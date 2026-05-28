/* 敦煌复苏计划 — title.js */
(function(){
  const bar = document.getElementById('loading-bar');
  const w = document.getElementById('loading-walker');
  const tip = document.getElementById('loading-tip');
  const tips = ['正在启动数字敦煌系统……','正在校准AI识别引擎……','正在连接莫高窟数据库……','正在加载文物图鉴……','系统就绪，欢迎进入。'];
  let p = 0;
  function tick() {
    p += randInt(3, 8); if (p > 100) p = 100;
    bar.style.width = p + '%';
    const pw = bar.parentElement.offsetWidth;
    w.style.left = (p / 100) * pw + 'px';
    tip.textContent = tips[Math.min(Math.floor(p / 22), tips.length - 1)];
    if (p < 100) { setTimeout(tick, randInt(180, 450)); }
    else { setTimeout(() => { SM.go('scene-title'); startParticles(); }, 400); }
  }
  Preloader.load(PreloadList);
  setTimeout(tick, 350);
})();

function startParticles() {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
  document.getElementById('scene-title').appendChild(c);
  const ctx = c.getContext('2d');
  let W, H;
  const ps = [];
  function rs() { W = c.width = innerWidth; H = c.height = innerHeight; }
  rs(); window.addEventListener('resize', rs);
  for (let i = 0; i < 55; i++) ps.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.4+.2, vx: (Math.random()-.5)*.25, vy: -Math.random()*.4-.1, op: Math.random()*.45+.08, cl: Math.random()>.6?'#C8963C':'#3a2a60' });
  function dr() {
    if (SM.current !== 'scene-title') return;
    ctx.clearRect(0, 0, W, H);
    ps.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = p.cl; ctx.globalAlpha = p.op; ctx.fill(); p.x += p.vx; p.y += p.vy; if (p.y < -5) { p.y = H + 5; p.x = Math.random()*W; } if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5; });
    ctx.globalAlpha = 1; requestAnimationFrame(dr);
  }
  dr();
}

document.querySelector('.start-main-btn').addEventListener('click', () => {
  GameState.phase = 'arch'; GameState.isMobile = isMobile();
  document.body.setAttribute('data-theme', 'arch');
  SM.go('scene-perm');
});
