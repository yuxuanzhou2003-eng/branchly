# Branchly

**A branching short-drama universe where every scene can split into a new story.**

Branchly is a collaborative AI video platform where a seed story grows into a tree. The platform publishes opening episodes, and creators continue the story by generating new branches using Google Veo 3.1. Viewers browse the tree, like the branches they believe in, and unlock paid episodes — forming a creator economy built around collective storytelling.

---

## The Idea

Traditional short dramas are linear. Branchly makes them alive.

Every node in the tree is a scene. Any scene can be continued. High-performing branches rise; low-engagement ones fade. The story evolves based on what the audience actually responds to — not what an algorithm recommends.

The economic loop:
- **Creators** pay tokens to generate new branches
- **Viewers** pay to unlock episodes after the free window
- **Creators** receive 79% of unlock revenue; the platform takes 21%
- Dropped branches go to a recycle bin — revivable if interest returns

---

## Features

### Story Universe
- Visual branching tree with pan, zoom, and animated node connections
- Three health states: **Active** (glowing), **Endangered** (pulsing), **Dropped** (grey)
- Node cards show live like counts, paywall status, and video previews on hover
- Sequential unlock logic: episode N requires episode N-1 to be unlocked first

### Video Player & Unlock
- Free window (first 30 days): all viewers can watch
- Paid window: blurred preview + unlock dialog showing creator/platform revenue split
- Smooth blur-dissolve animation on unlock reveal
- Like button and "Continue Here" only available after watching

### Branch Generation (Google Veo 3.1)
- Character version selector: choose exact age/appearance variant per scene
- Story context chain auto-assembled from parent synopses and passed to the model
- Character identity prefixes locked into every generation prompt for visual consistency
- Demo mode (preset results) and live mode (real Veo API) switchable via `CONFIG.DEMO_MODE`
- Polls operation status every 5s for up to 5 minutes

### Character Creator (Google Imagen 3)
- Inline in the branch generation modal — no page navigation
- Describe a character → generate front, side, and back reference views simultaneously
- Add age variants of existing characters (e.g. "Age 28", "Age 25 · Flashback", "Age 31 · 3 Years Later")
- All versions preserved and selectable independently — supports flashback scenes

### Visual Asset Inheritance
- Characters, scenes, and style assets live in a central library
- Each node stores only the asset IDs it introduces (`ownAssetIds`)
- `getAvailableAssets(nodeId)` walks the parent chain and merges all ancestor assets
- New branches automatically inherit their parent's full visual lineage — no manual re-configuration

---

## Architecture

```
Browser (branchly.html)
  │  User actions: browse tree, like, unlock, generate
  │
  ▼
server.js  (Node.js, zero dependencies)
  ├── /api/generate          → Google Vertex AI Veo 3.1 (long-running video job)
  ├── /api/status/:id        → Poll Veo operation result
  ├── /api/generate-character → Google Imagen 3 (3-angle character reference)
  ├── /api/checkpoints       → GCS or local JSON checkpoint storage
  ├── /api/assets            → Asset descriptor persistence
  └── /api/media             → GCS media proxy (streams video to browser)
  │
  ▼
Google Cloud
  ├── Vertex AI Veo 3.1       (veo-3.1-generate-001)
  ├── Imagen 3               (imagen-3.0-generate-002)
  └── Cloud Storage          (checkpoint manifests, generated videos, asset refs)
```

**Frontend:** Single-file HTML/CSS/JS — no build step, no framework.
**Backend:** Dependency-free Node.js HTTP server — no Express, no npm installs.
**Storage:** GCS-backed checkpoint manifests and asset descriptors, with local `.checkpoint-store/` fallback.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Video generation | Google Vertex AI — Veo 3.1 (`veo-3.1-generate-001`) |
| Image generation | Google Imagen 3 (`imagen-3.0-generate-002`) |
| Auth | Service account JWT exchange (no SDK dependency) |
| Storage | Google Cloud Storage REST API |
| Frontend | Vanilla HTML/CSS/JS, SVG canvas for tree |
| Backend | Node.js `http` module only |
| Video hosting | GCS + local proxy via `/api/media` |

---

## Project Structure

```
branchly/
├── branchly.html    # Main app — branch universe, node panel, generation modal
├── character_creator.html    # Standalone character reference sheet generator
├── server.js                 # Backend — video generation proxy, GCS, asset API
├── package.json
├── .env.example              # Environment variable reference
├── gcs-cors.json             # GCS CORS configuration
├── assets/                   # Character and scene reference images, drama posters
├── Videos/                   # Pre-generated story content
│   ├── Reborn.mp4            # Root episode
│   ├── 公司/                  # Branch A: Company (3 episodes)
│   ├── 童话/                  # Branch B: Fairy Tale (4 episodes)
│   └── 童年/                  # Branch C: Childhood (4 episodes)
└── docs/
    ├── architecture-v2.md    # Technical design and asset model
    ├── PRD.md                # Product requirements
    ├── DESIGN.md             # Design system
    └── gcs-checkpoint-storage.md
```

---

## Setup

**Requirements:** Node.js 18+, a Google Cloud project with Vertex AI API enabled.

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Fill in your credentials
#    GOOGLE_CLOUD_PROJECT=your-project-id
#    GOOGLE_API_KEY=your-api-key
#    GOOGLE_APPLICATION_CREDENTIALS=./your-service-account.json

# 3. Start
npm start
# → http://localhost:5173
```

To use pre-recorded content without real generation, set `DEMO_MODE: true` in `branchly.html`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VIDEO_GENERATION_PROVIDER` | Yes | Set to `google` |
| `GOOGLE_CLOUD_PROJECT` | Yes | GCP project ID |
| `GOOGLE_API_KEY` | Yes | Google AI API key (Veo + Imagen) |
| `GOOGLE_CLOUD_LOCATION` | No | Defaults to `us-central1` |
| `GOOGLE_VIDEO_MODEL` | No | Defaults to `veo-3.1-generate-001` |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Path to service account JSON (for GCS) |
| `GCS_BUCKET` | No | GCS bucket for checkpoint + video storage |

---

## API Reference

```http
POST /api/generate                     # Submit Veo video generation job
GET  /api/status/:operationId          # Poll generation result
POST /api/generate-character           # Generate 3-angle character reference (Imagen 3)
POST /api/checkpoints                  # Save checkpoint manifest
GET  /api/checkpoints/:nodeId          # Load checkpoint with inherited assets
POST /api/assets                       # Save asset descriptor
GET  /api/assets/:assetId             # Load asset descriptor
GET  /api/media?gcsUri=...            # Stream GCS video to browser
GET  /api/health                       # Server + provider health check
```

---

## Content

The pre-loaded story is **Coldwave Era · Rebirth** — a revenge short drama with three branching timelines:

| Branch | Theme | Episodes |
|---|---|---|
| 公司 (Company) | Corporate conspiracy | 3 |
| 童话 (Fairy Tale) | Frozen parallel world | 4 |
| 童年 (Childhood) | Time-loop childhood | 4 |

All video content generated with Google Veo 3.1. Character reference images used as visual anchors for cross-episode consistency.
