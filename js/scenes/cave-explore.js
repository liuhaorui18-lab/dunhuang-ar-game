/* 敦煌复苏计划 — cave-explore.js · 每个文物可重试 */
const Cave = { tm: null, td: null, sec: 0, ang: 0, near: null, _lg: 0, _ts: null, _ta: 0, _kh: null };

function initCaveExplore(sec) {
  Cave.sec = sec; Cave.ang = 0; Cave.near = null; Cave._lg = 0;
  Cave.td = document.getElementById('cave-timer'); Cave.td.style.display = ''; Cave.td.textContent = fmtTime(sec); Cave.td.className = 'cave-hud-timer';
  document.getElementById('compass-bar').style.display = '';
  updComp(0);

  const torch = document.getElementById('torch-glow');
  const ce = document.getElementById('scene-cave-explore');
  ce.addEventListener('mousemove', e => { torch.style.left = e.clientX + 'px'; torch.style.top = e.clientY + 'px'; });
  ce.addEventListener('touchmove', e => { const p = getPos(e); torch.style.left = p.x + 'px'; torch.style.top = p.y + 'px'; }, { passive: true });

  ce.addEventListener('touchstart', e => { Cave._ts = getPos(e); Cave._ta = Cave.ang; });
  ce.addEventListener('touchmove', e => { if (!Cave._ts) return; const p = getPos(e); Cave.ang = ((Cave._ta - (p.x - Cave._ts.x) * 0.5) % 360 + 360) % 360; updComp(Cave.ang); chkNear(); });
  ce.addEventListener('touchend', () => { Cave._ts = null; });

  Motion.on(d => { if (d.type !== 'orient') return; Cave.ang = (((d.gamma || 0) * 0.6 + Cave._lg * 0.4) + 45 + 360) % 360; Cave._lg = Cave.ang; updComp(Cave.ang); chkNear(); });

  Cave._kh = e => { if (SM.current !== 'scene-cave-explore') return; if (e.key === 'ArrowLeft') { Cave.ang = (Cave.ang + 3) % 360; updComp(Cave.ang); chkNear(); } if (e.key === 'ArrowRight') { Cave.ang = (Cave.ang - 3 + 360) % 360; updComp(Cave.ang); chkNear(); } };
  window.addEventListener('keydown', Cave._kh);

  Cave.tm = new Timer(Cave.sec, r => { Cave.td.textContent = fmtTime(r); if (r <= 30) Cave.td.style.color = 'var(--danger-red)'; else if (r <= 60) Cave.td.style.color = '#FFA726'; }, () => finCave());
  Cave.tm.start();

  onSceneCleanup(() => { if (Cave.tm) Cave.tm.stop(); Cave.td.style.display = 'none'; document.getElementById('compass-bar').style.display = 'none'; document.getElementById('minigame-overlay').classList.remove('active'); Motion.clear(); window.removeEventListener('keydown', Cave._kh); });
}

function updComp(a) { const d = document.getElementById('compass-dot'); if (d) d.style.left = ((a % 360) / 360 * 100) + '%'; }

function chkNear() {
  const targets = { mural: 0, scripture: 90, buddha: 180, statue: 270 };
  let nearest = null, nearDist = 999;
  for (const [n, deg] of Object.entries(targets)) {
    if (GameState.artifactsCompleted.includes(n)) continue;
    let d = Math.abs(Cave.ang - deg); if (d > 180) d = 360 - d;
    if (d < 28 && d < nearDist) { nearDist = d; nearest = n; }
  }
  if (nearest !== Cave.near) {
    Cave.near = nearest;
    const hint = document.getElementById('artifact-hint');
    if (nearest) { const nm = { mural: '壁画碎片', scripture: '经卷', buddha: '巨大碎石', statue: '微弱烛光' }; hint.textContent = '发现 ' + nm[nearest] + ' — 点击进入'; hint.style.opacity = '1'; hint.style.cursor = 'pointer'; hint.onclick = () => enterArt(nearest); }
    else { hint.style.opacity = '0'; }
  }
}

function enterArt(name) {
  Cave.tm.stop(); Cave.near = null; document.getElementById('artifact-hint').style.opacity = '0';
  const ov = document.getElementById('minigame-overlay'); ov.innerHTML = ''; ov.classList.add('active');
  const cb = (win) => {
    ov.classList.remove('active');
    if (win) GameState.artifactsCompleted.push(name); else GameState.failedArtifacts.push(name);
    const done = GameState.artifactsCompleted.length + GameState.failedArtifacts.length;
    if (GameState.artifactsCompleted.length >= 4 || done >= 4) { finCave(); }
    else { Cave.tm.start(); document.getElementById('artifact-hint').style.opacity = '0'; }
  };
  switch (name) { case 'mural': initMural(ov, cb); break; case 'scripture': initScrip(ov, cb); break; case 'buddha': initBuddha(ov, cb); break; case 'statue': initCandle(ov, cb); break; }
}

function finCave() { if (Cave.tm) Cave.tm.stop(); Cave.td.style.display = 'none'; document.getElementById('compass-bar').style.display = 'none'; document.getElementById('minigame-overlay').classList.remove('active'); SM.go('scene-ending').then(() => showEnding()); }
