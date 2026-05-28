/* 敦煌复苏计划 — clue-catch.js · 纯DOM移动，可靠渲染 */
const CC = { els: [], got: 0, need: 2, rem: 20, st: null, tm: null, done: false,
  _animEls: [] };

const ClueImgSrc = {
  mural:   'assets/找线索/壁画线索/文字框.png',
  scripture:'assets/找线索/经书线索/文字框.png',
  buddha:  'assets/找线索/大佛像线索/文字框.png',
  statue:  'assets/找线索/小佛像线索/文字框.png',
  junk1:   'assets/找线索/干扰线索/干扰线索1/文字框.png',
  junk2:   'assets/找线索/干扰线索/干扰线索2/文字框.png',
  junk3:   'assets/找线索/干扰线索/干扰线索3/文字框.png',
  junk4:   'assets/找线索/干扰线索/干扰线索4/文字框.png',
};

function initClueCatch() {
  CC.done = false; CC.got = 0; CC.rem = Config.cc.dur; CC.els = []; CC._animEls = [];
  document.getElementById('cc-score').textContent = '线索 ' + CC.got + '/' + CC.need;
  document.getElementById('cc-timer').textContent = CC.rem + 's';
  document.getElementById('cc-guide').style.display = '';

  CC.st = setInterval(function() { if (!CC.done) spClue(); }, Config.cc.spawnMs);
  for (let i = 0; i < 5; i++) setTimeout(function() { spClue(); }, i * 300);

  CC.tm = setInterval(function() { CC.rem--; document.getElementById('cc-timer').textContent = CC.rem + 's'; if (CC.rem <= 0) finCC(); }, 1000);

  onSceneCleanup(function() { CC.done = true; clearInterval(CC.st); clearInterval(CC.tm); CC.els.forEach(function(e) { e.remove(); }); CC.els = []; CC._animEls.forEach(function(a) { clearInterval(a); }); });
}

function spClue() {
  if (CC.done) return;
  var good = Math.random() > 0.4;
  var types = good ? ['mural','scripture','buddha','statue'] : ['junk1','junk2','junk3','junk4'];
  var t = types[randInt(0, types.length - 1)];
  var imgSrc = ClueImgSrc[t];

  var el = document.createElement('img');
  el.src = imgSrc;
  el.style.cssText = 'position:fixed;z-index:25;top:' + randInt(40, innerHeight - 120) + 'px;left:-100px;width:80px;height:80px;object-fit:contain;cursor:pointer;pointer-events:auto;';
  document.getElementById('scene-clue-catch').appendChild(el);
  CC.els.push(el);

  // Simple interval-based movement
  var x = -100;
  var spd = randFloat(2.5, 4.5);
  var aid = setInterval(function() {
    if (CC.done) { clearInterval(aid); return; }
    x += spd;
    el.style.left = x + 'px';
    if (x > innerWidth + 100) { clearInterval(aid); el.remove(); var i = CC.els.indexOf(el); if (i >= 0) CC.els.splice(i, 1); var j = CC._animEls.indexOf(aid); if (j >= 0) CC._animEls.splice(j, 1); }
  }, 30);
  CC._animEls.push(aid);

  el.addEventListener('click', function(e) { e.stopPropagation(); if (CC.done) return;
    if (good) {
      CC.got++;
      document.getElementById('cc-score').textContent = '线索 ' + CC.got + '/' + CC.need;
      sparks(e.clientX, e.clientY, 10, '#4FC3F7');
      el.remove();
      clearInterval(aid);
      var i = CC.els.indexOf(el); if (i >= 0) CC.els.splice(i, 1);
      if (CC.got >= CC.need) finCC();
    } else {
      el.style.opacity = '0.1';
      el.style.pointerEvents = 'none';
      setTimeout(function() { el.remove(); clearInterval(aid); }, 300);
      sparks(e.clientX, e.clientY, 4, '#FF3B30');
      toast('这是乱码！', 'arch', 1000);
    }
  });

  // Auto-remove after 6 seconds
  setTimeout(function() { if (el.parentNode) { el.remove(); clearInterval(aid); } var i = CC.els.indexOf(el); if (i >= 0) CC.els.splice(i, 1); }, 6500);
}

function finCC() {
  if (CC.done) return; CC.done = true;
  clearInterval(CC.st); clearInterval(CC.tm);
  CC.els.forEach(function(e) { e.remove(); }); CC.els = [];
  CC._animEls.forEach(function(a) { clearInterval(a); }); CC._animEls = [];
  document.getElementById('cc-guide').style.display = 'none';
  if (CC.got > 0) {
    var all = shuffle(['mural','scripture','buddha','statue']);
    for (var i = 0; i < CC.got; i++) GameState.cluesCollected.push(all[i]);
  }
  GameState.calcCountdown();
  Dialogue.play(Dialogues.arch_clue_ok).then(function() {
    var d = GameState.countdownMinutes + ':' + String(GameState.countdownSeconds).padStart(2, '0');
    var m = showModal({ theme:'arch', title:'⚠ 洞窟坍塌倒计时', text:'洞窟将在 <b style="color:var(--gold-light);font-size:22px">' + d + '</b> 后坍塌<br><span style="font-size:10px;opacity:.4">必须在倒计时结束前找到文物并离开</span>', btn:'走入洞窟', onConfirm:function() { goExplore(); } });
    setTimeout(function() { if (m.ov.parentNode) { m.close(); goExplore(); } }, 6000);
  });
}

function goExplore() {
  // 显示洞口像素图渐入代表进入洞窟
  var reveal = document.getElementById('scene-countdown-reveal');
  reveal.innerHTML = '<div id="cave-entrance" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.9)"><img src="assets/洞口像素图.png" style="width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity 1.5s" id="cave-img"></div>';
  SM.go('scene-countdown-reveal').then(function() {
    setTimeout(function() {
      document.getElementById('cave-img').style.opacity = '1';
    }, 200);
    setTimeout(function() {
      Dialogue.play(Dialogues.arch_timer).then(function() {
        SM.go('scene-cave-explore').then(function() { initCaveExplore(GameState.totalSec); });
      });
    }, 2200);
  });
}
