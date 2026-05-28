/* 敦煌复苏计划 — cave-explore.js · 四向转动 */
var Cave = { tm: null, td: null, sec: 0, ang: 0, dir: null, _ts: null, _ta: 0, _ga: 0 };

var DirMap = {
  0:   { name:'mural',     label:'壁画碎片', icon:'🖼' },
  90:  { name:'scripture', label:'经卷',     icon:'📜' },
  180: { name:'buddha',    label:'大佛像',   icon:'🗿' },
  270: { name:'statue',    label:'小佛像',   icon:'🕯' }
};

function initCaveExplore(sec) {
  Cave.sec = sec; Cave.ang = 0; Cave.dir = null; Cave._ga = 0;
  Cave.td = document.getElementById('cave-timer'); Cave.td.style.display = ''; Cave.td.textContent = fmtTime(sec);
  document.getElementById('compass-bar').style.display = '';
  document.getElementById('compass-bar').innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;height:100%;padding:0 6px">' +
    '<span class="compass-marker" data-dir="270">🗿<br>大佛</span>' +
    '<span class="compass-marker" data-dir="0">🖼<br>壁画</span>' +
    '<span class="compass-marker" data-dir="90">📜<br>经书</span>' +
    '<span class="compass-marker" data-dir="180">🕯<br>小佛</span>' +
    '</div>';

  var torch = document.getElementById('torch-glow');
  var ce = document.getElementById('scene-cave-explore');
  ce.addEventListener('mousemove', function(e){ torch.style.left=e.clientX+'px'; torch.style.top=e.clientY+'px'; });
  ce.addEventListener('touchmove', function(e){ var p=getPos(e); torch.style.left=p.x+'px'; torch.style.top=p.y+'px'; }, {passive:true});

  // 陀螺仪：用gamma左右倾斜改变角度
  Motion.on(function(d) {
    if (d.type !== 'orient') return;
    Cave._ga = ((d.gamma||0) + 90) * 2; // gamma -90~90 → 0~360
    Cave.ang = Cave.ang * 0.4 + Cave._ga * 0.6;
    updateDir();
  });

  // 触摸滑动转动
  ce.addEventListener('touchstart', function(e) { e.preventDefault(); Cave._ts = getPos(e); Cave._ta = Cave.ang; });
  ce.addEventListener('touchmove', function(e) {
    if (!Cave._ts) return; e.preventDefault();
    var p = getPos(e), dx = p.x - Cave._ts.x;
    Cave.ang = (Cave._ta - dx * 2 + 360) % 360;
    updateDir();
  });
  ce.addEventListener('touchend', function() { Cave._ts = null; });

  // 键盘：左右切换方向
  Cave._kh = function(e) { if (e.key==='ArrowLeft') { Cave.ang = (Cave.ang + 90) % 360; updateDir(); } if (e.key==='ArrowRight') { Cave.ang = (Cave.ang - 90 + 360) % 360; updateDir(); } };
  window.addEventListener('keydown', Cave._kh);

  // 倒计时
  Cave.tm = new Timer(Cave.sec, function(r) { Cave.td.textContent = fmtTime(r); if (r<=30) Cave.td.style.color='var(--danger-red)'; else if (r<=60) Cave.td.style.color='#FFA726'; }, function() { finCave(); });
  Cave.tm.start();

  // 立即初始化方向
  updateDir();

  onSceneCleanup(function() {
    if (Cave.tm) Cave.tm.stop();
    Cave.td.style.display = 'none';
    document.getElementById('compass-bar').style.display = 'none';
    document.getElementById('minigame-overlay').classList.remove('active');
    Motion.offAll();
    window.removeEventListener('keydown', Cave._kh);
  });
}

function updateDir() {
  var a = (Cave.ang % 360 + 360) % 360;
  var dirs = [0, 90, 180, 270];
  var best = null, bestD = 999;

  dirs.forEach(function(dg) {
    var dist = Math.abs(a - dg); if (dist > 180) dist = 360 - dist;
    if (dist < bestD) { bestD = dist; best = dg; }
  });

  // 更新转盘高亮
  document.querySelectorAll('.compass-marker').forEach(function(m) {
    var d = parseInt(m.dataset.dir);
    var dist = Math.abs(a - d); if (dist > 180) dist = 360 - dist;
    if (dist < 30) {
      m.style.cssText = 'color:var(--gold-light);font-weight:700;font-size:12px;transition:all .3s;background:rgba(200,150,60,.1);border-radius:4px;padding:2px 4px;';
    } else {
      m.style.cssText = 'color:var(--parchment-dim);font-weight:normal;font-size:9px;transition:all .3s;background:transparent;';
    }
  });

  if (bestD < 30 && best !== Cave.dir) {
    Cave.dir = best;
    var info = DirMap[best];
    var done = GameState.artifactsCompleted.includes(info.name) || GameState.failedArtifacts.includes(info.name);
    var hint = document.getElementById('artifact-hint');
    if (!done) {
      hint.innerHTML = info.icon + ' <b>' + info.label + '</b> — 点击进入';
      hint.style.opacity = '1'; hint.style.pointerEvents = 'auto'; hint.style.cursor = 'pointer';
      hint.onclick = function() { enterArt(info.name); };
    } else {
      hint.innerHTML = info.icon + ' ' + info.label + ' <span style="opacity:.4">✓</span>';
      hint.style.opacity = '.5'; hint.style.pointerEvents = 'none';
    }
  } else if (bestD > 40 && Cave.dir !== null) {
    Cave.dir = null;
    document.getElementById('artifact-hint').style.opacity = '0';
    document.getElementById('artifact-hint').style.pointerEvents = 'none';
  }
}

function enterArt(name) {
  Cave.tm.stop();
  document.getElementById('artifact-hint').style.opacity = '0';
  document.getElementById('artifact-hint').style.pointerEvents = 'none';
  var ov = document.getElementById('minigame-overlay'); ov.innerHTML = ''; ov.classList.add('active');
  var cb = function(win) {
    ov.classList.remove('active');
    if (win) GameState.artifactsCompleted.push(name);
    else GameState.failedArtifacts.push(name);
    var done = GameState.artifactsCompleted.length + GameState.failedArtifacts.length;
    if (done >= 4) { finCave(); }
    else { Cave.tm.start(); Cave.dir = null; updateDir(); }
  };
  switch(name) { case'mural':initMural(ov,cb);break; case'scripture':initScrip(ov,cb);break; case'buddha':initBuddha(ov,cb);break; case'statue':initCandle(ov,cb);break; }
}

function finCave() {
  if (Cave.tm) Cave.tm.stop();
  Cave.td.style.display = 'none';
  document.getElementById('compass-bar').style.display = 'none';
  document.getElementById('minigame-overlay').classList.remove('active');
  SM.go('scene-ending').then(function() { showEnding(); });
}
