/* 敦煌复苏计划 — programmer.js */

const G = {
  scene:null,
  cluesFound:[],
  timer:null, timerEl:null,
  artifactsRecovered:0
};

const SM = new SceneManager();
let subtitle = null;

function initScenes() {
  ['perm','wall-scan','data-shoot','maze','photo-puzzle','ending','results','countdown-reveal']
    .forEach(id => {
      const el = document.getElementById(`scene-${id}`);
      if (el) { el.style.display='none'; SM.register(id, el); }
    });
}

// ─── Entry ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  initScenes();
  subtitle = new SubtitleSystem('prog');
  const v = document.getElementById('camera-video');
  if (v) v.style.display = 'none';
  await SM.go('perm');
  document.getElementById('perm-btn').addEventListener('click', startPermissions);
});

async function startPermissions() {
  const btn = document.getElementById('perm-btn');
  btn.textContent = '正在请求权限...'; btn.disabled = true;

  const motP = Motion.requestPermission();
  const camOk = await Camera.init(document.getElementById('camera-video'));
  let motOk = false;
  try { motOk = await motP; } catch(e) { console.warn('Motion:', e); }
  Motion.start();

  const v = document.getElementById('camera-video');
  if (v) { v.style.display = camOk ? '' : 'none'; v.style.pointerEvents = camOk ? '' : 'none'; }

  if (!camOk) toast('摄像头不可用', 'prog', 3000);
  if (!motOk) toast('运动传感器不可用', 'prog', 3000);

  await SM.go('wall-scan');
  startWallScan();
}

// ─── Wall Scan ────────────────────────────────────────
function startWallScan() {
  let ready = false;
  const btn = document.getElementById('scan-tap-btn');
  btn.classList.remove('visible');
  document.getElementById('scan-label').textContent = '正在初始化数字敦煌系统……';

  // Boot text typing
  const bootEl = document.getElementById('boot-text');
  const bootLines = [
    '> 启动敦煌数字修复系统 v4.0',
    '> 初始化神经网络引擎……完成',
    '> 加载文物识别模型……完成',
    '> 连接莫高窟数据库……已连接',
    '> 扫描附近岩壁结构……',
    '> 检测到异常信号……',
    '> 分析中……',
    '> 系统就绪。',
  ];
  bootEl.innerHTML = '';
  let li = 0;
  function typeLine() {
    if (li >= bootLines.length) return;
    const line = document.createElement('div');
    line.textContent = bootLines[li];
    bootEl.appendChild(line);
    li++;
    if (li >= bootLines.length) {
      ready = true;
      document.getElementById('scan-label').textContent = '✓ 系统已就绪';
      btn.classList.add('visible');
    }
    setTimeout(typeLine, randInt(400, 800));
  }
  setTimeout(typeLine, 300);

  btn.onclick = () => {
    if (!ready) return;
    subtitle.play([
      {speaker:'*',text:'好，我这边已经准备完毕。让我先给你实时推送几个数据包，看看连接是否稳定。'},
    ], () => { SM.go('data-shoot'); initDataShoot(); });
  };
}

// ─── Data Shoot ───────────────────────────────────────
const DS = {
  active:false, health:3, totalRounds:3, roundsDone:0,
  progress:0, progressPerRound:100,
  blocks:[], spawnId:null, timerId:null
};
const DATA_STRINGS = ['0xF3A1','DAT_SCR','IMG_REF','SYS_OK','0x7B2C','BLK_CHN'];

function initDataShoot() {
  DS.active=true; DS.health=3; DS.roundsDone=0; DS.progress=0; DS.blocks=[];
  updateDSui();

  // Health hearts
  const hEl = document.getElementById('ds-health');
  hEl.innerHTML = '❤️❤️❤️';

  // Spawn blocks
  function spawn() { if(!DS.active)return; for(let i=0;i<3;i++)setTimeout(spawnBlock,i*400); }
  spawn();
  DS.spawnId = setInterval(spawn, 3500);

  // Progress tick
  DS.timerId = setInterval(tickProgress, 200);
}

function spawnBlock() {
  if (!DS.active) return;
  const isDanger = Math.random() > 0.5;
  const el = document.createElement('div');
  el.className = `data-block ${isDanger?'data-red':'data-blue'}`;
  // Cycle through 3 PNG variants
  const variant = randInt(1,3);
  el.style.backgroundImage = `url('assets/程序碎块/${isDanger?'红色':'蓝色'}${variant}.png')`;

  const y = randInt(10, 80);
  el.style.top = y+'vh';
  el.style.left = Math.random()>0.5?`${window.innerWidth+10}px`:'-120px';
  document.getElementById('scene-data-shoot').appendChild(el);
  DS.blocks.push({el, isDanger, hit:false});

  const dur = randInt(1800, 3000);
  el.style.transition = `left ${dur}ms linear`;
  setTimeout(() => { el.style.left = el.style.left.indexOf('-')===0 ? `${window.innerWidth+40}px` : '-120px'; }, 50);
  setTimeout(() => { el.remove(); DS.blocks = DS.blocks.filter(b=>b.el!==el); }, dur+300);

  const tap = () => {
    if (!DS.active || el.dataset.hit) return;
    el.dataset.hit='1'; el.style.transform='scale(1.5)'; el.style.opacity='0';
    setTimeout(()=>el.remove(), 200);

    if (isDanger) {
      // Hit red block: lose health
      DS.health--;
      updateDSui();
      toast('数据损坏！','bad',800);
      if (DS.health <= 0) endDataShoot(false);
    } else {
      // Hit blue block: gain progress
      DS.progress += 8;
      if (DS.progress >= 100) DS.progress = 100;
      updateDSui();
      toast('✓ 数据包接收','good',600);
    }

    // Check if progress reaches threshold for round
    const roundTarget = (DS.roundsDone+1) * (100/DS.totalRounds);
    if (DS.progress >= roundTarget) {
      DS.roundsDone++;
      updateDSui();
      if (DS.roundsDone >= DS.totalRounds) endDataShoot(true);
      else toast(`📦 数据包 ${DS.roundsDone}/${DS.totalRounds} 完成`,'prog',1200);
    }
  };
  el.addEventListener('touchstart', e => { e.preventDefault(); tap(); }, {passive:false});
  el.addEventListener('click', tap);
}

function updateDSui() {
  const bar = document.getElementById('ds-progress-bar');
  if (bar) bar.style.width = DS.progress+'%';
  const lbl = document.getElementById('ds-rounds');
  if (lbl) lbl.textContent = `数据包 ${DS.roundsDone}/${DS.totalRounds}`;

  const hEl = document.getElementById('ds-health');
  if (hEl) hEl.innerHTML = Array.from({length:3}, (_,i)=>`<span class="heart${i>=DS.health?' lost':''}">❤️</span>`).join('');
}

function tickProgress() {
  if (!DS.active) return;
  // Auto-increase slowly from missed blocks
  if (DS.progress < 100 && DS.blocks.filter(b=>!b.el.dataset.hit).length > 2) {
    DS.progress += 0.15;
    if (DS.progress > 100) DS.progress = 100;
    updateDSui();
    const roundTarget = (DS.roundsDone+1) * (100/DS.totalRounds);
    if (DS.progress >= roundTarget) {
      DS.roundsDone++;
      updateDSui();
      if (DS.roundsDone >= DS.totalRounds) endDataShoot(true);
    }
  }
}

function endDataShoot(success) {
  if (!DS.active) return;
  DS.active = false;
  clearInterval(DS.spawnId); clearInterval(DS.timerId);
  DS.blocks.forEach(b => b.el.remove());
  DS.blocks = [];

  subtitle.play([
    {speaker:'*',text:success?'数据传输完成！非常稳定。':'连接中断了……不过没关系，我拿到了一些关键数据。'},
    {speaker:'*',text:'现在我要你在这些碎片化的数据中，帮我找到一条通往洞窟深处的路径。'},
  ], () => { SM.go('maze'); initMaze(); });
}

// ─── Maze ─────────────────────────────────────────────
const MAZE = {
  cols:13, rows:9, cellSize:32, grid:[],
  ball:{x:0,y:0,vx:0,vy:0},
  exit:{x:12,y:8},
  animId:null, done:false
};

function initMaze() {
  const cvs = document.getElementById('maze-canvas');
  if (!cvs) return;

  MAZE.cellSize = Math.min(
    Math.floor((window.innerWidth*0.70)/MAZE.cols),
    Math.floor((window.innerHeight*0.72)/MAZE.rows)
  );
  cvs.width = MAZE.cols * MAZE.cellSize;
  cvs.height = MAZE.rows * MAZE.cellSize;

  MAZE.done = false;
  MAZE.ball = {x:0.5, y:0.5, vx:0, vy:0};
  MAZE.exit = {x:MAZE.cols-1, y:MAZE.rows-1};
  MAZE.grid = generateMaze(MAZE.cols, MAZE.rows);

  const ctx = cvs.getContext('2d');

  // Motion
  const motHandler = (type, m) => {
    if (type!=='orient'||MAZE.done) return;
    const beta = clamp(m.beta||0,-30,30)/30;
    const gamma = clamp(m.gamma||0,-30,30)/30;
    MAZE.ball.vx = gamma*0.25; MAZE.ball.vy = beta*0.25;
  };
  Motion.on(motHandler);

  // Keyboard
  const keyHandler = e => {
    const s=0.2;
    if(e.key==='ArrowLeft')MAZE.ball.vx=-s;
    if(e.key==='ArrowRight')MAZE.ball.vx=s;
    if(e.key==='ArrowUp')MAZE.ball.vy=-s;
    if(e.key==='ArrowDown')MAZE.ball.vy=s;
  };
  window.addEventListener('keydown', keyHandler);

  // Touch drag
  let lt=null;
  cvs.addEventListener('touchstart', e=>{lt=e.touches[0];},{passive:true});
  cvs.addEventListener('touchmove', e=>{e.preventDefault();if(!lt)return;MAZE.ball.vx=(e.touches[0].clientX-lt.clientX)/80;MAZE.ball.vy=(e.touches[0].clientY-lt.clientY)/80;lt=e.touches[0];},{passive:false});
  cvs.addEventListener('touchend',()=>{lt=null;});

  function loop() {
    if (MAZE.done) { Motion.off(motHandler); window.removeEventListener('keydown',keyHandler); return; }
    updateBall();
    drawMaze(ctx, cvs);
    MAZE.animId = requestAnimationFrame(loop);
  }
  loop();
}

function generateMaze(cols, rows) {
  const grid = [];
  for (let r=0; r<rows; r++) { grid[r]=[]; for(let c=0;c<cols;c++) grid[r][c]={walls:[true,true,true,true], visited:false}; }

  function dfs(r,c) {
    grid[r][c].visited = true;
    const dirs = [[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]];
    for (let i=dirs.length-1; i>0; i--) { const j=randInt(0,i); [dirs[i],dirs[j]]=[dirs[j],dirs[i]]; }
    for (const [dr,dc,w1,w2] of dirs) {
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&!grid[nr][nc].visited) {
        grid[r][c].walls[w1]=false; grid[nr][nc].walls[w2]=false;
        dfs(nr,nc);
      }
    }
  }
  dfs(0,0);
  return grid;
}

function updateBall() {
  MAZE.ball.x = clamp(MAZE.ball.x, 0.1, MAZE.cols-0.1);
  MAZE.ball.y = clamp(MAZE.ball.y, 0.1, MAZE.rows-0.1);

  let nx = MAZE.ball.x+MAZE.ball.vx, ny = MAZE.ball.y+MAZE.ball.vy;
  MAZE.ball.vx *= 0.85; MAZE.ball.vy *= 0.85;
  if (Math.abs(MAZE.ball.vx)<0.001) MAZE.ball.vx=0;
  if (Math.abs(MAZE.ball.vy)<0.001) MAZE.ball.vy=0;

  const cx=Math.floor(MAZE.ball.x), cy=Math.floor(MAZE.ball.y);
  const cell = MAZE.grid[cy]?.[cx];
  if (!cell) { MAZE.ball.x=clamp(nx,0.1,MAZE.cols-0.1); MAZE.ball.y=clamp(ny,0.1,MAZE.rows-0.1); return; }

  if (nx<MAZE.ball.x&&cell.walls[3]){nx=MAZE.ball.x;MAZE.ball.vx=0;}
  if (nx>MAZE.ball.x&&cell.walls[1]){nx=MAZE.ball.x;MAZE.ball.vx=0;}
  if (ny<MAZE.ball.y&&cell.walls[0]){ny=MAZE.ball.y;MAZE.ball.vy=0;}
  if (ny>MAZE.ball.y&&cell.walls[2]){ny=MAZE.ball.y;MAZE.ball.vy=0;}

  MAZE.ball.x=clamp(nx,0.1,MAZE.cols-0.1);
  MAZE.ball.y=clamp(ny,0.1,MAZE.rows-0.1);

  // Exit check
  if (Math.floor(MAZE.ball.x)===MAZE.exit.x && Math.floor(MAZE.ball.y)===MAZE.exit.y) {
    MAZE.done=true; toast('🚪 出口找到！','good',2000);
    setTimeout(startDialogue3, 1000);
  }
}

function drawMaze(ctx, cvs) {
  const cs=MAZE.cellSize, W=cvs.width, H=cvs.height;
  ctx.fillStyle='#040a12'; ctx.fillRect(0,0,W,H);

  // Grid lines (thin cyan)
  for (let r=0; r<MAZE.rows; r++) {
    for (let c=0; c<MAZE.cols; c++) {
      const x=c*cs, y=r*cs, cell=MAZE.grid[r][c];
      ctx.strokeStyle='rgba(0,212,255,0.15)'; ctx.lineWidth=1.5;
      if (cell.walls[0]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cs,y);ctx.stroke();}
      if (cell.walls[3]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+cs);ctx.stroke();}
    }
  }
  // Right + bottom borders
  ctx.strokeStyle='rgba(0,212,255,0.15)'; ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(W,0);ctx.lineTo(W,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(W,H);ctx.stroke();

  // Exit marker
  const ex=MAZE.exit.x*cs+cs/2, ey=MAZE.exit.y*cs+cs/2;
  ctx.fillStyle='rgba(0,212,255,0.3)'; ctx.fillRect(MAZE.exit.x*cs+4, MAZE.exit.y*cs+4, cs-8, cs-8);
  ctx.fillStyle='var(--prog-cyan)'; ctx.font=`${cs*0.5}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🚪', ex, ey);

  // Ball
  const bx=MAZE.ball.x*cs, by=MAZE.ball.y*cs, br=cs*0.32;
  const bglow=ctx.createRadialGradient(bx,by,0,bx,by,br*2);
  bglow.addColorStop(0,'rgba(0,212,255,0.5)'); bglow.addColorStop(1,'transparent');
  ctx.fillStyle=bglow; ctx.beginPath();ctx.arc(bx,by,br*2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='var(--prog-cyan)'; ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.fill();
}

function startDialogue3() {
  subtitle = new SubtitleSystem('prog');
  subtitle.play([
    {speaker:'*',text:'找到了一条路！太好了！'},
    {speaker:'*',text:'现在还剩最后一步——我这边的数据还需要你在现场提供一些视觉信息。让我给你几张需要识别位置的图像碎片，想办法对它们进行拍照拼合。'},
  ], () => { SM.go('photo-puzzle'); initPhotoPuzzle(); });
}

// ─── Photo Puzzle ─────────────────────────────────────
function initPhotoPuzzle() {
  const wrap = document.getElementById('pp-wrap');
  wrap.innerHTML = '';

  const art = {
    label:'壁画修复图',
    ai:['🌀','🔱','🌸','🦅'],
    cols:2, rows:2
  };

  const pieceSize = 48;
  const gap = 3;
  const targetW = art.cols * pieceSize + (art.cols+1)*gap;
  const targetH = art.rows * pieceSize + (art.rows+1)*gap;

  // Target area
  const targetArea = document.createElement('div');
  targetArea.style.cssText = `position:relative;width:${targetW}px;height:${targetH}px;border:1px solid var(--prog-cyan);border-radius:8px;overflow:hidden;flex-shrink:0`;
  for (let i=0; i<art.ai.length; i++) {
    const row=Math.floor(i/art.cols), col=i%art.cols;
    const slot = document.createElement('div');
    slot.className='pp-slot';
    slot.style.cssText = `left:${gap+col*(pieceSize+gap)}px;top:${gap+row*(pieceSize+gap)}px`;
    slot.id = 'pp-slot-'+i; slot.dataset.idx=i;
    targetArea.appendChild(slot);
  }

  // Pieces
  const piecesWrap = document.createElement('div');
  piecesWrap.className='pp-pieces';
  piecesWrap.style.cssText='display:flex;flex-wrap:wrap;gap:4px;max-width:120px';

  const shuffled = [...art.ai].sort(()=>Math.random()-0.5);
  shuffled.forEach((icon, origIdx) => {
    const piece = document.createElement('div');
    piece.className='pp-piece';
    piece.textContent=icon;
    piece.dataset.idx=art.ai.indexOf(icon);
    piecesWrap.appendChild(piece);

    let clone=null;
    function s(x,y){piece.style.opacity='0.6';clone=piece.cloneNode(true);clone.style.cssText=`position:fixed;left:${x-pieceSize/2}px;top:${y-pieceSize/2}px;width:${pieceSize}px;height:${pieceSize}px;z-index:300;pointer-events:none;opacity:.85;border:2px solid var(--prog-cyan);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(0,212,255,.12)`;document.body.appendChild(clone);}
    function m(x,y){if(!clone)return;clone.style.left=(x-pieceSize/2)+'px';clone.style.top=(y-pieceSize/2)+'px';}
    function e(x,y){if(!clone)return;clone.remove();clone=null;piece.style.opacity='1';
      document.querySelectorAll('.pp-slot:not(.filled)').forEach(sl=>{
        const r=sl.getBoundingClientRect();
        if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){
          if(sl.dataset.idx===piece.dataset.idx){sl.textContent=piece.textContent;sl.classList.add('filled');piece.remove();checkPPdone();}
        }
      });}
    piece.addEventListener('touchstart',ev=>{ev.preventDefault();const t=ev.touches[0];s(t.clientX,t.clientY);},{passive:false});
    piece.addEventListener('touchmove',ev=>{ev.preventDefault();const t=ev.touches[0];m(t.clientX,t.clientY);},{passive:false});
    piece.addEventListener('touchend',ev=>{const t=ev.changedTouches[0];e(t.clientX,t.clientY);});
    piece.addEventListener('mousedown',ev=>{s(ev.clientX,ev.clientY);});
    window.addEventListener('mousemove',ev=>{if(clone)m(ev.clientX,ev.clientY);});
    window.addEventListener('mouseup',ev=>{if(clone)e(ev.clientX,ev.clientY);});
  });

  function checkPPdone() {
    if (document.querySelectorAll('.pp-slot.filled').length >= art.ai.length) {
      toast('🎨 壁画修复图完成！','good',2000);
      setTimeout(() => {
        SM.go('ending');
        showEnding();
      }, 1200);
    }
  }

  const area = document.createElement('div');
  area.className='photo-puzzle-area';
  area.appendChild(targetArea);
  area.appendChild(piecesWrap);

  wrap.appendChild(document.createElement('div')).style.cssText='font-size:13px;font-weight:700;color:var(--prog-cyan);margin-bottom:4px;text-align:center';
  wrap.lastChild.textContent='📸 照片拼合';
  wrap.appendChild(area);
}

function showEnding() {
  const el = document.getElementById('scene-ending');
  el.innerHTML = `<div class="ending-screen">
    <div class="ending-icon">🔬</div>
    <div class="ending-title" style="color:var(--prog-cyan)">数据修复完成</div>
    <div class="ending-desc">所有文物数据已整理归档。<br>数字敦煌计划——圆满成功。</div>
    <div class="ending-quote">"在失忆的时代，选择记住什么，是一种反抗。"</div>
    <button class="btn btn-prog" onclick="showResults()">查看报告</button>
  </div>`;
}

function showResults() {
  SM.go('results');
  const el = document.getElementById('scene-results');
  el.innerHTML = `<div class="results-screen" style="height:100%">
    <div class="results-title" style="color:var(--prog-cyan)">📊 数据修复报告</div>
    <div class="results-item"><span class="results-label">身份</span><span class="results-value" style="color:var(--prog-cyan)">程序员</span></div>
    <div class="results-item"><span class="results-label">数据包接收</span><span class="results-value">${DS.roundsDone}/${DS.totalRounds}</span></div>
    <div class="results-item"><span class="results-label">壁画修复</span><span class="results-value" style="color:#34C759">✓ 完成</span></div>
    <div style="flex-basis:100%;text-align:center;margin-top:16px">
      <button class="btn btn-neutral" onclick="window.location.href='index.html'" style="padding:8px 20px">返回首页</button>
    </div>
  </div>`;
}
