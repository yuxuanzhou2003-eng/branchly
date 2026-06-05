
/* ──────────────────────────────────────────────────────────
   CONFIG
   Set DEMO_MODE=false to route live generation through server.js,
   which calls Google Vertex AI Veo / Omni video generation.
   ────────────────────────────────────────────────────────── */
const CONFIG = {
  DEMO_MODE: false,
  API_BASE: '',
  DEFAULT_DURATION: 8,
  DEFAULT_QUALITY: '720p',
  DEFAULT_MODEL: 'veo-3.1-generate-001',
};
const VEO_REFERENCE_IMAGE_LIMIT = 3;

/* ──────────────────────────────────────────────────────────
   ASSETS
   ────────────────────────────────────────────────────────── */
const ASSETS = {
  // ── Lin Xia · all versions ──────────────────────────────
  asset_lx: {
    assetId:'asset_lx', type:'character', characterId:'char_lx',
    name:'Lin Xia', ageLabel:'Age 28', refName:'linxia_28',
    pixverseImgId: 875295974, refImageUrl: 'assets/lin-xia.png',
    promptPrefix:'A 28-year-old East Asian woman, shoulder-length straight black hair, oval face, cold pale skin, sharp calm eyes, tailored dark grey business suit',
    negativePrompt:'no changing outfit, no different face, no extra person',
  },
  // ── Chen Yi ──────────────────────────────────────────────
  asset_cy: {
    assetId:'asset_cy', type:'character', characterId:'char_cy',
    name:'Chen Yi', ageLabel:'Age 32', refName:'chenyi_32',
    pixverseImgId: 875295975, refImageUrl: 'assets/chen-yi.png',
    promptPrefix:'A 32-year-old East Asian man, neat short hair, sharp navy suit, arrogant and restrained',
    negativePrompt:'no different face, no extra person, no casual clothes',
  },
  // ── Mystery Man ──────────────────────────────────────────
  asset_meteor: {
    assetId:'asset_meteor', type:'character', characterId:'char_meteor',
    name:'Mystery Man', ageLabel:'Age 45', refName:'mysteryman_45',
    pixverseImgId: 875295976, refImageUrl: 'assets/mystery-man.png',
    promptPrefix:'A 45-year-old East Asian man, tired eyes, dark coat, restrained and suspicious',
    negativePrompt:'no young face, no extra person',
  },
  asset_scene_meeting: {
    assetId:'asset_scene_meeting', type:'scene', name:'Glass Conference Room', refName:'meetingroom',
    pixverseImgId: 20001, refImageUrl: 'assets/glass-conference-room.png',
  },
  asset_scene_blizzard: {
    assetId:'asset_scene_blizzard', type:'scene', name:'Blizzard Street', refName:'blizzard',
    pixverseImgId: 20002, refImageUrl: 'assets/blizzard-street.png',
  },
  asset_scene_lab: {
    assetId:'asset_scene_lab', type:'scene', name:'Dim Laboratory', refName:'lab',
    pixverseImgId: 20003, refImageUrl: '',
  },
  asset_style_main: {
    assetId:'asset_style_main', type:'style', name:'Coldwave Main Style', refName:'coldwave',
    promptPrefix:'vertical 9:16, cinematic short-drama, high contrast, cold winter light, shallow depth of field, film grain, tense revenge drama mood',
  },
};

/* ──────────────────────────────────────────────────────────
   MOCK NODES
   ────────────────────────────────────────────────────────── */
function vp(p) { return p.split('/').map((s,i)=>i===0?s:encodeURIComponent(s)).join('/'); }

const INITIAL_NODES = {
  // ── Root ────────────────────────────────────────────────
  node_root: {
    nodeId:'node_root', parentId:null, title:'Reborn', storyId:'story_001',
    synopsis:'She tore up the check in public and the room erupted. This is where the whole story begins.',
    prompt:'Lin Xia stands in the banquet hall and tears up the check. The camera slowly pushes in as the crowd freezes.',
    authorId:'platform', authorName:'Platform', duration:35,
    ageDays:60, isFreeWindow:true, unlockPrice:0,
    likes:520, impressions:12000, paidUnlocks:0,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/Reborn.mp4'),
    ownAssetIds:['asset_lx','asset_cy','asset_meteor','asset_scene_meeting','asset_scene_blizzard','asset_style_main'],
  },

  // ── Branch A · 公司 (Company) ────────────────────────────
  node_co_1: {
    nodeId:'node_co_1', parentId:'node_root', title:"Boss's Message", storyId:'story_001',
    synopsis:"A cryptic message from the CEO arrives at 3am. Something is being set in motion.",
    prompt:"Close on Lin Xia's phone screen — a message from the CEO she hasn't heard from in years.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:10, isFreeWindow:true, unlockPrice:1.9,
    likes:188, impressions:2100, paidUnlocks:0,
    isProtected:false, status:'alive',
    videoUrl: vp("videos/公司/1 Boss's message.mp4"), ownAssetIds:[],
  },
  node_co_2: {
    nodeId:'node_co_2', parentId:'node_co_1', title:'Gossip from Colleague', storyId:'story_001',
    synopsis:"A whispered rumor in the break room reveals someone has been watching her every move.",
    prompt:"Two colleagues speak in hushed tones by the coffee machine. Lin Xia listens from the corridor.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:143, impressions:980, paidUnlocks:34,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/公司/2 Gossip from collegue.mp4'), ownAssetIds:[],
  },
  node_co_3: {
  node_co_3: {
    nodeId:'node_co_3', parentId:'node_co_2', title:'A Weird Mission', storyId:'story_001',
    synopsis:"She is handed an assignment no one else would take — a mission that changes everything.",
    prompt:"The CEO slides a sealed envelope across the desk. Lin Xia opens it and her expression shifts.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:97, impressions:620, paidUnlocks:28,
    isProtected:false, status:'alive',
    videoUrl: vp('Videos/公司/3-1. A wierd mission.mp4'), ownAssetIds:[],
  },
  node_co_3_2: {
    nodeId:'node_co_3_2', parentId:'node_co_2', title:'Tell My Sis', storyId:'story_001',
    synopsis:"Instead of following orders, she makes an unexpected call — a choice that splits her path in two.",
    prompt:"Lin Xia steps into the stairwell, dials a number she hasn't called in years. Her sister picks up.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:74, impressions:510, paidUnlocks:19,
    isProtected:false, status:'alive',
    videoUrl: vp('Videos/公司/3-2 Tell my sis.mp4'), ownAssetIds:[],
  },
  node_co_4_2: {
    nodeId:'node_co_4_2', parentId:'node_co_3_2', title:'Predict the Future', storyId:'story_001',
    synopsis:"Her sister knows something she shouldn't. A prediction too precise to be a coincidence.",
    prompt:"Two sisters face each other across a kitchen table. One speaks. The other goes pale.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:58, impressions:390, paidUnlocks:14,
    isProtected:false, status:'alive',
    videoUrl: vp('Videos/公司/4-2 Predict the future.mp4'), ownAssetIds:[],
  },

  // ── Branch B · 童话 (Fairy Tale) ─────────────────────────
  node_ft_1: {
    nodeId:'node_ft_1', parentId:'node_root', title:'Into the Frozen World', storyId:'story_001',
    synopsis:"She steps through a door that shouldn't exist and finds herself in a world of endless winter.",
    prompt:"Lin Xia walks through a glowing doorway. On the other side — a vast frozen tundra under a violet sky.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:6, isFreeWindow:true, unlockPrice:1.9,
    likes:231, impressions:3400, paidUnlocks:0,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童话/1. Into the frozen world.mp4'), ownAssetIds:[],
  },
  node_ft_2: {
    nodeId:'node_ft_2', parentId:'node_ft_1', title:'Frozen Palace', storyId:'story_001',
    synopsis:"The palace of ice holds secrets buried for centuries — and someone wants her to find them.",
    prompt:"Wide shot of a crystalline palace. Lin Xia approaches the gate as ice statues watch silently.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:178, impressions:1800, paidUnlocks:52,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童话/2. Frozen palace.mp4'), ownAssetIds:[],
  },
  node_ft_3: {
    nodeId:'node_ft_3', parentId:'node_ft_2', title:'Death Threat', storyId:'story_001',
    synopsis:"A voice in the frozen dark speaks her name. This world does not welcome intruders.",
    prompt:"Darkness. A whisper. Lin Xia turns — a figure made of ice stands inches from her face.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:134, impressions:1100, paidUnlocks:41,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童话/3. Death threat.mp4'), ownAssetIds:[],
  },
  node_ft_4: {
    nodeId:'node_ft_4', parentId:'node_ft_3', title:'Being Chased', storyId:'story_001',
    synopsis:"She runs. The ice cracks beneath her feet. Whatever is behind her is not human.",
    prompt:"Lin Xia sprints across a frozen lake. Behind her the ice shatters. Something massive pursues.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:89, impressions:740, paidUnlocks:29,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童话/4. Being chased.mp4'), ownAssetIds:[],
  },

  // ── Branch C · 童年 (Childhood) ──────────────────────────
  node_ch_1: {
    nodeId:'node_ch_1', parentId:'node_root', title:'8 Years Old Again', storyId:'story_001',
    synopsis:"She wakes up and she is 8 years old. Everything she built — gone. The clock has reset.",
    prompt:"Lin Xia looks at her small hands. She is in a childhood bedroom. Calendar reads 1997.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:4, isFreeWindow:true, unlockPrice:1.9,
    likes:312, impressions:4200, paidUnlocks:0,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童年/1. 8 years old again.mp4'), ownAssetIds:[],
  },
  node_ch_2: {
    nodeId:'node_ch_2', parentId:'node_ch_1', title:'The Boy', storyId:'story_001',
    synopsis:"A boy she has never met looks at her like he knows exactly who she is — and who she will become.",
    prompt:"A young boy stands at the school gate staring at Lin Xia. She knows she has never seen him before.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:267, impressions:2900, paidUnlocks:88,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童年/2. the boy.mp4'), ownAssetIds:[],
  },
  node_ch_3: {
    nodeId:'node_ch_3', parentId:'node_ch_2', title:'Snow in Summer', storyId:'story_001',
    synopsis:"The seasons don't make sense here. The snow falls in July and the flowers never die.",
    prompt:"A summer street. Snowflakes fall. Children stare upward. Lin Xia catches one in her palm.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:198, impressions:1600, paidUnlocks:61,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童年/3. Snow in summer.mp4'), ownAssetIds:[],
  },
  node_ch_4: {
    nodeId:'node_ch_4', parentId:'node_ch_3', title:'Painting', storyId:'story_001',
    synopsis:"She finds a painting of herself she could never have painted. Someone knew. Someone always knew.",
    prompt:"An attic. Lin Xia pulls a dusty sheet from a canvas — her own face, aged, stares back at her.",
    authorId:'platform', authorName:'Platform', duration:8,
    ageDays:38, isFreeWindow:false, unlockPrice:1.9,
    likes:154, impressions:1200, paidUnlocks:47,
    isProtected:false, status:'alive',
    videoUrl: vp('videos/童年/4. Painting.mp4'), ownAssetIds:[],
  },
};

/* 4 short dramas for home grid */
const DRAMAS = [
  {
    id:'story_001', title:'Coldwave Era · Rebirth',
    tagline:'After tearing up that check in public, her comeback has only begun',
    poster:'assets/coldwave-rebirth-poster.png', status:'alive', featured:true,
    nodeIds:['node_co_1','node_ft_1','node_ch_1'],
  },
  {
    id:'story_002', title:'Queen of the Dark Night',
    tagline:'Deep violet night, lavish old money. After half a life in hiding, she overturns everything in one night',
    poster:'assets/queen-of-the-dark-night.png', status:'coming', featured:false,
    gradientFrom:'#1a0428', gradientTo:'#0a0318',
    nodeIds:[],
  },
  {
    id:'story_003', title:'Abyssal Chessboard',
    tagline:'All the love, hatred, and revenge are moves in a meticulously designed game',
    poster:'assets/abyssal-chessboard.png', status:'coming', featured:false,
    gradientFrom:'#040c18', gradientTo:'#0a1428',
    nodeIds:[],
  },
  {
    id:'story_004', title:'Roses and Thorns',
    tagline:'She turns love into a blade and cuts open the family lie',
    poster:'assets/roses-and-thorns.png', status:'coming', featured:false,
    gradientFrom:'#1a0408', gradientTo:'#280a0a',
    nodeIds:[],
  },
];

const PRESET_RESULTS = [
  { resultId:'preset_A', title:'New Sprout · Look Back in the Blizzard', synopsis:'Lin Xia looks back in the blizzard and discovers another operator behind Chen Yi.', seed:120845911 },
  { resultId:'preset_B', title:'New Sprout · Conference Room Counterattack', synopsis:'She pushes the check back across the table, the conference room lights snap dark, and Chen Yi finally loses control.', seed:573290184 },
  { resultId:'preset_C', title:'New Sprout · Recorded Evidence', synopsis:'An old recording exposes the truth behind the coldwave, and Lin Xia decides to drag the Chen family into judgment.', seed:948220731 },
];

/* ──────────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────────── */
const S = {
  nodes: JSON.parse(JSON.stringify(INITIAL_NODES)),
  tokenBalance: 100,
  unlockedNodes: new Set(['node_root','node_co_1','node_ft_1','node_ch_1']),
  likedNodes: new Set(),
  currentPage: 'home',
  selectedNodeId: null,
  modalParentId: null,
  modalPhase: 'draft',
  modalResult: null,
  modalPrompt: '',
  modalSelectedChars: new Set(),
  modalSelectedScene: '',
  modalResultIndex: 0,
  modalError: '',
  modalPayloadVisible: false,
  treeTransform: { x: 80, y: 80, k: 1 },
  treePositions: {},
  newNodeIds: new Set(),
  addCharStep: null,       // null | 'choose' | 'variant' | 'new' | 'new_loading' | 'new_results'
  addCharMode: 'new',      // 'new' | 'variant'
  addCharBaseId: null,
  addCharAge: '', addCharDesc: '',
  addCharNewName: '', addCharNewAge: '', addCharNewDesc: '', addCharNewStyle: 'cinematic realism, detailed',
  addCharNewImages: null,  // [{label, dataUrl}]
  addCharSelectedImg: null,
};

/* ──────────────────────────────────────────────────────────
   STARFIELD
   ────────────────────────────────────────────────────────── */
(function() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
    stars = Array.from({length:240}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.1+0.1, base: Math.random()*0.45+0.04,
      phase: Math.random()*Math.PI*2, speed: 0.004+Math.random()*0.007,
    }));
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const t = Date.now()/1000;
    stars.forEach(s => {
      const o = s.base + Math.sin(s.phase + t*s.speed)*0.1;
      ctx.fillStyle = `rgba(200,215,255,${Math.max(0,o)})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); window.addEventListener('resize', resize); draw();
})();

/* ──────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────── */
function getStoryContext(nodeId) {
  const synopses = [];
  let cur = S.nodes[nodeId];
  while (cur && synopses.length < 3) {
    if (cur.synopsis) synopses.unshift(cur.synopsis);
    cur = cur.parentId ? S.nodes[cur.parentId] : null;
  }
  return synopses.join(' → ');
}

function getStoryPath(nodeId) {
  const path = [];
  let cur = S.nodes[nodeId];
  while (cur) {
    path.unshift({ id: cur.nodeId, title: cur.title });
    cur = cur.parentId ? S.nodes[cur.parentId] : null;
  }
  return path;
}

// A node is accessible only if its parent has been watched (free or unlocked)
function isNodeAccessible(nodeId) {
  const node = S.nodes[nodeId];
  if (!node || !node.parentId) return true;
  const parent = S.nodes[node.parentId];
  if (!parent) return true;
  const parentWatched = parent.isFreeWindow || S.unlockedNodes.has(node.parentId);
  return parentWatched && isNodeAccessible(node.parentId);
}

function getAvailableAssets(nodeId) {
  const ids = new Set();
  let cur = S.nodes[nodeId];
  while (cur) {
    (cur.ownAssetIds||[]).forEach(id => ids.add(id));
    cur = cur.parentId ? S.nodes[cur.parentId] : null;
  }
  return [...ids].map(id => ASSETS[id]).filter(Boolean);
}

function mergeStoredAsset(asset) {
  if (!asset?.assetId) return;
  ASSETS[asset.assetId] = {
    ...(ASSETS[asset.assetId] || {}),
    ...asset,
  };
}

function mergeStoredCheckpoint(checkpoint) {
  if (!checkpoint?.nodeId || !S.nodes[checkpoint.nodeId]) return;
  const node = S.nodes[checkpoint.nodeId];
  node.ownAssetIds = [...new Set([
    ...(node.ownAssetIds || []),
    ...(checkpoint.ownAssetIds || []),
  ])];
  if (checkpoint.prompt) node.prompt = checkpoint.prompt;
  if (checkpoint.synopsis) node.synopsis = checkpoint.synopsis;
  if (checkpoint.video?.url) node.videoUrl = checkpoint.video.url;
  node.config = {
    ...(node.config || {}),
    ...(checkpoint.config || {}),
  };
}

async function hydrateStoredCheckpoints() {
  const nodeIds = Object.keys(S.nodes);
  const results = await Promise.allSettled(nodeIds.map(async nodeId => {
    const storyId = S.nodes[nodeId].storyId || 'story_001';
    const res = await fetch(`/api/checkpoints/${encodeURIComponent(nodeId)}?storyId=${encodeURIComponent(storyId)}&includeAssets=false`);
    if (res.status === 404 || !res.ok) return;
    const data = await res.json();
    const ownAssetIds = data.checkpoint?.ownAssetIds || [];
    mergeStoredCheckpoint(data.checkpoint);
    await Promise.allSettled(ownAssetIds
      .filter(assetId => !ASSETS[assetId])
      .map(async assetId => {
        const assetRes = await fetch(`/api/assets/${encodeURIComponent(assetId)}`);
        if (!assetRes.ok) return;
        const assetData = await assetRes.json();
        mergeStoredAsset(assetData.asset);
      }));
  }));
  const loaded = results.filter(r => r.status === 'fulfilled').length;
  if (loaded) console.info(`Hydrated ${loaded} checkpoint lookups from storage.`);
}

function nodeColor(node) {
  if (node.status === 'dropped')    return { fill:'#4b5563', glow:'none', filterId:'' };
  if (node.status === 'endangered') return { fill:'#f59e0b', glow:'var(--danger-g)', filterId:'glow-dngr' };
  if (node.likes > 100)             return { fill:'#f0c040', glow:'var(--hot-g)',    filterId:'glow-hot' };
  return { fill:'#78d8ff', glow:'var(--alive-g)', filterId:'glow-alive' };
}

function formatRate(node) {
  if (!node.impressions) return '—';
  return (node.likes/node.impressions*100).toFixed(1)+'%';
}

function toast(msg, ms=1800) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function uid() { return 'node_'+Math.random().toString(36).slice(2,10); }
function safePlayVideo(video) {
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(error => {
      if (error?.name !== 'AbortError') console.warn('Video preview playback failed:', error);
    });
  }
}
function resetPreviewVideo(video) {
  video.pause();
  video.currentTime = 0;
}

/* ──────────────────────────────────────────────────────────
   ROUTER
   ────────────────────────────────────────────────────────── */
function navigate(page, nodeId) {
  S.currentPage = page; S.selectedNodeId = nodeId || null;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-'+page);
  if (el) el.classList.add('active');
  const back = document.getElementById('nav-back');
  const backLabel = document.getElementById('nav-back-label');
  if (page === 'home') {
    back.style.display = 'none';
  } else {
    back.style.display = 'flex';
    backLabel.textContent = page === 'tree' ? 'Home' : 'branch universe';
  }
  if (page === 'home') renderHome();
  else if (page === 'tree') renderTree();
}

function navBack() {
  if (S.currentPage === 'tree') navigate('home');
  else navigate('tree');
}

/* ──────────────────────────────────────────────────────────
   HOME RENDER
   ────────────────────────────────────────────────────────── */
function renderHome() {
  // Update hero stats
  const aliveCount = Object.values(S.nodes).filter(n => n.status !== 'dropped').length;
  const totalLikes = Object.values(S.nodes).reduce((s,n) => s+n.likes, 0);
  document.getElementById('hero-branches').textContent = aliveCount;
  document.getElementById('hero-likes').textContent = totalLikes;

  // Drama cards — landscape poster + in-card branches
  const grid = document.getElementById('drama-grid');
  grid.innerHTML = DRAMAS.map(d => {
    const isNav = d.id === 'story_001';
    const bg = d.poster
      ? `<img src="${d.poster}" alt="${d.title}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
         ><div class="drama-poster-placeholder" style="display:none;background:linear-gradient(135deg,${d.gradientFrom||'#0a1030'} 0%,${d.gradientTo||'#040820'} 100%)"><span style="color:rgba(255,255,255,0.15);font-size:13px;letter-spacing:2px;text-align:center;padding:0 20px">${d.title}</span></div>`
      : `<div class="drama-poster-placeholder" style="background:linear-gradient(135deg,${d.gradientFrom||'#0a1030'} 0%,${d.gradientTo||'#040820'} 100%)"><span style="color:rgba(255,255,255,0.15);font-size:13px;letter-spacing:2px;text-align:center;padding:0 20px">${d.title}</span></div>`;

    // branch chips inside card — only for story_001
    const branchNodes = (d.nodeIds||[]).map(id => S.nodes[id]).filter(Boolean);
    const branchesHtml = branchNodes.length ? `
      <div class="card-branches">
        <div class="card-branches-label">
          <span>🔥 Hot Branches</span>
          <span style="color:var(--alive);font-weight:600">${branchNodes.length}</span>
        </div>
        <div class="card-branches-row">
          ${branchNodes.map(n => {
            const col = nodeColor(n);
            const isDropped = n.status === 'dropped';
            const isLocked  = !n.isFreeWindow && n.status !== 'dropped' && !n.videoUrl;
            // For thumbnail: use own video, or fall back to base.mov at a random-ish offset
            const thumbSrc = n.videoUrl || 'base.mov';
            const thumbT   = n.videoUrl ? '' : '#t=3';
            const vidHtml = `<video src="${thumbSrc}${thumbT}" muted playsinline preload="metadata"
                style="width:100%;height:100%;object-fit:cover"
                onmouseenter="if(!${isDropped}&&!${isLocked})safePlayVideo(this)"
                onmouseleave="resetPreviewVideo(this)"></video>`;
            const overlay = isDropped
              ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px">
                   <div style="font-size:14px">💀</div>
                   <div style="font-size:9px;color:var(--drop);text-transform:uppercase;letter-spacing:1px">Dropped</div>
                 </div>`
              : isLocked
              ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px">
                   <div style="font-size:14px">🔒</div>
                   <div style="font-size:9px;color:var(--hot);letter-spacing:0.5px">¥${n.unlockPrice}</div>
                 </div>`
              : `<div class="mini-play">▶</div>`;
            return `<div class="card-branch-chip" onclick="event.stopPropagation();navigate('tree');setTimeout(()=>openPanel('${n.nodeId}'),400)">
              <div class="card-branch-vid" style="position:relative">
                ${vidHtml}
                ${overlay}
              </div>
              <div class="card-branch-info">
                <div class="card-branch-title">${n.title}</div>
                <div class="card-branch-likes" style="color:${isDropped?'var(--drop)':isLocked?'var(--hot)':'var(--faint)'}">
                  ${isDropped ? 'Dropped' : isLocked ? 'Locked' : '♥ '+n.likes}
                </div>
              </div>
            </div>`;
          }).join('')}
          ${isNav ? `<div class="card-branch-chip" onclick="event.stopPropagation();navigate('tree')"
            style="display:flex;align-items:center;justify-content:center;border-style:dashed;opacity:0.5;min-height:80px">
            <div style="text-align:center;font-size:10px;color:var(--faint);line-height:1.5">+ Continue<br>New Branch</div>
          </div>` : ''}
        </div>
      </div>` : (d.status === 'coming' ? `
      <div class="card-branches" style="text-align:center;padding:16px">
        <span style="font-size:11px;color:var(--faint)">Coming soon</span>
      </div>` : '');

    const badge = d.featured
      ? `<div class="poster-badge live">🌿 Live</div>`
      : `<div class="poster-badge new">✦ Soon</div>`;

    const totalBranches = d.nodeIds?.length || 0;

    return `<div class="drama-card${d.featured?' featured':''}" onclick="${isNav?"navigate('tree')":'void(0)'}">
      <div class="drama-poster">
        ${bg}
        ${badge}
        ${isNav ? `<div class="poster-play-hint"><div class="play-circle">▶</div></div>` : ''}
      </div>
      <div class="drama-info">
        <div class="drama-name">《${d.title}》</div>
        <div class="drama-tagline">${d.tagline}</div>
        <div class="drama-footer">
          ${isNav ? `<div class="branch-count"><span class="n">${Object.values(S.nodes).filter(n=>n.status!=='dropped').length}</span> active branches</div>` : '<div class="branch-count">--</div>'}
          <div class="status-chip ${d.status==='coming'?'coming':'alive'}">${isNav?'Enter':'Coming Soon'}</div>
        </div>
      </div>
      ${branchesHtml}
    </div>`;
  }).join('');

  // branches-row section is removed (now inside cards)
  const row = document.getElementById('branches-row');
  if (row) row.closest('.home-section').style.display = 'none';
}

/* ──────────────────────────────────────────────────────────
   TREE LAYOUT
   ────────────────────────────────────────────────────────── */
function computeLayout(rootId) {
  const X_GAP=240, Y_GAP=130;
  const children={};
  Object.values(S.nodes).forEach(n => {
    if (n.parentId) { if (!children[n.parentId]) children[n.parentId]=[]; children[n.parentId].push(n.nodeId); }
  });
  function height(id) {
    const kids=children[id]||[];
    return kids.length ? kids.reduce((s,k)=>s+height(k),0) : 1;
  }
  const pos={};
  function assign(id, depth, yTop) {
    const kids=children[id]||[], h=height(id);
    pos[id]={x:depth*X_GAP+80, y:yTop+(h-1)*Y_GAP/2};
    let cur=yTop;
    kids.forEach(kid=>{ assign(kid,depth+1,cur); cur+=height(kid)*Y_GAP; });
  }
  assign(rootId,0,80); return pos;
}

/* ──────────────────────────────────────────────────────────
   TREE RENDER
   ────────────────────────────────────────────────────────── */
function renderTree() {
  S.treePositions = computeLayout('node_root');
  drawTree();
  setupTreePan();
}

function drawTree() {
  // Card dimensions
  const CARD = { w:155, h:96,  hw:77.5, thumbH:68, infoH:28 };
  const ROOT = { w:182, h:112, hw:91,   thumbH:84, infoH:28 };

  const g = document.getElementById('tree-root-g');
  const {x,y,k} = S.treeTransform;
  g.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
  const pos = S.treePositions;

  // Edges: right-edge of source → left-edge of target
  const edges = Object.values(S.nodes)
    .filter(n => n.parentId && pos[n.nodeId] && pos[n.parentId])
    .map(n => {
      const parNode = S.nodes[n.parentId];
      const srcDim = parNode.nodeId === 'node_root' ? ROOT : CARD;
      const p = pos[n.parentId], c = pos[n.nodeId];
      const sx = p.x + srcDim.hw, sy = p.y;
      const tx = c.x - CARD.hw,   ty = c.y;
      const cx1 = sx + 50, cx2 = tx - 50;
      const col = n.status === 'dropped'     ? 'rgba(75,85,99,0.3)'
                : n.nodeId === 'node_locked' ? 'rgba(240,192,64,0.18)'
                : 'rgba(120,216,255,0.25)';
      return `<path class="edge" data-id="${n.nodeId}" d="M${sx},${sy} C${cx1},${sy} ${cx2},${ty} ${tx},${ty}" stroke="${col}"/>`;
    }).join('');

  // Node cards via foreignObject
  const nodesSVG = Object.values(S.nodes)
    .filter(n => pos[n.nodeId])
    .map(n => {
      const {x:nx, y:ny} = pos[n.nodeId];
      const col      = nodeColor(n);
      const dim      = n.nodeId === 'node_root' ? ROOT : CARD;
      const isDropped     = n.status === 'dropped';
      const isLocked      = n.nodeId === 'node_locked';
      const isAccessible  = isNodeAccessible(n.nodeId);
      const isPaid        = !isDropped && !isLocked && isAccessible && !n.isFreeWindow && !S.unlockedNodes.has(n.nodeId);
      const isPrereqLocked = !isDropped && !isLocked && !isAccessible;
      const isRestricted  = isLocked || isPaid || isPrereqLocked;
      const sel        = S.selectedNodeId === n.nodeId;

      // Video thumbnail source
      const vidSrc = n.videoUrl
        ? n.videoUrl
        : isDropped ? '' : 'base.mov#t=4';

      const thumbFilter = isDropped    ? 'filter:brightness(0.2)'
                        : isRestricted ? 'filter:blur(4px) brightness(0.35)'
                        : '';

      const vidHtml = vidSrc
        ? `<video src="${vidSrc}" muted playsinline preload="metadata"
             style="width:100%;height:100%;object-fit:cover;${thumbFilter}"
             onmouseenter="if(!${isDropped}&&!${isRestricted})safePlayVideo(this)"
             onmouseleave="resetPreviewVideo(this)"></video>`
        : `<div style="width:100%;height:100%;background:rgba(30,30,40,0.8)"></div>`;

      const overlay = isDropped
        ? `<div class="nc-overlay"><span style="font-size:20px">💀</span><span>Dropped</span></div>`
        : isPrereqLocked
        ? `<div class="nc-overlay"><span style="font-size:14px">⛔</span><span style="font-size:10px;color:var(--faint)">Watch previous</span></div>`
        : isPaid
        ? `<div class="nc-overlay"><span style="font-size:16px">🔒</span><span style="color:var(--hot);font-size:11px">¥${n.unlockPrice}</span></div>`
        : isLocked
        ? `<div class="nc-overlay"><span style="font-size:20px">🔒</span><span style="color:var(--hot)">¥${n.unlockPrice}</span></div>`
        : '';

      const hotColor = 'rgba(240,192,64,1)';
      const prereqColor = 'rgba(100,100,120,1)';
      const border = sel
        ? `border:2px solid ${isPaid ? hotColor : isPrereqLocked ? prereqColor : col.fill};box-shadow:0 0 20px ${col.fill}55`
        : isPaid
        ? `border:1.5px solid ${hotColor}90;box-shadow:0 0 10px ${hotColor}30`
        : isPrereqLocked
        ? `border:1.5px solid ${prereqColor}50`
        : `border:1.5px solid ${col.fill}70;box-shadow:0 0 14px ${col.fill}28`;

      const likesColor = isDropped ? 'var(--drop)' : isPrereqLocked ? 'var(--faint)' : isRestricted ? 'var(--hot)' : col.fill;
      const likesText  = isDropped ? '✕ Drop' : isLocked ? 'Locked' : isPrereqLocked ? '⛔ Locked' : isPaid ? '🔒 Paid' : '♥ ' + n.likes;

      const endangeredClass = n.status === 'endangered' ? ' endangered-pulse' : '';
      const newClass = S.newNodeIds && S.newNodeIds.has(n.nodeId) ? ' node-new' : '';
      return `<g class="node-g${endangeredClass}${newClass}" data-id="${n.nodeId}" onclick="openPanel('${n.nodeId}')" transform="translate(${nx},${ny})">
        <foreignObject x="${-dim.hw}" y="${-dim.h/2}" width="${dim.w}" height="${dim.h}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="nc" style="${border}">
            <div class="nc-thumb" style="height:${dim.thumbH}px">
              ${vidHtml}
              ${overlay}
            </div>
            <div class="nc-info" style="height:${dim.infoH}px">
              <span class="nc-title">${n.title}</span>
              <span class="nc-likes" style="color:${likesColor}">${likesText}</span>
            </div>
          </div>
        </foreignObject>
      </g>`;
    }).join('');

  // Plus buttons — appear to the right of each card
  const plusBtns = Object.values(S.nodes)
    .filter(n => n.status !== 'dropped' && n.nodeId !== 'node_locked' && pos[n.nodeId])
    .map(n => {
      const {x:nx, y:ny} = pos[n.nodeId];
      const dim = n.nodeId === 'node_root' ? ROOT : CARD;
      const bx = nx + dim.hw + 20;
      return `<g class="plus-g" data-id="${n.nodeId}" transform="translate(${bx},${ny})"
        onclick="openCreateModal('${n.nodeId}')" style="cursor:pointer;opacity:0;transition:opacity 0.2s">
        <circle r="15" fill="var(--alive)" opacity="0.1"/>
        <circle r="13" fill="none" stroke="var(--alive)" stroke-width="1" opacity="0.5"/>
        <text text-anchor="middle" dy="5" font-size="16" fill="var(--alive)" font-weight="300">+</text>
      </g>`;
    }).join('');

  g.innerHTML = edges + nodesSVG + plusBtns;

  // Show + on hover over card or plus button
  g.querySelectorAll('.node-g').forEach(ng => {
    const id   = ng.dataset.id;
    const plus = g.querySelector(`.plus-g[data-id="${id}"]`);
    if (!plus) return;
    const show = () => plus.style.opacity = '1';
    const hide = () => plus.style.opacity = '0';
    ng.addEventListener('mouseenter', show);
    ng.addEventListener('mouseleave', hide);
    plus.addEventListener('mouseenter', show);
    plus.addEventListener('mouseleave', hide);
  });
}

function setupTreePan() {
  const svg=document.getElementById('tree-svg');
  let dragging=false, sx,sy,tx,ty;
  svg.onmousedown=e=>{
    if (e.target.closest('.node-g')||e.target.closest('.plus-g')||e.target.closest('.nc')) return;
    dragging=true; sx=e.clientX; sy=e.clientY; tx=S.treeTransform.x; ty=S.treeTransform.y;
  };
  window.addEventListener('mousemove',e=>{
    if (!dragging) return;
    S.treeTransform.x=tx+(e.clientX-sx); S.treeTransform.y=ty+(e.clientY-sy);
    applyTreeTransform();
  });
  window.addEventListener('mouseup',()=>{ dragging=false; });
  svg.addEventListener('wheel',e=>{ e.preventDefault(); const d=e.deltaY>0?0.9:1.1; S.treeTransform.k=Math.max(0.3,Math.min(2,S.treeTransform.k*d)); applyTreeTransform(); },{passive:false});
}

function applyTreeTransform() {
  const g=document.getElementById('tree-root-g');
  const {x,y,k}=S.treeTransform;
  g.setAttribute('transform',`translate(${x},${y}) scale(${k})`);
}

function treeZoom(f) { S.treeTransform.k=Math.max(0.3,Math.min(2,S.treeTransform.k*f)); applyTreeTransform(); }
function treeReset() { S.treeTransform={x:80,y:80,k:1}; applyTreeTransform(); }

/* ──────────────────────────────────────────────────────────
   NODE PANEL
   ────────────────────────────────────────────────────────── */
function openPanel(nodeId) {
  S.selectedNodeId=nodeId;
  const node=S.nodes[nodeId];
  if (!node) return;
  drawTree();

  const col=nodeColor(node);
  const accessible = isNodeAccessible(nodeId);
  const isUnlocked = accessible && (node.isFreeWindow || S.unlockedNodes.has(nodeId));
  const isLiked=S.likedNodes.has(nodeId);
  const assets=getAvailableAssets(nodeId);
  const chars=assets.filter(a=>a.type==='character');
  const scenes=assets.filter(a=>a.type==='scene');

  const statusMap={alive:'Active',endangered:'Endangered',dropped:'Dropped'};
  const statusColMap={alive:'var(--alive)',endangered:'var(--danger)',dropped:'var(--drop)'};

  const storyPath = getStoryPath(nodeId);
  const pathHtml = storyPath.map((seg, i) =>
    `<span class="path-seg${i===storyPath.length-1?' current':''}">${seg.title}</span>${i<storyPath.length-1?'<span class="path-sep">→</span>':''}`
  ).join('');

  document.getElementById('panel-header').innerHTML = `
    <button class="panel-close" onclick="closePanel()">×</button>
    <div class="panel-status" style="color:${statusColMap[node.status]}">
      <div class="status-dot ${node.status}"></div>
      ${statusMap[node.status]} · Day ${node.ageDays}
    </div>
    <div class="panel-title">${node.title}</div>
    <div class="panel-meta">${node.authorName} · ${node.isFreeWindow?'Free now':'Paid ¥'+node.unlockPrice}</div>
    ${node.derivedFrom?`<div class="derived-tag">Derived from <span>@${node.derivedFrom}</span></div>`:''}
    <div class="story-path" style="margin-top:6px">${pathHtml}</div>`;

  let videoHtml='';
  if (nodeId === 'node_locked') {
    // special: use base.mov as blurred preview with lock overlay
    videoHtml = `<video src="base.mov#t=8" muted playsinline preload="metadata"
        style="width:100%;height:100%;object-fit:cover;filter:blur(8px) brightness(0.4)"></video>
      <div class="lock-overlay">
        <div style="font-size:32px">🔒</div>
        <div class="lock-text" style="font-size:14px;font-weight:500;color:var(--text)">This branch is not open yet</div>
        <div class="lock-text">Be the first to unlock it</div>
        <button class="btn sm primary" onclick="unlockNode('${nodeId}')">Unlock ¥${node.unlockPrice}</button>
      </div>`;
  } else if (isUnlocked) {
    videoHtml = node.videoUrl
      ? `<video src="${node.videoUrl}" controls muted playsinline style="width:100%;height:100%;object-fit:cover"></video>`
      : `<video src="base.mov#t=3" muted playsinline preload="metadata"
           style="width:100%;height:100%;object-fit:cover;filter:brightness(0.6)"></video>
         <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
           <div style="font-size:11px;color:var(--faint);text-align:center">Video placeholder</div>
         </div>`;
  } else if (!accessible) {
    const parentNode = S.nodes[node.parentId];
    videoHtml = `<video src="${parentNode?.videoUrl||'videos/Reborn.mp4'}" muted playsinline preload="metadata"
        style="width:100%;height:100%;object-fit:cover;filter:blur(8px) brightness(0.25)"></video>
      <div class="lock-overlay">
        <div style="font-size:28px">⛔</div>
        <div class="lock-text" style="font-size:13px;font-weight:500;color:var(--text)">Watch the previous episode first</div>
        <div class="lock-text" style="font-size:11px">${parentNode?.title||''}</div>
      </div>`;
  } else {
    videoHtml = `<video src="${node.videoUrl||'videos/Reborn.mp4'}" muted playsinline preload="metadata"
        style="width:100%;height:100%;object-fit:cover;filter:blur(4px) brightness(0.3)"></video>
      <div class="lock-overlay">
        <div style="font-size:24px">🔒</div>
        <div class="lock-text">The 30-day free window has ended</div>
        <button class="btn sm primary" onclick="unlockNode('${nodeId}')">Unlock ¥${node.unlockPrice}</button>
      </div>`;
  }

  const charChips = chars.map(c => `<div class="asset-chip"><div class="chip-dot"></div>${c.name}</div>`).join('');
  const sceneChips = scenes.map(s => `<div class="asset-chip" style="border-color:rgba(240,192,64,0.2)"><div class="chip-dot" style="background:var(--hot)"></div>${s.name}</div>`).join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="video-box">${videoHtml}</div>
    <div class="synopsis-box">
      <div class="section-label">Synopsis (always free)</div>
      <div class="synopsis-text">${node.synopsis}</div>
    </div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-val" style="color:${col.fill}">${node.likes}</div><div class="stat-lab">Likes</div></div>
      <div class="stat-box"><div class="stat-val">${node.impressions}</div><div class="stat-lab">Views</div></div>
      <div class="stat-box"><div class="stat-val">${formatRate(node)}</div><div class="stat-lab">Like Rate</div></div>
    </div>
    ${(charChips||sceneChips)?`<div>
      <div class="section-label">Inherited Assets (Visual Lineage)</div>
      <div class="asset-row">${charChips}${sceneChips}</div>
    </div>`: ''}
    <div class="panel-actions">
      ${isUnlocked
        ? `<button class="like-btn ${isLiked?'liked':''}" onclick="likeNode('${nodeId}')">${isLiked?'♥':'♡'} ${node.likes}</button>`
        : `<button class="like-btn" style="opacity:0.3;cursor:not-allowed" title="Watch this episode first">♡ ${node.likes}</button>`
      }
      ${isUnlocked && node.status!=='dropped'
        ? `<button class="btn sm primary" onclick="openCreateModal('${nodeId}')">✎ Continue Here</button>`
        : isUnlocked ? '' : `<span style="font-size:11px;color:var(--faint);align-self:center">${accessible?'Unlock to continue':'Watch previous first'}</span>`
      }
    </div>`;

  document.getElementById('node-panel').classList.add('open');
}

function closePanel() {
  S.selectedNodeId=null;
  document.getElementById('node-panel').classList.remove('open');
  drawTree();
}

function likeNode(nodeId) {
  const node=S.nodes[nodeId]; if(!node) return;
  if (!isNodeAccessible(nodeId) || (!node.isFreeWindow && !S.unlockedNodes.has(nodeId))) {
    toast('Watch this episode first before liking.'); return;
  }
  const was=S.likedNodes.has(nodeId);
  if (was){S.likedNodes.delete(nodeId);node.likes--;}else{S.likedNodes.add(nodeId);node.likes++;}
  openPanel(nodeId); drawTree();
  if (!was) {
    const ng = document.querySelector(`.node-g[data-id="${nodeId}"]`);
    if (ng) { ng.classList.remove('like-flash'); void ng.offsetWidth; ng.classList.add('like-flash'); }
  }
  toast(was?'Like removed':'♥ Liked. Node popularity updated');
}

function unlockNode(nodeId) {
  const node = S.nodes[nodeId];
  const price = node.unlockPrice || 1.9;
  const creator = (price * 0.79).toFixed(1);
  const platform = (price * 0.21).toFixed(1);
  document.getElementById('pay-split-body').innerHTML = `
    <div class="pay-row total"><span class="label">Total</span><span class="val">¥${price}</span></div>
    <div class="pay-row"><span class="label">Creator earns</span><span class="val" style="color:var(--alive)">¥${creator}</span></div>
    <div class="pay-row"><span class="label">Platform fee</span><span class="val">¥${platform}</span></div>`;
  const btn = document.getElementById('pay-confirm-btn');
  btn.onclick = () => { confirmUnlock(nodeId); };
  document.getElementById('payment-dialog').classList.add('open');
}

function confirmUnlock(nodeId) {
  closePaymentDialog();
  // Animate existing overlay BEFORE marking unlocked (overlay is still in DOM)
  const overlay = document.querySelector('#node-panel .lock-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.65s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      S.unlockedNodes.add(nodeId);
      drawTree();
      openPanel(nodeId);
      toast('🔓 Unlocked! Creator received their share.');
    }, 650);
  } else {
    S.unlockedNodes.add(nodeId);
    drawTree();
    openPanel(nodeId);
    toast('🔓 Unlocked! Creator received their share.');
  }
}

function closePaymentDialog() {
  document.getElementById('payment-dialog').classList.remove('open');
}

/* ──────────────────────────────────────────────────────────
   CREATE MODAL
   ────────────────────────────────────────────────────────── */
function openCreateModal(parentId) {
  const parent=S.nodes[parentId]; if(!parent) return;
  if (!isNodeAccessible(parentId) || (!parent.isFreeWindow && !S.unlockedNodes.has(parentId))) {
    toast('Watch this episode first before continuing the story.'); return;
  }
  S.modalParentId=parentId; S.modalPhase='draft'; S.modalResult=null;
  S.modalError=''; S.modalPayloadVisible=false; S.modalResultIndex=0;
  S.modalPrompt=parent.prompt.replace(/^\[Character bible\].*?\n/u,'').trim();
  const assets=getAvailableAssets(parentId);
  const chars=assets.filter(a=>a.type==='character');
  const scenes=assets.filter(a=>a.type==='scene');
  // Veo reference-image mode supports up to 3 selected character avatars.
  const defaultChars = new Set();
  const seenCharGroups = new Set();
  chars.forEach(c => {
    const gid = c.characterId || c.assetId;
    if (defaultChars.size < VEO_REFERENCE_IMAGE_LIMIT && !seenCharGroups.has(gid)) {
      seenCharGroups.add(gid);
      defaultChars.add(c.assetId);
    }
  });
  S.modalSelectedChars = defaultChars;
  S.modalSelectedScene = scenes[0]?.assetId||'';
  S.addCharStep = null; S.addCharBaseId = chars[0]?.characterId||chars[0]?.assetId||null;
  S.addCharAge = ''; S.addCharDesc = '';
  renderModal();
  document.getElementById('modal-create').classList.add('open');
}

function selectCharVersion(characterId, assetId) {
  // Clicking the selected version again removes that character from generation.
  const assets = getAvailableAssets(S.modalParentId);
  const wasSelected = S.modalSelectedChars.has(assetId);
  assets.filter(a => a.type==='character' && (a.characterId||a.assetId)===characterId)
    .forEach(a => S.modalSelectedChars.delete(a.assetId));
  if (wasSelected) {
    renderModal();
    return;
  }
  if (isVeo3Model(document.getElementById('modal-model')?.value||CONFIG.DEFAULT_MODEL) && S.modalSelectedChars.size >= VEO_REFERENCE_IMAGE_LIMIT) {
    toast(`Veo supports up to ${VEO_REFERENCE_IMAGE_LIMIT} character reference images.`);
    renderModal();
    return;
  }
  S.modalSelectedChars.add(assetId);
  renderModal();
}

function closeModal() { document.getElementById('modal-create').classList.remove('open'); }

function renderAddCharSection(charGroups) {
  if (S.addCharStep === null) {
    return `<button class="add-char-btn" onclick="startAddChar()">+ Add character or age version</button>`;
  }
  if (S.addCharStep === 'choose') {
    return `<div class="add-char-panel">
      <div style="font-size:12px;color:var(--text2)">What do you want to add?</div>
      <div class="add-char-choose">
        <button class="choose-btn" onclick="setAddCharStep('variant')">🕰 New age version<br><span style="font-size:10px;color:var(--faint)">of an existing character</span></button>
        <button class="choose-btn" onclick="setAddCharStep('new')">✦ Brand new<br><span style="font-size:10px;color:var(--faint)">character from scratch</span></button>
      </div>
      <div class="add-char-actions"><button onclick="cancelAddChar()">Cancel</button></div>
    </div>`;
  }
  if (S.addCharStep === 'new') {
    return `<div class="add-char-panel">
      <label>Character Name</label>
      <input id="nc-name" placeholder="e.g. Lin Xia" value="${S.addCharNewName}" oninput="S.addCharNewName=this.value"/>
      <label>Age Label</label>
      <input id="nc-age" placeholder="e.g. Age 28" value="${S.addCharNewAge}" oninput="S.addCharNewAge=this.value"/>
      <label>Appearance Description</label>
      <textarea id="nc-desc" rows="3" placeholder="e.g. East Asian woman, shoulder-length black hair, sharp eyes, business suit" oninput="S.addCharNewDesc=this.value">${S.addCharNewDesc}</textarea>
      <label>Art Style</label>
      <select id="nc-style" onchange="S.addCharNewStyle=this.value">
        <option value="cinematic realism, detailed" ${S.addCharNewStyle.startsWith('cinematic')?'selected':''}>Cinematic Realism</option>
        <option value="anime style, clean lines" ${S.addCharNewStyle.startsWith('anime')?'selected':''}>Anime</option>
        <option value="concept art, digital painting" ${S.addCharNewStyle.startsWith('concept')?'selected':''}>Concept Art</option>
      </select>
      <div class="add-char-actions">
        <button onclick="cancelAddChar()">Cancel</button>
        <button class="primary" onclick="generateNewCharImages()">✦ Generate Reference</button>
      </div>
    </div>`;
  }
  if (S.addCharStep === 'new_loading') {
    return `<div class="add-char-panel">
      <div style="font-size:12px;color:var(--text2);display:flex;align-items:center;gap:10px">
        <div class="loading-ring" style="width:16px;height:16px;border-width:2px"></div>
        ${S.addCharMode==='variant'?'Generating age-version reference':'Generating 3-angle reference'}… (~20s)
      </div>
    </div>`;
  }
  if (S.addCharStep === 'new_results' && S.addCharNewImages) {
    const imgs = S.addCharNewImages;
    const imgCards = imgs.map(img => {
      const sel = S.addCharSelectedImg === img.label;
      return `<div onclick="S.addCharSelectedImg='${img.label}';renderModal()" style="cursor:pointer;border-radius:8px;overflow:hidden;border:2px solid ${sel?'var(--alive)':'var(--border2)'};flex:1">
        <div style="font-size:10px;color:var(--text2);padding:4px 8px;background:rgba(0,0,0,0.3)">${img.label}</div>
        <img src="${img.dataUrl}" style="width:100%;display:block;aspect-ratio:3/4;object-fit:cover"/>
      </div>`;
    }).join('');
    return `<div class="add-char-panel">
      <div style="font-size:12px;color:var(--text2)">Select the reference image to use:</div>
      <div style="display:flex;gap:6px">${imgCards}</div>
      <div class="add-char-actions">
        <button onclick="S.addCharStep=S.addCharMode==='variant'?'variant':'new';renderModal()">← Regenerate</button>
        <button class="primary" onclick="S.addCharMode==='variant'?finalizeVariant():confirmNewChar()" ${!S.addCharSelectedImg?'disabled':''}>
          ${S.addCharMode==='variant'?'Add Version':'Add Character'}
        </button>
      </div>
    </div>`;
  }
  if (S.addCharStep === 'variant') {
    const existingGroups = charGroups.filter(g => g.versions.length > 0);
    const charOptions = existingGroups.map(g =>
      `<option value="${g.gid}" ${S.addCharBaseId===g.gid?'selected':''}>${g.versions[0].name}</option>`
    ).join('');
    const baseChar = S.addCharBaseId ? charGroups.find(g=>g.gid===S.addCharBaseId)?.versions[0] : null;
    return `<div class="add-char-panel">
      <label>Which character?</label>
      <select onchange="S.addCharBaseId=this.value;renderModal()">${charOptions}</select>
      <label>Age label</label>
      <input id="add-age" placeholder="e.g. Age 31 · 3 Years Later" value="${S.addCharAge}" oninput="S.addCharAge=this.value"/>
      <label>Appearance notes <span style="color:var(--faint);font-weight:400">(leave blank to inherit original)</span></label>
      <textarea id="add-desc" rows="3" placeholder="e.g. slightly tired eyes, hair tied up, dark coat" oninput="S.addCharDesc=this.value">${S.addCharDesc}</textarea>
      <div class="add-char-actions">
        <button onclick="cancelAddChar()">Cancel</button>
        <button class="primary" onclick="generateVariantImages()">✦ Generate Reference</button>
      </div>
    </div>`;
  }
  return '';
}

function startAddChar() { S.addCharStep='choose'; renderModal(); }
function setAddCharStep(step) {
  S.addCharStep = step;
  S.addCharMode = step === 'variant' ? 'variant' : 'new';
  S.addCharNewImages = null;
  S.addCharNewName = ''; S.addCharNewAge = ''; S.addCharNewDesc = ''; S.addCharNewStyle = 'cinematic realism, detailed';
  S.addCharSelectedImg = null;
  renderModal();
}
function cancelAddChar() {
  S.addCharStep=null; S.addCharMode='new'; S.addCharBaseId=null; S.addCharAge=''; S.addCharDesc='';
  S.addCharNewImages=null; S.addCharNewName=''; S.addCharNewAge=''; S.addCharNewDesc=''; S.addCharSelectedImg=null;
  renderModal();
}

function cleanCharacterName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function cleanAgeLabel(value) {
  const label = String(value || '').trim().replace(/\s+/g, ' ');
  if (!label) return 'Unknown Age';
  return /^\d+$/.test(label) ? `Age ${label}` : label;
}

function slugifyId(value, fallback = 'item') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || fallback;
}

async function generateVariantImages() {
  if (!String(S.addCharAge || '').trim()) { toast('Please enter an age label.'); return; }
  const age = cleanAgeLabel(S.addCharAge);
  const base = Object.values(ASSETS).find(a => a.type==='character' && (a.characterId||a.assetId)===S.addCharBaseId);
  if (!base) return;
  const baseName = cleanCharacterName(base.name) || 'Character';
  const baseAge = base.ageLabel ? ` Current reference age/version: ${base.ageLabel}.` : '';
  const desc = S.addCharDesc.trim() || base.promptPrefix || `${baseName}, same recognizable face and identity`;
  const promptDescription = [
    `${baseName}, ${age}`,
    `new age/version of the existing character, preserve the same identity and facial structure`,
    baseAge,
    desc,
  ].filter(Boolean).join(', ');
  S.addCharMode = 'variant';
  S.addCharAge = age;
  S.addCharNewDesc = desc;
  S.addCharStep = 'new_loading'; renderModal();
  try {
    const res = await fetch('/api/generate-character', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: promptDescription, style: 'cinematic realism, detailed' }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');
    S.addCharNewImages = data.images;
    S.addCharSelectedImg = data.images[0]?.label || null;
    S.addCharStep = 'new_results';
  } catch(e) {
    S.addCharStep = 'variant';
    toast('Error: ' + e.message);
  }
  renderModal();
}

function finalizeVariant() {
  const img = S.addCharNewImages?.find(i => i.label === S.addCharSelectedImg);
  if (!img) return;
  const base = Object.values(ASSETS).find(a => a.type==='character' && (a.characterId||a.assetId)===S.addCharBaseId);
  if (!base) return;
  const age = cleanAgeLabel(S.addCharAge);
  const desc = S.addCharDesc.trim() || base.promptPrefix;
  const baseName = cleanCharacterName(base.name) || 'Character';
  const refName = slugifyId(`${baseName}_${age}`, 'character_version');
  const newId = `asset_${refName}_${Math.random().toString(36).slice(2, 8)}`;

  const asset = {
    assetId: newId, type: 'character', characterId: S.addCharBaseId,
    name: baseName, ageLabel: age, refName,
    refImageUrl: img.dataUrl,
    promptPrefix: desc,
    negativePrompt: base.negativePrompt || 'no different face, no extra person',
  };
  ASSETS[newId] = asset;

  const parentNode = S.nodes[S.modalParentId];
  if (parentNode && !parentNode.ownAssetIds.includes(newId)) parentNode.ownAssetIds.push(newId);

  const assets = getAvailableAssets(S.modalParentId);
  assets.filter(a => a.type==='character' && (a.characterId||a.assetId)===S.addCharBaseId)
    .forEach(a => S.modalSelectedChars.delete(a.assetId));
  S.modalSelectedChars.add(newId);

  cancelAddChar();
  toast(`✓ Added: ${baseName} · ${age}`);
  persistBranchAssetInBackground(asset, parentNode, `${baseName} · ${age}`);
}

async function generateNewCharImages() {
  const name = cleanCharacterName(S.addCharNewName);
  const desc = S.addCharNewDesc.trim();
  if (!name) { toast('Please enter a character name.'); return; }
  if (!desc) { toast('Please enter an appearance description.'); return; }
  S.addCharMode = 'new';
  S.addCharStep = 'new_loading'; renderModal();
  try {
    const age = S.addCharNewAge.trim();
    const promptDescription = [name, age, desc].filter(Boolean).join(', ');
    const res = await fetch('/api/generate-character', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: promptDescription, style: S.addCharNewStyle }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');
    S.addCharNewImages = data.images;
    S.addCharSelectedImg = data.images[0]?.label || null;
    S.addCharStep = 'new_results';
  } catch(e) {
    S.addCharStep = 'new';
    toast('Error: ' + e.message);
  }
  renderModal();
}

function checkpointFromNode(node) {
  return {
    storyId: node.storyId || 'story_001',
    nodeId: node.nodeId,
    parentId: node.parentId || null,
    title: node.title || '',
    synopsis: node.synopsis || '',
    prompt: node.prompt || '',
    videoUrl: node.videoUrl || '',
    config: node.config || {},
    ownAssetIds: [...new Set(node.ownAssetIds || [])],
    metadata: {
      authorId: node.authorId || '',
      authorName: node.authorName || '',
      status: node.status || '',
    },
  };
}

async function persistBranchAsset(asset, node) {
  if (!asset || !node) throw new Error('Missing asset or branch node.');
  const res = await fetch('/api/checkpoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkpoint: checkpointFromNode(node),
      assets: [asset],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Asset storage save failed.');
  return data;
}

function persistBranchAssetInBackground(asset, node, label) {
  persistBranchAsset(asset, node)
    .then(() => toast(`✓ Saved ${label} to branch asset storage.`))
    .catch(error => toast(`Added locally, but asset storage save failed: ${error.message}`, 3200));
}

function confirmNewChar() {
  const img = S.addCharNewImages?.find(i => i.label === S.addCharSelectedImg);
  if (!img) return;
  const name = cleanCharacterName(S.addCharNewName);
  if (!name) { toast('Please enter a character name.'); return; }
  const age = cleanAgeLabel(S.addCharNewAge);
  const refName = slugifyId(`${name}_${age}`, 'new_character');
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const newId = `asset_${refName}_${uniqueSuffix}`;
  const charId = `char_${slugifyId(name, 'new_character')}`;

  const asset = {
    assetId: newId, type: 'character', characterId: charId,
    name, ageLabel: age, refName,
    refImageUrl: img.dataUrl,
    promptPrefix: S.addCharNewDesc.trim(),
    negativePrompt: 'no different face, no extra person',
  };
  ASSETS[newId] = asset;
  const parentNode = S.nodes[S.modalParentId];
  if (parentNode && !parentNode.ownAssetIds.includes(newId)) parentNode.ownAssetIds.push(newId);
  S.modalSelectedChars.add(newId);
  cancelAddChar();
  toast(`✓ Added: ${name} · ${age}`);
  persistBranchAssetInBackground(asset, parentNode, name);
}

function renderModal() {
  const assets=getAvailableAssets(S.modalParentId);
  const chars=assets.filter(a=>a.type==='character');
  const scenes=assets.filter(a=>a.type==='scene');
  const styleAsset=assets.find(a=>a.type==='style');
  const parent=S.nodes[S.modalParentId];

  // Phase steps
  document.querySelectorAll('.phase-step').forEach(el => {
    el.classList.toggle('active', el.dataset.phase===S.modalPhase);
  });

  // Group characters by characterId
  const charGroups = [];
  const seenGroups = new Map();
  chars.forEach(c => {
    const gid = c.characterId || c.assetId;
    if (!seenGroups.has(gid)) { seenGroups.set(gid, []); charGroups.push({ gid, versions: seenGroups.get(gid) }); }
    seenGroups.get(gid).push(c);
  });

  function charGroupHtml(g) {
    const firstName = cleanCharacterName(g.versions[0].name) || 'Character';
    function versionLabel(c) {
      const name = cleanCharacterName(c.name) || firstName;
      const age = cleanAgeLabel(c.ageLabel);
      return age && age !== 'Unknown Age' ? `${name} · ${age}` : name;
    }
    const versions = g.versions.map(c => {
      const sel = S.modalSelectedChars.has(c.assetId);
      const photo = c.refImageUrl
        ? `<img src="${c.refImageUrl}" alt="${c.name}" onerror="this.style.display='none'">`
        : `<span style="font-size:18px">👤</span>`;
      return `<button class="char-btn${sel?' selected':''}" onclick="selectCharVersion('${c.characterId||c.assetId}','${c.assetId}')">
        <div class="char-photo">${photo}</div>
        <div class="char-name">${versionLabel(c)}</div>
      </button>`;
    }).join('');
    return `<div class="char-group">
      <div class="char-group-name">${firstName}</div>
      <div class="char-versions">${versions}</div>
    </div>`;
  }

  function sceneBtn(s) {
    const sel=S.modalSelectedScene===s.assetId;
    const photoHtml=s.refImageUrl
      ? `<img src="${s.refImageUrl}" alt="${s.name}" onerror="this.style.display='none'">`
      : s.name;
    return `<button class="scene-btn${sel?' selected':''}" onclick="selectScene('${s.assetId}')">
      <div class="scene-photo">${photoHtml}</div>
      <div class="scene-name">${s.name}</div>
    </button>`;
  }

  // Story context chain — ancestors only (parent itself is shown in "Continuing From")
  const ancestorCtx = getStoryContext(parent.parentId);
  const storyCtxHtml = ancestorCtx
    ? `<div class="story-ctx-chain"><div class="ctx-label" style="margin-bottom:6px">📖 Story so far</div><div class="ctx-chain-text">${ancestorCtx.replace(/ → /g,'<span class="ctx-arrow"> → </span>')}</div></div>`
    : '';

  document.getElementById('modal-left').innerHTML = `
    <div class="parent-ctx">
      <div class="ctx-label">Continuing From</div>
      <p>${parent.synopsis}</p>
    </div>
    ${storyCtxHtml}
    <div>
      <label class="form-label">What happens next?</label>
      <textarea class="prompt-area" id="modal-prompt" rows="4"
        placeholder="Example: Lin Xia turns off the projector in the conference room, leaving only a recording Chen Yi cannot deny.">${S.modalPrompt}</textarea>
      <div class="role-lock" style="margin-top:8px">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="margin-top:1px;flex-shrink:0">
          <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        Character identity prefixes are locked. The system sends up to three selected avatar images as Veo asset references for character fusion.
      </div>
    </div>
    <div>
      <label class="form-label">Characters · Select Version per Character</label>
      <div style="font-size:11px;color:var(--faint);margin:-2px 0 8px">Click a selected avatar again to remove it from this generation.</div>
      <div class="char-groups">${charGroups.map(charGroupHtml).join('')}${!charGroups.length?'<div style="font-size:12px;color:var(--faint)">No inherited characters</div>':''}</div>
      ${renderAddCharSection(charGroups)}
    </div>
    <div>
      <label class="form-label">Duration / Model</label>
      <div class="options-row">
        <select class="option-select" id="modal-duration"><option value="8">8 sec</option><option value="6">6 sec</option><option value="4">4 sec</option></select>
        <select class="option-select" id="modal-model"><option value="veo-3.1-generate-001">Google Omni · Standard</option><option value="veo-3.1-fast-generate-001">Google Omni · Flash</option><option value="veo-3.0-fast-generate-001">Google Veo 3 · Fast</option><option value="veo-3.0-generate-001">Google Veo 3 · Text Only</option></select>
      </div>
    </div>`;

  renderPreview();
  renderModalActions();
  syncModalToken();

  document.getElementById('modal-error').innerHTML=S.modalError?`<div class="error-msg">${S.modalError}</div>`:'';
  document.getElementById('tech-payload').classList.toggle('open',S.modalPayloadVisible);
  if (S.modalPayloadVisible) updatePayloadDisplay();
  document.getElementById('tech-toggle').textContent=S.modalPayloadVisible?'Hide API Request':'View API Request';
}

function renderPreview() {
  const pp=document.getElementById('preview-player');
  if (S.modalPhase==='generating') {
    pp.innerHTML=`<div class="preview-empty">
      <div class="loading-ring"></div>
      <p style="margin-top:12px;color:var(--muted)">AI is drafting the branch...</p>
      <p style="font-size:11px;color:var(--faint);margin-top:4px">${CONFIG.DEMO_MODE?'(Demo mode, returns quickly)':'Live generation takes about 90s'}</p>
    </div>`;
  } else if (S.modalPhase==='preview'&&S.modalResult) {
    const r=S.modalResult;
    pp.innerHTML=r.videoUrl
      ? `<video src="${r.videoUrl}" controls autoplay muted playsinline style="width:100%;height:100%;object-fit:cover"></video>`
      : `<div class="preview-empty">
          <div class="icon">✨</div>
          <p style="font-size:13px;font-weight:500;color:var(--text)">${r.title}</p>
          <p style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5">${r.synopsis}</p>
          <p style="font-size:10px;color:var(--faint);margin-top:8px">seed: ${r.seed||'—'}</p>
        </div>`;
  } else {
    pp.innerHTML=`<div class="preview-empty"><div class="icon">🎬</div><p>Preview appears here after generation</p></div>`;
  }
}

function renderModalActions() {
  const working=S.modalPhase==='generating';
  const hasResult=S.modalPhase==='preview'&&S.modalResult;
  const tokenOK=S.tokenBalance>=5;
  document.getElementById('modal-actions').innerHTML=`
    <button class="btn" ${working?'disabled':''} onclick="runGeneration(true)">🔀 Shuffle</button>
    <button class="btn primary" ${working||!tokenOK?'disabled':''} onclick="runGeneration(false)">
      ${working?'Generating...':'Generate · 5 token'}
    </button>
    ${hasResult?`<button class="btn gold" onclick="publishBranch()">✓ Use and Attach</button>`:''}`;
}

function syncModalToken() {
  const el=document.getElementById('modal-token-count');
  if (el) el.textContent=S.tokenBalance;
  document.getElementById('token-count').textContent=S.tokenBalance;
}

function toggleChar(assetId) {
  if (S.modalSelectedChars.has(assetId)) S.modalSelectedChars.delete(assetId);
  else S.modalSelectedChars.add(assetId);
  renderModal();
}
function selectScene(assetId) { S.modalSelectedScene=assetId; renderModal(); }

function togglePayload() {
  S.modalPayloadVisible=!S.modalPayloadVisible;
  document.getElementById('tech-payload').classList.toggle('open',S.modalPayloadVisible);
  document.getElementById('tech-toggle').textContent=S.modalPayloadVisible?'Hide API Request':'View API Request';
  if (S.modalPayloadVisible) updatePayloadDisplay();
}

function makeVeoSafePrompt(prompt) {
  const replacements = [
    [/\brevenge\b/gi, 'emotional confrontation'],
    [/\brage\b/gi, 'intense emotion'],
    [/\bburn\b/gi, 'fall apart emotionally'],
    [/\bblade\b/gi, 'sharp decision'],
    [/\bdeath\b/gi, 'past crisis'],
    [/\bdead\b/gi, 'gone'],
    [/\bkill(?:ed|ing)?\b/gi, 'defeat emotionally'],
    [/\bblood\b/gi, 'dramatic tension'],
    [/\bviolent\b/gi, 'high-stakes'],
    [/\bviolence\b/gi, 'conflict'],
    [/\babyss\b/gi, 'uncertainty'],
    [/\bdrag\b/gi, 'bring'],
    [/\bjudgment\b/gi, 'truth and accountability'],
  ];
  const safePrompt = replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), prompt);
  return [
    'Cinematic workplace short-drama scene suitable for a broad audience.',
    safePrompt,
    'Use any supplied asset reference image only for character identity consistency, not as the first frame, pose, composition, or background.',
    'Begin with a fresh moving shot, a new camera angle, and natural motion.',
    'Focus on facial expressions, professional dialogue tension, camera movement, lighting, and emotional restraint.',
  ].join(' ');
}

function isVeo3Model(model) {
  return String(model||'').startsWith('veo-3.');
}

function buildPayload() {
  const assets=getAvailableAssets(S.modalParentId);
  const chars=assets.filter(a=>a.type==='character'&&S.modalSelectedChars.has(a.assetId));
  const scene=assets.find(a=>a.type==='scene'&&a.assetId===S.modalSelectedScene);
  const style=assets.find(a=>a.type==='style');
  const promptEl=document.getElementById('modal-prompt');
  const userPrompt=promptEl?promptEl.value.trim():S.modalPrompt;
  const duration=parseInt(document.getElementById('modal-duration')?.value||'8');
  const model=document.getElementById('modal-model')?.value||'veo-3.1-generate-001';
  const preset=PRESET_RESULTS[S.modalResultIndex];
  const generationChars=isVeo3Model(model)?chars.slice(0,VEO_REFERENCE_IMAGE_LIMIT):chars;
  const characterRefs=generationChars.map(c=>({
    type:'subject',
    referenceType:'asset',
    img_id:c.pixverseImgId,
    ref_name:c.refName,
    refImageUrl:c.refImageUrl,
    gcsUri:c.gcsUri||'',
  }));
  const refs=characterRefs.slice(0,3);
  const lockedPrefix=generationChars.map(c=>c.promptPrefix).filter(Boolean).join('. ');
  const negPrompt=generationChars.map(c=>c.negativePrompt).filter(Boolean)
    .concat(['no distorted face','no flicker','no sudden identity change']).join(', ');
  const storyContext = getStoryContext(S.modalParentId);
  const rawPromptParts = [
    style?.promptPrefix,
    lockedPrefix,
    storyContext ? 'Story so far: ' + storyContext : null,
    userPrompt,
  ];
  const rawPrompt = rawPromptParts.filter(Boolean).join('. ');
  return {
    _demo: CONFIG.DEMO_MODE?'DEMO_MODE: uses preset result':'LIVE: calls Google Omni video generation via /api/generate',
    provider:'google',
    would_call:'/api/generate',
    image_references:refs,
    prompt:makeVeoSafePrompt(rawPrompt),
    original_prompt:rawPrompt,
    negative_prompt:isVeo3Model(model)?'':negPrompt,
    use_image_as_first_frame:false,
    model,duration,quality:CONFIG.DEFAULT_QUALITY,
    aspect_ratio:'9:16',motion_mode:'normal',
    seed:preset?.seed||Math.floor(Math.random()*1e9),
  };
}

function updatePayloadDisplay() {
  const el=document.getElementById('tech-payload');
  if (el) el.textContent=JSON.stringify(buildPayload(),null,2);
}

async function runGeneration(shuffle) {
  const promptEl=document.getElementById('modal-prompt');
  const userPrompt=promptEl?promptEl.value.trim():'';
  if (!userPrompt){S.modalError='Write the next scene first.';renderModal();return;}
  if (!S.modalSelectedChars.size){S.modalError='Select at least one character.';renderModal();return;}
  if (S.tokenBalance<5){S.modalError='Not enough tokens to generate.';renderModal();return;}
  S.modalPrompt=userPrompt; S.modalError=''; S.modalResult=null;
  if (shuffle) S.modalResultIndex=(S.modalResultIndex+1)%PRESET_RESULTS.length;
  S.tokenBalance-=5; S.modalPhase='generating';
  renderModal(); syncModalToken();
  const payload=buildPayload();
  try {
    const result=CONFIG.DEMO_MODE
      ? await demoGenerate()
      : await realGenerate(payload);
    S.modalResult=result; S.modalPhase='preview';
  } catch(e) {
    S.modalPhase='draft'; S.tokenBalance+=5;
    S.modalError=e.message||'Generation failed. Please try again.';
  }
  renderModal(); syncModalToken();
}

async function demoGenerate() {
  await sleep(1800+Math.random()*600);
  const p=PRESET_RESULTS[S.modalResultIndex];
  return {title:p.title,synopsis:p.synopsis,videoUrl:p.videoUrl||'',seed:p.seed,generationId:'demo_'+Date.now()};
}

async function realGenerate(payload) {
  const base=CONFIG.API_BASE||'';
  const res=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    mode:'google',
    payload,
  })});
  const data=await res.json();
  if (!res.ok) throw new Error(data.error||`API error ${res.status}`);
  const gid=data.video_id || encodeURIComponent(data.operation_name||'');
  if (!gid) throw new Error('No generation operation returned');
  for (let i=0;i<60;i++) {
    await sleep(5000);
    const pr=await fetch(`${base}/api/status/${gid}`);
    const pd=await pr.json();
    const result=pd.result||{};
    if (pd.error) throw new Error(pd.error);
    if (result.error) throw new Error(result.error);
    if ((result.done||result.status===1) && result.video_url) return {videoUrl:result.video_url,gcsUri:result.gcs_uri||'',title:'New Sprout · '+S.modalPrompt.slice(0,10),synopsis:S.modalPrompt,generationId:gid};
    if (result.done||result.status===1) throw new Error('Generation finished without a video URL.');
  }
  throw new Error('Generation timed out (>5 minutes)');
}

function publishBranch() {
  if (!S.modalResult) return;
  const newId=uid();
  const parent=S.nodes[S.modalParentId];
  const fullPrompt = buildPayload().prompt;
  S.nodes[newId]={
    nodeId:newId, parentId:S.modalParentId, storyId:'story_001',
    title:S.modalResult.title||'New Sprout · '+S.modalPrompt.slice(0,10),
    synopsis:S.modalResult.synopsis||S.modalPrompt,
    prompt:fullPrompt,
    authorId:'user_me', authorName:'You',
    derivedFrom:parent.authorName,
    videoUrl:S.modalResult.videoUrl||'',
    duration:5, ageDays:0, isFreeWindow:true, unlockPrice:1.9,
    likes:0, impressions:0, paidUnlocks:0,
    isProtected:true, status:'alive', ownAssetIds:[], thumbUrl:'',
  };
  if (!S.newNodeIds) S.newNodeIds = new Set();
  S.newNodeIds.add(newId);
  closeModal();
  S.treePositions=computeLayout('node_root');
  drawTree();
  // Animate the new edge drawing in
  requestAnimationFrame(() => {
    const edgePath = document.querySelector(`.edge[data-id="${newId}"]`);
    if (edgePath) {
      const len = edgePath.getTotalLength();
      edgePath.style.setProperty('--edge-len', len);
      edgePath.style.strokeDasharray = len;
      edgePath.style.strokeDashoffset = len;
      edgePath.classList.add('edge-animate');
    }
    // Clear new-node flag after animation so it doesn't replay on redraw
    setTimeout(() => { if (S.newNodeIds) S.newNodeIds.delete(newId); }, 600);
  });
  setTimeout(()=>openPanel(newId), 300);
  toast('🌿 New branch added to the branch universe!');
}

/* ──────────────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await hydrateStoredCheckpoints();
  } catch (error) {
    console.warn('Checkpoint hydration skipped:', error);
  }
  renderHome();
  document.getElementById('modal-create').addEventListener('input', e => {
    if (e.target.id==='modal-prompt') S.modalPrompt=e.target.value;
    if (S.modalPayloadVisible) updatePayloadDisplay();
  });
});
