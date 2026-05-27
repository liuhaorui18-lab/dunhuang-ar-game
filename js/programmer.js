/* ─── programmer.js ─── Full Programmer Game Logic ─── */

const P = {
  countdown: 0,
  health: 3,          // data-shoot lives
  dataScore: 0,       // affects countdown
  puzzlesDone: 0,
  cluesUnlocked: [],
  timer: null,
  timerEl: null,
  artifactsRestored: 0,
};

const SM = new SceneManager();
let dialogue = null;

function initScenes() {
  ['perm','dialogue1','wall-scan','data-shoot','dialogue2',
   'maze','dialogue3','countdown-reveal','photo-puzzle','ending','results']
  .forEach(id => {
    const el = document.getElementById(`scene-${id}`);
    if (el) { el.style.display='none'; SM.register(id, el); }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  initScenes();
  dialogue = new DialogueSystem(document.getElementById('dialogue-box'), 'prog');
  await SM.go('perm');
  document.getElementById('perm-btn').addEventListener('click', startPermissions);
});

async function startPermissions() {
  document.getElementById('perm-btn').textContent = '正在请求权限...';
  document.getElementById('perm-btn').disabled = true;

  const camOk = await Camera.init(document.getElementById('camera-video'));
  const motOk = await Motion.requestPermission();
  Motion.start();

  if (!camOk) toast('摄像头不可用，使用纯色背景', 'prog');
  if (!motOk) toast('运动传感器不可用，将使用替代操作', 'prog');

  SM.go('dialogue1');
  startDialogue1();
}

// ─── Dialogue 1 ───────────────────────────────────────
function startDialogue1() {
  const lines = [
    { speaker: '-', text: '……你好？程序员，你还在吗？' },
    { speaker: '*', text: '啊！对不起。我刚才好像走神了。我们进行到哪一步了？稍等，我的设备进入睡眠模式了。我得找一块合适的屏幕……' },
    { speaker: '*', text: '好了。让我想想我们接下来要做什么。你是考古学家。你在开凿洞窟。你已经在洞窟面前了对吗，快要二次坍塌、需要紧急抢修文物的那个？你在挖进去的通道吗？' },
    { speaker: '-', text: '嗯。已经挖到一半了。' },
    { speaker: '*', text: '挖到一半了！你一直在原地等我吗？真对不起，我们现在就继续开挖吧，我会继续协助你的。你只要跟着我的提示继续工作就好。这样能为我们争取最多时间。' },
    { speaker: '*', text: '传回来的数据也太多了……算了，我能处理。注意听我的指令，三、二、一——' },
  ];
  dialogue.play(lines, () => SM.go('wall-scan', initWallScan));
}

// ─── Tech Wall Scan ───────────────────────────────────
let scanReady = false;
let scanTimer = null;
let bootIdx = 0;
const BOOT_LINES = [
  '> SYSTEM BOOT......OK',
  '> SCANNING SURFACE......',
  '> DETECTING CAVE STRUCTURE......',
  '> CALIBRATING SENSORS......',
  '> AI MODULE LOADED',
  '> SURFACE DETECTED ✓',
];

function initWallScan() {
  scanReady = false;
  const tapBtn = document.getElementById('scan-tap-btn');
  tapBtn.classList.remove('visible');
  const bootEl = document.getElementById('boot-text');
  bootIdx = 0;

  function typeBootLine() {
    if (bootIdx >= BOOT_LINES.length) {
      scanReady = true;
      tapBtn.classList.add('visible');
      return;
    }
    const line = document.createElement('div');
    line.textContent = BOOT_LINES[bootIdx];
    if (bootIdx === BOOT_LINES.length - 1) line.style.color = '#34C759';
    bootEl.appendChild(line);
    bootEl.scrollTop = bootEl.scrollHeight;
    bootIdx++;
    setTimeout(typeBootLine, 600);
  }
  typeBootLine();

  tapBtn.onclick = () => {
    if (!scanReady) return;
    clearTimeout(scanTimer);
    SM.go('data-shoot');
    initDataShoot();
  };
}

// ─── Data Shoot ───────────────────────────────────────
const DS = {
  active: false,
  health: 3,
  progress: 0,        // 0-100 per round
  roundsDone: 0,
  totalRounds: 3,
  blocks: [],
  spawnId: null,
  progId: null,
  hitCount: 0,
  missCount: 0,
  animId: null,
};

const DATA_STRINGS = [
  'DATA_0x4F2', 'CORRUPTED', 'BLOCK_ERR', '010110',
  'CACHE_MISS', '404_LOST', 'NULL_PTR', 'OVERFLOW',
  'SEGMENT_FAULT', 'MEM_LEAK', 'INF_LOOP', '0xFF0000',
];

function initDataShoot() {
  DS.active = true; DS.health = 3; DS.progress = 0;
  DS.roundsDone = 0; DS.blocks = []; DS.hitCount = 0; DS.missCount = 0;
  P.dataScore = 0;

  updateHealthUI();
  updateProgUI();

  DS.spawnId = setInterval(spawnBlock, 1200);
  DS.progId  = setInterval(tickProgress, 200);
}

function spawnBlock() {
  if (!DS.active) return;
  const isDanger = Math.random() > 0.4;
  const el = document.createElement('div');
  el.className = `data-block${isDanger?' danger':''}`;
  el.textContent = DATA_STRINGS[randInt(0, DATA_STRINGS.length-1)];

  const fromLeft = Math.random() > 0.5;
  const y = randInt(20, 70);
  el.style.top = `${y}vh`;
  el.style.left = fromLeft ? '-120px' : `${window.innerWidth+20}px`;

  document.getElementById('scene-data-shoot').appendChild(el);
  DS.blocks.push({ el, isDanger, hit: false });

  const duration = randInt(2500, 4000);
  el.style.transition = `left ${duration}ms linear`;
  setTimeout(() => { el.style.left = fromLeft ? `${window.innerWidth+50}px` : '-120px'; }, 50);

  setTimeout(() => {
    if (!el.dataset.hit && DS.active) {
      // Block passed through
      if (isDanger) {
        takeDamage();
      }
      el.remove();
      DS.blocks = DS.blocks.filter(b => b.el !== el);
    }
  }, duration + 200);

  const tap = () => {
    if (el.dataset.hit) return;
    el.dataset.hit = '1';
    el.style.transform = 'scale(2)';
    el.style.opacity = '0';
    setTimeout(() => { el.remove(); DS.blocks = DS.blocks.filter(b => b.el !== el); }, 200);

    showHitEffect(el, isDanger ? '💥 摧毁！' : '✓ 清除！');
    DS.hitCount++;
    DS.progress = Math.min(100, DS.progress + (isDanger ? 18 : 10));
    updateProgUI();
  };

  el.addEventListener('touchstart', e => { e.preventDefault(); tap(); }, { passive: false });
  el.addEventListener('click', tap);
}

function tickProgress() {
  if (!DS.active) return;
  // Progress drains slowly if blocks are present
  if (DS.blocks.filter(b => !b.el.dataset.hit).length > 2) {
    DS.progress = Math.max(0, DS.progress - 1.5);
    updateProgUI();
  }
  if (DS.progress >= 100) {
    DS.progress = 0;
    DS.roundsDone++;
    P.dataScore++;
    updateProgUI();
    toast(`✓ 数据包 ${DS.roundsDone}/${DS.totalRounds} 发送成功！`, 'good', 1200);
    if (DS.roundsDone >= DS.totalRounds) endDataShoot(true);
  }
}

function takeDamage() {
  DS.health--;
  updateHealthUI();
  toast('被数据团击中！', 'bad', 1000);
  // Screen flash
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,0,0,.3);z-index:200;pointer-events:none;animation:toast-out .4s forwards';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);

  if (DS.health <= 0) endDataShoot(false);
}

function updateHealthUI() {
  const el = document.getElementById('ds-health');
  if (!el) return;
  el.innerHTML = [0,1,2].map(i => `<span class="heart ${i >= DS.health ? 'lost' : ''}">💻</span>`).join('');
}

function updateProgUI() {
  const el = document.getElementById('ds-progress-bar');
  if (el) el.style.width = `${DS.progress}%`;
  const lbl = document.getElementById('ds-rounds');
  if (lbl) lbl.textContent = `数据包 ${DS.roundsDone}/${DS.totalRounds}`;
}

function showHitEffect(el, msg) {
  const r = el.getBoundingClientRect();
  const eff = document.createElement('div');
  eff.className = 'data-hit-effect';
  eff.style.left = `${r.left + r.width/2}px`;
  eff.style.top  = `${r.top}px`;
  eff.textContent = msg;
  document.body.appendChild(eff);
  setTimeout(() => eff.remove(), 700);
}

function endDataShoot(success) {
  DS.active = false;
  clearInterval(DS.spawnId);
  clearInterval(DS.progId);
  DS.blocks.forEach(b => b.el.remove());
  DS.blocks = [];

  if (!success) {
    toast('💥 系统死机！正在重启……', 'bad', 2000);
    P.dataScore = 0;
    setTimeout(() => { DS.health = 3; initDataShoot(); }, 2000);
    return;
  }

  // Countdown: better score = more time
  const base = 150;
  const bonus = P.dataScore * 25;
  P.countdown = base + bonus + randInt(0, 30);

  SM.go('dialogue2');
  startDialogue2();
}

// ─── Dialogue 2 ───────────────────────────────────────
function startDialogue2() {
  const el = document.getElementById('scene-dialogue2');
  const dlg = new DialogueSystem(document.getElementById('dialogue-box-2'), 'prog');
  const lines = [
    { speaker: '*', text: '呼——总算结束了。你那边情况如何？有没有受伤，又或者，有没有新的发现？' },
    { speaker: '-', text: '我没事。洞窟里面很黑，看不清里面的状况。' },
    { speaker: '*', text: '你有没有照明用的设备？我把关于文物的线索发给你。怎么这么多……！线索、线索……到底在哪里……' },
    { speaker: '-', text: '……你还好吗？' },
    { speaker: '*', text: '好，我很好。我只是……我有一点理不清……等我一下。' },
  ];
  dlg.play(lines, () => {
    SM.go('maze');
    initMaze();
  });
}

// ─── Maze Game ────────────────────────────────────────
const MAZE = {
  cols: 9, rows: 13,
  cellSize: 32,
  grid: [],
  ball: { x: 0, y: 0, vx: 0, vy: 0 },
  exit: { x: 8, y: 12 },
  animId: null,
  done: false,
};

function initMaze() {
  const cvs = document.getElementById('maze-canvas');
  if (!cvs) return;

  MAZE.cellSize = Math.min(Math.floor((window.innerWidth * 0.85) / MAZE.cols),
                           Math.floor((window.innerHeight * 0.55) / MAZE.rows));
  cvs.width  = MAZE.cols * MAZE.cellSize;
  cvs.height = MAZE.rows * MAZE.cellSize;

  MAZE.done = false;
  MAZE.ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
  MAZE.grid = generateMaze(MAZE.cols, MAZE.rows);

  const ctx = cvs.getContext('2d');

  // Motion handler
  const motHandler = (type, m) => {
    if (type !== 'orient') return;
    const beta  = clamp(m.beta  || 0, -30, 30) / 30;
    const gamma = clamp(m.gamma || 0, -30, 30) / 30;
    MAZE.ball.vx = gamma * 0.25;
    MAZE.ball.vy = beta  * 0.25;
  };
  Motion.on(motHandler);

  // Desktop: arrow keys
  const keyHandler = e => {
    const s = 0.2;
    if (e.key === 'ArrowLeft')  MAZE.ball.vx = -s;
    if (e.key === 'ArrowRight') MAZE.ball.vx =  s;
    if (e.key === 'ArrowUp')    MAZE.ball.vy = -s;
    if (e.key === 'ArrowDown')  MAZE.ball.vy =  s;
  };
  window.addEventListener('keydown', keyHandler);

  // Touch drag fallback
  let lastTouch = null;
  cvs.addEventListener('touchstart', e => { lastTouch = e.touches[0]; }, { passive: true });
  cvs.addEventListener('touchmove',  e => {
    e.preventDefault();
    if (!lastTouch) return;
    MAZE.ball.vx = (e.touches[0].clientX - lastTouch.clientX) / 80;
    MAZE.ball.vy = (e.touches[0].clientY - lastTouch.clientY) / 80;
    lastTouch = e.touches[0];
  }, { passive: false });
  cvs.addEventListener('touchend', () => { MAZE.ball.vx = 0; MAZE.ball.vy = 0; lastTouch = null; });

  function loop() {
    if (MAZE.done) return;
    updateBall();
    drawMaze(ctx);

    if (Math.abs(MAZE.ball.x - MAZE.exit.x) < 0.6 && Math.abs(MAZE.ball.y - MAZE.exit.y) < 0.6) {
      MAZE.done = true;
      Motion.off(motHandler);
      window.removeEventListener('keydown', keyHandler);
      toast('✓ 数据整理完成！', 'good', 1500);
      setTimeout(() => { SM.go('dialogue3'); startDialogue3(); }, 1000);
      return;
    }
    MAZE.animId = requestAnimationFrame(loop);
  }
  loop();
}

function generateMaze(cols, rows) {
  // Simple recursive backtracker
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({ r, c, walls: [true,true,true,true], visited: false }))
  );
  // [top, right, bottom, left]
  const stack = [grid[0][0]];
  grid[0][0].visited = true;
  const dirs = [[0,-1,2],[1,0,3],[-1,0,1],[0,1,0]]; // [dc, dr, opposite_wall_idx, my_wall_idx]
  // corrected: [dc, dr, wall_i_remove, wall_neighbor_remove]
  const DIRS = [
    { dc: 0, dr: -1, wi: 0, wn: 2 }, // top
    { dc: 1, dr:  0, wi: 1, wn: 3 }, // right
    { dc: 0, dr:  1, wi: 2, wn: 0 }, // bottom
    { dc:-1, dr:  0, wi: 3, wn: 1 }, // left
  ];

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const neighbors = DIRS
      .map(d => ({ d, cell: grid[cur.r + d.dr]?.[cur.c + d.dc] }))
      .filter(n => n.cell && !n.cell.visited);
    if (!neighbors.length) { stack.pop(); continue; }
    const { d, cell } = neighbors[randInt(0, neighbors.length-1)];
    cur.walls[d.wi]  = false;
    cell.walls[d.wn] = false;
    cell.visited = true;
    stack.push(cell);
  }
  return grid;
}

function updateBall() {
  const cs = 1; // 1 = one cell
  let nx = MAZE.ball.x + MAZE.ball.vx;
  let ny = MAZE.ball.y + MAZE.ball.vy;

  // Friction
  MAZE.ball.vx *= 0.85;
  MAZE.ball.vy *= 0.85;

  // Collision
  const cx = Math.floor(MAZE.ball.x);
  const cy = Math.floor(MAZE.ball.y);
  const cell = MAZE.grid[cy]?.[cx];
  if (!cell) return;

  // Check walls
  if (nx < MAZE.ball.x && cell.walls[3]) { nx = MAZE.ball.x; MAZE.ball.vx = 0; }
  if (nx > MAZE.ball.x && cell.walls[1]) { nx = MAZE.ball.x; MAZE.ball.vx = 0; }
  if (ny < MAZE.ball.y && cell.walls[0]) { ny = MAZE.ball.y; MAZE.ball.vy = 0; }
  if (ny > MAZE.ball.y && cell.walls[2]) { ny = MAZE.ball.y; MAZE.ball.vy = 0; }

  MAZE.ball.x = clamp(nx, 0.1, MAZE.cols - 0.1);
  MAZE.ball.y = clamp(ny, 0.1, MAZE.rows - 0.1);
}

function drawMaze(ctx) {
  const { cols, rows, cellSize: cs, grid, ball, exit } = MAZE;
  ctx.fillStyle = '#050A0F';
  ctx.fillRect(0, 0, cols * cs, rows * cs);

  ctx.strokeStyle = 'rgba(0,212,255,0.5)';
  ctx.lineWidth = 1.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const x = c * cs, y = r * cs;
      if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x,y);    ctx.lineTo(x+cs,y);    ctx.stroke(); }
      if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x+cs,y); ctx.lineTo(x+cs,y+cs); ctx.stroke(); }
      if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x,y+cs); ctx.lineTo(x+cs,y+cs); ctx.stroke(); }
      if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x,y);    ctx.lineTo(x,y+cs);    ctx.stroke(); }
    }
  }

  // Exit
  ctx.fillStyle = 'rgba(52,199,89,0.25)';
  ctx.fillRect(exit.x * cs + 2, exit.y * cs + 2, cs - 4, cs - 4);
  ctx.fillStyle = '#34C759';
  ctx.font = `${cs * 0.6}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚪', exit.x * cs + cs/2, exit.y * cs + cs/2);

  // Ball
  const bx = ball.x * cs, by = ball.y * cs;
  const grd = ctx.createRadialGradient(bx, by, 0, bx, by, cs * 0.35);
  grd.addColorStop(0, '#00D4FF');
  grd.addColorStop(1, 'rgba(0,212,255,0.1)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(bx, by, cs * 0.3, 0, Math.PI*2); ctx.fill();

  // Glow dot
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(bx - cs*0.08, by - cs*0.08, cs * 0.08, 0, Math.PI*2); ctx.fill();
}

// ─── Dialogue 3 ───────────────────────────────────────
function startDialogue3() {
  const el = document.getElementById('scene-dialogue3');
  const dlg = new DialogueSystem(document.getElementById('dialogue-box-3'), 'prog');
  const lines = [
    { speaker: '*', text: '对了！就是这样！好了！我把数据和关于文物的信息发给你。有了这些线索，我们的进展一定能更加顺利。抓住它们！' },
    { speaker: '-', text: '抓住……？' },
    { speaker: '-', text: '……真是太感谢你了。' },
    { speaker: '*', text: '不用谢，这是我应该做的。那么，接下来——怎么只剩这么点时间了……' },
  ];
  dlg.play(lines, () => {
    SM.go('countdown-reveal');
    showCountdownReveal();
  });
}

// ─── Countdown Reveal ─────────────────────────────────
function showCountdownReveal() {
  showModal({
    theme: 'prog',
    title: '⚠ 洞窟坍塌倒计时',
    content: `坍塌即将发生！<br>考古学家必须在倒计时结束前逃出洞窟。<br><br>你的数据处理为他们争取了：`,
    timer: fmtTime(P.countdown),
    btnText: '开始修复任务',
    onClose: () => {
      SM.go('photo-puzzle');
      initPhotoPuzzle();
    }
  });
}

// ─── Photo Puzzle ─────────────────────────────────────
const ARTIFACTS_PP = [
  {
    name: '飞天壁画',
    icon: '🦅',
    pieces: ['🌸','🌀','🎆','✨'],
    ai:    ['❓','⬜','❓','⬜'],
  },
  {
    name: '经卷文书',
    icon: '📜',
    pieces: ['𝌀','𝌁','𝌂','𝌃'],
    ai:    ['⬛','⬜','⬛','⬜'],
  },
];

let ppCurrent = 0;
let ppPlaced = 0;
let ppTotal = 0;

function initPhotoPuzzle() {
  ppCurrent = 0; ppPlaced = 0; ppTotal = 0;
  P.artifactsRestored = 0;

  // Start timer
  P.timerEl = document.getElementById('prog-timer-badge');
  P.timerEl.textContent = fmtTime(P.countdown);
  P.timerEl.style.display = '';

  P.timer = new CountdownTimer(
    P.countdown,
    rem => {
      P.timerEl.textContent = fmtTime(rem);
      if (rem <= 30) P.timerEl.classList.add('danger');
    },
    () => endGame(false)
  );
  P.timer.start();

  renderPuzzleRound();
}

function renderPuzzleRound() {
  if (ppCurrent >= ARTIFACTS_PP.length) { endGame(true); return; }
  const art = ARTIFACTS_PP[ppCurrent];
  const wrap = document.getElementById('pp-wrap');
  wrap.innerHTML = '';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:16px;font-weight:700;color:#00D4FF;margin-bottom:4px;text-align:center';
  title.textContent = `修复 ${ppCurrent+1}/${ARTIFACTS_PP.length}：${art.name}`;
  wrap.appendChild(title);

  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:12px;opacity:.5;margin-bottom:16px;text-align:center';
  sub.textContent = '将真实照片碎片拖入AI修复版上，替换错误的部分';
  wrap.appendChild(sub);

  const area = document.createElement('div');
  area.style.cssText = 'display:flex;gap:20px;justify-content:center;align-items:flex-start;width:100%';

  // AI restored version (target)
  const targetDiv = document.createElement('div');
  targetDiv.innerHTML = `
    <div style="font-size:11px;color:#FF6600;opacity:.7;margin-bottom:6px;text-align:center">AI修复版（存在偏差）</div>
    <div id="pp-target" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:8px;background:rgba(0,212,255,0.05);border:1px solid rgba(255,102,0,0.4);border-radius:8px">
      ${art.ai.map((icon, i) =>
        `<div class="pp-slot" id="pp-slot-${i}" data-idx="${i}"
          style="width:64px;height:64px;border:2px dashed rgba(0,212,255,.25);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:28px;background:rgba(255,102,0,0.06)">
          ${icon}
        </div>`
      ).join('')}
    </div>
  `;

  // Real pieces (source)
  const piecesDiv = document.createElement('div');
  piecesDiv.innerHTML = `
    <div style="font-size:11px;color:#34C759;opacity:.7;margin-bottom:6px;text-align:center">真实照片</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
      ${art.pieces.map((icon, i) =>
        `<div class="pp-piece" id="pp-piece-${i}" data-idx="${i}" data-icon="${icon}"
          style="width:64px;height:64px;border:2px solid #34C759;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:grab;background:rgba(52,199,89,0.08)">
          ${icon}
        </div>`
      ).join('')}
    </div>
  `;

  area.appendChild(piecesDiv);
  area.appendChild(targetDiv);
  wrap.appendChild(area);

  // Progress for this round
  const prog = document.createElement('div');
  prog.id = 'pp-prog';
  prog.style.cssText = 'margin-top:12px;font-size:13px;opacity:.6;text-align:center';
  prog.textContent = `已修复 0/${art.pieces.length}`;
  wrap.appendChild(prog);

  // Skip button
  const skip = document.createElement('button');
  skip.className = 'btn btn-neutral';
  skip.style.cssText = 'margin-top:16px;font-size:13px;padding:8px 20px';
  skip.textContent = '跳过此文物';
  skip.onclick = () => { ppCurrent++; ppPlaced = 0; renderPuzzleRound(); };
  wrap.appendChild(skip);

  // Make pieces draggable → slots
  let placed = 0;
  art.pieces.forEach((icon, i) => {
    const piece = document.getElementById(`pp-piece-${i}`);
    makePPDraggable(piece, icon, i, art, onPlace);
  });

  function onPlace(slotIdx) {
    placed++;
    document.getElementById('pp-prog').textContent = `已修复 ${placed}/${art.pieces.length}`;
    if (placed >= art.pieces.length) {
      P.artifactsRestored++;
      toast(`✓ ${art.name} 修复完成！`, 'good', 1500);
      ppCurrent++;
      ppPlaced = 0;
      setTimeout(renderPuzzleRound, 1200);
    }
  }
}

function makePPDraggable(el, icon, pieceIdx, art, onPlace) {
  let clone = null;

  function start(x, y) {
    clone = el.cloneNode(true);
    clone.style.cssText = `position:fixed;left:${x-32}px;top:${y-32}px;width:64px;height:64px;z-index:300;pointer-events:none;opacity:.85;border:2px solid #34C759;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:28px;background:rgba(52,199,89,.15)`;
    document.body.appendChild(clone);
  }
  function move(x, y) {
    if (!clone) return;
    clone.style.left = `${x-32}px`;
    clone.style.top  = `${y-32}px`;
  }
  function end(x, y) {
    if (!clone) return;
    clone.remove(); clone = null;

    const slots = document.querySelectorAll('.pp-slot:not([data-filled])');
    slots.forEach(slot => {
      const r = slot.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        slot.textContent = icon;
        slot.style.borderColor = '#00D4FF';
        slot.style.borderStyle = 'solid';
        slot.style.background = 'rgba(0,212,255,0.12)';
        slot.dataset.filled = '1';
        el.style.opacity = '0.3';
        el.style.pointerEvents = 'none';
        onPlace(parseInt(slot.dataset.idx));
        toast(`碎片已放置`, 'good', 600);
      }
    });
  }

  el.addEventListener('touchstart', e => { e.preventDefault(); const t=e.touches[0]; start(t.clientX,t.clientY); }, { passive:false });
  el.addEventListener('touchmove',  e => { e.preventDefault(); const t=e.touches[0]; move(t.clientX,t.clientY); }, { passive:false });
  el.addEventListener('touchend',   e => { const t=e.changedTouches[0]; end(t.clientX,t.clientY); });
  el.addEventListener('mousedown',  e => start(e.clientX,e.clientY));
  window.addEventListener('mousemove', e => { if(clone) move(e.clientX,e.clientY); });
  window.addEventListener('mouseup',   e => { if(clone) end(e.clientX,e.clientY); });
}

// ─── End Game ─────────────────────────────────────────
function endGame(timerExpired) {
  if (P.timer) P.timer.stop();
  P.timerEl.style.display = 'none';

  const success = P.artifactsRestored >= 1;
  SM.go('ending');
  showEnding(success);
}

function showEnding(success) {
  const el = document.getElementById('scene-ending');
  if (success) {
    el.innerHTML = `
      <div class="ending-screen" style="background:rgba(5,10,15,0.97)">
        <div class="ending-icon">🖥️</div>
        <div class="ending-title" style="color:#00D4FF">数据修复完成</div>
        <div class="ending-desc" style="color:#C8F0FF">
          成功修复了 ${P.artifactsRestored}/${ARTIFACTS_PP.length} 件文物的数字档案。<br><br>
          但是——AI修复版本与真实照片之间存在细微差异。<br>
          有多少"历史"，已经悄悄被AI改写了呢？
        </div>
        <div class="ending-quote" style="color:#00D4FF">
          "在失忆的时代，选择记住什么，是一种反抗。"
        </div>
        <button class="btn btn-prog" onclick="showResults()">查看报告</button>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="ending-screen" style="background:rgba(5,10,15,0.97)">
        <div class="ending-icon">📡</div>
        <div class="ending-title" style="color:#888">连接中断</div>
        <div class="ending-desc" style="color:#C8F0FF;opacity:.7">
          倒计时归零，数据传输被强制中断。<br>
          ${P.artifactsRestored > 0 ? `仅修复了 ${P.artifactsRestored} 件文物。` : '没有文物被成功修复。'}
          <br><br>那些来不及留下的记忆，随着坍塌永远消失了。
        </div>
        <button class="btn btn-neutral" onclick="showResults()">查看报告</button>
      </div>
    `;
  }
}

function showResults() {
  SM.go('results');
  const el = document.getElementById('scene-results');
  el.innerHTML = `
    <div class="results-screen" style="background:rgba(5,10,15,0.97);height:100%;overflow-y:auto">
      <div class="results-title" style="color:#00D4FF">📊 数字修复任务报告</div>
      <div class="results-item">
        <span class="results-label">身份</span>
        <span class="results-value" style="color:#00D4FF">程序员</span>
      </div>
      <div class="results-item">
        <span class="results-label">数据包发送</span>
        <span class="results-value">${P.dataScore} / 3 轮</span>
      </div>
      <div class="results-item">
        <span class="results-label">迷宫导航</span>
        <span class="results-value">✓ 完成</span>
      </div>
      <div class="results-item">
        <span class="results-label">文物修复</span>
        <span class="results-value">${P.artifactsRestored} / ${ARTIFACTS_PP.length} 件</span>
      </div>
      <div class="results-item">
        <span class="results-label">AI偏差警告</span>
        <span class="results-value" style="color:#FF6600">已记录</span>
      </div>
      <div style="margin-top:16px">
        <div class="results-label" style="margin-bottom:10px">修复档案：</div>
        <div class="results-artifacts">
          ${ARTIFACTS_PP.map((a, i) =>
            `<div class="artifact-badge prog-style" style="${i >= P.artifactsRestored ? 'opacity:.3' : ''}">${a.name}</div>`
          ).join('')}
        </div>
      </div>
      <div style="margin-top:16px;padding:12px;border:1px solid rgba(255,102,0,.3);border-radius:8px;background:rgba(255,102,0,.05)">
        <div style="font-size:12px;color:#FF6600;margin-bottom:6px">⚠ AI伦理提示</div>
        <div style="font-size:12px;opacity:.7;line-height:1.6">AI修复版本与真实文物存在细微差异。这些"修复"究竟是保存，还是改写？</div>
      </div>
      <div style="margin-top:32px;display:flex;gap:12px;justify-content:center">
        <button class="btn btn-neutral" onclick="window.location.href='index.html'" style="padding:12px 24px">返回选择</button>
      </div>
    </div>
  `;
}
