/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — title.js
   加载页 → 标题页 → 直接进入考古学家线
   ═══════════════════════════════════════════════════════ */

// ─── Loading ───────────────────────────────────────────
(function initLoading() {
  const bar = document.getElementById('loading-bar');
  const walker = document.getElementById('loading-walker');
  const tip = document.getElementById('loading-tip');
  const tips = [
    '正在启动数字敦煌系统……',
    '正在校准AI识别引擎……',
    '正在连接莫高窟数据库……',
    '正在加载文物图鉴……',
    '系统就绪，欢迎进入。'
  ];
  let progress = 0;

  function tick() {
    progress += randInt(3, 8);
    if (progress > 100) progress = 100;

    bar.style.width = progress + '%';
    const pw = bar.parentElement.offsetWidth;
    walker.style.left = (progress / 100) * pw + 'px';

    const ti = Math.min(Math.floor(progress / 22), tips.length - 1);
    tip.textContent = tips[ti];

    if (progress < 100) {
      setTimeout(tick, randInt(200, 500));
    } else {
      setTimeout(() => {
        SM.go('scene-title', () => { startParticles(); });
      }, 500);
    }
  }

  Preloader.preload(PreloadAssets.critical);
  setTimeout(tick, 400);
})();

// ─── Particles ─────────────────────────────────────────
function startParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-particles';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
  document.getElementById('scene-title').appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.5 - 0.1,
      op: Math.random() * 0.5 + 0.1,
      col: Math.random() > 0.6 ? '#C8963C' : '#3a2a60'
    });
  }

  function draw() {
    if (SM.current !== 'scene-title') return;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col; ctx.globalAlpha = p.op; ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

// ─── Start Button ──────────────────────────────────────
const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', () => {
  GameState.character = 'arch';
  GameState.phase = 'arch';
  GameState.isMobile = isMobile();
  document.body.setAttribute('data-theme', 'arch');
  SM.go('scene-perm');
});
