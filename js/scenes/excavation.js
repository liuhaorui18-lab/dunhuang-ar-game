/* 敦煌复苏计划 — excavation.js */
const EX = { c: null, x: null, W: 0, H: 0, notes: [], lanes: 5, spd: 2.5, r: 22, hz: { y:0, h:56 }, sc: 0, pf: 0, ms: 0, total: 12, spwn: 0, fv: 0.5, st: null, aid: null, done: false, _lt: 0 };

function initExcavation() {
  EX.c = document.getElementById('excavation-canvas'); EX.x = EX.c.getContext('2d');
  EX.done = false; EX.sc = 0; EX.pf = 0; EX.ms = 0; EX.spwn = 0; EX.notes = [];
  document.getElementById('ex-score').style.display = ''; document.getElementById('ex-score').textContent = '0 / ' + EX.total;
  document.getElementById('force-meter').style.display = '';
  document.getElementById('ex-guide').style.display = '';
  rsEx(); window.addEventListener('resize', rsEx);
  EX.hz.y = EX.H * 0.78; EX.hz.h = 56;

  EX.c.addEventListener('click', e => { e.preventDefault(); tapEx(getPos(e)); });
  EX.c.addEventListener('touchend', e => { e.preventDefault(); tapEx(getPos(e)); });
  Motion.on(_upF);

  EX.st = setInterval(() => { if (EX.done) return; if (EX.spwn >= EX.total) { clearInterval(EX.st); return; } spEx(); EX.spwn++; }, Config.ex.spawnMs);
  EX.aid = requestAnimationFrame(drEx);

  onSceneCleanup(() => { EX.done = true; clearInterval(EX.st); cancelAnimationFrame(EX.aid); Motion.off(_upF); window.removeEventListener('resize', rsEx); });
}

function rsEx() { EX.c.width = innerWidth; EX.c.height = innerHeight; EX.W = EX.c.width; EX.H = EX.c.height; EX.hz.y = EX.H * 0.78; }
function spEx() { const lw = EX.W / EX.lanes; const l = randInt(0, EX.lanes - 1); EX.notes.push({ x: l * lw + lw / 2, y: -30, l, r: EX.r, hit: false }); }

function tapEx(pos) {
  if (EX.done) return;
  if (Date.now() - EX._lt < 80) return; EX._lt = Date.now();
  for (let i = EX.notes.length - 1; i >= 0; i--) {
    const n = EX.notes[i]; if (n.hit) continue;
    const dy = Math.abs(n.y - EX.hz.y);
    if (dy < Config.ex.hitGood && Math.hypot(pos.x - n.x, pos.y - EX.hz.y) < EX.r * 2) {
      n.hit = true; EX.sc++;
      const perf = dy < Config.ex.hitPerfect; if (perf) EX.pf++;
      fbEx(perf ? '完美！' : '不错', perf ? '#FFD700' : '#C8963C');
      document.getElementById('ex-score').textContent = (EX.sc + EX.ms) + ' / ' + EX.total;
      sparks(n.x, EX.hz.y, perf ? 10 : 5, perf ? '#FFD700' : '#C8963C');
      if (EX.spwn >= EX.total && EX.sc + EX.ms >= EX.total) finEx();
      return;
    }
  }
  fbEx('偏了', 'var(--danger-red)');
}

function fbEx(t, c) {
  const el = document.getElementById('ex-feedback'); el.textContent = t; el.style.color = c; el.style.opacity = '1';
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = '0'; }, 600);
}

function _upF(d) { if (EX.done || d.type !== 'motion') return; const f = clamp(Math.abs(d.ay || 0) / 15, .05, 1); EX.fv = f; document.getElementById('force-fill').style.height = (f * 100) + '%'; if (f > .75 || f < .15) GameState.rhythmMistakes++; }

function drEx() {
  if (EX.done) return;
  const ctx = EX.x, W = EX.W, H = EX.H, hz = EX.hz;
  ctx.clearRect(0, 0, W, H);
  const lw = W / EX.lanes;
  ctx.strokeStyle = 'rgba(200,150,60,.05)'; ctx.lineWidth = 1;
  for (let i = 1; i < EX.lanes; i++) { ctx.beginPath(); ctx.moveTo(i * lw, 0); ctx.lineTo(i * lw, H); ctx.stroke(); }
  ctx.fillStyle = 'rgba(200,150,60,.06)'; ctx.fillRect(0, hz.y - hz.h / 2, W, hz.h);
  ctx.strokeStyle = 'rgba(200,150,60,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, hz.y); ctx.lineTo(W, hz.y); ctx.stroke();
  EX.notes.forEach(n => { if (n.hit) return;
    ctx.save();
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r); g.addColorStop(0, '#D4A853'); g.addColorStop(1, '#8B6914');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,150,60,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  });
  EX.notes.forEach(n => { if (!n.hit) n.y += EX.spd; });
  EX.notes.forEach(n => { if (!n.hit && n.y > H + 30) { n.hit = true; EX.ms++; GameState.rhythmMistakes++; document.getElementById('ex-score').textContent = (EX.sc + EX.ms) + ' / ' + EX.total; if (EX.spwn >= EX.total && EX.sc + EX.ms >= EX.total) finEx(); } });
  EX.aid = requestAnimationFrame(drEx);
}

function finEx() {
  EX.done = true; clearInterval(EX.st); cancelAnimationFrame(EX.aid); GameState.rhythmScore = EX.pf;
  ['ex-score','force-meter','ex-guide'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
  document.getElementById('ex-feedback').style.display = 'none';
  Motion.off(_upF);
  Dialogue.play(Dialogues.arch_ex_done).then(() => {
    Dialogue.play(Dialogues.arch_collapse).then(() => {
      SM.go('scene-clue-catch').then(() => initClueCatch());
    });
  });
}
