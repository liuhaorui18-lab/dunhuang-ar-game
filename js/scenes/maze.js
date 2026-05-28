/* 敦煌复苏计划 — maze.js · 可跳过 */
const MZ = { c: null, x: null, cols: 14, rows: 18, cs: 28, grid: [], p: { x:1, y:1 }, e: { x:0, y:0 }, done: false, aid: null, _mfn: null, _kfn: null };

function initMaze() {
  MZ.cols = Config.maze.cols; MZ.rows = Config.maze.rows; MZ.cs = Config.maze.cell; MZ.done = false;
  MZ.c = document.getElementById('maze-canvas'); MZ.x = MZ.c.getContext('2d');
  MZ.grid = genMZ(MZ.cols, MZ.rows); MZ.p = { x: 1, y: 1 }; MZ.e = { x: MZ.cols - 2, y: MZ.rows - 2 };
  MZ.c.width = MZ.cols * MZ.cs; MZ.c.height = MZ.rows * MZ.cs;
  const sc = Math.min(innerWidth * .85 / (MZ.cols * MZ.cs), innerHeight * .55 / (MZ.rows * MZ.cs), 1.5);
  MZ.c.style.width = (MZ.cols * MZ.cs * sc) + 'px'; MZ.c.style.height = (MZ.rows * MZ.cs * sc) + 'px';
  renderMZ();

  var _lastMove=0;
  MZ._mfn = d => { if (MZ.done || d.type !== 'orient') return;
    var now=Date.now(); if(now-_lastMove<200) return; // 200ms冷却
    var dx=clamp((d.gamma||0)/100,-1,1), dy=clamp((d.beta||0)/100,-1,1);
    if(Math.abs(dx)<.35&&Math.abs(dy)<.35) return; // 需要明显倾斜
    _lastMove=now;
    mvMZ(Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp'));
  };
  Motion.on(MZ._mfn);
  MZ._kfn = e => { if (SM.current !== 'scene-maze' || MZ.done) return; mvMZ(e.key); };
  window.addEventListener('keydown', MZ._kfn);

  document.getElementById('maze-skip-btn').addEventListener('click', () => { MZ.done = true; cancelAnimationFrame(MZ.aid); Motion.off(MZ._mfn); window.removeEventListener('keydown', MZ._kfn); Dialogue.play(Dialogues.prog_maze_ok).then(() => showProgCD()); });

  onSceneCleanup(() => { MZ.done = true; cancelAnimationFrame(MZ.aid); Motion.off(MZ._mfn); window.removeEventListener('keydown', MZ._kfn); });
}

function genMZ(cs, rs) {
  const g = []; for (let y = 0; y < rs; y++) { g[y] = []; for (let x = 0; x < cs; x++) g[y][x] = { w: true, v: false }; }
  function carve(x, y) { g[y][x].w = false; g[y][x].v = true; shuffle([[2,0],[-2,0],[0,2],[0,-2]]).forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx > 0 && nx < cs - 1 && ny > 0 && ny < rs - 1 && !g[ny][nx].v) { g[y + dy/2][x + dx/2].w = false; carve(nx, ny); } }); }
  carve(1, 1); g[rs - 2][cs - 2].w = false; return g;
}

function mvMZ(key) { if (MZ.done) return; let { x, y } = MZ.p, nx = x, ny = y;
  switch (key) { case 'ArrowUp': ny--; break; case 'ArrowDown': ny++; break; case 'ArrowLeft': nx--; break; case 'ArrowRight': nx++; break; default: return; }
  if (nx < 0 || ny < 0 || nx >= MZ.cols || ny >= MZ.rows) return;
  if (MZ.grid[ny] && MZ.grid[ny][nx] && MZ.grid[ny][nx].w) return;
  MZ.p.x = nx; MZ.p.y = ny; renderMZ();
  if (nx === MZ.e.x && ny === MZ.e.y) { MZ.done = true; cancelAnimationFrame(MZ.aid); Motion.off(MZ._mfn); window.removeEventListener('keydown', MZ._kfn); toast('找到出口了！', 'prog', 1800); setTimeout(() => { Dialogue.play(Dialogues.prog_maze_ok).then(() => showProgCD()); }, 1000); }
}

function renderMZ() {
  const ctx = MZ.x, cs = MZ.cs;
  ctx.clearRect(0, 0, MZ.c.width, MZ.c.height);
  for (let y = 0; y < MZ.rows; y++) for (let x = 0; x < MZ.cols; x++) if (MZ.grid[y][x].w) { ctx.fillStyle = 'rgba(0,212,255,.05)'; ctx.fillRect(x * cs, y * cs, cs, cs); }
  ctx.fillStyle = 'rgba(0,255,100,.12)'; ctx.fillRect(MZ.e.x * cs, MZ.e.y * cs, cs, cs);
  ctx.fillStyle = '#fff'; ctx.font = (cs - 6) + 'px sans-serif'; ctx.fillText('🚪', MZ.e.x * cs + 2, MZ.e.y * cs + cs - 4);
  ctx.fillStyle = '#00D4FF'; ctx.beginPath(); ctx.arc(MZ.p.x * cs + cs / 2, MZ.p.y * cs + cs / 2, cs / 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
  MZ.aid = requestAnimationFrame(renderMZ);
}

function showProgCD() {
  GameState.calcCountdown();
  const d = GameState.countdownMinutes + ':' + String(GameState.countdownSeconds).padStart(2, '0');
  const m = showModal({ theme: 'prog', title: '⚠ 洞窟坍塌倒计时', text: `剩余时间 <b style="color:var(--prog-cyan);font-size:20px">${d}</b><br><span style="font-size:10px;opacity:.4">利用照片完成文物数字修复</span>`, btn: '开始修复', onConfirm() { startPP(); } });
  setTimeout(() => { if (m.ov.parentNode) { m.close(); startPP(); } }, 5000);
}

function startPP() {
  Dialogue.play(Dialogues.prog_countdown).then(() => { SM.go('scene-photo-puzzle').then(() => initPhotoPuzzle()); });
}
