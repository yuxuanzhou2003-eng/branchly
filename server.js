const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createSign, randomUUID } = require("node:crypto");

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const apiBase = "https://app-api.pixverse.ai/openapi/v2";
const checkpointStorageRoot = process.env.CHECKPOINT_LOCAL_DIR || ".checkpoint-store";
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
  console.log(`StoryTree video workflow: http://localhost:${port}`);
  console.log(
    process.env.PIXVERSE_API_KEY
      ? "PIXVERSE_API_KEY loaded."
      : "PIXVERSE_API_KEY is missing. Set it before generating videos.",
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
    const checkpoint = await loadCheckpointManifest(storyId, nodeId);
    const assets = includeAssets ? await resolveCheckpointAssets(storyId, nodeId) : null;
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

  if (req.method === "POST" && url.pathname === "/api/generate") {
    requireApiKey();
    const { mode = "fusion", payload } = await readJson(req);
    normalizeFusionPayload(payload);
    validateVideoPayload(payload);

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
    requireApiKey();
    const videoId = decodeURIComponent(url.pathname.replace("/api/status/", ""));
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

  return {
    schemaVersion: 1,
    assetId,
    type,
    name: raw.name || assetId,
    refName: raw.refName || assetId,
    pixverseImgId: raw.pixverseImgId || raw.img_id || null,
    refImageUrl,
    gcsUri: raw.gcsUri || raw.gcs_uri || gcsUriForObject(raw.gcsObject || raw.gcs_object || ""),
    gcsObject: raw.gcsObject || raw.gcs_object || objectNameFromGcsUri(raw.gcsUri || raw.gcs_uri || ""),
    promptPrefix: raw.promptPrefix || "",
    negativePrompt: raw.negativePrompt || "",
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
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

async function ensureGcsOk(response, action) {
  if (response.ok) return;
  const text = await response.text();
  throw new Error(`GCS ${action} failed (${response.status}): ${text}`);
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
    scope: "https://www.googleapis.com/auth/devstorage.read_write",
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
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
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
