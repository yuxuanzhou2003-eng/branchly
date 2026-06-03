# Branchly

Branchly is a hackathon prototype for collaborative, branching short-drama creation. It combines a visual story tree with Google Omni / Veo-style video generation and reference inheritance so creators can continue an existing scene while preserving character, scene, and style continuity.

The core idea is simple: every story checkpoint can inherit visual resources from its parent chain. A creator writes what happens next, selects the inherited characters and scene for the shot, and the app assembles a generation payload that keeps the branch visually consistent with everything before it.

## What It Does

- Displays a short-drama universe as a branching story tree.
- Lets users inspect each checkpoint/node with video, synopsis, likes, views, status, unlock state, and inherited assets.
- Opens a branch-creation modal where users write the next scene.
- Automatically resolves inherited character, scene, and style assets through the parent chain.
- Builds Google video generation payloads with inherited visual references, locked character prompts, negative prompts, model, duration, aspect ratio, output storage, and seed.
- Supports a demo generation mode with preset results for fast hackathon demos.
- Provides backend endpoints for Google video generation, checkpoint manifests, asset descriptors, and Google Cloud Storage-backed persistence.

## Main Screens

- `storytree_creator.html` is the main Branchly prototype. It includes the home page, drama cards, visual story tree, node detail panel, and branch generation modal.
- `index.html` is a compact workflow lab for testing the StoryTree / Google video payload flow.

## How The Resource Model Works

Resources are centralized in an asset library. Checkpoints only store the asset IDs they introduce.

```text
asset library
  asset_lx
  asset_cy
  asset_scene_meeting
  asset_style_main

checkpoint node
  nodeId
  parentId
  ownAssetIds
```

When the app needs resources for a checkpoint, it walks from that checkpoint up through `parentId` until the root and merges all `ownAssetIds`. This lets each branch reuse prior visual resources without duplicating data.

For scalable storage, checkpoint manifests and asset descriptors can be stored in Google Cloud Storage:

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
```

See [docs/gcs-checkpoint-storage.md](docs/gcs-checkpoint-storage.md) for the manifest schema and API details.

## Tech Stack

- Static HTML, CSS, and browser JavaScript.
- A dependency-free Node.js HTTP server in `server.js`.
- Google Vertex AI Veo / Omni video generation endpoints for long-running video jobs.
- Google Cloud Storage REST integration for checkpoint and asset persistence.
- Local JSON-file fallback storage under `.checkpoint-store/` when GCS is not configured.

## Local Setup

Copy the example env file:

```bash
cp .env.example .env
```

For demo-only local use, you can run without Google video credentials. The app will use preset generation results.

To enable real Google Omni / Veo generation, set:

```env
VIDEO_GENERATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_VIDEO_MODEL=veo-3.1-fast-generate-preview
GOOGLE_VIDEO_RESOLUTION=720p
GOOGLE_API_KEY=your_google_api_key_here
```

For local development, the project can also authenticate Google generation with the same service account file used for GCS:

To enable GCS-backed checkpoint storage, set:

```env
GCS_BUCKET=your-branchly-bucket
GCS_PREFIX=branchly
GOOGLE_APPLICATION_CREDENTIALS=./branchly-storage-key.json
```

Start the server:

```bash
npm start
```

Open:

```text
http://localhost:5173/storytree_creator.html
```

The compact workflow lab is available at:

```text
http://localhost:5173
```

## Backend API

Health and storage:

```http
GET /api/health
GET /api/storage/health
```

Checkpoint and asset storage:

```http
POST /api/assets
POST /api/assets/upload-local
GET /api/assets/{assetId}
POST /api/checkpoints
GET /api/checkpoints/{nodeId}?storyId=story_001
```

Legacy reference upload helpers:

```http
POST /api/upload-reference
POST /api/upload-local-assets
```

Google video generation:

```http
POST /api/generate
GET /api/status/{operationName}
```

## GCS CORS

The repository includes `gcs-cors.json` for allowing browser access from:

```text
https://pixverse-hackathon.vercel.app
```

Apply it with:

```bash
gcloud storage buckets update gs://your-branchly-bucket --cors-file=gcs-cors.json
```

## Important Files

- `storytree_creator.html` - main Branchly single-file prototype.
- `index.html` - compact payload workflow lab.
- `app.js` - logic for the compact workflow lab.
- `server.js` - static server, Google video generation proxy, checkpoint storage API, legacy PixVerse upload helpers, and GCS integration.
- `styles.css` - styles for the compact workflow lab.
- `docs/gcs-checkpoint-storage.md` - GCS checkpoint storage model and API documentation.
- `gcs-cors.json` - CORS config for the deployed Vercel domain.
- `storyboard-*.md` - source storyboards and planning material.

## Demo Notes

The main prototype defaults to demo mode. Demo generation waits briefly, returns a preset branch result, and lets the user attach it to the tree. This is intentional for live demos where real video generation latency would interrupt the product walkthrough.

For a production path, the app should move the single-file prototype into modules, persist story state through the checkpoint API, and route all real Google generation through `server.js` so credentials stay private.
