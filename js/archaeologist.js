/* ─── archaeologist.js ─── Full Archaeologist Game Logic ─── */

// ─── Game State ───────────────────────────────────────
const G = {
  scene: null,
  countdown: 0,         // seconds for cave exploration (set after excavation)
  forceAvg: 0.5,        // 0=too light, 1=too heavy, 0.5=perfect
  cluesFound: [],       // blue clues caught
  artifactsFound: [],   // artifact names rescued
  currentArtifact: null,
  timer: null,
  timerEl: null,
  allArtifacts: ['壁画', '经卷', '佛像', '小佛像'],
};

// ─── Scene Manager & Camera init ──────────────────────
const SM = new SceneManager();
let dialogue = null;

function initScenes() {
  ['perm','dialogue1','wall-scan','excavation','dialogue2',
   'clue-catch','countdown-reveal','cave-explore','ending','results','notebook']
  .forEach(id => {
    const el = document.getElementById(`scene-${id}`);
    if (el) { el.style.display = 'none'; SM.register(id, el); }
  });
}

// ─── Entry Point ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  initScenes();
  dialogue = new DialogueSystem(document.getElementById('dialogue-box'), 'arch');
  // Hide video until permissions are granted
  const videoEl = document.getElementById('camera-video');
  if (videoEl) videoEl.style.display = 'none';
  await SM.go('perm');
  document.getElementById('perm-btn').addEventListener('click', startPermissions);
});

async function startPermissions() {
  const btn = document.getElementById('perm-btn');
  btn.textContent = '正在请求权限...';
  btn.disabled = true;

  // iOS: DeviceMotionEvent.requestPermission() MUST be called in the
  // same user-gesture tick (before any await), or it will be silently denied.
  const motPromise = Motion.requestPermission();

  // Camera: race against a 12s timeout so the game never hangs
  const camOk = await Camera.init(document.getElementById('camera-video'));

  // Now await the motion permission (it was triggered synchronously above)
  let motOk = false;
  try {
    motOk = await motPromise;
  } catch (e) {
    console.warn('Motion permission error:', e);
  }
  Motion.start();

  // Restore video (hidden initially to avoid blocking touches)
  const videoEl = document.getElementById('camera-video');
  if (videoEl && !camOk) {
    videoEl.style.display = 'none';
    videoEl.style.pointerEvents = 'none';
  } else if (videoEl) {
    videoEl.style.display = '';
  }

  if (!camOk) toast('摄像头不可用，将使用纯色背景', 'arch', 3000);
  if (!motOk) toast('运动传感器不可用，将使用替代操作', 'arch', 3000);

  // Start game
  await SM.go('dialogue1');
  startDialogue1();
}

// ─── Dialogue 1: Opening ──────────────────────────────
function startDialogue1() {
  const lines = [
    { speaker: '*', text: '……看得到吗？你好？' },
    { speaker: '-', text: '你好？' },
    { speaker: '*', text: '太好了，你就是那个考古学家对吧！是我，程序员，终于联系上你了。你已经到洞窟面前了，对吗？' },
    { speaker: '-', text: '……还没有。' },
    { speaker: '*', text: '好。我们得抓紧了，根据测算，下一次坍塌很快就会发生，那个洞窟会变成一片废墟。认真听我说的每一句话，我能带你找到那里。' },
    { speaker: '*', text: '你手里有一台机器对不对？就是用来联系我的这台，上面搭载了AI智能程序，我会用它来帮助你。现在，把它的摄像头对准你周围的岩壁，任何一面。' },
  ];
  dialogue.play(lines, () => SM.go('wall-scan', initWallScan));
}

// ─── Wall Scan ────────────────────────────────────────
let scanTimer = null;
let scanReady = false;

function initWallScan() {
  scanReady = false;
  const tapBtn = document.getElementById('scan-tap-btn');
  tapBtn.classList.remove('visible');
  const label = document.getElementById('scan-label');
  label.textContent = '将摄像头对准附近的岩壁……';

  // Simulate scan detection after 3s
  scanTimer = setTimeout(() => {
    scanReady = true;
    label.textContent = '✓ 检测到可开凿岩壁！';
    label.style.color = '#C8860A';
    tapBtn.classList.add('visible');
    toast('找到了！就是这里', 'arch');
  }, 3000);

  tapBtn.onclick = () => {
    if (!scanReady) return;
    clearTimeout(scanTimer);
    SM.go('excavation');
    initExcavation();
  };
}

// ─── Excavation Rhythm Game ───────────────────────────
const EX = {
  canvas: null, ctx: null,
  W: 0, H: 0,
  notes: [], // { lane, y, hit, perfect }
  lanes: 3,
  noteSpeed: 4,
  hitZoneY: 0,
  hitZoneH: 60,
  score: 0, perfect: 0, total: 0,
  maxNotes: 12,
  spawned: 0,
  spawnInterval: null,
  animId: null,
  forceValues: [],
  done: false,
};

const TOOL_COLORS = ['#C8860A', '#8B4513', '#D4A853', '#B8860B', '#A0522D'];

function initExcavation() {
  const cvs = document.getElementById('game-canvas');
  cvs.classList.remove('hidden');
  EX.canvas = cvs;
  EX.ctx = cvs.getContext('2d');
  EX.W = cvs.width = window.innerWidth;
  EX.H = cvs.height = window.innerHeight;
  EX.hitZoneY = EX.H - EX.hitZoneH - 60;
  EX.notes = []; EX.spawned = 0; EX.score = 0; EX.perfect = 0; EX.total = 0;
  EX.forceValues = []; EX.done = false;

  EX.lanes = 5;
  EX.noteSpeed = 2;

  // Show force meter
  document.getElementById('force-wrap').style.display = 'flex';
  document.getElementById('ex-hud').style.display = 'flex';
  updateForceMeter(0.5);

  // Touch handler
  cvs.addEventListener('touchstart', handleExTouch, { passive: false });
  cvs.addEventListener('mousedown', handleExMouse);

  EX.spawnInterval = setInterval(spawnNote, 900);
  EX.animId = requestAnimationFrame(exLoop);
}

function spawnNote() {
  if (EX.spawned >= EX.maxNotes) { clearInterval(EX.spawnInterval); return; }
  EX.notes.push({ lane: randInt(0, EX.lanes - 1), y: -30, hit: false, perfect: false, flash: 0 });
  EX.spawned++;
}

function exLoop() {
  const { ctx, W, H, notes, hitZoneY, hitZoneH } = EX;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, H);

  const laneW = W / EX.lanes;

  // Lane dividers
  for (let i = 1; i < EX.lanes; i++) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i * laneW, 0); ctx.lineTo(i * laneW, H); ctx.stroke();
  }

  // Hit zone
  for (let i = 0; i < EX.lanes; i++) {
    const x = i * laneW;
    const gradient = ctx.createLinearGradient(x, hitZoneY, x, hitZoneY + hitZoneH);
    gradient.addColorStop(0, 'rgba(200,134,10,0.3)');
    gradient.addColorStop(1, 'rgba(200,134,10,0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, hitZoneY, laneW - 4, hitZoneH);

    // Hit zone line
    ctx.strokeStyle = 'rgba(200,134,10,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 10, hitZoneY); ctx.lineTo(x + laneW - 10, hitZoneY); ctx.stroke();

    // Tool icon in hit zone
    ctx.fillStyle = 'rgba(200,134,10,0.4)';
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    const tools = ['🔨', '⛏️', '🪚', '🪨', '🔩'];
    ctx.fillText(tools[i % tools.length], x + laneW / 2, hitZoneY + hitZoneH / 2 + 10);
  }

  // Move and draw notes
  for (let n of notes) {
    if (n.hit) { if (n.flash > 0) { drawHitEffect(ctx, n, laneW); n.flash--; } continue; }
    n.y += EX.noteSpeed;

    const cx = n.lane * laneW + laneW / 2;
    const r = 22;

    // Glow
    const grd = ctx.createRadialGradient(cx, n.y, 0, cx, n.y, r * 1.8);
    grd.addColorStop(0, TOOL_COLORS[n.lane]);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, n.y, r * 1.8, 0, Math.PI * 2); ctx.fill();

    // Stone note
    ctx.fillStyle = TOOL_COLORS[n.lane];
    ctx.beginPath(); ctx.arc(cx, n.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Miss if past hit zone
    if (n.y > EX.hitZoneY + EX.hitZoneH + 30 && !n.hit) {
      n.hit = true; n.flash = 0;
      EX.total++;
      EX.forceValues.push(0.05); // too light (missed)
      updateForceMeter(0.15);
      toast('力度太小！', 'bad', 1000);
      checkExcavationDone();
    }
  }

  if (!EX.done) EX.animId = requestAnimationFrame(exLoop);
}

function drawHitEffect(ctx, n, laneW) {
  const cx = n.lane * laneW + laneW / 2;
  const alpha = n.flash / 15;
  ctx.fillStyle = n.perfect ? `rgba(255,220,50,${alpha})` : `rgba(200,134,10,${alpha})`;
  ctx.beginPath(); ctx.arc(cx, EX.hitZoneY + 30, 40 * (1 - alpha / 1), 0, Math.PI * 2); ctx.fill();
}

function hitLane(lane) {
  if (EX.done) return;
  const laneW = EX.W / EX.lanes;
  let hit = false;

  for (let n of EX.notes) {
    if (n.hit || n.lane !== lane) continue;
    if (n.y >= EX.hitZoneY - 20 && n.y <= EX.hitZoneY + EX.hitZoneH + 10) {
      const center = EX.hitZoneY + 10;
      const diff = Math.abs(n.y - center);
      const perfect = diff < 25;
      n.hit = true; n.flash = 15; n.perfect = perfect;
      EX.total++;

      if (perfect) {
        EX.perfect++;
        EX.forceValues.push(0.5);
        updateForceMeter(0.5);
        showExFeedback('🔥 完美！', '#FFD700');
        toast('完美！', 'good', 800);
      } else {
        // Slightly early = too heavy, late = too light
        const force = n.y < center ? 0.8 : 0.3;
        EX.forceValues.push(force);
        updateForceMeter(force);
        showExFeedback(n.y < center ? '力道过猛！' : '轻了些！', '#C8860A');
      }
      EX.score++;
      document.getElementById('ex-score').textContent = `${EX.score}/${EX.maxNotes}`;
      hit = true;
      checkExcavationDone();
      break;
    }
  }

  if (!hit) {
    EX.forceValues.push(0.9);
    updateForceMeter(0.9);
    showExFeedback('别那么用力！', '#FF6B35');
  }
}

function showExFeedback(msg, color) {
  const el = document.getElementById('ex-feedback');
  el.textContent = msg;
  el.style.color = color;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 700);
}

function updateForceMeter(val) {
  const bar = document.getElementById('force-bar');
  const pct = (1 - val) * 100;
  bar.style.height = `${Math.round(pct)}%`;
  if (val > 0.65) bar.style.background = '#FF3B30';
  else if (val < 0.35) bar.style.background = '#007AFF';
  else bar.style.background = 'linear-gradient(to top, #34C759, #C8860A)';
}

function checkExcavationDone() {
  if (EX.total < EX.maxNotes) return;
  if (EX.done) return;
  EX.done = true;

  cancelAnimationFrame(EX.animId);
  clearInterval(EX.spawnInterval);
  EX.canvas.removeEventListener('touchstart', handleExTouch);
  EX.canvas.removeEventListener('mousedown', handleExMouse);

  // Calculate force avg
  const avg = EX.forceValues.reduce((a, b) => a + b, 0) / EX.forceValues.length;
  G.forceAvg = avg;

  // Countdown: perfect avg → 4min, worst → 2min (in seconds)
  const base = 180;
  const bonus = Math.round((1 - Math.abs(avg - 0.5) * 2) * 60);
  G.countdown = base + bonus + randInt(0, 30);

  document.getElementById('force-wrap').style.display = 'none';
  document.getElementById('ex-hud').style.display = 'none';
  EX.canvas.classList.add('hidden');

  SM.go('dialogue2');
  startDialogue2();
}

function handleExTouch(e) {
  e.preventDefault();
  Array.from(e.changedTouches).forEach(t => {
    const lane = Math.floor(t.clientX / (EX.W / EX.lanes));
    hitLane(clamp(lane, 0, EX.lanes - 1));
  });
}
function handleExMouse(e) {
  const lane = Math.floor(e.clientX / (EX.W / EX.lanes));
  hitLane(clamp(lane, 0, EX.lanes - 1));
}

// ─── Dialogue 2: After Excavation ─────────────────────
function startDialogue2() {
  const dlg2 = new DialogueSystem(document.getElementById('dialogue-box-2'), 'arch');
  const lines = [
    { speaker: '*', text: '很好，数据显示只要再——小心！后退几步！' },
    { speaker: '-', text: '……你还好吗？' },
    { speaker: '*', text: '什么？哦哦……好，很好，非常好。幸好我们来得及。让我……' },
    { speaker: '*', text: '对了。看得到吗？我把跟这里有关的一些提示传给你了。它可能有点……多，不过没关系，我相信你。抓住它们！' },
  ];
  dlg2.play(lines, () => {
    SM.go('clue-catch');
    initClueCatch();
  });
}

// ─── Clue Catch ───────────────────────────────────────
const CC = {
  active: false,
  blueCount: 0,
  items: [],
  timeLeft: 18,
  timerId: null,
  required: 2,
};

const CLUE_TEXTS_REAL = ['壁画·飞天纹', '经文·甲卷', '坐佛头像', '莲花纹样', '供养人像'];
const CLUE_TEXTS_FAKE = ['ERR_DATA', '乱码×4F2', 'NULL_REF', '已损坏', '无法读取'];

function initClueCatch() {
  CC.active = true; CC.blueCount = 0; CC.items = []; CC.timeLeft = 18;
  document.getElementById('cc-score').textContent = `线索 0/${CC.required}`;
  document.getElementById('cc-timer').textContent = `${CC.timeLeft}s`;

  spawnClues();

  CC.timerId = setInterval(() => {
    CC.timeLeft--;
    document.getElementById('cc-timer').textContent = `${CC.timeLeft}s`;
    if (CC.timeLeft <= 0) endClueCatch();
  }, 1000);

  // Continuous spawn
  CC._spawnId = setInterval(() => { if (CC.active) spawnClue(); }, 1400);
}

function spawnClues() {
  for (let i = 0; i < 5; i++) setTimeout(spawnClue, i * 300);
}

function spawnClue() {
  if (!CC.active) return;
  const isReal = Math.random() > 0.45;
  const text = isReal ? CLUE_TEXTS_REAL[randInt(0, 4)] : CLUE_TEXTS_FAKE[randInt(0, 4)];

  const el = document.createElement('div');
  el.className = `clue-item ${isReal ? 'clue-real' : 'clue-fake'}`;
  el.textContent = (isReal ? '🔵 ' : '🔴 ') + text;
  el.dataset.real = isReal ? '1' : '0';

  const startLeft = Math.random() > 0.5;
  const y = randInt(10, 80);
  el.style.top = `${y}vh`;
  el.style.left = startLeft ? '-100px' : `${window.innerWidth + 20}px`;
  el.style.zIndex = 60;

  document.getElementById('scene-clue-catch').appendChild(el);
  CC.items.push(el);

  const targetX = startLeft ? window.innerWidth * Math.random() : -120;
  const duration = randInt(3000, 5000);
  el.style.transition = `left ${duration}ms linear, top 0.1s`;
  setTimeout(() => { el.style.left = `${targetX}px`; }, 50);

  // Remove after flight
  setTimeout(() => { el.remove(); CC.items = CC.items.filter(i => i !== el); }, duration + 200);

  el.addEventListener('touchstart', e => { e.preventDefault(); catchClue(el, isReal); }, { passive: false });
  el.addEventListener('click', () => catchClue(el, isReal));
}

function catchClue(el, isReal) {
  if (!CC.active || el.dataset.caught) return;
  el.dataset.caught = '1';
  el.style.transform = 'scale(1.3)';
  el.style.opacity = '0.5';
  setTimeout(() => el.remove(), 300);

  if (isReal) {
    CC.blueCount++;
    const clueText = el.textContent.replace('🔵 ', '');
    G.cluesFound.push(clueText);
    document.getElementById('cc-score').textContent = `线索 ${CC.blueCount}/${CC.required}`;
    toast(`✓ ${clueText}`, 'good', 1200);
    if (CC.blueCount >= CC.required) endClueCatch(true);
  } else {
    toast('乱码！丢弃', 'bad', 900);
  }
}

function endClueCatch(success) {
  if (!CC.active) return;
  CC.active = false;
  clearInterval(CC.timerId);
  clearInterval(CC._spawnId);
  CC.items.forEach(el => el.remove());
  CC.items = [];

  if (CC.blueCount === 0) {
    toast('没拿到任何线索，后续解密将无提示！', 'bad', 2500);
    G.cluesFound = [];
  }

  // Countdown reveal
  setTimeout(() => {
    SM.go('countdown-reveal');
    showCountdownReveal();
  }, 600);
}

// ─── Countdown Reveal ─────────────────────────────────
function showCountdownReveal() {
  const { overlay, timerEl } = showModal({
    theme: 'arch',
    title: '⚠️ 洞窟坍塌倒计时',
    content: `坍塌即将发生！你必须在倒计时结束前逃出洞窟。<br><br>根据开凿情况，你的可用时间为：`,
    timer: fmtTime(G.countdown),
    btnText: '进入洞窟',
    onClose: () => {
      SM.go('cave-explore');
      initCaveExplore();
    }
  });
}

// ─── Cave Explore ─────────────────────────────────────
const CE = {
  alpha: 0,
  artifactAngles: { '壁画': 20, '经卷': 85, '佛像': 155, '小佛像': 265 },
  foundArtifacts: new Set(),
  activeArtifact: null,
  tolerance: 28,           // lock-on zone
  nearTolerance: 55,       // proximity warning zone
  minigameOpen: false,
  velocity: 0,             // inertia
  snapTarget: null,        // snap-to-artifact
};

function initCaveExplore() {
  G.artifactsFound = [];
  CE.foundArtifacts = new Set();
  CE.activeArtifact = null;
  CE.minigameOpen = false;
  CE.velocity = 0;
  CE.snapTarget = null;

  // Random starting angle so user isn't always at 0
  CE.alpha = Math.random() * 360;

  // Start timer
  G.timerEl = document.getElementById('timer-badge');
  G.timerEl.textContent = fmtTime(G.countdown);
  G.timerEl.style.display = '';

  G.timer = new CountdownTimer(
    G.countdown,
    (rem) => {
      G.timerEl.textContent = fmtTime(rem);
      if (rem <= 30) G.timerEl.classList.add('danger');
    },
    () => endCaveExplore(false)
  );
  G.timer.start();

  // Gyroscope → alpha
  Motion.on(handleCaveMotion);

  updateCompass();
  updateArtifactHint();
  updateProximityGlow();

  // ── Touch drag with inertia ──
  let lastX = null, lastTime = null;
  const camOverlay = document.getElementById('cave-area');

  const dragMultiplier = 0.9;

  camOverlay.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - (lastX || t.clientX);
    const dt = Date.now() - (lastTime || Date.now());
    if (dt > 0 && Math.abs(dx) > 1) {
      CE.velocity = (dx / dt) * 20 * (dragMultiplier / 1.5); // scale momentum with sensitivity
    }
    CE.alpha = (CE.alpha + dx * dragMultiplier + 360) % 360;
    CE.snapTarget = null;
    lastX = t.clientX;
    lastTime = Date.now();
    updateCompass(); updateArtifactHint(); updateProximityGlow();
  }, { passive: false });

  camOverlay.addEventListener('touchend', () => {
    lastX = null; lastTime = null;
  });

  // ── Mouse drag for desktop ──
  camOverlay.addEventListener('mousemove', e => {
    if (!e.buttons) return;
    CE.alpha = (CE.alpha + e.movementX * dragMultiplier + 360) % 360;
    CE.snapTarget = null;
    updateCompass(); updateArtifactHint(); updateProximityGlow();
  });

  // ── Inertia / snap loop ──
  function physicsLoop() {
    if (CE.minigameOpen || !G.timer || !G.timer.running) return;

    // Apply inertia
    if (Math.abs(CE.velocity) > 0.01) {
      CE.alpha = (CE.alpha + CE.velocity + 360) % 360;
      CE.velocity *= 0.92; // friction
      updateCompass(); updateArtifactHint(); updateProximityGlow();
    }

    // Snap to nearest artifact when close enough and not being dragged
    if (Math.abs(CE.velocity) < 0.05 && !lastX) {
      let nearest = null, nearestDist = Infinity;
      for (const [name, ang] of Object.entries(CE.artifactAngles)) {
        if (CE.foundArtifacts.has(name)) continue;
        const d = angleDiff(CE.alpha, ang);
        if (d < nearestDist) { nearestDist = d; nearest = ang; }
      }
      // Gentle magnetic pull when within 45° and not actively dragging
      if (nearest && nearestDist < 45 && nearestDist > 3) {
        const pullDir = angleSign(CE.alpha, nearest);
        CE.alpha = (CE.alpha + pullDir * 0.4 + 360) % 360;
        updateCompass(); updateArtifactHint(); updateProximityGlow();
      }
    }

    requestAnimationFrame(physicsLoop);
  }
  physicsLoop();

  // ── Tap to interact ──
  camOverlay.addEventListener('touchend', e => {
    e.preventDefault();
    if (CE.activeArtifact && !CE.minigameOpen) openArtifactMinigame(CE.activeArtifact);
  });
  let caveTouchFired = false;
  camOverlay.addEventListener('touchstart', () => { caveTouchFired = true; });
  camOverlay.addEventListener('click', () => {
    if (caveTouchFired) { caveTouchFired = false; return; }
    if (CE.activeArtifact && !CE.minigameOpen) openArtifactMinigame(CE.activeArtifact);
  });

  // ── Compass markers: tap to jump ──
  document.querySelectorAll('.art-marker').forEach(marker => {
    const name = marker.dataset.name;
    const ang = CE.artifactAngles[name];
    if (ang == null) return;

    const jumpTo = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (CE.foundArtifacts.has(name)) return;
      CE.alpha = ang;
      CE.velocity = 0;
      updateCompass(); updateArtifactHint(); updateProximityGlow();
      // Auto-open if already locked on
      if (CE.activeArtifact === name && !CE.minigameOpen) {
        setTimeout(() => openArtifactMinigame(name), 400);
      }
    };

    marker.addEventListener('click', jumpTo);
    marker.addEventListener('touchend', jumpTo);
  });
}

function handleCaveMotion(type, m) {
  if (type !== 'orient') return;
  CE.alpha = ((m.alpha || 0) + 360) % 360;
  CE.velocity = 0;
  CE.snapTarget = null;
  updateCompass();
  updateArtifactHint();
  updateProximityGlow();
}

function angleDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Returns +1 or -1 indicating the shorter direction from a to b
function angleSign(a, b) {
  const diff = ((b - a) % 360 + 360) % 360;
  return diff > 180 ? -1 : 1;
}

function updateCompass() {
  const bar = document.getElementById('compass-bar');
  if (!bar) return;
  const pct = (CE.alpha / 360) * 100;
  document.getElementById('compass-dot').style.left = `${pct}%`;

  // Check which artifact is in view
  let found = null;
  for (const [name, ang] of Object.entries(CE.artifactAngles)) {
    if (CE.foundArtifacts.has(name)) continue;
    if (angleDiff(CE.alpha, ang) < CE.tolerance) { found = name; break; }
  }
  CE.activeArtifact = found;

  const vf = document.getElementById('viewfinder');
  const hint = document.getElementById('artifact-hint');

  if (found) {
    vf.classList.add('lit');
    vf.classList.remove('near');
  } else {
    vf.classList.remove('lit');
    // Check if near any artifact
    let nearFound = false;
    for (const [name, ang] of Object.entries(CE.artifactAngles)) {
      if (CE.foundArtifacts.has(name)) continue;
      if (angleDiff(CE.alpha, ang) < CE.nearTolerance) { nearFound = true; break; }
    }
    if (nearFound) { vf.classList.add('near'); }
    else { vf.classList.remove('near'); }
  }

  // Update markers: show proximity
  document.querySelectorAll('.art-marker').forEach(m => {
    const name = m.dataset.name;
    const ang = CE.artifactAngles[name];
    if (ang == null) return;
    if (CE.foundArtifacts.has(name)) {
      m.classList.add('found');
      m.classList.remove('nearby');
    } else {
      const dist = angleDiff(CE.alpha, ang);
      if (dist < CE.nearTolerance) m.classList.add('nearby');
      else m.classList.remove('nearby');
    }
  });
}

function updateProximityGlow() {
  // Increase viewfinder glow as user gets closer to any artifact
  let minDist = Infinity;
  for (const [name, ang] of Object.entries(CE.artifactAngles)) {
    if (CE.foundArtifacts.has(name)) continue;
    const d = angleDiff(CE.alpha, ang);
    if (d < minDist) minDist = d;
  }

  const vf = document.getElementById('viewfinder');
  if (minDist === Infinity) return;

  // Glow intensity: 0 (far) → 1 (locked on)
  const intensity = Math.max(0, 1 - minDist / CE.nearTolerance);
  const glowSize = 8 + intensity * 24;
  const glowAlpha = 0.1 + intensity * 0.5;
  vf.style.boxShadow = `0 0 ${glowSize}px rgba(200,134,10,${glowAlpha})`;
  vf.style.borderColor = intensity > 0.8
    ? 'var(--arch-primary)'
    : `rgba(200,134,10,${0.3 + intensity * 0.5})`;
}

function updateArtifactHint() {
  const el = document.getElementById('artifact-hint');
  if (!el) return;

  if (CE.activeArtifact && !CE.foundArtifacts.has(CE.activeArtifact)) {
    el.textContent = `发现：${CE.activeArtifact} · 点击互动`;
    el.classList.add('visible');
    return;
  }

  // Find nearest unfound artifact and show direction
  let nearest = null, nearestDist = Infinity;
  for (const [name, ang] of Object.entries(CE.artifactAngles)) {
    if (CE.foundArtifacts.has(name)) continue;
    const d = angleDiff(CE.alpha, ang);
    if (d < nearestDist) { nearestDist = d; nearest = name; }
  }

  if (nearest && nearestDist < CE.nearTolerance) {
    const sign = angleSign(CE.alpha, CE.artifactAngles[nearest]);
    el.textContent = `${sign > 0 ? '→' : '←'} 靠近中……（${nearest}）`;
    el.classList.add('visible');
  } else if (nearest) {
    el.textContent = '转动手机或拖动屏幕 · 寻找文物';
    el.classList.remove('visible');
  } else {
    el.textContent = '';
    el.classList.remove('visible');
  }
}

function openArtifactMinigame(name) {
  if (CE.minigameOpen) return;
  CE.minigameOpen = true;
  G.currentArtifact = name;

  const hasClue = G.cluesFound.length > 0;
  showArtifactDialogue(name, hasClue, () => {
    if (name === '壁画') openJigsaw();
    else if (name === '经卷') openSort();
    else if (name === '佛像') openDustSweep();
    else if (name === '小佛像') openWhackMole();
  });
}

function showArtifactDialogue(name, hasClue, cb) {
  const convos = {
    '壁画': {
      yes: [
        { speaker: '*', text: '等一下。我知道这是什么！把周围的碎片收集起来，快，只要能拼个大概，再拍摄下来，我没准就能利用现有的技术修复它！' },
      ],
      no: [
        { speaker: '*', text: '这个……它被破坏得太过彻底，已经无法修复了。去看看其他地方吧。' },
      ]
    },
    '经卷': {
      yes: [
        { speaker: '*', text: '凑近点。1、2、3、4……我好像知道这卷经文。它们应该是这样排列的——' },
      ],
      no: [
        { speaker: '*', text: '唉……这么珍贵的文物……没时间哀悼了，我们走吧。' },
      ]
    },
    '佛像': {
      yes: [
        { speaker: '*', text: '你觉不觉得它长得……如果没有灰尘和沙土，上面像不像刻着一只眼睛？' },
      ],
      no: [
        { speaker: '*', text: '这是从洞窟顶上掉下来的吗？快走吧，类似的石头随时可能再次从头顶滚下来。' },
      ]
    },
    '小佛像': {
      yes: [
        { speaker: '*', text: '等一下！那边不太对劲，是不是有什么东西在发光？' },
      ],
      no: [
        { speaker: '*', text: '什么……没事，你一定是看错了。' },
      ]
    },
  };

  const lines = hasClue ? convos[name].yes : convos[name].no;

  const tmpBox = document.getElementById('minigame-dialogue-box');
  const tmpSys = new DialogueSystem(tmpBox, 'arch');
  document.getElementById('minigame-dialogue-wrap').style.display = '';
  tmpSys.play(lines, () => {
    document.getElementById('minigame-dialogue-wrap').style.display = 'none';
    if (!hasClue) {
      CE.minigameOpen = false;
      return;
    }
    cb();
  });
}

// ─── Jigsaw Mini-game ──────────────────────────────────
const MURAL_PIECES = ['🌸','🦅','🎆','🔱','🌀','🪷'];

function openJigsaw() {
  const wrap = document.getElementById('minigame-wrap');
  wrap.innerHTML = `
    <div class="minigame-title" style="color:#D4A853">壁画 · 碎片拼合</div>
    <div class="minigame-subtitle">将碎片拖入对应位置，还原壁画原貌</div>
    <div class="jigsaw-area">
      <div>
        <div style="font-size:11px;opacity:.5;margin-bottom:8px;">碎片</div>
        <div class="jigsaw-pieces" id="jigsaw-pieces"></div>
      </div>
      <div>
        <div style="font-size:11px;opacity:.5;margin-bottom:8px;">目标位置</div>
        <div id="jigsaw-slots" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
      </div>
    </div>
    <div id="jigsaw-progress" style="margin-top:12px;font-size:13px;opacity:.6">已拼合 0/6</div>
    <button class="btn btn-neutral" id="jigsaw-skip" style="margin-top:20px;font-size:13px;padding:8px 20px">时间不够了！跳过</button>
  `;
  wrap.style.display = 'flex';

  const pieces = [...MURAL_PIECES];
  const shuffled = [...pieces].sort(() => Math.random() - 0.5);
  let placed = 0;

  const piecesEl = document.getElementById('jigsaw-pieces');
  const slotsEl  = document.getElementById('jigsaw-slots');

  // Create slots
  pieces.forEach((p, i) => {
    const slot = document.createElement('div');
    slot.className = 'puzzle-slot';
    slot.dataset.expects = p;
    slot.dataset.idx = i;
    slotsEl.appendChild(slot);
  });

  // Create draggable pieces
  shuffled.forEach(p => {
    const el = document.createElement('div');
    el.className = 'puzzle-piece';
    el.textContent = p;
    el.dataset.val = p;
    piecesEl.appendChild(el);
    makeDraggable(el, p, () => {
      placed++;
      document.getElementById('jigsaw-progress').textContent = `已拼合 ${placed}/6`;
      if (placed >= 6) finishMinigame('壁画');
    });
  });

  document.getElementById('jigsaw-skip').onclick = () => {
    toast('壁画碎片丢失了……', 'bad', 1800);
    closeMinigame(false);
  };

  // Remaining time limit using G.timer
  if (G.timer && G.timer.remaining < 60) {
    toast('⚠️ 时间紧张！快速拼合！', 'arch', 2000);
  }
}

function makeDraggable(el, val, onPlace) {
  let startX, startY, origParent, origNext, clone;

  function start(x, y) {
    startX = x; startY = y;
    origParent = el.parentNode;
    origNext = el.nextSibling;
    el.classList.add('dragging');
    clone = el.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = 200;
    clone.style.width = el.offsetWidth + 'px';
    clone.style.height = el.offsetHeight + 'px';
    clone.style.left = (x - el.offsetWidth/2) + 'px';
    clone.style.top  = (y - el.offsetHeight/2) + 'px';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.8';
    document.body.appendChild(clone);
  }

  function move(x, y) {
    if (!clone) return;
    clone.style.left = (x - el.offsetWidth/2) + 'px';
    clone.style.top  = (y - el.offsetHeight/2) + 'px';
  }

  function end(x, y) {
    if (!clone) return;
    clone.remove(); clone = null;
    el.classList.remove('dragging');

    const slots = document.querySelectorAll('.puzzle-slot:not(.filled)');
    let dropped = false;
    slots.forEach(slot => {
      const r = slot.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        if (slot.dataset.expects === val) {
          slot.textContent = val;
          slot.classList.add('filled');
          el.classList.add('placed');
          el.style.display = 'none';
          dropped = true;
          onPlace();
          toast('✓', 'good', 600);
        } else {
          toast('位置不对', 'bad', 600);
        }
      }
    });
  }

  el.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: false });
  el.addEventListener('touchmove',  e => { e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
  el.addEventListener('touchend',   e => { const t = e.changedTouches[0]; end(t.clientX, t.clientY); });
  el.addEventListener('mousedown',  e => { start(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => { if (clone) move(e.clientX, e.clientY); });
  window.addEventListener('mouseup',   e => { if (clone) end(e.clientX, e.clientY); });
}

// ─── Sort Mini-game ────────────────────────────────────
const SUTRAS = [
  { label: '甲卷', h: 100, order: 2 },
  { label: '乙卷', h: 60,  order: 0 },
  { label: '丙卷', h: 140, order: 3 },
  { label: '丁卷', h: 80,  order: 1 },
];

function openSort() {
  const wrap = document.getElementById('minigame-wrap');
  let items = [...SUTRAS].sort(() => Math.random() - 0.5);
  let selected = null;

  wrap.innerHTML = `
    <div class="minigame-title" style="color:#D4A853">经卷 · 理清顺序</div>
    <div class="minigame-subtitle">点击选中，再点击目标位置，按尺寸从小到大排列</div>
    <div class="sort-items" id="sort-row"></div>
    <div class="sort-order">
      <span>正确顺序：</span><span>小 → 大</span>
    </div>
    <button class="btn btn-arch" id="sort-confirm" style="margin-top:24px">确认顺序</button>
    <button class="btn btn-neutral" id="sort-skip" style="margin-top:10px;font-size:13px;padding:8px 20px">跳过</button>
  `;
  wrap.style.display = 'flex';

  function render() {
    const row = document.getElementById('sort-row');
    row.innerHTML = '';
    items.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = `sort-item ${selected === i ? 'selected' : ''}`;
      const body = document.createElement('div');
      body.className = 'sort-item-body';
      body.style.height = `${item.h}px`;
      const lbl = document.createElement('div');
      lbl.className = 'sort-item-label';
      lbl.textContent = item.label;
      el.appendChild(body); el.appendChild(lbl);
      el.addEventListener('click', () => {
        if (selected === null) {
          selected = i;
        } else if (selected === i) {
          selected = null;
        } else {
          // Swap
          [items[selected], items[i]] = [items[i], items[selected]];
          selected = null;
        }
        render();
      });
      row.appendChild(el);
    });
  }
  render();

  document.getElementById('sort-confirm').onclick = () => {
    const correct = items.every((item, i) => item.order === i);
    if (correct) {
      finishMinigame('经卷');
    } else {
      toast('顺序不对，再试试！', 'bad', 1200);
    }
  };
  document.getElementById('sort-skip').onclick = () => {
    toast('经卷顺序未能还原……', 'bad', 1800);
    closeMinigame(false);
  };
}

// ─── Dust Sweep Mini-game ─────────────────────────────
function openDustSweep() {
  const wrap = document.getElementById('minigame-wrap');
  wrap.innerHTML = `
    <div class="minigame-title" style="color:#D4A853">佛像 · 清扫灰尘</div>
    <div class="minigame-subtitle">用手指擦拭，清除灰尘与沙土，还原本来面目</div>
    <canvas id="dust-canvas" width="280" height="280"></canvas>
    <div class="sweep-progress-wrap">
      <div style="font-size:11px;opacity:.6;margin-bottom:4px;">已清除 <span id="swept-pct">0</span>%</div>
      <div style="height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden">
        <div id="sweep-bar" style="height:100%;background:#C8860A;width:0%;transition:width .2s;border-radius:3px"></div>
      </div>
    </div>
    <button class="btn btn-neutral" id="sweep-skip" style="margin-top:20px;font-size:13px;padding:8px 20px">跳过</button>
  `;
  wrap.style.display = 'flex';

  const cvs = document.getElementById('dust-canvas');
  const ctx = cvs.getContext('2d');
  const W = 180, H = 180;
  cvs.width = W; cvs.height = H;

  // Draw artifact (buddha face) on bottom
  ctx.fillStyle = '#2a1808';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#C8860A';
  ctx.font = '160px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🗿', W/2, H/2);

  // Dust layer: save image, then overlay dust
  const imgData = ctx.getImageData(0, 0, W, H);

  // Draw dust on top
  ctx.fillStyle = 'rgba(100,70,40,0.92)';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(${randInt(80,140)},${randInt(50,90)},${randInt(20,50)},0.5)`;
    ctx.beginPath();
    ctx.arc(Math.random()*W, Math.random()*H, randInt(3,18), 0, Math.PI*2);
    ctx.fill();
  }

  // Composite mode: erase dust
  const dustData = ctx.getImageData(0, 0, W, H);
  let sweptPixels = 0;
  const totalPixels = W * H;

  function sweep(x, y, r=22) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    updateSweptPct();
  }

  function updateSweptPct() {
    const d = ctx.getImageData(0, 0, W, H).data;
    let cleared = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 128) cleared++;
    const pct = Math.round((cleared / totalPixels) * 100);
    document.getElementById('swept-pct').textContent = pct;
    document.getElementById('sweep-bar').style.width = `${pct}%`;
    if (pct >= 65) finishMinigame('佛像');
  }

  let drawing = false;
  cvs.addEventListener('touchstart',  e => { e.preventDefault(); drawing = true; const t=e.touches[0]; const r=cvs.getBoundingClientRect(); sweep(t.clientX-r.left, t.clientY-r.top); }, { passive:false });
  cvs.addEventListener('touchmove',   e => { e.preventDefault(); if(!drawing)return; const t=e.touches[0]; const r=cvs.getBoundingClientRect(); sweep(t.clientX-r.left, t.clientY-r.top); }, { passive:false });
  cvs.addEventListener('touchend',    () => drawing=false);
  cvs.addEventListener('mousedown',   () => drawing=true);
  cvs.addEventListener('mousemove',   e => { if(!drawing)return; const r=cvs.getBoundingClientRect(); sweep(e.clientX-r.left, e.clientY-r.top); });
  window.addEventListener('mouseup',  () => drawing=false);

  document.getElementById('sweep-skip').onclick = () => { toast('佛像仍埋于尘中……', 'bad', 1800); closeMinigame(false); };
}

// ─── Whack-a-mole ─────────────────────────────────────
function openWhackMole() {
  const wrap = document.getElementById('minigame-wrap');
  let hits = 0;

  wrap.innerHTML = `
    <div class="minigame-title" style="color:#D4A853">小佛像 · 捕捉烛光</div>
    <div class="minigame-subtitle">点击三次微弱亮光，找到它！</div>
    <div class="wam-count" id="wam-hits">0 / 3</div>
    <div class="wam-area" id="wam-area"></div>
    <button class="btn btn-neutral" id="wam-skip" style="margin-top:20px;font-size:13px;padding:8px 20px">跳过</button>
  `;
  wrap.style.display = 'flex';

  showNewLight();

  function showNewLight() {
    const area = document.getElementById('wam-area');
    if (!area) return;
    area.querySelectorAll('.wam-light').forEach(e => e.remove());

    const light = document.createElement('div');
    light.className = 'wam-light';
    const maxX = area.offsetWidth  || 190;
    const maxY = area.offsetHeight || 190;
    light.style.left = `${randInt(10, maxX - 10)}px`;
    light.style.top  = `${randInt(10, maxY - 10)}px`;
    area.appendChild(light);

    // Auto-hide after 1.5s
    const hide = setTimeout(() => { light.remove(); if (hits < 3) showNewLight(); }, 1500);

    const tap = () => {
      clearTimeout(hide);
      light.remove();
      hits++;
      document.getElementById('wam-hits').textContent = `${hits} / 3`;
      toast(['✓ 找到了！', '✓ 又看见了！', '✓ 抓住！'][hits-1], 'good', 800);
      if (hits >= 3) finishMinigame('小佛像');
      else showNewLight();
    };
    light.addEventListener('touchstart', e => { e.preventDefault(); tap(); }, { passive:false });
    light.addEventListener('click', tap);
  }

  document.getElementById('wam-skip').onclick = () => { toast('烛光消失了……', 'bad', 1800); closeMinigame(false); };
}

// ─── Minigame helpers ──────────────────────────────────
function finishMinigame(artifactName) {
  CE.foundArtifacts.add(artifactName);
  G.artifactsFound.push(artifactName);
  CE.minigameOpen = false;

  const wrap = document.getElementById('minigame-wrap');
  wrap.style.display = 'none';

  const successLines = {
    '壁画':   [{ speaker: '*', text: '太好了！把摄像头对准它……我们成功了！这幅壁画，保住了！' }],
    '经卷':   [{ speaker: '*', text: '这就是那卷经文！它失传很久了，我的天啊。带走它，一定要带走它！' }],
    '佛像':   [{ speaker: '*', text: '这就是一只眼睛！佛像，是佛头的一部分！别动，我在扫描它。' }],
    '小佛像': [{ speaker: '*', text: '我就知道！我就知道那不是石头！把它带出去，能多带一个就多带一个！' }],
  };

  const tmpBox = document.getElementById('minigame-dialogue-box');
  const tmpSys = new DialogueSystem(tmpBox, 'arch');
  document.getElementById('minigame-dialogue-wrap').style.display = '';
  tmpSys.play(successLines[artifactName] || [], () => {
    document.getElementById('minigame-dialogue-wrap').style.display = 'none';
    updateArtifactHint();

    // Check all found
    if (G.artifactsFound.length >= G.allArtifacts.length) {
      endCaveExplore(true);
    }
  });
}

function closeMinigame(success) {
  CE.minigameOpen = false;
  document.getElementById('minigame-wrap').style.display = 'none';
  updateArtifactHint();
}

// ─── End Cave Explore ─────────────────────────────────
function endCaveExplore(timedOut) {
  if (G.timer) G.timer.stop();
  Motion.off(handleCaveMotion);
  G.timerEl.style.display = 'none';

  const success = G.artifactsFound.length >= 2;
  SM.go('ending');
  showEnding(success);
}

// ─── Ending ───────────────────────────────────────────
function showEnding(success) {
  const el = document.getElementById('scene-ending');
  if (success) {
    el.innerHTML = `
      <div class="ending-screen" style="background:rgba(13,8,4,0.97)">
        <div class="ending-icon">🏛️</div>
        <div class="ending-title" style="color:#D4A853">抢救成功</div>
        <div class="ending-desc" style="color:#F5E6C8">
          "${G.artifactsFound.join('、')}"<br>已经安全带出洞窟。<br><br>
          程序员已将所有扫描数据整理归档，文物修复工作即将开始。
        </div>
        <div class="ending-quote" style="color:#D4A853">
          "在失忆的时代，选择记住什么，是一种反抗。"
        </div>
        <button class="btn btn-arch" onclick="showResults()">查看报告</button>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="ending-screen" style="background:rgba(13,8,4,0.97)">
        <div class="ending-icon">💨</div>
        <div class="ending-title" style="color:#888">洞窟已坍塌</div>
        <div class="ending-desc" style="color:#F5E6C8;opacity:.7">
          ${G.artifactsFound.length > 0
            ? `抢救出了${G.artifactsFound.join('、')}，但未能带出全部文物。`
            : '洞窟倒计时结束前，没能找到任何文物。'}
          <br><br>有些记忆，消失于此刻。
        </div>
        <div class="ending-quote" style="color:#888">
          "把火把拿远一点，会晃到摄像头……等等，注意时间！"
        </div>
        <button class="btn btn-neutral" onclick="showResults()">查看报告</button>
      </div>
    `;
  }

  // Check for notebook easter egg
  if (G.artifactsFound.length >= G.allArtifacts.length) {
    setTimeout(() => {
      const nb = document.createElement('div');
      nb.style.cssText = 'margin-top:12px;font-size:13px;color:#D4A853;opacity:.7;animation:blink 1.2s infinite;cursor:pointer';
      nb.textContent = '📓 发现神秘线索 → 点击查看';
      nb.onclick = () => openNotebook();
      el.querySelector('.ending-screen').appendChild(nb);
    }, 2000);
  }
}

function showResults() {
  SM.go('results');
  const el = document.getElementById('scene-results');
  const totalTime = G.countdown;
  const used = totalTime - (G.timer ? G.timer.remaining : totalTime);
  const kb = G.artifactsFound.length * 42 + randInt(5, 18);

  el.innerHTML = `
    <div class="results-screen" style="background:rgba(13,8,4,0.97);height:100%;overflow-y:auto">
      <div class="results-title" style="color:#D4A853">📜 数字开窟功德记</div>
      <div class="results-item">
        <span class="results-label">身份</span>
        <span class="results-value" style="color:#D4A853">考古学家</span>
      </div>
      <div class="results-item">
        <span class="results-label">抢救文物</span>
        <span class="results-value">${G.artifactsFound.length} / ${G.allArtifacts.length}</span>
      </div>
      <div class="results-item">
        <span class="results-label">获取线索</span>
        <span class="results-value">${G.cluesFound.length} 条</span>
      </div>
      <div class="results-item">
        <span class="results-label">保存数据</span>
        <span class="results-value" style="color:#34C759">${kb} KB</span>
      </div>
      <div class="results-item">
        <span class="results-label">开凿力度</span>
        <span class="results-value">${G.forceAvg > 0.65 ? '偏重' : G.forceAvg < 0.35 ? '偏轻' : '✓ 适中'}</span>
      </div>
      <div style="margin-top:16px">
        <div class="results-label" style="margin-bottom:10px">抢救文物：</div>
        <div class="results-artifacts">
          ${G.allArtifacts.map(a =>
            `<div class="artifact-badge ${G.artifactsFound.includes(a) ? '' : 'style=\"opacity:.3\"'}">${a}</div>`
          ).join('')}
        </div>
      </div>
      <div style="margin-top:32px;display:flex;gap:12px;justify-content:center">
        <button class="btn btn-neutral" onclick="window.location.href='index.html'" style="padding:12px 24px">返回选择</button>
      </div>
    </div>
  `;
}

// ─── Notebook Easter Egg ──────────────────────────────
function openNotebook() {
  const overlay = document.createElement('div');
  overlay.className = 'notebook-overlay';

  let input = ['', '', '', ''];
  let activeDigit = 0;

  function render() {
    overlay.innerHTML = `
      <div style="font-size:13px;opacity:.5;text-align:center;letter-spacing:.1em">发现了一个神秘的笔记本</div>
      <div class="notebook-book">
        <div class="notebook-title">✦ 野外笔记 · 莫高窟 ✦</div>
        <div class="notebook-content">
          一个有点破破烂烂的笔记本，里面夹着很多照片和手绘的草稿，仅凭直觉就能看出它的珍贵。
          <span class="notebook-img">📔</span>
          <span style="color:#C8860A;font-size:13px">— 需要四位密码才能打开 —</span>
        </div>
      </div>
      <div style="font-size:13px;color:#D4A853;margin-bottom:8px">输入密码</div>
      <div class="password-input-wrap">
        ${input.map((v, i) => `<div class="password-digit ${activeDigit===i?'active':''}">${v||'·'}</div>`).join('')}
      </div>
      <div class="numpad">
        ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k =>
          `<div class="numpad-key ${k===''?'style=\"visibility:hidden\"':''}" data-key="${k}">${k}</div>`
        ).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn btn-arch" id="nb-confirm">确认</button>
        <button class="btn btn-neutral" id="nb-close">关闭</button>
      </div>
      ${input.join('')==='1900'?'<div style="color:#34C759;font-size:13px;margin-top:8px">✓ 解锁成功！</div>':''}
    `;

    overlay.querySelectorAll('.numpad-key').forEach(key => {
      key.addEventListener('click', () => {
        const k = key.dataset.key;
        if (k === '⌫') {
          if (activeDigit > 0) { activeDigit--; input[activeDigit] = ''; render(); }
        } else if (k !== '' && activeDigit < 4) {
          input[activeDigit] = k;
          activeDigit++;
          render();
          if (activeDigit === 4 && input.join('') === '1900') {
            setTimeout(() => showNotebookContents(overlay), 500);
          }
        }
      });
    });

    overlay.querySelector('#nb-confirm').onclick = () => {
      if (input.join('') === '1900') showNotebookContents(overlay);
      else { toast('密码错误', 'bad'); input=['','','','']; activeDigit=0; render(); }
    };
    overlay.querySelector('#nb-close').onclick = () => overlay.remove();
  }

  render();
  document.body.appendChild(overlay);
}

function showNotebookContents(overlay) {
  overlay.innerHTML = `
    <div class="notebook-book" style="max-width:320px">
      <div class="notebook-title">✦ 野外笔记 · 1900年 ✦</div>
      <div class="notebook-content">
        <span class="notebook-img">📸</span>
        笔记本被打开、翻阅。里面满是照片和手绘草稿——<br><br>
        前来考古的前辈留下的文物图鉴，记载着洞窟最初的样貌。<br><br>
        <span style="color:#C8860A">*等一下。有点不对劲……</span><br>
        <span style="opacity:.6">— 程序员</span>
      </div>
    </div>
    <div style="font-size:13px;color:#D4A853;text-align:center;line-height:1.8;padding:0 24px">
      程序员发现了什么？<br>
      <span style="opacity:.5;font-size:11px">（故事尚未结束……）</span>
    </div>
    <button class="btn btn-neutral" onclick="this.closest('.notebook-overlay').remove()">关闭</button>
  `;
}
