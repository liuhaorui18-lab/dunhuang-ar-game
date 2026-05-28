/* 敦煌复苏计划 — cave-explore.js · 四个文物按钮直接进入 */
var Cave = { tm: null, td: null, sec: 0, ang: 0, _ts: null, _ta: 0 };

var Artifacts = [
  { name:'mural',     label:'壁画碎片', icon:'🖼', done:false },
  { name:'scripture', label:'经卷',     icon:'📜', done:false },
  { name:'buddha',    label:'大佛像',   icon:'🗿', done:false },
  { name:'statue',    label:'小佛像',   icon:'🕯', done:false },
];

function initCaveExplore(sec) {
  Cave.sec = sec;
  Cave.td = document.getElementById('cave-timer'); Cave.td.style.display = 'block'; Cave.td.textContent = fmtTime(sec);

  // 标记已处理的
  Artifacts.forEach(function(a) {
    a.done = GameState.artifactsCompleted.includes(a.name) || GameState.failedArtifacts.includes(a.name);
  });

  // 底部四个按钮
  var bar = document.getElementById('compass-bar');
  bar.style.display = 'block';
  bar.innerHTML = '<div style="display:flex;justify-content:space-around;align-items:center;height:100%;padding:0 4px;gap:4px" id="artifact-btns"></div>';
  renderArtifactButtons();

  // 火把
  var torch = document.getElementById('torch-glow');
  document.getElementById('scene-cave-explore').addEventListener('touchmove', function(e) {
    var p = getPos(e); torch.style.left = p.x + 'px'; torch.style.top = p.y + 'px';
  }, {passive:true});
  document.getElementById('scene-cave-explore').addEventListener('mousemove', function(e) {
    torch.style.left = e.clientX + 'px'; torch.style.top = e.clientY + 'px';
  });

  // 陀螺仪转动——只是视觉效果，进出靠按钮
  Motion.on(function(d) {
    if (d.type !== 'orient') return;
    Cave.ang = Cave.ang * 0.5 + ((d.gamma||0)+90)*2 * 0.5;
    updateHighlight();
  });

  // 触摸滑动
  var ce = document.getElementById('scene-cave-explore');
  ce.addEventListener('touchstart', function(e) { e.preventDefault(); Cave._ts = getPos(e); Cave._ta = Cave.ang; });
  ce.addEventListener('touchmove', function(e) { if (!Cave._ts) return; var p=getPos(e); Cave.ang = (Cave._ta - (p.x-Cave._ts.x)*2 + 360) % 360; updateHighlight(); });
  ce.addEventListener('touchend', function() { Cave._ts = null; });

  // 倒计时
  Cave.tm = new Timer(Cave.sec, function(r) { Cave.td.textContent = fmtTime(r); if (r<=30) Cave.td.style.color='var(--danger-red)'; else if (r<=60) Cave.td.style.color='#FFA726'; }, function() { finCave(); });
  Cave.tm.start();

  updateHighlight();
  // 转动手机引导提示
  showRotateHint();
  onSceneCleanup(function() { if (Cave.tm) Cave.tm.stop(); Cave.td.style.display = 'none'; bar.style.display = 'none'; document.getElementById('minigame-overlay').classList.remove('active'); Motion.clear(); });
}

function renderArtifactButtons() {
  var container = document.getElementById('artifact-btns'); if (!container) return;
  container.innerHTML = '';
  Artifacts.forEach(function(a) {
    var btn = document.createElement('div');
    btn.style.cssText = 'flex:1;text-align:center;padding:4px 2px;border-radius:6px;cursor:pointer;transition:all .3s;font-size:10px;line-height:1.3;' +
      (a.done ? 'opacity:.35;color:var(--parchment-dim);border:1px solid rgba(255,255,255,.05);' : 'color:var(--gold-light);border:1px solid rgba(200,150,60,.2);background:rgba(200,150,60,.08);');
    btn.innerHTML = a.icon + '<br>' + a.label + (a.done ? '<br><span style="font-size:8px">✓</span>' : '');
    btn.addEventListener('click', function() {
      if (a.done) return;
      enterArt(a.name);
    });
    container.appendChild(btn);
  });
}

function updateHighlight() {
  var a = (Cave.ang % 360 + 360) % 360;
  var btns = document.querySelectorAll('#artifact-btns > div');
  // 根据角度高亮对应按钮（0=mural, 90=scripture, 180=buddha, 270=statue）
  var idxMap = {0:0, 90:1, 180:2, 270:3};
  Artifacts.forEach(function(art, i) {
    var deg = [0,90,180,270][i];
    var dist = Math.abs(a - deg); if (dist > 180) dist = 360 - dist;
    if (btns[i] && !art.done) {
      if (dist < 40) {
        btns[i].style.border = '2px solid var(--gold)';
        btns[i].style.boxShadow = '0 0 10px var(--gold-glow)';
      } else {
        btns[i].style.border = '1px solid rgba(200,150,60,.2)';
        btns[i].style.boxShadow = 'none';
      }
    }
  });
}

function enterArt(name) {
  Cave.tm.stop();
  var ov = document.getElementById('minigame-overlay'); ov.innerHTML = ''; ov.classList.add('active');
  var cb = function(win) {
    ov.classList.remove('active');
    if (win) GameState.artifactsCompleted.push(name);
    else GameState.failedArtifacts.push(name);
    // 更新按钮状态
    Artifacts.forEach(function(a) { if (a.name===name) a.done=true; });
    renderArtifactButtons();
    var done = GameState.artifactsCompleted.length + GameState.failedArtifacts.length;
    if (done >= 4) { finCave(); }
    else { Cave.tm.start(); }
  };
  switch(name) { case'mural':initMural(ov,cb);break; case'scripture':initScrip(ov,cb);break; case'buddha':initBuddha(ov,cb);break; case'statue':initCandle(ov,cb);break; }
}

function showRotateHint() {
  var hint = document.createElement('div');
  hint.id = 'rotate-hint';
  hint.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none">' +
    '<div style="font-size:40px;animation:rotatePhone 2s ease-in-out infinite">📱↔️</div>' +
    '<div style="font-size:13px;font-weight:700;color:var(--gold-light)">转动手机切换文物</div>' +
    '<div style="font-size:10px;opacity:.5">左右旋转选择不同的解密关卡</div>' +
    '</div>';
  hint.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(hint);

  var sty = document.createElement('style');
  sty.textContent = '@keyframes rotatePhone{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}}';
  document.head.appendChild(sty);

  // 用户触摸后消失
  var removeHint = function() { if (hint.parentNode) { hint.remove(); sty.remove(); } };
  document.addEventListener('touchstart', removeHint, {once:true});
  document.addEventListener('click', removeHint, {once:true});
}

function finCave() {
  if (Cave.tm) Cave.tm.stop();
  Cave.td.style.display = 'none';
  document.getElementById('compass-bar').style.display = 'none';
  document.getElementById('minigame-overlay').classList.remove('active');
  SM.go('scene-ending').then(function() { showEnding(); });
}
