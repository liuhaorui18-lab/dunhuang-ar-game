/* 敦煌复苏计划 — archaeologist.js */

const G = {
  scene:null, countdown:0, forceAvg:0.5,
  artworkDone:0, artifactsFound:[],
  currentArtifact:null,
  timer:null, timerEl:null,
  allArtifacts:['壁画','经书','大佛像','小佛像']
};

const SM = new SceneManager();
let subtitle = null;

function initScenes() {
  ['perm','wall-scan','excavation','clue-catch','countdown-reveal','cave-explore','ending','results']
    .forEach(id => {
      const el = document.getElementById(`scene-${id}`);
      if (el) { el.style.display='none'; SM.register(id, el); }
    });
}

// ─── Entry ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  initScenes();
  subtitle = new SubtitleSystem('arch');
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

  if (!camOk) toast('摄像头不可用，使用纯色背景', 'arch', 3000);
  if (!motOk) toast('运动传感器不可用', 'arch', 3000);

  await SM.go('wall-scan');
  startWallScan();
}

// ─── Wall Scan ────────────────────────────────────────
let scanReady = false, scanTimer = null;

function startWallScan() {
  scanReady = false;
  const btn = document.getElementById('scan-tap-btn');
  btn.classList.remove('visible');
  document.getElementById('scan-label').textContent = '将摄像头对准附近的岩壁……';
  scanTimer = setTimeout(() => {
    scanReady = true;
    document.getElementById('scan-label').textContent = '✓ 检测到可开凿岩壁！';
    document.getElementById('scan-label').style.color = 'var(--gold)';
    btn.classList.add('visible');
  }, 2500);
  btn.onclick = () => { if (!scanReady) return; clearTimeout(scanTimer); SM.go('excavation'); initExcavation(); };
}

// ─── Excavation Rhythm Game ───────────────────────────
const EX = {
  canvas:null, ctx:null, W:0, H:0,
  notes:[], lanes:5, noteSpeed:2,
  hitZoneY:0, hitZoneH:50,
  score:0, perfect:0, total:0, maxNotes:12,
  spawned:0, spawnInterval:null, animId:null,
  forceValues:[], done:false
};

const TOOL_COLORS = ['#C8963C','#8B6914','#D4A853','#B8860B','#A0522D'];

function initExcavation() {
  const cvs = document.getElementById('game-canvas');
  cvs.classList.remove('hidden');
  EX.canvas = cvs; EX.ctx = cvs.getContext('2d');
  EX.W = cvs.width = window.innerWidth; EX.H = cvs.height = window.innerHeight;
  EX.hitZoneY = EX.H - EX.hitZoneH - 40;
  EX.notes = []; EX.spawned = 0; EX.score = 0; EX.perfect = 0; EX.total = 0;
  EX.forceValues = []; EX.done = false;

  document.getElementById('force-wrap').style.display = 'flex';
  document.getElementById('ex-hud').style.display = 'flex';
  updateForceMeter(0.5);

  cvs.addEventListener('touchstart', handleExTouch, {passive:false});
  cvs.addEventListener('mousedown', handleExMouse);

  EX.spawnInterval = setInterval(spawnNote, 800);
  EX.animId = requestAnimationFrame(exLoop);
}

function spawnNote() {
  if (EX.spawned >= EX.maxNotes) { clearInterval(EX.spawnInterval); return; }
  EX.notes.push({ lane:randInt(0,EX.lanes-1), y:-30, hit:false, perfect:false, flash:0 });
  EX.spawned++;
}

function exLoop() {
  const {ctx,W,H,notes,hitZoneY,hitZoneH} = EX;
  ctx.clearRect(0,0,W,H);

  // Cave wall texture
  ctx.fillStyle = 'rgba(10,5,2,0.5)';
  ctx.fillRect(0,0,W,H);
  for (let i=0; i<30; i++) {
    ctx.fillStyle = `rgba(${30+randInt(0,20)},${15+randInt(0,10)},${5+randInt(0,5)},0.3)`;
    ctx.fillRect(randInt(0,W), randInt(0,H), randInt(10,40), randInt(6,15));
  }

  const laneW = W / EX.lanes;

  // Lane guides
  for (let i=1; i<EX.lanes; i++) {
    ctx.strokeStyle = 'rgba(200,150,60,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(i*laneW,0); ctx.lineTo(i*laneW,H); ctx.stroke();
  }

  // Hit zone
  for (let i=0; i<EX.lanes; i++) {
    const x = i*laneW;
    const g = ctx.createLinearGradient(x,hitZoneY,x,hitZoneY+hitZoneH);
    g.addColorStop(0,'rgba(200,150,60,0.25)'); g.addColorStop(1,'rgba(200,150,60,0.04)');
    ctx.fillStyle=g; ctx.fillRect(x+2,hitZoneY,laneW-4,hitZoneH);
    ctx.strokeStyle='rgba(200,150,60,0.5)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x+8,hitZoneY); ctx.lineTo(x+laneW-8,hitZoneY); ctx.stroke();
    // Draw excavation button using rhythm PNG
    const btnImg = new Image();
    btnImg.src = 'assets/开凿过程（音游）/音游按钮.png';
    const btnW = Math.min(laneW-12, 40), btnH = Math.min(hitZoneH-8, 36);
    const btnX = x + (laneW-btnW)/2, btnY = hitZoneY + (hitZoneH-btnH)/2;
    // Fallback tool icon while PNG loads
    ctx.fillStyle='rgba(200,150,60,0.35)'; ctx.font='20px serif'; ctx.textAlign='center';
    const tools = ['🔨','⛏️','🪚','🪨','🔩'];
    ctx.fillText(tools[i%tools.length], x+laneW/2, hitZoneY+hitZoneH/2+5);
    // Draw PNG over (will appear once loaded)
    if (btnImg.complete) {
      ctx.drawImage(btnImg, btnX, btnY, btnW, btnH);
    } else {
      btnImg.onload = () => { /* will appear on next frame */ };
    }
  }

  // Notes
  for (let n of notes) {
    if (n.hit) { if (n.flash>0) { drawHitFx(ctx,n,laneW); n.flash--; } continue; }
    n.y += EX.noteSpeed;

    const cx = n.lane*laneW + laneW/2, r = 18;
    const grd = ctx.createRadialGradient(cx,n.y,0,cx,n.y,r*1.6);
    grd.addColorStop(0,TOOL_COLORS[n.lane]); grd.addColorStop(1,'transparent');
    ctx.fillStyle=grd;
    ctx.beginPath(); ctx.arc(cx,n.y,r*1.6,0,Math.PI*2); ctx.fill();

    // Stone block
    ctx.fillStyle=TOOL_COLORS[n.lane]; ctx.beginPath();
    ctx.arc(cx,n.y,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5; ctx.stroke();
    // Crack line
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx-5,n.y-3); ctx.lineTo(cx+3,n.y+5); ctx.stroke();

    // Miss
    if (n.y > hitZoneY+hitZoneH+25 && !n.hit) {
      n.hit=true; n.flash=0; EX.total++; EX.forceValues.push(0.05);
      updateForceMeter(0.15); toast('力度太小！','bad',800);
      checkExcDone();
    }
  }

  if (!EX.done) EX.animId = requestAnimationFrame(exLoop);
}

function drawHitFx(ctx, n, laneW) {
  const cx = n.lane*laneW + laneW/2;
  const a = n.flash/15;
  ctx.fillStyle = n.perfect ? `rgba(255,220,50,${a})` : `rgba(200,150,60,${a})`;
  ctx.beginPath(); ctx.arc(cx, EX.hitZoneY+25, 32*(1-a), 0, Math.PI*2); ctx.fill();
}

function hitLane(lane) {
  if (EX.done) return;
  const laneW = EX.W / EX.lanes;
  for (let n of EX.notes) {
    if (n.hit || n.lane!==lane) continue;
    if (n.y >= EX.hitZoneY-16 && n.y <= EX.hitZoneY+EX.hitZoneH+8) {
      const c = EX.hitZoneY+4, diff = Math.abs(n.y-c);
      const perfect = diff < 20;
      n.hit=true; n.flash=15; n.perfect=perfect; EX.total++;
      if (perfect) {
        EX.perfect++; EX.forceValues.push(0.5);
        updateForceMeter(0.5); showExFb('🔥 完美！','#FFD700');
        spawnSparks(n.lane*laneW+laneW/2, EX.hitZoneY+25, 6);
      } else {
        const force = n.y<c ? 0.78 : 0.28;
        EX.forceValues.push(force); updateForceMeter(force);
        showExFb(n.y<c?'力道过猛！':'轻了些！','var(--gold)');
      }
      EX.score++;
      document.getElementById('ex-score').textContent = `${EX.score}/${EX.maxNotes}`;
      checkExcDone(); return;
    }
  }
  EX.forceValues.push(0.9); updateForceMeter(0.9); showExFb('别那么用力！','#FF6B35');
}

function showExFb(msg, color) {
  const el = document.getElementById('ex-feedback');
  el.textContent=msg; el.style.color=color; el.style.opacity='1';
  clearTimeout(el._t); el._t = setTimeout(()=>{el.style.opacity='0';},600);
}

function updateForceMeter(val) {
  const bar = document.getElementById('force-bar');
  bar.style.height = Math.round((1-val)*100)+'%';
  bar.style.background = val>0.65?'#FF3B30':val<0.35?'#007AFF':'linear-gradient(to top,#34C759,var(--gold))';
}

function checkExcDone() {
  if (EX.total < EX.maxNotes || EX.done) return;
  EX.done = true;
  cancelAnimationFrame(EX.animId); clearInterval(EX.spawnInterval);
  EX.canvas.removeEventListener('touchstart',handleExTouch);
  EX.canvas.removeEventListener('mousedown',handleExMouse);
  const avg = EX.forceValues.reduce((a,b)=>a+b,0)/EX.forceValues.length;
  G.forceAvg = avg;
  const base=180, bonus=Math.round((1-Math.abs(avg-0.5)*2)*60);
  G.countdown = base+bonus+randInt(0,30);
  document.getElementById('force-wrap').style.display='none';
  document.getElementById('ex-hud').style.display='none';
  EX.canvas.classList.add('hidden');

  subtitle.play([
    {speaker:'*',text:'很好，数据显示只要再——小心！后退几步！'},
    {speaker:'-',text:'……你还好吗？'},
    {speaker:'*',text:'什么？哦哦……好，很好，非常好。幸好我们来得及。'},
    {speaker:'*',text:'我把跟这里有关的一些提示传给你了。抓住它们！'},
  ], () => { SM.go('clue-catch'); initClueCatch(); });
}

function handleExTouch(e) {
  e.preventDefault();
  Array.from(e.changedTouches).forEach(t => {
    hitLane(clamp(Math.floor(t.clientX/(EX.W/EX.lanes)),0,EX.lanes-1));
  });
}
function handleExMouse(e) { hitLane(clamp(Math.floor(e.clientX/(EX.W/EX.lanes)),0,EX.lanes-1)); }

// ─── Clue Catch ───────────────────────────────────────
const CC = { active:false, blueCount:0, items:[], timeLeft:18, timerId:null, required:2 };
const CLUE_REAL = ['壁画·飞天纹','经文·甲卷','坐佛头像','莲花纹样','供养人像'];
const CLUE_FAKE = ['ERR_DATA','乱码×4F2','NULL_REF','已损坏','无法读取'];

function initClueCatch() {
  CC.active=true; CC.blueCount=0; CC.items=[]; CC.timeLeft=18;
  document.getElementById('cc-score').textContent=`线索 0/${CC.required}`;
  document.getElementById('cc-timer').textContent='18s';

  // Add center selection UI as overlay
  let selUI = document.getElementById('clue-select-ui');
  if (!selUI) {
    selUI = document.createElement('div');
    selUI.id = 'clue-select-ui';
    selUI.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:65;width:160px;height:60px;background:url(\'assets/找线索/画面中间选择ui.png\') center/contain no-repeat;pointer-events:none;opacity:.5';
    document.getElementById('scene-clue-catch').appendChild(selUI);
  }

  for (let i=0; i<5; i++) setTimeout(spawnClue, i*300);
  CC._spawnId = setInterval(() => { if(CC.active) spawnClue(); }, 1400);
  CC.timerId = setInterval(() => {
    CC.timeLeft--; document.getElementById('cc-timer').textContent=CC.timeLeft+'s';
    if (CC.timeLeft<=0) endClueCatch();
  }, 1000);
}

function spawnClue() {
  if (!CC.active) return;
  const isReal = Math.random()>0.4;
  // Each unique clue type gets its own PNG
  const realImgs = [
    'assets/找线索/壁画线索/文字框.png',
    'assets/找线索/经书线索/文字框.png',
    'assets/找线索/大佛像线索/文字框.png',
    'assets/找线索/小佛像线索/文字框.png'
  ];
  const fakeImgs = [
    'assets/找线索/干扰线索/干扰线索1/文字框.png',
    'assets/找线索/干扰线索/干扰线索2/文字框.png',
    'assets/找线索/干扰线索/干扰线索3/文字框.png',
    'assets/找线索/干扰线索/干扰线索4/文字框.png'
  ];
  const idx = randInt(0,3);
  const imgSrc = isReal ? realImgs[idx] : fakeImgs[idx];
  const el = document.createElement('div');
  el.className = `clue-item ${isReal?'clue-real':'clue-fake'}`;
  el.style.backgroundImage = `url('${imgSrc}')`;
  el.style.backgroundSize = '100% 100%';
  el.style.width = '130px'; el.style.height = '50px';
  el.dataset.real = isReal?'1':'0';
  const y = randInt(10,80);
  el.style.top = y+'vh';
  el.style.left = Math.random()>0.5?`${window.innerWidth+10}px`:'-120px';
  document.getElementById('scene-clue-catch').appendChild(el);
  CC.items.push(el);

  const targetX = el.style.left.indexOf('-')===0 ? window.innerWidth*Math.random() : -120;
  const dur = randInt(2500,4500);
  el.style.transition = `left ${dur}ms linear`;
  setTimeout(() => { el.style.left = targetX+'px'; }, 50);
  setTimeout(() => { el.remove(); CC.items = CC.items.filter(i=>i!==el); }, dur+300);

  const tap = () => { catchClue(el, isReal); };
  el.addEventListener('touchstart', e => { e.preventDefault(); tap(); }, {passive:false});
  el.addEventListener('click', tap);
}

function catchClue(el, isReal) {
  if (!CC.active || el.dataset.caught) return;
  el.dataset.caught='1';
  el.style.transform='scale(1.3)'; el.style.opacity='0.4';
  setTimeout(()=>el.remove(),250);
  if (isReal) {
    CC.blueCount++;
    G.cluesFound = G.cluesFound || [];
    G.cluesFound.push(el.textContent.replace('◆ ',''));
    document.getElementById('cc-score').textContent=`线索 ${CC.blueCount}/${CC.required}`;
    toast('✓ '+el.textContent.replace('◆ ',''),'good',1000);
    if (CC.blueCount>=CC.required) endClueCatch(true);
  } else { toast('乱码！丢弃','bad',800); }
}

function endClueCatch(success) {
  if (!CC.active) return;
  CC.active=false; clearInterval(CC.timerId); clearInterval(CC._spawnId);
  CC.items.forEach(el=>el.remove()); CC.items=[];
  setTimeout(() => { SM.go('countdown-reveal'); showCountdown(); }, 500);
}

function showCountdown() {
  // Skip countdown timer, go directly to exploration
  SM.go('cave-explore'); initCaveExplore();
}

// ─── Cave Explore ─────────────────────────────────────
const CE = {
  alpha:Math.random()*360,
  artifactAngles:{'壁画':18,'经书':85,'大佛像':158,'小佛像':268},
  foundArtifacts:new Set(), activeArtifact:null,
  tolerance:26, nearTolerance:52, minigameOpen:false, velocity:0
};

function initCaveExplore() {
  G.artifactsFound=[]; G.artworkDone=0;
  CE.foundArtifacts=new Set(); CE.activeArtifact=null; CE.minigameOpen=false; CE.velocity=0;

  // NO timer — free exploration
  G.timerEl=document.getElementById('timer-badge');
  if(G.timerEl) G.timerEl.style.display='none';

  Motion.on(handleCaveMotion);
  updateCompass(); updateArtifactHint(); updateProxGlow();

  let lastX=null, lastTime=null;
  const ca = document.getElementById('cave-area');
  ca.addEventListener('touchmove', e => {
    e.preventDefault();
    const t=e.touches[0];
    const dx=t.clientX-(lastX||t.clientX);
    const dt=Date.now()-(lastTime||Date.now());
    if(dt>0&&Math.abs(dx)>1) CE.velocity=(dx/dt)*12;
    CE.alpha=(CE.alpha+dx*0.9+360)%360; CE.snapTarget=null;
    lastX=t.clientX; lastTime=Date.now();
    updateCompass(); updateArtifactHint(); updateProxGlow();
  },{passive:false});
  ca.addEventListener('touchend',()=>{lastX=null;lastTime=null;});

  ca.addEventListener('mousemove', e => {
    if(!e.buttons) return;
    CE.alpha=(CE.alpha+e.movementX*0.9+360)%360; CE.snapTarget=null;
    updateCompass(); updateArtifactHint(); updateProxGlow();
  });

  // Inertia / snap loop
  function physicsLoop() {
    if (CE.minigameOpen || !G.timer||!G.timer.running) return;
    if (Math.abs(CE.velocity)>0.01) {
      CE.alpha=(CE.alpha+CE.velocity+360)%360; CE.velocity*=0.92;
      updateCompass(); updateArtifactHint(); updateProxGlow();
    }
    if (Math.abs(CE.velocity)<0.05 && !lastX) {
      let nearest=null, nd=Infinity;
      for (const [n,a] of Object.entries(CE.artifactAngles)) {
        if(CE.foundArtifacts.has(n)) continue;
        const d=angleDiff(CE.alpha,a); if(d<nd){nd=d;nearest=a;}
      }
      if(nearest&&nd<42&&nd>2){CE.alpha=(CE.alpha+angleSign(CE.alpha,nearest)*0.35+360)%360;updateCompass();updateArtifactHint();updateProxGlow();}
    }
    requestAnimationFrame(physicsLoop);
  }
  physicsLoop();

  // Tap to interact
  ca.addEventListener('touchend', e => { e.preventDefault(); if(CE.activeArtifact&&!CE.minigameOpen) openArtMinigame(CE.activeArtifact); });
  let touchFired=false;
  ca.addEventListener('touchstart',()=>{touchFired=true;});
  ca.addEventListener('click',()=>{if(touchFired){touchFired=false;return;}if(CE.activeArtifact&&!CE.minigameOpen) openArtMinigame(CE.activeArtifact);});

  // Marker tap to jump
  document.querySelectorAll('.art-marker').forEach(m => {
    const name=m.dataset.name, ang=CE.artifactAngles[name];
    if(!ang) return;
    const jump = e => { e.stopPropagation(); e.preventDefault(); if(CE.foundArtifacts.has(name))return;
      CE.alpha=ang;CE.velocity=0;updateCompass();updateArtifactHint();updateProxGlow();
      if(CE.activeArtifact===name&&!CE.minigameOpen) setTimeout(()=>openArtMinigame(name),350);
    };
    m.addEventListener('click',jump); m.addEventListener('touchend',jump);
  });
}

function handleCaveMotion(type,m) { if(type!=='orient')return; CE.alpha=((m.alpha||0)+360)%360;CE.velocity=0;updateCompass();updateArtifactHint();updateProxGlow(); }
function angleDiff(a,b){let d=Math.abs(a-b)%360;return d>180?360-d:d;}
function angleSign(a,b){const d=((b-a)%360+360)%360;return d>180?-1:1;}

function updateCompass() {
  const bar = document.getElementById('compass-bar');
  if(!bar) return;
  document.getElementById('compass-dot').style.left=((CE.alpha/360)*100)+'%';
  let found=null;
  for(const[n,a] of Object.entries(CE.artifactAngles)){
    if(CE.foundArtifacts.has(n)) continue;
    if(angleDiff(CE.alpha,a)<CE.tolerance){found=n;break;}
  }
  CE.activeArtifact=found;
  const vf=document.getElementById('viewfinder');
  if(found){vf.classList.add('lit');vf.classList.remove('near');}
  else{ vf.classList.remove('lit');let nf=false;
    for(const[n,a] of Object.entries(CE.artifactAngles)){if(CE.foundArtifacts.has(n))continue;if(angleDiff(CE.alpha,a)<CE.nearTolerance){nf=true;break;}}
    if(nf)vf.classList.add('near');else vf.classList.remove('near');}

  document.querySelectorAll('.art-marker').forEach(m=>{
    const n=m.dataset.name,a=CE.artifactAngles[n];
    if(!a)return;
    if(CE.foundArtifacts.has(n)){m.classList.add('found');m.classList.remove('nearby');}
    else{const d=angleDiff(CE.alpha,a);if(d<CE.nearTolerance)m.classList.add('nearby');else m.classList.remove('nearby');}
  });
}

function updateProxGlow() {
  let md=Infinity;
  for(const[n,a] of Object.entries(CE.artifactAngles)){if(CE.foundArtifacts.has(n))continue;const d=angleDiff(CE.alpha,a);if(d<md)md=d;}
  const vf=document.getElementById('viewfinder');
  if(md===Infinity)return;
  const int=Math.max(0,1-md/CE.nearTolerance);
  vf.style.boxShadow=`0 0 ${6+int*20}px rgba(200,150,60,${0.08+int*0.4})`;
  vf.style.borderColor=int>0.8?`var(--gold)`:`rgba(200,150,60,${0.25+int*0.45})`;
}

function updateArtifactHint() {
  const el=document.getElementById('artifact-hint');
  if(!el)return;
  if(CE.activeArtifact&&!CE.foundArtifacts.has(CE.activeArtifact)){el.textContent=`发现：${CE.activeArtifact} · 点击互动`;el.classList.add('visible');return;}
  let nearest=null,nd=Infinity;
  for(const[n,a] of Object.entries(CE.artifactAngles)){if(CE.foundArtifacts.has(n))continue;const d=angleDiff(CE.alpha,a);if(d<nd){nd=d;nearest=n;}}
  if(nearest&&nd<CE.nearTolerance){const s=angleSign(CE.alpha,CE.artifactAngles[nearest]);el.textContent=`${s>0?'→':'←'} 靠近中……（${nearest}）`;el.classList.add('visible');}
  else if(nearest){el.textContent='转动手机或拖动屏幕 · 寻找文物';el.classList.remove('visible');}
  else{el.textContent='';el.classList.remove('visible');}
}

function openArtMinigame(name) {
  if(CE.minigameOpen||CE.foundArtifacts.has(name))return;
  CE.minigameOpen=true; G.currentArtifact=name;
  if(name==='壁画') openMuralPuzzle();
  else if(name==='经书') openScriptureSort();
  else if(name==='大佛像') openBuddhaAssembly();
  else if(name==='小佛像') openCandleGame();
}

function finishArtifact(name) {
  CE.foundArtifacts.add(name); G.artifactsFound.push(name);
  CE.minigameOpen=false;
  document.getElementById('minigame-wrap').style.display='none';
  G.artworkDone++;
  updateCompass(); updateArtifactHint(); updateProxGlow();
  toast(`✓ ${name} 抢救成功！`,'good',1800);
  if (G.artworkDone >= G.allArtifacts.length) endCaveExplore();
}

function endCaveExplore() {
  Motion.off(handleCaveMotion);
  if(G.timerEl) G.timerEl.style.display='none';
  const allDone = G.artworkDone >= G.allArtifacts.length;
  SM.go('ending');
  document.getElementById('scene-ending').innerHTML =
    `<div class="ending-screen">
      ${allDone
        ? `<div class="ending-icon">🏛️</div><div class="ending-title" style="color:var(--gold-light)">全部抢救成功</div><div class="ending-desc">${G.artifactsFound.join('、')}<br>已安全带出洞窟。<br>程序员已将所有扫描数据整理归档。</div>`
        : `<div class="ending-icon">💨</div><div class="ending-title" style="color:#888">洞窟已坍塌</div><div class="ending-desc">${G.artifactsFound.length>0?'抢救出了'+G.artifactsFound.join('、')+'。':'没能找到任何文物。'}</div>`
      }
      <div class="ending-quote">"在失忆的时代，选择记住什么，是一种反抗。"</div>
      <button class="btn btn-arch" onclick="showResults()">查看报告</button>
    </div>`;
  if (allDone) {
    setTimeout(() => {
      const nb = document.createElement('div');
      nb.style.cssText='margin-top:8px;font-size:11px;color:var(--gold-light);opacity:.7;animation:blink 1.2s infinite;cursor:pointer';
      nb.textContent='📓 发现神秘线索 → 点击查看';
      nb.onclick=()=>openNotebook();
      document.getElementById('scene-ending').querySelector('.ending-screen').appendChild(nb);
    },1500);
  }
}

function showResults() {
  SM.go('results');
  const el=document.getElementById('scene-results');
  const kb=G.artifactsFound.length*42+randInt(5,18);
  el.innerHTML = `<div class="results-screen" style="height:100%">
    <div class="results-title" style="color:var(--gold-light)">📜 数字开窟功德记</div>
    <div class="results-item"><span class="results-label">身份</span><span class="results-value" style="color:var(--gold-light)">考古学家</span></div>
    <div class="results-item"><span class="results-label">抢救文物</span><span class="results-value">${G.artifactsFound.length}/${G.allArtifacts.length}</span></div>
    <div class="results-item"><span class="results-label">获取线索</span><span class="results-value">${(G.cluesFound||[]).length}条</span></div>
    <div class="results-item"><span class="results-label">保存数据</span><span class="results-value" style="color:#34C759">${kb}KB</span></div>
    <div class="results-item"><span class="results-label">开凿力度</span><span class="results-value">${G.forceAvg>0.65?'偏重':G.forceAvg<0.35?'偏轻':'✓ 适中'}</span></div>
    <div style="flex-basis:100%"><div class="results-label" style="margin-bottom:6px">抢救文物：</div><div class="results-artifacts">${G.allArtifacts.map(a=>{ const found=G.artifactsFound.includes(a); return '<div class="artifact-badge"'+(found?'':' style="opacity:.3"')+'>'+a+'</div>'; }).join('')}</div></div>
    <div style="flex-basis:100%;text-align:center;margin-top:12px">
      <button class="btn btn-neutral" onclick="window.location.href='index.html'" style="padding:8px 20px">返回选择</button>
      ${G.artworkDone >= G.allArtifacts.length ? `<button class="btn btn-arch" onclick="openNotebook()" style="margin-left:10px;padding:8px 20px">📓 神秘笔记</button>` : ''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// MINI-GAME 1: MURAL PUZZLE (3 steps)
// ═══════════════════════════════════════════════════════
function openMuralPuzzle() {
  // 4-piece drag puzzle — single step
  const pieceImgs = [
    'assets/壁画碎片/壁画移动页面/普通状态碎片.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片2.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片3.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片 4.png'
  ];
  const wrap = document.getElementById('minigame-wrap');
  let placed = 0;
  wrap.innerHTML = `<div style="width:160px;height:24px;background:url('assets/壁画碎片/壁画碎片页面/文字.png') center/contain no-repeat;opacity:.7;margin-bottom:2px"></div>
    <div class="minigame-subtitle">手指拖拽碎片到正确位置</div>
    <div class="jigsaw-area">
      <div class="jigsaw-pieces" id="jp-pieces"></div>
      <div id="jp-slots" style="display:flex;flex-wrap:wrap;gap:4px;width:120px"></div>
    </div>
    <div id="jp-progress" style="margin-top:8px;font-size:11px;opacity:.5">已拼合 0/4</div>
    <button class="btn btn-skip" style="margin-top:10px">跳过</button>`;
  wrap.style.display = 'flex';

  // 4 slots with ghost images
  pieceImgs.forEach((src, i) => {
    const s = document.createElement('div');
    s.className = 'puzzle-slot';
    s.dataset.expects = i;
    s.style.backgroundImage = `url('${src}')`;
    s.style.backgroundSize = 'contain';
    s.style.backgroundRepeat = 'no-repeat';
    s.style.backgroundPosition = 'center';
    s.style.opacity = '0.25';
    document.getElementById('jp-slots').appendChild(s);
  });

  // 4 shuffled draggable pieces
  [0,1,2,3].sort(()=>Math.random()-0.5).forEach(i => {
    const el = document.createElement('div');
    el.className = 'puzzle-piece';
    el.dataset.val = i;
    el.style.backgroundImage = `url('${pieceImgs[i]}')`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    el.style.width = '55px'; el.style.height = '55px';
    document.getElementById('jp-pieces').appendChild(el);
    makeDraggable(el, i, () => {
      placed++;
      document.getElementById('jp-progress').textContent = `已拼合 ${placed}/4`;
      if (placed >= 4) showMuralSuccess();
    });
  });

  document.getElementById('jp-skip').onclick = () => {
    toast('壁画碎片丢失……', 'bad', 1500);
    finishArtifact('壁画');
  };
}

function showMuralSuccess() {
  const wrap = document.getElementById('minigame-wrap');
  wrap.innerHTML = `<div style="text-align:center">
    <div style="width:160px;height:24px;background:url('assets/壁画碎片/拼合成功页面/文字.png') center/contain no-repeat;opacity:.7;margin:0 auto 6px"></div>
    <div style="width:120px;height:80px;background:var(--mural-complete) center/contain no-repeat;margin:10px auto"></div>
    <div style="font-size:11px;opacity:.5">壁画已安全记录到数据库中</div>
    <button class="btn btn-arch" style="margin-top:14px" id="mural-done">确认</button></div>`;
  wrap.style.display = 'flex';
  document.getElementById('mural-done').onclick = () => finishArtifact('壁画');
}

// ─── Draggable helper ─────────────────────────────────
function makeDraggable(el, val, onPlace) {
  let clone=null;
  function start(x,y){
    el.classList.add('dragging');
    clone=el.cloneNode(true);clone.style.position='fixed';clone.style.zIndex=200;
    clone.style.width=el.offsetWidth+'px';clone.style.height=el.offsetHeight+'px';
    clone.style.left=(x-el.offsetWidth/2)+'px';clone.style.top=(y-el.offsetHeight/2)+'px';
    clone.style.pointerEvents='none';clone.style.opacity='0.8';
    document.body.appendChild(clone);
  }
  function move(x,y){if(!clone)return;clone.style.left=(x-el.offsetWidth/2)+'px';clone.style.top=(y-el.offsetHeight/2)+'px';}
  function end(x,y){
    if(!clone)return;clone.remove();clone=null;el.classList.remove('dragging');
    const slots=document.querySelectorAll('.puzzle-slot:not(.filled)');
    slots.forEach(slot=>{const r=slot.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){if(slot.dataset.expects===val){slot.textContent=val;slot.classList.add('filled');el.classList.add('placed');el.style.display='none';onPlace();}else{toast('位置不对','bad',500);}}});
  }
  el.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];start(t.clientX,t.clientY);},{passive:false});
  el.addEventListener('touchmove',e=>{e.preventDefault();const t=e.touches[0];move(t.clientX,t.clientY);},{passive:false});
  el.addEventListener('touchend',e=>{const t=e.changedTouches[0];end(t.clientX,t.clientY);});
  el.addEventListener('mousedown',e=>{start(e.clientX,e.clientY);});
  window.addEventListener('mousemove',e=>{if(clone)move(e.clientX,e.clientY);});
  window.addEventListener('mouseup',e=>{if(clone)end(e.clientX,e.clientY);});
}

// ═══════════════════════════════════════════════════════
// MINI-GAME 2: SCRIPTURE SORT
// ═══════════════════════════════════════════════════════
function openScriptureSort() {
  const scImages = [
    ['assets/经书/左1未选中.png','assets/经书/左1选中.png','assets/经书/左1固定.png'],
    ['assets/经书/左2未选中.PNG','assets/经书/左2选中.png','assets/经书/左2固定.png'],
    ['assets/经书/左3未选中.png','assets/经书/左3选中.png','assets/经书/左3固定.png'],
    ['assets/经书/左4未选中.png','assets/经书/左4选中.png','assets/经书/左4固定.png'],
    ['assets/经书/左5未选中.png','assets/经书/左5选中.png','assets/经书/左5固定.png'],
    ['assets/经书/左6未选中.png','assets/经书/左6选中.png',null]
  ];
  let items=scImages.map((imgs,i)=>({imgs,order:i}));
  items=[...items].sort(()=>Math.random()-0.5);
  let selected=null;
  const wrap=document.getElementById('minigame-wrap');
  function render(){
    const correct = items.every((item,i)=>item.order===i);
    wrap.innerHTML=`<div class="minigame-title">经书 · 理清顺序</div><div class="minigame-subtitle">点击两条经卷交换位置，按尺寸从小到大排列</div>
      <div class="sort-items" id="sr-row"></div>
      <div style="font-size:10px;opacity:.45;margin-top:4px">正确顺序：小 → 大</div>
      <button class="btn btn-arch" id="sr-confirm" style="margin-top:10px">确认顺序</button>
      <button class="btn btn-skip" id="sr-skip" style="margin-top:4px">跳过</button>`;
    wrap.style.display='flex';
    const row=document.getElementById('sr-row');
    items.forEach((item,i)=>{
      const el=document.createElement('div');
      el.className=`sort-item${selected===i?' selected':''}`;
      el.style.width='46px';
      const img=document.createElement('img');
      img.src=selected===i ? item.imgs[1] : item.imgs[0];
      img.style.width='100%';img.style.height='auto';img.style.display='block';
      el.appendChild(img);
      el.addEventListener('click',()=>{
        if(correct)return;
        if(selected===null)selected=i;
        else if(selected===i)selected=null;
        else{[items[selected],items[i]]=[items[i],items[selected]];selected=null;}
        render();
      });
      row.appendChild(el);
    });
    if(correct){
      // Show all as fixed
      setTimeout(()=>{
        document.querySelectorAll('#sr-row img').forEach((img,i)=>{
          const item=items[i];
          img.src=item.imgs[2]||item.imgs[1];
        });
      },100);
    }
    document.getElementById('sr-confirm').onclick=()=>{
      if(correct){toast('顺序正确！','good',1500);finishArtifact('经书');}
      else toast('顺序不对，再试试！','bad',1000);
    };
    document.getElementById('sr-skip').onclick=()=>{toast('经书顺序未能还原……','bad',1500);finishArtifact('经书');};
  }
  render();
}

// ═══════════════════════════════════════════════════════
// MINI-GAME 3: BIG BUDDHA ASSEMBLY + SHAKE + CLEAN
// ═══════════════════════════════════════════════════════
function openBuddhaAssembly() {
  const wrap=document.getElementById('minigame-wrap');
  wrap.innerHTML=`<div style="width:160px;height:24px;background:url('assets/神像碎片/界面1/文字.png') center/contain no-repeat;opacity:.7;margin-bottom:2px"></div><div class="minigame-subtitle">将三块神像碎片拖入正确位置</div>
    <div style="width:120px;height:30px;background:url('assets/神像碎片/拖动提示界面2/ui提示.png') center/contain no-repeat;opacity:.6;margin:2px 0"></div>
    <div class="buddha-area"><div id="buddha-pieces" style="display:flex;gap:12px"></div><div style="display:flex;gap:8px">
      <div class="buddha-slot" data-expects="left"></div><div class="buddha-slot" data-expects="center"></div><div class="buddha-slot" data-expects="right"></div>
    </div></div>
    <button class="btn btn-skip" style="margin-top:10px">跳过</button>`;
  wrap.style.display='flex';

  const pieces_=['left','center','right'];
  const buddhaImages={'left':'assets/神像碎片/界面1/左边神像.png','center':'assets/神像碎片/界面1/中间神像.png','right':'assets/神像碎片/界面1/右边神像.png'};
  let placed=0;
  [...pieces_].sort(()=>Math.random()-0.5).forEach(p=>{
    const el=document.createElement('div');el.className='buddha-piece';
    el.style.backgroundImage=`url('${buddhaImages[p]}')`;
    el.style.backgroundSize='contain'; el.style.backgroundRepeat='no-repeat'; el.style.backgroundPosition='center';
    el.dataset.val=p;
    document.getElementById('buddha-pieces').appendChild(el);
    makeBuddhaDrag(el,p,()=>{placed++;if(placed>=3){toast('佛像拼合！现在摇晃手机清除灰尘','good',1800);setTimeout(buddhaShake,1200);}});
  });
  wrap.querySelector('.btn-skip').onclick=()=>{toast('佛像碎片散落了……','bad',1500);finishArtifact('大佛像');};
}

function makeBuddhaDrag(el,val,cb){
  let clone=null;
  function s(x,y){el.classList.add('dragging');clone=el.cloneNode(true);clone.style.cssText=`position:fixed;z-index:200;width:${el.offsetWidth}px;height:${el.offsetHeight}px;left:${x-el.offsetWidth/2}px;top:${y-el.offsetHeight/2}px;pointer-events:none;opacity:.8`;document.body.appendChild(clone);}
  function m(x,y){if(!clone)return;clone.style.left=(x-el.offsetWidth/2)+'px';clone.style.top=(y-el.offsetHeight/2)+'px';}
  function e(x,y){if(!clone)return;clone.remove();clone=null;el.classList.remove('dragging');
    document.querySelectorAll('.buddha-slot:not(.filled)').forEach(sl=>{const r=sl.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){if(sl.dataset.expects===val){sl.style.backgroundImage=el.style.backgroundImage;sl.style.backgroundSize='contain';sl.style.backgroundRepeat='no-repeat';sl.style.backgroundPosition='center';sl.classList.add('filled');el.classList.add('placed');el.style.display='none';cb();}else toast('位置不对','bad',500);}});}
  el.addEventListener('touchstart',ev=>{ev.preventDefault();const t=ev.touches[0];s(t.clientX,t.clientY);},{passive:false});
  el.addEventListener('touchmove',ev=>{ev.preventDefault();const t=ev.touches[0];m(t.clientX,t.clientY);},{passive:false});
  el.addEventListener('touchend',ev=>{const t=ev.changedTouches[0];e(t.clientX,t.clientY);});
  el.addEventListener('mousedown',ev=>{s(ev.clientX,ev.clientY);});
  window.addEventListener('mousemove',ev=>{if(clone)m(ev.clientX,ev.clientY);});
  window.addEventListener('mouseup',ev=>{if(clone)e(ev.clientX,ev.clientY);});
}

function buddhaShake() {
  const wrap=document.getElementById('minigame-wrap');
  wrap.innerHTML=`<div style="width:160px;height:24px;background:url('assets/神像碎片/摇晃界面4/文字.png') center/contain no-repeat;opacity:.7;margin-bottom:2px"></div><div class="minigame-subtitle">用力摇晃手机清除表面灰尘</div>
    <div style="width:80px;height:30px;background:url('assets/神像碎片/摇晃界面4/ui.png') center/contain no-repeat;opacity:.6;margin:2px 0"></div>
    <div style="width:100px;height:120px;background:var(--buddha-assembled) center/contain no-repeat;animation:pulse 0.6s ease-in-out infinite;margin:0 auto"></div>
    <div style="font-size:11px;opacity:.5;margin-top:6px" id="shake-progress">摇晃力度 0%</div>
    <button class="btn btn-skip" style="margin-top:12px">跳过</button>`;
  wrap.style.display='flex';
  wrap.querySelector('.btn-skip').onclick=()=>{toast('佛像仍埋于尘中……','bad',1500);finishArtifact('大佛像');};

  let shakeAcc=0;
  const shakeHandler = (type,m) => {
    if(type!=='motion')return;
    const force=Math.abs(m.ax)+Math.abs(m.ay)+Math.abs(m.az);
    shakeAcc+=force*0.5;
    const pct=Math.min(100,Math.round(shakeAcc));
    document.getElementById('shake-progress').textContent=`摇晃力度 ${pct}%`;
    if(pct>=100){Motion.off(shakeHandler);buddhaClean();}
  };
  Motion.on(shakeHandler);
  // Fallback: tap to simulate
  wrap.addEventListener('click',()=>{shakeAcc+=15;const pct=Math.min(100,Math.round(shakeAcc));document.getElementById('shake-progress').textContent=`摇晃力度 ${pct}%`;if(pct>=100){Motion.off(shakeHandler);buddhaClean();}});
}

function buddhaClean() {
  const wrap=document.getElementById('minigame-wrap');
  wrap.innerHTML=`<div style="width:160px;height:24px;background:url('assets/神像碎片/神像5/文字.png') center/contain no-repeat;opacity:.7;margin-bottom:4px"></div>
    <div style="width:100px;height:120px;background:var(--buddha-clean) center/contain no-repeat;margin:8px auto"></div><div style="font-size:11px;opacity:.5">佛像面貌已展露，数据已记录</div>
    <button class="btn btn-arch" style="margin-top:14px" id="buddha-done">确认</button>`;
  wrap.style.display='flex';
  document.getElementById('buddha-done').onclick=()=>finishArtifact('大佛像');
}

// ═══════════════════════════════════════════════════════
// MINI-GAME 4: SMALL BUDDHA CANDLE
// ═══════════════════════════════════════════════════════
function openCandleGame() {
  const wrap=document.getElementById('minigame-wrap');
  let stonesCleared=0;
  wrap.innerHTML=`<div class="minigame-title">小佛像 · 烛光探索</div><div class="minigame-subtitle">用手指拖动蜡烛照亮区域，点击石块清除</div>
    <div class="wam-count" id="wam-hits">石块 0/3</div>
    <div class="wam-area" id="wam-area" style="position:relative;overflow:hidden;background:var(--sm-buddha) center/contain no-repeat,rgba(0,0,0,.8);cursor:none">
      <div id="candle-glow" style="position:absolute;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,rgba(255,220,100,.5) 0%,rgba(255,180,40,.15) 40%,transparent 70%);pointer-events:none;transform:translate(-50%,-50%);z-index:5;display:none;box-shadow:0 0 30px rgba(255,200,60,.4)"></div>
      <img id="candle-img" src="assets/小佛像/蜡烛.png" style="position:absolute;width:24px;height:24px;pointer-events:none;z-index:6;transform:translate(-50%,-50%);display:none">
    </div>
    <button class="btn btn-skip" style="margin-top:8px">跳过</button>`;
  wrap.style.display='flex';

  const area=document.getElementById('wam-area');
  const glow=document.getElementById('candle-glow');
  const candleImg=document.getElementById('candle-img');

  // Add stone overlays
  const stones=[
    {img:'assets/小佛像/石块1.png',x:'10%',y:'18%',w:44,h:32},
    {img:'assets/小佛像/石块2.png',x:'52%',y:'30%',w:48,h:30},
    {img:'assets/小佛像/石块3.png',x:'30%',y:'52%',w:54,h:36}
  ];
  stones.forEach(st=>{
    const s=document.createElement('div');
    s.style.cssText=`position:absolute;left:${st.x};top:${st.y};width:${st.w}px;height:${st.h}px;background:url('${st.img}') center/contain no-repeat;cursor:pointer;transition:opacity .3s,filter .3s;z-index:3;filter:brightness(.3)`;
    s.addEventListener('click',function handler(){
      if(glow.style.display==='none') return; // candle not active
      s.style.opacity='0';s.style.pointerEvents='none';
      stonesCleared++;
      document.getElementById('wam-hits').textContent=`石块 ${stonesCleared}/3`;
      toast(['✓ 石块碎裂！','✓ 又清除一块！','✓ 佛像露出！'][stonesCleared-1]||'✓','good',800);
      spawnSparks(area.getBoundingClientRect().left+area.offsetWidth*parseFloat(st.x)/100,
                  area.getBoundingClientRect().top+area.offsetHeight*parseFloat(st.y)/100, 6);
      if(stonesCleared>=3)finishArtifact('小佛像');
    });
    s.addEventListener('touchstart',e=>{e.preventDefault();s.click();},{passive:false});
    area.appendChild(s);
  });

  // Candle follows finger
  function moveCandle(e){
    const r=area.getBoundingClientRect();
    let cx,cy;
    if(e.touches){cx=e.touches[0].clientX;cy=e.touches[0].clientY;}
    else{cx=e.clientX;cy=e.clientY;}
    const x=cx-r.left,y=cy-r.top;
    glow.style.display='block';glow.style.left=x+'px';glow.style.top=y+'px';
    candleImg.style.display='block';candleImg.style.left=x+'px';candleImg.style.top=(y-12)+'px';
    // Brighten nearby stones
    stones.forEach((st,i)=>{
      const sx=parseFloat(st.x)*r.width/100, sy=parseFloat(st.y)*r.height/100;
      const dist=Math.hypot(x-sx,y-sy);
      const stoneEl=area.children[i+2]; // skip glow and candle img
      if(stoneEl) stoneEl.style.filter=dist<50?`brightness(${1-dist/50})`:'brightness(.3)';
    });
  }

  area.addEventListener('touchmove',e=>{e.preventDefault();moveCandle(e);},{passive:false});
  area.addEventListener('touchstart',e=>{e.preventDefault();moveCandle(e);},{passive:false});
  area.addEventListener('mousemove',moveCandle);

  document.getElementById('wam-skip').onclick=()=>{toast('石块太坚固了……','bad',1500);finishArtifact('小佛像');};
}

// ═══════════════════════════════════════════════════════
// NOTEBOOK
// ═══════════════════════════════════════════════════════
function openNotebook() {
  const overlay=document.createElement('div');overlay.className='notebook-overlay';
  let input=['','','',''], activeDigit=0;
  function render(){
    overlay.innerHTML=`<div style="font-size:11px;opacity:.45;text-align:center">发现了一个神秘的笔记本</div>
      <div class="notebook-book"><div class="notebook-title">✦ 野外笔记 · 莫高窟 ✦</div>
        <div class="notebook-content">一个有点破破烂烂的笔记本，里面夹着很多照片和手绘的草稿。<span class="notebook-img">📔</span><span style="color:var(--gold-light);font-size:11px">— 需要四位密码才能打开 —</span></div></div>
      <div style="font-size:11px;color:var(--gold-light);margin-bottom:6px">输入密码</div>
      <div class="password-input-wrap">${input.map((v,i)=>`<div class="password-digit${activeDigit===i?' active':''}">${v||'·'}</div>`).join('')}</div>
      <div class="numpad">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>`<div class="numpad-key" style="${k===''?'visibility:hidden':''}" data-key="${k}">${k}</div>`).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-arch" id="nb-confirm" style="padding:6px 20px;font-size:12px">确认</button><button class="btn btn-neutral" id="nb-close" style="padding:6px 20px;font-size:12px">关闭</button></div>
      ${input.join('')==='1900'?'<div style="color:#34C759;font-size:11px;margin-top:4px">✓ 解锁成功！</div>':''}`;

    overlay.querySelectorAll('.numpad-key').forEach(key=>key.addEventListener('click',()=>{
      const k=key.dataset.key;if(k==='⌫'){if(activeDigit>0){activeDigit--;input[activeDigit]='';render();}}
      else if(k!==''&&activeDigit<4){input[activeDigit]=k;activeDigit++;render();
        if(activeDigit===4&&input.join('')==='1900')setTimeout(()=>showNotebookContents(overlay),400);}
    }));
    overlay.querySelector('#nb-confirm').onclick=()=>{if(input.join('')==='1900')showNotebookContents(overlay);else{toast('密码错误','bad');input=['','','',''];activeDigit=0;render();}};
    overlay.querySelector('#nb-close').onclick=()=>overlay.remove();
  }
  render();document.body.appendChild(overlay);
}

function showNotebookContents(overlay){
  overlay.innerHTML=`<div class="notebook-book" style="max-width:280px"><div class="notebook-title">✦ 野外笔记 · 1900年 ✦</div>
    <div class="notebook-content"><span class="notebook-img">📸</span>笔记本被打开、翻阅。里面满是照片和手绘草稿——前来考古的前辈留下的文物图鉴，记载着洞窟最初的样貌。<br><br>
      <span style="color:var(--gold-light)">*等一下。有点不对劲……</span><br><span style="opacity:.55">— 程序员</span></div></div>
    <div style="font-size:11px;color:var(--gold-light);text-align:center;line-height:1.6;padding:0 16px">程序员发现了什么？<br><span style="opacity:.4;font-size:10px">（调查尚未结束……前往程序员路线继续探索）</span></div>
    <button class="btn btn-prog" onclick="window.location.href='programmer.html'" style="margin-top:6px">🔬 切换至程序员视角</button>
    <button class="btn btn-neutral" onclick="this.closest('.notebook-overlay').remove()" style="margin-top:4px;font-size:11px;padding:6px 16px">关闭</button>`;
}
