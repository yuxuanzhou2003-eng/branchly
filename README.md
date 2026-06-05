# Branchly

**Branchly is an AI-native short-drama platform where every episode can split into a new monetizable storyline.**

Instead of treating a drama as one fixed linear video, Branchly turns it into a living story tree. The platform starts with a seed episode, creators continue any scene into a new branch with Google Veo 3.1, viewers vote with likes and unlocks, and the highest-signal branches become the next directions of the universe.

Branchly was built as a hackathon prototype, but the product thesis is commercial: combine short-drama monetization, creator revenue sharing, and generative video into a collaborative entertainment format that can scale across fandoms, IP universes, and serialized mobile-first content.

---

## Why This Matters

Short dramas are one of the fastest-growing mobile entertainment formats, but the current production model is still mostly linear:

- One production team decides the canon.
- Viewers can only watch, not meaningfully steer the story.
- Creators cannot easily remix or continue an existing universe.
- Platforms optimize distribution, but not collaborative story creation.

Branchly changes the loop:

1. **The platform publishes a strong opening episode.**
2. **Creators branch the story using AI video generation.**
3. **Viewers like, unlock, and financially signal which branches matter.**
4. **Revenue flows back to creators, encouraging better branches.**
5. **The story universe grows organically instead of linearly.**

The result is a new content primitive: **a playable, monetizable, AI-generated story graph**.

---

## Product Experience Flow

Branchly is designed around one complete creator-viewer loop that can be demonstrated end to end:

1. **Enter the story universe.** A viewer opens the main story tree and sees the root episode, high-performing branches, endangered branches, and dropped branches as a living visual graph.
2. **Explore a branch.** Each node exposes a free synopsis, video preview, creator attribution, likes, unlock state, and downstream child branches.
3. **Signal interest.** Viewers like branches they want to survive and unlock paid episodes after the free window, giving the platform demand data beyond passive views.
4. **Continue from any node.** A creator selects **Continue Here**, inherits the parent prompt, character references, scene context, and style constraints, then edits the next-scene prompt.
5. **Generate with AI.** Branchly sends the continuation prompt and selected character references to Google Veo 3.1, then polls the long-running operation until the video is ready.
6. **Preview and attach.** The creator previews the generated video, confirms it, and the new branch grows from the parent node.
7. **Let the market prune the tree.** Strong branches gain visibility and unlocks. Weak branches become endangered, then dropped, while still remaining recoverable if audience interest returns.

The important product idea is that **creation, distribution, feedback, monetization, and pruning all happen inside the same story graph**.

---

## Core Product Loop

```text
Seed Episode
    ↓
Creator chooses a node to continue
    ↓
Inherited character / scene / style assets are assembled
    ↓
Google Veo 3.1 generates a new video branch
    ↓
Viewers watch, like, and unlock
    ↓
High-performing branches grow; weak branches fade
```

### Branch Lifecycle

Branchly turns audience behavior into a lightweight evolution system:

| Stage | What Happens | Product Purpose |
|---|---|---|
| Protected | A new branch receives an initial grace period | Gives creators a fair chance before ranking pressure |
| Active | Likes, watches, and unlocks determine visibility | Rewards branches with real audience pull |
| Endangered | Low-signal branches dim visually in the tree | Makes quality control visible without deleting work |
| Dropped | Branches leave the main path but remain recoverable | Keeps the main universe readable while preserving creator ownership |
| Revived | Renewed likes or unlocks can bring a branch back | Makes the archive a discovery surface, not a graveyard |

This creates a memorable demo mechanic: **likes are nutrients, paid unlocks are validation, and drop is editorial pruning**.

### Monetization Model

Branchly is designed around a short-drama creator economy:

| Actor | Action | Value |
|---|---|---|
| Platform | Seeds premium story universes | Owns initial IP and distribution |
| Creator | Pays tokens to generate branches | Can earn from unlocked episodes |
| Viewer | Watches, likes, unlocks | Directly influences story evolution |
| Branchly | Takes platform fee | Benefits when the universe compounds |

Prototype revenue split:

- **79%** of paid unlock revenue goes to the branch creator.
- **21%** goes to the platform.
- Free windows can be used to bootstrap new branches.
- Dropped branches can be revived if viewer interest returns.

### Revenue Streams

Branchly supports multiple business lines from the same product surface:

| Stream | How It Works | Why It Scales |
|---|---|---|
| Generation tokens | Creators spend tokens to generate or shuffle branches | Revenue is tied directly to creative activity |
| Paid unlocks | Viewers pay to watch mature or premium branches | Demand is validated at the branch level |
| Platform commission | Branchly takes a fee from unlock revenue | Incentives stay aligned with creator success |
| Sponsored universes | Brands or IP owners seed official story worlds | One seed episode can produce many fan-created paths |
| Creator analytics | Top creators can receive paid tools for testing prompts and improving conversion | The data layer becomes more valuable as the graph grows |

---

## Market Potential

Branchly sits at the intersection of four large trends:

- **Short-drama monetization.** Mobile-first episodic storytelling has proven that viewers will pay for fast emotional payoff, cliffhangers, and serialized unlocks.
- **Creator economy.** Fans already remix stories on social platforms, but most platforms do not give them structured IP inheritance, revenue share, or a path to canon influence.
- **Generative video.** AI lowers the cost of producing alternate scenes, niche continuations, and personalized storylines that traditional crews could not economically film.
- **Interactive entertainment.** Audiences increasingly expect participation, from branching games to fandom voting to collaborative worldbuilding.

The wedge is not simply "make AI videos." The wedge is **turn every successful short-drama moment into a new marketplace for continuations**.

### Target Users

| User | Need | Branchly Value |
|---|---|---|
| Viewers | More agency and faster access to the stories they care about | Vote, unlock, and steer story direction |
| Fan creators | A way to continue popular stories without a production crew | Generate branches from inherited assets and prompts |
| IP owners | More content surface area without linear production cost | Seed worlds and let the community expand them |
| Platforms | Higher retention and monetization density | Each node can become a new engagement and revenue surface |

### Business Value

Branchly creates value through compounding story assets:

- **Lower production cost:** AI video generation makes it feasible to test many narrative paths.
- **Higher content density:** One seed episode can produce dozens of monetizable continuations.
- **Better demand discovery:** Likes and unlocks reveal which characters, scenes, and plotlines deserve investment.
- **Creator-aligned growth:** Revenue sharing turns fan creativity into platform supply.
- **Reusable IP memory:** Checkpoint assets preserve characters, scenes, and style across branches instead of starting every generation from scratch.
- **Self-pruning catalog:** Endangered and dropped states keep the story tree navigable as the universe scales.

### Competitive Advantages

Branchly is differentiated from ordinary UGC video tools and linear short-drama apps:

| Advantage | Why It Matters |
|---|---|
| Story graph, not feed-only discovery | Every branch has lineage, context, and a clear continuation path |
| Asset inheritance | Characters and scenes stay reusable across checkpoints, reducing repeated prompt work |
| Revenue-linked branching | Creators have a reason to improve branches, not just upload once |
| Drop and revival mechanics | Quality control becomes part of the product experience |
| AI-native production loop | Generation, preview, storage, playback, and publishing are integrated |
| IP-friendly structure | Rights holders can seed official universes while measuring which fan paths resonate |

---

## Hackathon Highlights

Branchly is more than a static demo page. It includes a working end-to-end AI generation pipeline:

- **Live Google Veo 3.1 video generation** through Vertex AI long-running operations.
- **Google Imagen 3 character reference generation** for front, side, and back character sheets.
- **Visual asset inheritance** across parent and child story checkpoints.
- **GCS-backed persistence** for checkpoint manifests, asset descriptors, and generated video outputs.
- **Generated-video playback** from Cloud Storage, including public object playback and a local media proxy path.
- **Safety-aware prompt shaping** for Veo generation.
- **Reference-image guidance** using Veo `referenceImages` / `referenceType: "asset"` so selected avatars preserve character identity without being used as the first frame.
- **Branching tree interface** with pan, zoom, node health states, paid unlocks, and creator revenue split UI.

---

## Feature Overview

### 1. Branching Story Universe

- Interactive visual story tree with pan and zoom.
- Each node represents an episode or branch checkpoint.
- Nodes show likes, unlock status, creator attribution, and video preview.
- Branch states include active, endangered, dropped, locked, and paid.
- New AI-generated branches are attached back into the tree.

### 2. AI Branch Generation

Creators can open any eligible node and continue the story:

- Write the next scene.
- Select the character version to preserve.
- Select a scene environment.
- Choose duration, camera motion, and Veo model.
- Generate a video branch.
- Preview the result.
- Attach it into the story tree.

The generation flow uses:

- `veo-3.1-generate-001` as the standard default model.
- Long-running Vertex AI operations via `predictLongRunning`.
- Polling through `fetchPredictOperation`.
- GCS output storage under `gs://{GCS_BUCKET}/{GCS_PREFIX}/generated-videos/`.

### 3. Character Consistency System

One of the hardest problems in AI video is keeping characters consistent over multiple scenes. Branchly addresses this with an asset model:

- Each character has a stable `characterId`.
- Each age / timeline version is a separate asset.
- The creator selects the exact character version for the branch.
- Up to three selected character avatars are sent to Veo as asset references, not as first-frame images.
- The prompt includes locked identity descriptors.
- For Veo 3.x, reference inputs are capped at the model limit and scene/background images are omitted from the reference list to keep the references focused on character fusion.

This gives the model identity guidance while still allowing the generated video to start with a fresh shot.

### 4. Character Creator

The built-in character creator uses Google Imagen 3:

- Creator enters a visual description.
- Backend calls Imagen 3 through the Vertex AI publisher-model `predict` endpoint.
- Three reference views are generated simultaneously: front, side, and back.
- The selected reference can be added into the branch modal.
- Age variants can be created for flashbacks, time skips, and alternate timelines.

### 5. Asset Inheritance

Every checkpoint only stores the assets it introduces:

```text
Root checkpoint
  ownAssetIds: [Lin Xia, Chen Yi, Conference Room, Main Style]

Child checkpoint
  ownAssetIds: [New Character Variant]

Grandchild checkpoint
  inherited assets = root + child + grandchild
```

At generation time, the app walks the parent chain and merges inherited assets:

```js
getAvailableAssets(nodeId)
```

This is the key scalability idea: branches can refer to previous checkpoint assets without duplicating config or media.

---

## Technical Architecture

```text
Browser: branchly.html
  ├── Story tree UI
  ├── Node detail panel
  ├── Branch generation modal
  ├── Character / scene selector
  └── Video preview + attach flow

Node.js server.js
  ├── Static app server
  ├── Google Veo proxy
  ├── Google Imagen proxy
  ├── GCS checkpoint storage API
  ├── GCS asset descriptor API
  ├── GCS media proxy
  └── Health endpoints

Google Cloud
  ├── Vertex AI Veo 3.1
  ├── Imagen 3
  └── Cloud Storage
```

### Why The Backend Is Interesting

The backend is intentionally dependency-light:

- Uses Node.js `http` directly.
- Uses REST APIs instead of Google SDKs.
- Performs service-account JWT signing manually.
- Reuses the same service account flow for GCS and Vertex AI.
- Streams private GCS media through `/api/media` when needed.
- Supports local filesystem fallback when GCS is not configured.

That makes the prototype easy to audit for a hackathon evaluator: the core logic is visible in one server file, without hidden framework machinery.

---

## AI Pipeline

### Video Generation

Endpoint:

```http
POST /api/generate
```

The server:

1. Validates the payload.
2. Builds a Veo request.
3. Converts selected avatar references into base64 image assets.
4. Sends asset references to Veo using `referenceImages`.
5. Starts a long-running operation.
6. Returns the operation name to the browser.

### Operation Polling

Endpoint:

```http
GET /api/status/{operationName}
```

The browser polls every 5 seconds for up to 5 minutes. When complete:

- If a video exists, it is shown in the preview panel.
- If Veo filters the output, the app surfaces `raiMediaFilteredReasons`.
- If GCS returns a generated `gcsUri`, the app converts it to a playable media URL.

### Reference Image Handling

The system supports several reference input forms:

```json
{
  "image_references": [
    { "refImageUrl": "assets/characters/lin-xia.png", "type": "subject" },
    { "dataUrl": "data:image/png;base64,...", "type": "subject" },
    { "gcsUri": "gs://your-bucket/branchly/assets/asset/image.png" }
  ]
}
```

The server normalizes these into the format Veo expects:

```json
{
  "referenceImages": [
    {
      "image": {
        "bytesBase64Encoded": "...",
        "mimeType": "image/png"
      },
      "referenceType": "asset"
    }
  ]
}
```

### Prompt Safety And Control

Veo can reject generations through Responsible AI filtering. Branchly handles that in two ways:

- It rewrites risky melodrama language into neutral workplace-drama language.
- It displays Veo filter messages instead of silently showing an empty preview.

The prompt also instructs Veo:

- Use up to three asset references for character identity consistency.
- Do not treat the avatar as the first frame.
- Begin with a fresh moving shot and natural camera motion.

---

## Data Model

### Checkpoint Manifest

Each story node can be persisted as a checkpoint:

```json
{
  "schemaVersion": 1,
  "storyId": "story_001",
  "nodeId": "node_a",
  "parentId": "node_root",
  "title": "The Coldwave Arrives",
  "synopsis": "...",
  "prompt": "...",
  "video": {
    "url": "...",
    "gcsUri": "gs://..."
  },
  "ownAssetIds": ["asset_lx", "asset_scene_meeting"],
  "config": {
    "model": "veo-3.1-generate-001",
    "duration": 8
  }
}
```

### Asset Descriptor

```json
{
  "schemaVersion": 1,
  "assetId": "asset_lx",
  "type": "character",
  "name": "Lin Xia",
  "refName": "linxia_28",
  "refImageUrl": "assets/characters/lin-xia.png",
  "gcsUri": "gs://...",
  "promptPrefix": "A 28-year-old East Asian woman..."
}
```

### GCS Layout

```text
gs://{GCS_BUCKET}/{GCS_PREFIX}/
  assets/
    {assetId}.json
    {assetId}/{filename}
  stories/
    {storyId}/
      checkpoints/
        {nodeId}/
          manifest.json
  generated-videos/
    {operationOutputId}/
      sample_0.mp4
```

---

## API Reference

```http
GET  /api/health
GET  /api/storage/health

POST /api/generate
GET  /api/status/{operationName}
POST /api/generate-character

POST /api/assets
POST /api/assets/upload-local
GET  /api/assets/{assetId}

POST /api/checkpoints
GET  /api/checkpoints/{nodeId}?storyId=story_001

GET  /api/media?gcsUri=gs://...
```

---

## Tech Stack

| Layer | Technology | Why It Matters |
|---|---|---|
| Video generation | Google Vertex AI Veo 3.1 | High-quality AI short-drama video generation |
| Image generation | Google Imagen 3 | Character sheet and avatar reference generation |
| Storage | Google Cloud Storage | Durable checkpoint, asset, and generated-video persistence |
| Auth | Service account JWT | Server-side Google API access without exposing secrets |
| Frontend | Vanilla HTML/CSS/JS | Fast hackathon iteration, no build complexity |
| Tree rendering | SVG + HTML foreignObject | Rich node cards inside a zoomable graph |
| Backend | Node.js `http` | Auditable, dependency-light API server |

---

## Project Structure

```text
branchly/
├── branchly.html              # Main Branchly application
├── character_creator.html     # Standalone character reference generator
├── server.js                  # API server, Google integration, GCS persistence
├── package.json
├── .env.example
├── gcs-cors.json
├── assets/                    # Character refs, scene refs, posters
├── Videos/                    # Pre-generated story video content
└── docs/
    ├── architecture-v2.md
    ├── PRD.md
    ├── DESIGN.md
    └── gcs-checkpoint-storage.md
```

The server also maps the legacy URL `/storytree_creator.html` to `branchly.html`, so previous demo links continue to work.

---

## Setup

Requirements:

- Node.js 18+
- Google Cloud project
- Vertex AI API enabled
- Google Cloud Storage bucket
- Service account with access to Vertex AI and Storage

```bash
cp .env.example .env
npm start
```

Open:

```text
http://localhost:5173
```

Legacy demo URL:

```text
http://localhost:5173/storytree_creator.html
```

---

## Environment Variables

```env
VIDEO_GENERATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_VIDEO_MODEL=veo-3.1-generate-001
GOOGLE_IMAGE_MODEL=imagen-3.0-generate-002
GOOGLE_VIDEO_RESOLUTION=720p
GOOGLE_API_KEY=your_google_api_key_here

GCS_BUCKET=your-branchly-bucket
GCS_PREFIX=branchly
GOOGLE_APPLICATION_CREDENTIALS=./branchly-storage-key.json
```

### Recommended IAM Roles

For the service account used by the server:

- `roles/aiplatform.user`
- `roles/storage.objectAdmin`

For public generated-video playback:

- Bucket-level `roles/storage.objectViewer` for `allUsers`, or
- Keep the bucket private and use `/api/media` proxy playback.

---

## Demo Script

1. Open Branchly.
2. Enter the **Coldwave Era · Rebirth** story universe.
3. Inspect the branch tree and node panel.
4. Click **Continue Here** on an active node.
5. Select a character version and scene.
6. Write a calm workplace-drama continuation prompt.
7. Generate with Veo 3.1.
8. Preview the generated video.
9. Click **Use and Attach** to add it as a new branch.
10. Show the new branch in the tree.

Suggested generation prompt:

```text
Lin Xia sits in the conference room, looks at Chen Yi calmly,
and says one firm sentence while the camera slowly pushes in.
```

---

## Evaluation Checklist

For hackathon / AI-code evaluators, Branchly demonstrates:

- A clear user problem and monetizable product loop.
- Real integration with Google generative media models.
- Long-running async operation handling.
- Generated media persistence in cloud storage.
- Reference-image conditioning for character consistency.
- Parent-chain resource inheritance for scalable story branching.
- Authenticated server-side API proxying to protect credentials.
- Graceful handling of model safety filters.
- Browser playback of generated GCS media.
- A complete end-to-end creator workflow, not just isolated API calls.

---

## Current Limitations

This is a hackathon prototype, so several production items are intentionally simplified:

- In-memory likes, unlocks, and newly attached branches should move to a database.
- User auth and payment processing are mocked.
- Creator revenue split is simulated in UI.
- Generation cost controls and moderation queues need production hardening.
- Multi-user collaboration and branch ranking should be backed by persistent analytics.

---

## Roadmap

- Persist all story graph edits to GCS or Firestore.
- Add user accounts and wallet/token balances.
- Add branch ranking based on watch completion, likes, and unlocks.
- Add moderation review for generated branches.
- Add signed URL support as an alternative to public GCS objects.
- Add batch branch generation and A/B testing.
- Add creator dashboards for revenue and branch performance.
- Expand asset inheritance to support props, costumes, voices, and music.

---

## Why Branchly Is Compelling

Branchly is not just "AI video generation in a UI." It proposes a new entertainment structure:

- **AI lowers production cost.**
- **Branching increases content surface area.**
- **Viewer unlocks validate demand.**
- **Creator revenue turns fan fiction into an economy.**
- **Asset inheritance makes long-running AI story worlds manageable.**

The product opportunity is a platform where every successful scene can become the root of another creator-owned path.
