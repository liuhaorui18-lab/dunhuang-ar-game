/* 敦煌复苏计划 — cave-explore.js · 四方向转动切换文物 */
var Cave = { tm: null, td: null, sec: 0, ang: 0, dir: null, smoothed: 0, _ts: null, _ta: 0 };

// 四个方向→文物映射
var DirMap = {
  0:   { name:'mural',     label:'壁画碎片', deg:0,   icon:'🖼' },
  90:  { name:'scripture', label:'经卷',     deg:90,  icon:'📜' },
  180: { name:'buddha',    label:'大佛像',   deg:180, icon:'🗿' },
  270: { name:'statue',    label:'小佛像',   deg:270, icon:'🕯' }
};

function initCaveExplore(sec) {
  Cave.sec = sec; Cave.ang = 0; Cave.dir = null; Cave.smoothed = 0;
  Cave.td = document.getElementById('cave-timer'); Cave.td.style.display = ''; Cave.td.textContent = fmtTime(sec);
  document.getElementById('compass-bar').style.display = '';

  // 横版转盘
  document.getElementById('compass-bar').innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;height:100%;padding:0 8px;position:relative;overflow:hidden">' +
    '<span class="compass-marker" data-dir="90" style="color:var(--parchment-dim);flex:1;text-align:center">📜<br>经书</span>' +
    '<span class="compass-marker" data-dir="0" style="color:var(--parchment-dim);flex:1;text-align:center">🖼<br>壁画</span>' +
    '<span class="compass-marker" data-dir="270" style="color:var(--parchment-dim);flex:1;text-align:center">🗿<br>大佛</span>' +
    '<span class="compass-marker" data-dir="180" style="color:var(--parchment-dim);flex:1;text-align:center">🕯<br>小佛</span>' +
    '</div>';

  // 火把跟随手指/鼠标
  var torch = document.getElementById('torch-glow');
  var ce = document.getElementById('scene-cave-explore');
  ce.addEventListener('mousemove', function(e){torch.style.left=e.clientX+'px';torch.style.top=e.clientY+'px';});
  ce.addEventListener('touchmove', function(e){var p=getPos(e);torch.style.left=p.x+'px';torch.style.top=p.y+'px';},{passive:true});

  // 陀螺仪转动
  Motion.on(onRotate);

  // 触摸拖动转动
  ce.addEventListener('touchstart', function(e){e.preventDefault();Cave._ts=getPos(e);Cave._ta=Cave.smoothed;});
  ce.addEventListener('touchmove', function(e){if(!Cave._ts)return;e.preventDefault();var p=getPos(e);var dx=p.x-Cave._ts.x;Cave.smoothed=((Cave._ta-dx*0.6)%360+360)%360;updateDir();});
  ce.addEventListener('touchend', function(){Cave._ts=null;});

  // 键盘
  Cave._kh = function(e){if(e.key==='ArrowLeft'){Cave.smoothed=(Cave.smoothed+90)%360;updateDir();}if(e.key==='ArrowRight'){Cave.smoothed=(Cave.smoothed-90+360)%360;updateDir();}};
  window.addEventListener('keydown', Cave._kh);

  // 倒计时
  Cave.tm = new Timer(Cave.sec, function(r){Cave.td.textContent=fmtTime(r);if(r<=30)Cave.td.style.color='var(--danger-red)';else if(r<=60)Cave.td.style.color='#FFA726';}, function(){finCave();});
  Cave.tm.start();

  onSceneCleanup(function(){if(Cave.tm)Cave.tm.stop();Cave.td.style.display='none';document.getElementById('compass-bar').style.display='none';document.getElementById('minigame-overlay').classList.remove('active');Motion.off(onRotate);window.removeEventListener('keydown',Cave._kh);});
}

function onRotate(d) {
  if (d.type !== 'orient') return;
  // 平滑：最近值占0.7，新值占0.3
  Cave.smoothed = Cave.smoothed * 0.7 + (((d.gamma||0)+45)%360+360)%360 * 0.3;
  updateDir();
}

function updateDir() {
  // 找到最近的方向（0/90/180/270）
  var a = Cave.smoothed % 360; if (a < 0) a += 360;
  var dirs = [0, 90, 180, 270];
  var best = null, bestDist = 999;
  dirs.forEach(function(dg) {
    var dist = Math.abs(a - dg);
    if (dist > 180) dist = 360 - dist;
    if (dist < bestDist) { bestDist = dist; best = dg; }
  });

  // 更新转盘高亮
  document.querySelectorAll('.compass-marker').forEach(function(m) {
    var d = parseInt(m.dataset.dir);
    var dist = Math.abs(a - d); if (dist > 180) dist = 360 - dist;
    if (dist < 35) {
      m.style.color = 'var(--gold-light)';
      m.style.fontWeight = '700';
      m.style.fontSize = '11px';
    } else {
      m.style.color = 'var(--parchment-dim)';
      m.style.fontWeight = 'normal';
      m.style.fontSize = '9px';
    }
  });

  // 如果对准了某个方向且该文物未处理
  if (bestDist < 30 && best !== Cave.dir) {
    Cave.dir = best;
    var info = DirMap[best];
    var processed = GameState.artifactsCompleted.includes(info.name) || GameState.failedArtifacts.includes(info.name);
    var hint = document.getElementById('artifact-hint');
    if (!processed) {
      hint.innerHTML = info.icon + ' <b>' + info.label + '</b> — 点击进入';
      hint.style.opacity = '1';
      hint.style.pointerEvents = 'auto';
      hint.style.cursor = 'pointer';
      hint.onclick = function() { enterArt(info.name); };
    } else {
      hint.innerHTML = info.icon + ' ' + info.label + ' <span style="opacity:.4">✓ 已完成</span>';
      hint.style.opacity = '.5';
      hint.style.pointerEvents = 'none';
    }
  } else if (bestDist > 40 && Cave.dir !== null) {
    Cave.dir = null;
    document.getElementById('artifact-hint').style.opacity = '0';
    document.getElementById('artifact-hint').style.pointerEvents = 'none';
  }
}

function enterArt(name) {
  Cave.tm.stop(); document.getElementById('artifact-hint').style.opacity='0'; document.getElementById('artifact-hint').style.pointerEvents='none';
  var ov = document.getElementById('minigame-overlay'); ov.innerHTML=''; ov.classList.add('active');
  var cb = function(win) {
    ov.classList.remove('active');
    if (win) GameState.artifactsCompleted.push(name); else GameState.failedArtifacts.push(name);
    var done = GameState.artifactsCompleted.length + GameState.failedArtifacts.length;
    if (done >= 4) { finCave(); }
    else { Cave.tm.start(); Cave.dir=null; }
  };
  switch(name){case'mural':initMural(ov,cb);break;case'scripture':initScrip(ov,cb);break;case'buddha':initBuddha(ov,cb);break;case'statue':initCandle(ov,cb);break;}
}

function finCave() { if(Cave.tm)Cave.tm.stop(); Cave.td.style.display='none'; document.getElementById('compass-bar').style.display='none'; document.getElementById('minigame-overlay').classList.remove('active'); SM.go('scene-ending').then(function(){showEnding();}); }
