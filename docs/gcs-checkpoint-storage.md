# GCS Checkpoint Storage

Branchly stores scalable checkpoint state as JSON manifests and asset descriptors.

## Storage Layout

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

## Manifest Shape

Each checkpoint stores only the resources it introduces in `ownAssetIds`.
Inherited resources are resolved by walking `parentId` to the root.

```json
{
  "schemaVersion": 1,
  "storyId": "story_001",
  "nodeId": "node_a",
  "parentId": "node_root",
  "title": "The Coldwave Arrives",
  "prompt": "Lin Xia turns with a cold smile.",
  "video": {
    "url": "branch1.mov",
    "gcsUri": "gs://bucket/branchly/videos/branch1.mov"
  },
  "config": {
    "model": "v6",
    "duration": 5,
    "camera_movement": "push_in"
  },
  "ownAssetIds": []
}
```

## Asset Descriptor Shape

```json
{
  "schemaVersion": 1,
  "assetId": "asset_lx",
  "type": "character",
  "name": "Lin Xia",
  "refName": "linxia",
  "pixverseImgId": 875295974,
  "refImageUrl": "lin-xia.png",
  "gcsUri": "gs://bucket/branchly/assets/asset_lx/lin-xia.png",
  "promptPrefix": "A 28-year-old East Asian woman...",
  "negativePrompt": "no changing outfit, no different face"
}
```

## API

Save an asset descriptor:

```http
POST /api/assets
```

Upload a local asset file into checkpoint storage and save its descriptor:

```http
POST /api/assets/upload-local
```

```json
{
  "assetId": "asset_lx",
  "filePath": "lin-xia.png",
  "type": "character",
  "name": "Lin Xia",
  "refName": "linxia"
}
```

Save a checkpoint manifest and any asset descriptors introduced by it:

```http
POST /api/checkpoints
```

```json
{
  "checkpoint": {
    "storyId": "story_001",
    "nodeId": "node_a",
    "parentId": "node_root",
    "title": "The Coldwave Arrives",
    "prompt": "Lin Xia turns with a cold smile.",
    "config": { "model": "v6", "duration": 5 },
    "ownAssetIds": []
  },
  "assets": []
}
```

Load a checkpoint and its inherited asset chain:

```http
GET /api/checkpoints/{nodeId}?storyId=story_001
```

Check the active storage backend:

```http
GET /api/storage/health
```

## Configuration

Set these in `.env`:

```env
GCS_BUCKET=your-branchly-bucket
GCS_PREFIX=branchly
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

For local development without GCS credentials, the same API writes to `.checkpoint-store/`.
