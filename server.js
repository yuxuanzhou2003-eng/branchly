const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createSign, randomUUID } = require("node:crypto");
const { Readable } = require("node:stream");

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const apiBase = "https://app-api.pixverse.ai/openapi/v2";
const checkpointStorageRoot = process.env.CHECKPOINT_LOCAL_DIR || ".checkpoint-store";
const VEO_REFERENCE_IMAGE_LIMIT = 3;
let gcsTokenCache = null;

loadEnv();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await routeApi(req, res);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Internal server error",
    });
  }
});

server.listen(port, () => {
  console.log(`Branchly: http://localhost:${port}`);
  console.log(
    getVideoProvider() === "google"
      ? `Video generation provider: Google Vertex AI (${getGoogleVideoModel()}).`
      : "Video generation provider: PixVerse.",
  );
});

async function routeApi(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    const keyState = getApiKeyState();
    let balance = null;
    if (keyState.valid) {
      try {
        const rawBalance = await pixverseFetch("/account/balance", { method: "GET" });
        balance = rawBalance.Resp || null;
      } catch {
        balance = null;
      }
    }
    sendJson(res, 200, {
      ok: true,
      hasApiKey: keyState.valid,
      keyState: keyState.reason,
      balance,
      checkpointStorage: getCheckpointStorageState(),
      videoGeneration: getVideoGenerationState(),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/storage/health") {
    sendJson(res, 200, {
      ok: true,
      checkpointStorage: getCheckpointStorageState(),
      layout: {
        checkpointManifest: "stories/{storyId}/checkpoints/{nodeId}/manifest.json",
        assetDescriptor: "assets/{assetId}.json",
      },
    });
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/api/media") {
    await streamGcsMedia(req, res, url);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/assets") {
    const body = await readJson(req);
    const asset = normalizeAssetDescriptor(body.asset || body);
    await saveAssetDescriptor(asset);
    sendJson(res, 200, {
      ok: true,
      asset,
      storageKey: assetStorageKey(asset.assetId),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/assets/upload-local") {
    const body = await readJson(req);
    const uploaded = await uploadLocalAssetToCheckpointStorage(body);
    sendJson(res, 200, { ok: true, ...uploaded });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/assets/")) {
    const assetId = decodeURIComponent(url.pathname.replace("/api/assets/", ""));
    const asset = await loadAssetDescriptor(assetId);
    sendJson(res, 200, { ok: true, asset });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/checkpoints") {
    const body = await readJson(req);
    const saved = await saveCheckpointBundle(body);
    sendJson(res, 200, { ok: true, ...saved });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/checkpoints/")) {
    const nodeId = decodeURIComponent(url.pathname.replace("/api/checkpoints/", ""));
    const storyId = url.searchParams.get("storyId") || "story_001";
    const includeAssets = url.searchParams.get("includeAssets") !== "false";
    let checkpoint;
    let assets = null;
    try {
      checkpoint = await loadCheckpointManifest(storyId, nodeId);
      assets = includeAssets ? await resolveCheckpointAssets(storyId, nodeId) : null;
    } catch (error) {
      if (isMissingStorageError(error)) {
        sendJson(res, 404, { error: "Checkpoint not found." });
        return;
      }
      throw error;
    }
    sendJson(res, 200, {
      ok: true,
      checkpoint,
      inheritedAssets: assets,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload-reference") {
    requireApiKey();
    const webReq = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: streamToWeb(req),
      duplex: "half",
    });
    const form = await webReq.formData();
    const image = form.get("image");

    if (!image || typeof image === "string") {
      throw new Error("Missing image file.");
    }

    const uploaded = await uploadImage(image, image.name || "reference.png");
    sendJson(res, 200, uploaded);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload-local-assets") {
    requireApiKey();
    const body = await readJson(req);
    const items = Array.isArray(body.items) ? body.items : [];
    const cacheByPath = new Map();
    const uploads = {};

    for (const item of items) {
      if (!item.assetId || !item.refImageUrl) continue;

      if (!cacheByPath.has(item.refImageUrl)) {
        const absolute = resolveSafePath(item.refImageUrl);
        const bytes = await fs.promises.readFile(absolute);
        const blob = new Blob([bytes], { type: mimeForPath(absolute) });
        cacheByPath.set(
          item.refImageUrl,
          await uploadImage(blob, path.basename(absolute)),
        );
      }

      uploads[item.assetId] = cacheByPath.get(item.refImageUrl);
    }

    sendJson(res, 200, { uploads });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generate-character") {
    const { description, style = "cinematic", baseImageBase64, baseMimeType = "image/png" } = await readJson(req);
    if (!description) throw new Error("description is required.");

    // Style presets: control positive keywords and negative prompt
    const stylePresets = {
      cinematic: {
        positive: "photograph, RAW photo, DSLR, 8k uhd, photorealistic, hyperrealistic, real human face, Fujifilm XT3, studio portrait, neutral grey background, professional lighting",
        negative: "anime, cartoon, manga, illustration, drawing, painting, CGI, 3D render, sketch, watercolor, stylized, animated, game character",
      },
      anime: {
        positive: "anime portrait, manga style, cel shaded, clean linework, vibrant colors, Japanese animation style",
        negative: "photorealistic, photograph, real person, 3D render, CGI",
      },
      art: {
        positive: "digital painting, concept art, artstation, painterly, detailed brushwork, cinematic lighting, fantasy portrait",
        negative: "photograph, anime, manga, cartoon",
      },
    };
    const preset = stylePresets[style] || stylePresets.cinematic;

    const angles = [
      { label: "3/4 Left",  hint: "three-quarter view, 45 degrees to the left, looking slightly past camera" },
      { label: "Front",     hint: "front facing, looking directly at camera, symmetrical" },
      { label: "3/4 Right", hint: "three-quarter view, 45 degrees to the right, looking slightly past camera" },
    ];

    const images = await Promise.all(angles.map(async (angle) => {
      const stylePrefix = style === "cinematic" ? "Photograph: " : style === "anime" ? "Anime illustration: " : "Digital painting: ";
      const prompt = `${stylePrefix}portrait reference, ${angle.hint}, head and upper chest only, ${description}, ${preset.positive}, single subject, no text, no watermark`;

      const requestBody = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "3:4",
          negativePrompt: preset.negative,
        },
      };

      const resp = await fetch(googleImageEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...(await getGoogleAuthHeaders()),
        },
        body: JSON.stringify(requestBody),
      });
      const data = await readGoogleJson(resp, `Imagen character (${angle.label})`);
      if (data.error) throw new Error(`Imagen error (${angle.label}): ${data.error.message}`);
      const b64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (!b64) throw new Error("No image returned for " + angle.label);
      return { label: angle.label, dataUrl: `data:image/png;base64,${b64}` };
    }));

    sendJson(res, 200, { images });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    const { mode = "fusion", payload } = await readJson(req);
    validateVideoPayload(payload);

    if (getVideoProvider() === "google") {
      const raw = await googleGenerateVideo(payload);
      const operationName = raw.name;
      if (!operationName) {
        throw new Error(`Google Veo did not return an operation name: ${JSON.stringify(raw)}`);
      }

      sendJson(res, 200, {
        provider: "google",
        operation_name: operationName,
        video_id: encodeURIComponent(operationName),
        raw,
      });
      return;
    }

    requireApiKey();
    normalizeFusionPayload(payload);

    const endpoint = mode === "text" ? "/video/text/generate" : "/video/fusion/generate";
    if (mode !== "text") validateFusionPayload(payload);

    const raw = await pixverseFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const videoId = raw.Resp?.video_id || raw.Resp?.id || raw.video_id;

    if (!videoId) {
      throw new Error(`PixVerse did not return video_id: ${JSON.stringify(raw)}`);
    }

    sendJson(res, 200, { video_id: videoId, raw });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/status/")) {
    const videoId = decodeURIComponent(url.pathname.replace("/api/status/", ""));

    if (getVideoProvider() === "google" || videoId.startsWith("projects/")) {
      const raw = await googleFetchVideoOperation(videoId);
      const response = raw.response || {};
      const videos = response.videos || [];
      const filteredCount = Number(response.raiMediaFilteredCount || 0);
      const filteredReasons = Array.isArray(response.raiMediaFilteredReasons)
        ? response.raiMediaFilteredReasons
        : [];
      const filterMessage = filteredCount > 0
        ? filteredReasons.join(" ") || `${filteredCount} generated video(s) were filtered by Vertex AI safety policy.`
        : "";
      const firstVideoUrl = videos[0]?.gcsUri ? playableGcsMediaUrl(videos[0].gcsUri) : "";
      sendJson(res, 200, {
        provider: "google",
        result: {
          done: Boolean(raw.done),
          videos,
          video_url: firstVideoUrl,
          gcs_uri: videos[0]?.gcsUri || "",
          status: filterMessage ? 3 : raw.done ? 1 : 5,
          operation_name: raw.name,
          filtered_count: filteredCount,
          filtered_reasons: filteredReasons,
          error: filterMessage,
        },
        raw,
      });
      return;
    }

    requireApiKey();
    const raw = await pixverseFetch(`/video/result/${videoId}`, {
      method: "GET",
    });
    sendJson(res, 200, { result: raw.Resp || raw, raw });
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

async function pixverseFetch(endpoint, options = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      "API-KEY": process.env.PIXVERSE_API_KEY,
      "Ai-trace-id": randomUUID(),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || (Number.isFinite(data.ErrCode) && data.ErrCode !== 0)) {
    throw new Error(data.ErrMsg || `PixVerse request failed (${response.status})`);
  }

  return data;
}

async function uploadImage(blob, filename) {
  const form = new FormData();
  form.append("image", blob, filename);

  const raw = await pixverseFetch("/image/upload", {
    method: "POST",
    body: form,
  });

  const imgId = raw.Resp?.img_id;
  if (!imgId) {
    throw new Error(`PixVerse did not return img_id: ${JSON.stringify(raw)}`);
  }

  return {
    img_id: imgId,
    img_url: raw.Resp?.img_url || "",
    raw,
  };
}

function validateFusionPayload(payload) {
  if (!Array.isArray(payload.image_references) || payload.image_references.length === 0) {
    throw new Error("image_references must not be empty.");
  }

  if (payload.image_references.length > 3) {
    throw new Error("PixVerse Fusion supports 1 to 3 references.");
  }

  for (const ref of payload.image_references) {
    if (!ref.img_id || !ref.ref_name || !ref.type) {
      throw new Error("Each reference needs type, img_id, and ref_name.");
    }
  }
}

function validateVideoPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing video generation payload.");
  }

  if (!payload.prompt || typeof payload.prompt !== "string") {
    throw new Error("Missing prompt.");
  }
}

function normalizeFusionPayload(payload) {
  if (!payload || typeof payload !== "object") return;
  const modelMap = {
    C1: "c1",
    c1: "c1",
    V6: "v6",
    v6: "v6",
    "V4.5": "v4.5",
    "v4.5": "v4.5",
  };
  if (payload.model && modelMap[payload.model]) {
    payload.model = modelMap[payload.model];
  }
}

async function googleGenerateVideo(payload) {
  requireGoogleVideoConfig();
  const model = getGoogleVideoModel(payload.model);
  const body = await buildGoogleVideoRequest(payload, model);
  const response = await fetch(googleVideoEndpoint("predictLongRunning", model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(await getGoogleAuthHeaders()),
    },
    body: JSON.stringify(body),
  });

  const raw = await readGoogleJson(response, "Google Veo generation request");
  raw.model = model;
  return raw;
}

async function googleFetchVideoOperation(operationName) {
  requireGoogleVideoConfig();
  const response = await fetch(googleVideoEndpoint("fetchPredictOperation", modelFromOperationName(operationName)), {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(await getGoogleAuthHeaders()),
    },
    body: JSON.stringify({ operationName }),
  });

  return readGoogleJson(response, "Google Veo operation poll");
}

async function googleGenerateImage(prompt, parameters = {}) {
  requireGoogleVideoConfig();
  const model = getGoogleImageModel();
  const response = await fetch(googleImageEndpoint(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(await getGoogleAuthHeaders()),
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: Number(parameters.sampleCount || 1),
        aspectRatio: parameters.aspectRatio || "3:4",
      },
    }),
  });

  return readGoogleJson(response, "Google Imagen generation request");
}

async function buildGoogleVideoRequest(payload, model) {
  const prompt = makeGoogleVeoSafePrompt(payload.prompt || "");
  const parameters = {
    aspectRatio: payload.aspect_ratio || payload.aspectRatio || "9:16",
    durationSeconds: normalizeGoogleDuration(payload.duration),
    sampleCount: Number(payload.sampleCount || payload.sample_count || 1),
    personGeneration: payload.personGeneration || "allow_adult",
  };

  const negativePrompt = payload.negative_prompt || payload.negativePrompt;
  if (String(negativePrompt || "").trim()) parameters.negativePrompt = negativePrompt;

  const seed = Number(payload.seed);
  if (Number.isFinite(seed)) parameters.seed = seed;

  const resolution = process.env.GOOGLE_VIDEO_RESOLUTION || payload.resolution || payload.quality;
  if (resolution) parameters.resolution = normalizeGoogleResolution(resolution);

  const storageUri = payload.storageUri || payload.storage_uri || defaultGoogleVideoOutputUri();
  if (storageUri) parameters.storageUri = storageUri;

  const instance = { prompt };
  const referenceImages = await buildGoogleReferenceImages(payload.image_references || []);
  if (referenceImages.length) {
    if (usesGoogleImageInput(model, payload)) {
      instance.image = referenceImages[0].image;
    } else if (usesGoogleReferenceImages(model)) {
      instance.referenceImages = referenceImages;
    }
  }

  return {
    instances: [instance],
    parameters,
  };
}

async function buildGoogleReferenceImages(references) {
  const normalized = [];

  for (const reference of references.slice(0, VEO_REFERENCE_IMAGE_LIMIT)) {
    const image = await resolveGoogleReferenceImage(reference);
    if (!image) continue;

    normalized.push({
      image,
      referenceType: normalizeGoogleReferenceType(reference),
    });
  }

  return normalized;
}

async function resolveGoogleReferenceImage(reference) {
  if (!reference || typeof reference !== "object") return null;

  const bytesBase64Encoded = reference.bytesBase64Encoded || reference.bytes_base64_encoded;
  if (bytesBase64Encoded) {
    return {
      bytesBase64Encoded,
      mimeType: normalizeImageMimeType(reference.mimeType || reference.mime_type),
    };
  }

  const source =
    reference.dataUrl ||
    reference.data_url ||
    reference.refImageUrl ||
    reference.ref_image_url ||
    reference.imageUrl ||
    reference.image_url ||
    reference.url ||
    reference.path ||
    "";

  if (typeof source === "string" && source.startsWith("data:")) {
    return imageFromDataUrl(source, reference.mimeType || reference.mime_type);
  }

  const gcsUri = reference.gcsUri || reference.gcs_uri || (typeof source === "string" && source.startsWith("gs://") ? source : "");
  if (gcsUri) {
    const objectName = objectNameFromGcsUri(gcsUri);
    if (!objectName) return null;
    const bytes = await gcsDownloadObjectBytes(objectName);
    return {
      bytesBase64Encoded: bytes.toString("base64"),
      mimeType: normalizeImageMimeType(reference.mimeType || reference.mime_type || mimeForPath(objectName)),
    };
  }

  if (!source || typeof source !== "string") return null;

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Reference image download failed (${response.status}): ${source}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      bytesBase64Encoded: bytes.toString("base64"),
      mimeType: normalizeImageMimeType(reference.mimeType || reference.mime_type || response.headers.get("content-type")),
    };
  }

  const localPath = source.replace(/^\/+/, "");
  const absolute = resolveSafePath(localPath);
  const bytes = await fs.promises.readFile(absolute);
  return {
    bytesBase64Encoded: bytes.toString("base64"),
    mimeType: normalizeImageMimeType(reference.mimeType || reference.mime_type || mimeForPath(absolute)),
  };
}

function imageFromDataUrl(dataUrl, fallbackMimeType = "") {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?,(.+)$/);
  if (!match) return null;

  return {
    bytesBase64Encoded: match[2],
    mimeType: normalizeImageMimeType(fallbackMimeType || match[1]),
  };
}

function normalizeGoogleReferenceType(reference) {
  return "asset";
}

function normalizeImageMimeType(mimeType) {
  const clean = String(mimeType || "").split(";")[0].trim().toLowerCase();
  if (clean === "image/jpg") return "image/jpeg";
  return ["image/jpeg", "image/png", "image/webp"].includes(clean) ? clean : "image/png";
}

function normalizeGoogleDuration(duration) {
  const value = Number(duration || process.env.GOOGLE_VIDEO_DURATION || 8);
  return [4, 6, 8].includes(value) ? value : 8;
}

function makeGoogleVeoSafePrompt(prompt) {
  const replacements = [
    [/\brevenge\b/gi, "emotional confrontation"],
    [/\brage\b/gi, "intense emotion"],
    [/\bburn\b/gi, "fall apart emotionally"],
    [/\bblade\b/gi, "sharp decision"],
    [/\bdeath\b/gi, "past crisis"],
    [/\bdead\b/gi, "gone"],
    [/\bkill(?:ed|ing)?\b/gi, "defeat emotionally"],
    [/\bblood\b/gi, "dramatic tension"],
    [/\bviolent\b/gi, "high-stakes"],
    [/\bviolence\b/gi, "conflict"],
    [/\babyss\b/gi, "uncertainty"],
    [/\bdrag\b/gi, "bring"],
    [/\bjudgment\b/gi, "truth and accountability"],
  ];
  const safePrompt = replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), prompt);
  return [
    "Cinematic workplace short-drama scene suitable for a broad audience.",
    safePrompt,
    "Use any supplied asset reference image only for character identity consistency, not as the first frame, pose, composition, or background.",
    "Begin with a fresh moving shot, a new camera angle, and natural motion.",
    "Focus on facial expressions, professional dialogue tension, camera movement, lighting, and emotional restraint.",
  ].join(" ");
}

function usesGoogleImageInput(model, payload = {}) {
  if (!String(model || "").startsWith("veo-3.")) return false;
  return payload.useImageAsFirstFrame === true || payload.use_image_as_first_frame === true;
}

function usesGoogleReferenceImages(model) {
  return [
    "veo-3.1-generate-001",
    "veo-3.1-fast-generate-001",
    "veo-2.0-generate-exp",
  ].includes(String(model || ""));
}

function normalizeGoogleResolution(resolution) {
  if (resolution === "540p") return "720p";
  return resolution;
}

function defaultGoogleVideoOutputUri() {
  if (process.env.GOOGLE_VIDEO_OUTPUT_URI) return process.env.GOOGLE_VIDEO_OUTPUT_URI;
  if (!process.env.GCS_BUCKET) return "";
  const prefix = process.env.GCS_PREFIX || process.env.CHECKPOINT_STORAGE_PREFIX || "branchly";
  return `gs://${process.env.GCS_BUCKET}/${prefix}/generated-videos/`;
}

function googleVideoEndpoint(action, modelId = "") {
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const project = getGoogleCloudProject();
  const model = getGoogleVideoModel(modelId);
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}:${action}`;
}

function googleImageEndpoint(modelId = "") {
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const project = getGoogleCloudProject();
  const model = getGoogleImageModel(modelId);
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}:predict`;
}

async function readGoogleJson(response, action) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${action} failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

function requireGoogleVideoConfig() {
  if (!getGoogleCloudProject()) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT for Google Veo video generation.");
  }

  const apiKey = (process.env.GOOGLE_API_KEY || "").trim();
  if (!getServiceAccountConfig() && (!apiKey || apiKey === "your_google_api_key_here")) {
    throw new Error("Missing Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY.");
  }
}

function getGoogleCloudProject() {
  return process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
}

function getGoogleVideoModel(modelId = "") {
  return modelId || process.env.GOOGLE_VIDEO_MODEL || "veo-3.1-generate-001";
}

function getGoogleImageModel(modelId = "") {
  return modelId || process.env.GOOGLE_IMAGE_MODEL || "imagen-3.0-generate-002";
}

function getVideoProvider() {
  return (process.env.VIDEO_GENERATION_PROVIDER || "google").trim().toLowerCase();
}

function getVideoGenerationState() {
  return getVideoProvider() === "google"
    ? {
        provider: "google",
        model: getGoogleVideoModel(),
        project: getGoogleCloudProject() || "missing",
        location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
        outputUri: defaultGoogleVideoOutputUri() || "inline response",
      }
    : {
        provider: "pixverse",
        hasApiKey: getApiKeyState().valid,
    };
}

function modelFromOperationName(operationName) {
  const match = operationName.match(/\/models\/([^/]+)\//);
  return match ? decodeURIComponent(match[1]) : "";
}

async function getGoogleAuthHeaders() {
  if (getServiceAccountConfig()) {
    return { Authorization: `Bearer ${await getGoogleAccessToken()}` };
  }

  const apiKey = (process.env.GOOGLE_API_KEY || "").trim();
  if (apiKey && apiKey !== "your_google_api_key_here") {
    return { "x-goog-api-key": apiKey };
  }

  throw new Error("Missing Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY.");
}

async function saveCheckpointBundle(body) {
  const checkpoint = normalizeCheckpointManifest(body.checkpoint || body);
  const assets = Array.isArray(body.assets) ? body.assets.map(normalizeAssetDescriptor) : [];
  const ownAssetIds = new Set(checkpoint.ownAssetIds);

  for (const asset of assets) {
    ownAssetIds.add(asset.assetId);
    await saveAssetDescriptor(asset);
  }

  checkpoint.ownAssetIds = [...ownAssetIds];
  await writeStorageJson(checkpointStorageKey(checkpoint.storyId, checkpoint.nodeId), checkpoint);

  return {
    checkpoint,
    savedAssets: assets,
    storageKey: checkpointStorageKey(checkpoint.storyId, checkpoint.nodeId),
  };
}

function normalizeCheckpointManifest(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Missing checkpoint manifest.");
  }

  const nodeId = String(raw.nodeId || "").trim();
  if (!nodeId) throw new Error("checkpoint.nodeId is required.");

  const storyId = String(raw.storyId || "story_001").trim();
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    storyId,
    nodeId,
    parentId: raw.parentId || null,
    title: raw.title || "",
    synopsis: raw.synopsis || "",
    prompt: raw.prompt || "",
    video: normalizeVideoResource(raw.video || raw.videoUrl),
    config: raw.config && typeof raw.config === "object" ? raw.config : {},
    ownAssetIds: Array.isArray(raw.ownAssetIds) ? raw.ownAssetIds.map(String) : [],
    createdAt: raw.createdAt || now,
    updatedAt: now,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

function normalizeAssetDescriptor(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Missing asset descriptor.");
  }

  const assetId = String(raw.assetId || "").trim();
  if (!assetId) throw new Error("asset.assetId is required.");

  const type = String(raw.type || "reference").trim();
  const refImageUrl = raw.refImageUrl || raw.url || "";
  const name = cleanAssetText(raw.name) || assetId;
  const ageLabel = cleanAssetAgeLabel(raw.ageLabel || raw.age_label);

  return {
    schemaVersion: 1,
    assetId,
    type,
    name,
    characterId: cleanAssetText(raw.characterId || raw.character_id),
    ageLabel,
    refName: cleanAssetText(raw.refName) || assetId,
    pixverseImgId: raw.pixverseImgId || raw.img_id || null,
    refImageUrl,
    gcsUri: raw.gcsUri || raw.gcs_uri || gcsUriForObject(raw.gcsObject || raw.gcs_object || ""),
    gcsObject: raw.gcsObject || raw.gcs_object || objectNameFromGcsUri(raw.gcsUri || raw.gcs_uri || ""),
    promptPrefix: raw.promptPrefix || "",
    negativePrompt: raw.negativePrompt || "",
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

function cleanAssetText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cleanAssetAgeLabel(value) {
  const label = cleanAssetText(value);
  if (!label) return "";
  return /^\d+$/.test(label) ? `Age ${label}` : label;
}

function normalizeVideoResource(raw) {
  if (!raw) return null;
  if (typeof raw === "string") return { url: raw, gcsUri: "", gcsObject: "" };
  if (typeof raw !== "object") return null;

  return {
    url: raw.url || raw.videoUrl || "",
    gcsUri: raw.gcsUri || raw.gcs_uri || gcsUriForObject(raw.gcsObject || raw.gcs_object || ""),
    gcsObject: raw.gcsObject || raw.gcs_object || objectNameFromGcsUri(raw.gcsUri || raw.gcs_uri || ""),
    generationId: raw.generationId || raw.videoId || "",
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

async function saveAssetDescriptor(asset) {
  await writeStorageJson(assetStorageKey(asset.assetId), asset);
}

async function loadAssetDescriptor(assetId) {
  return readStorageJson(assetStorageKey(assetId));
}

async function loadCheckpointManifest(storyId, nodeId) {
  return readStorageJson(checkpointStorageKey(storyId, nodeId));
}

async function resolveCheckpointAssets(storyId, nodeId) {
  const assetIds = new Set();
  const chain = [];
  let currentId = nodeId;

  while (currentId) {
    const checkpoint = await loadCheckpointManifest(storyId, currentId);
    chain.unshift({
      nodeId: checkpoint.nodeId,
      ownAssetIds: checkpoint.ownAssetIds,
    });
    checkpoint.ownAssetIds.forEach((assetId) => assetIds.add(assetId));
    currentId = checkpoint.parentId;
  }

  const assets = [];
  for (const assetId of assetIds) {
    assets.push(await loadAssetDescriptor(assetId));
  }

  return { chain, assets };
}

function checkpointStorageKey(storyId, nodeId) {
  return storageKey("stories", storyId, "checkpoints", nodeId, "manifest.json");
}

function assetStorageKey(assetId) {
  return storageKey("assets", `${assetId}.json`);
}

function storageKey(...parts) {
  const prefix = (process.env.GCS_PREFIX || process.env.CHECKPOINT_STORAGE_PREFIX || "branchly").trim();
  return [prefix, ...parts]
    .filter(Boolean)
    .map((part) => String(part).replace(/^\/+|\/+$/g, ""))
    .join("/");
}

async function writeStorageJson(key, value) {
  const payload = JSON.stringify(value, null, 2);

  if (isGcsConfigured()) {
    await writeStorageBytes(key, payload, "application/json; charset=utf-8");
    return;
  }

  const absolute = resolveStoragePath(key);
  await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
  await fs.promises.writeFile(absolute, payload);
}

async function writeStorageBytes(key, value, contentType) {
  if (isGcsConfigured()) {
    await gcsUploadObject(key, value, contentType);
    return;
  }

  const absolute = resolveStoragePath(key);
  await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
  await fs.promises.writeFile(absolute, value);
}

async function readStorageJson(key) {
  let raw;

  if (isGcsConfigured()) {
    raw = await gcsDownloadObject(key);
  } else {
    const absolute = resolveStoragePath(key);
    raw = await fs.promises.readFile(absolute, "utf8");
  }

  return JSON.parse(raw);
}

function getCheckpointStorageState() {
  return isGcsConfigured()
    ? {
        backend: "gcs",
        bucket: process.env.GCS_BUCKET,
        prefix: process.env.GCS_PREFIX || process.env.CHECKPOINT_STORAGE_PREFIX || "branchly",
      }
    : {
        backend: "local",
        directory: checkpointStorageRoot,
        note: "Set GCS_BUCKET plus GOOGLE_APPLICATION_CREDENTIALS or GCS_SERVICE_ACCOUNT_JSON to store checkpoints in Google Cloud Storage.",
      };
}

async function uploadLocalAssetToCheckpointStorage(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Missing local asset upload body.");
  }

  const filePath = String(body.filePath || "").trim();
  if (!filePath) throw new Error("filePath is required.");

  const assetId = String(body.assetId || body.asset?.assetId || "").trim();
  if (!assetId) throw new Error("assetId is required.");

  const absolute = resolveSafePath(filePath);
  const bytes = await fs.promises.readFile(absolute);
  const objectName = storageKey("assets", assetId, path.basename(absolute));
  await writeStorageBytes(objectName, bytes, mimeForPath(absolute));

  const asset = normalizeAssetDescriptor({
    ...(body.asset || {}),
    ...body,
    assetId,
    gcsObject: objectName,
    gcsUri: gcsUriForObject(objectName),
    refImageUrl: body.refImageUrl || body.asset?.refImageUrl || filePath,
  });
  await saveAssetDescriptor(asset);

  return {
    asset,
    objectName,
    storageKey: assetStorageKey(asset.assetId),
  };
}

function isGcsConfigured() {
  return Boolean(process.env.GCS_BUCKET && getServiceAccountConfig());
}

async function gcsUploadObject(objectName, body, contentType) {
  const bucket = encodeURIComponent(process.env.GCS_BUCKET);
  const name = encodeURIComponent(objectName);
  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${name}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getGcsAccessToken()}`,
        "Content-Type": contentType,
      },
      body,
    },
  );

  await ensureGcsOk(response, `upload ${objectName}`);
}

async function gcsDownloadObject(objectName) {
  const bucket = encodeURIComponent(process.env.GCS_BUCKET);
  const name = encodeURIComponent(objectName);
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${name}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${await getGcsAccessToken()}`,
      },
    },
  );

  await ensureGcsOk(response, `download ${objectName}`);
  return response.text();
}

async function gcsDownloadObjectBytes(objectName) {
  const bucket = encodeURIComponent(process.env.GCS_BUCKET);
  const name = encodeURIComponent(objectName);
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${name}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${await getGcsAccessToken()}`,
      },
    },
  );

  await ensureGcsOk(response, `download ${objectName}`);
  return Buffer.from(await response.arrayBuffer());
}

async function streamGcsMedia(req, res, url) {
  const objectName = mediaObjectNameFromUrl(url);
  const bucket = encodeURIComponent(process.env.GCS_BUCKET);
  const name = encodeURIComponent(objectName);
  const headers = {
    Authorization: `Bearer ${await getGcsAccessToken()}`,
  };
  const range = normalizeRangeHeader(req.headers.range);
  if (range) headers.Range = range;

  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${name}?alt=media`,
    { headers },
  );

  if (!response.ok && response.status !== 206) {
    await ensureGcsOk(response, `stream ${objectName}`);
  }

  const outputHeaders = {
    "Content-Type": response.headers.get("content-type") || mimeForPath(objectName),
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300",
  };
  copyHeader(response, outputHeaders, "content-length", "Content-Length");
  copyHeader(response, outputHeaders, "content-range", "Content-Range");

  res.writeHead(response.status === 206 ? 206 : 200, outputHeaders);
  if (req.method === "HEAD" || !response.body) {
    res.end();
    return;
  }

  Readable.fromWeb(response.body).pipe(res);
}

function mediaObjectNameFromUrl(url) {
  const objectName = String(url.searchParams.get("object") || objectNameFromGcsUri(url.searchParams.get("gcsUri") || "")).trim();
  if (!objectName) throw new Error("Missing media object.");

  const gcsUri = url.searchParams.get("gcsUri") || "";
  if (gcsUri) {
    const bucket = bucketNameFromGcsUri(gcsUri);
    if (bucket && bucket !== process.env.GCS_BUCKET) {
      throw new Error("Media object is outside the configured GCS bucket.");
    }
  }

  return objectName.replace(/^\/+/, "");
}

function normalizeRangeHeader(range) {
  if (!range) return "";
  const value = String(range).trim();
  return /^bytes=\d*-\d*$/.test(value) ? value : "";
}

function copyHeader(response, headers, sourceName, targetName) {
  const value = response.headers.get(sourceName);
  if (value) headers[targetName] = value;
}

async function ensureGcsOk(response, action) {
  if (response.ok) return;
  const text = await response.text();
  throw new Error(`GCS ${action} failed (${response.status}): ${text}`);
}

function isMissingStorageError(error) {
  return error?.code === "ENOENT" || /\b(404|not found)\b/i.test(error?.message || "");
}

async function getGcsAccessToken() {
  if (gcsTokenCache && gcsTokenCache.expiresAt > Date.now() + 60_000) {
    return gcsTokenCache.accessToken;
  }

  const serviceAccount = getServiceAccountConfig();
  if (!serviceAccount) {
    throw new Error("GCS service account credentials are not configured.");
  }

  const tokenUri = serviceAccount.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
  const claims = base64UrlJson({
    iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  });
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`GCS auth failed (${response.status}): ${JSON.stringify(data)}`);
  }

  gcsTokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  return gcsTokenCache.accessToken;
}

function getServiceAccountConfig() {
  if (process.env.GCS_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GCS_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (fs.existsSync(credentialPath)) {
      return JSON.parse(fs.readFileSync(credentialPath, "utf8"));
    }
  }

  return null;
}

async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (gcsTokenCache && gcsTokenCache.exp > now + 60) return gcsTokenCache.token;

  const sa = getServiceAccountConfig();
  if (!sa) throw new Error("No service account config available.");

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key, "base64url");

  const jwt = `${header}.${payload}.${sig}`;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await resp.json();
  if (!data.access_token) throw new Error(`Google OAuth2 token exchange failed: ${JSON.stringify(data)}`);

  gcsTokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return gcsTokenCache.token;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function gcsUriForObject(objectName) {
  if (!objectName || !process.env.GCS_BUCKET) return "";
  return `gs://${process.env.GCS_BUCKET}/${objectName}`;
}

function objectNameFromGcsUri(uri) {
  if (!uri || !uri.startsWith("gs://")) return "";
  const withoutScheme = uri.slice("gs://".length);
  const slashIndex = withoutScheme.indexOf("/");
  return slashIndex === -1 ? "" : withoutScheme.slice(slashIndex + 1);
}

function bucketNameFromGcsUri(uri) {
  if (!uri || !uri.startsWith("gs://")) return "";
  const withoutScheme = uri.slice("gs://".length);
  const slashIndex = withoutScheme.indexOf("/");
  return slashIndex === -1 ? withoutScheme : withoutScheme.slice(0, slashIndex);
}

function playableGcsMediaUrl(uri) {
  if (!uri || !uri.startsWith("gs://")) return uri || "";
  return `/api/media?gcsUri=${encodeURIComponent(uri)}`;
}

function resolveStoragePath(key) {
  const storageRoot = path.isAbsolute(checkpointStorageRoot)
    ? checkpointStorageRoot
    : path.join(root, checkpointStorageRoot);
  const base = path.resolve(storageRoot);
  const absolute = path.resolve(base, key);
  const relative = path.relative(base, absolute);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Storage key escapes checkpoint storage root.");
  }

  return absolute;
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === "/"
    ? "branchly.html"
    : pathname === "/storytree_creator.html"
      ? "branchly.html"
      : pathname.slice(1);
  const absolute = resolveSafePath(requested);

  let stat;
  try {
    stat = await fs.promises.stat(absolute);
  } catch {
    sendJson(res, 404, { error: "File not found." });
    return;
  }

  if (!stat.isFile()) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": mimeForPath(absolute),
    "Content-Length": stat.size,
  });
  fs.createReadStream(absolute).pipe(res);
}

function resolveSafePath(inputPath) {
  const absolute = path.resolve(root, inputPath);
  const relative = path.relative(root, absolute);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escapes project root.");
  }

  return absolute;
}

function mimeForPath(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function streamToWeb(req) {
  return require("node:stream").Readable.toWeb(req);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function requireApiKey() {
  const keyState = getApiKeyState();
  if (!keyState.valid) {
    throw new Error(keyState.message);
  }
}

function getApiKeyState() {
  const key = (process.env.PIXVERSE_API_KEY || "").trim();
  if (!key) {
    return {
      valid: false,
      reason: "missing",
      message: "Missing PIXVERSE_API_KEY. Set it in your environment or .env file.",
    };
  }
  if (key === "your_pixverse_api_key_here") {
    return {
      valid: false,
      reason: "placeholder",
      message: "PIXVERSE_API_KEY is still the placeholder value. Replace it with a real PixVerse OpenAPI key.",
    };
  }
  return { valid: true, reason: "configured", message: "" };
}

function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
