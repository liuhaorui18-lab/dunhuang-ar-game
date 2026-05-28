/* 敦煌复苏计划 — clue-catch.js */
const CC = { els: [], got: 0, need: 2, rem: 20, st: null, tm: null, done: false };

// Direct asset paths (no CSS variable indirection in inline styles)
const ClueImg = {
  mural:   'url(assets/找线索/壁画线索/文字框.png)',
  scripture:'url(assets/找线索/经书线索/文字框.png)',
  buddha:  'url(assets/找线索/大佛像线索/文字框.png)',
  statue:  'url(assets/找线索/小佛像线索/文字框.png)',
  junk1:   'url(assets/找线索/干扰线索/干扰线索1/文字框.png)',
  junk2:   'url(assets/找线索/干扰线索/干扰线索2/文字框.png)',
  junk3:   'url(assets/找线索/干扰线索/干扰线索3/文字框.png)',
  junk4:   'url(assets/找线索/干扰线索/干扰线索4/文字框.png)',
};

// Inject a style sheet for clue card animation
const _clueStyle = document.createElement('style');
_clueStyle.textContent = `.clue-card{position:fixed;z-index:25;pointer-events:auto}.clue-fly{animation:clueFly 4.5s linear forwards}@keyframes clueFly{from{left:-100px}to{left:110vw}}`;
document.head.appendChild(_clueStyle);

function initClueCatch() {
  CC.done = false; CC.got = 0; CC.rem = Config.cc.dur; CC.els = [];
  document.getElementById('cc-score').textContent = `线索 ${CC.got}/${CC.need}`;
  document.getElementById('cc-timer').textContent = CC.rem + 's';
  document.getElementById('cc-guide').style.display = '';

  CC.st = setInterval(() => { if (!CC.done) spClue(); }, Config.cc.spawnMs);
  for (let i = 0; i < 5; i++) setTimeout(() => spClue(), i * 300);

  CC.tm = setInterval(() => { CC.rem--; document.getElementById('cc-timer').textContent = CC.rem + 's'; if (CC.rem <= 0) finCC(); }, 1000);

  onSceneCleanup(() => { CC.done = true; clearInterval(CC.st); clearInterval(CC.tm); CC.els.forEach(e => e.remove()); CC.els = []; });
}

function spClue() {
  if (CC.done) return;
  const good = Math.random() > .4;
  const types = good ? ['mural','scripture','buddha','statue'] : ['junk1','junk2','junk3','junk4'];
  const t = types[randInt(0, types.length - 1)];

  const el = document.createElement('div'); el.className = 'clue-card clue-fly';
  const y = randInt(40, innerHeight - 120);
  el.style.cssText = `
    top:${y}px; width:80px; height:80px;
    background:${ClueImg[t]} center/contain no-repeat;
    cursor:pointer;
  `;
  document.getElementById('scene-clue-catch').appendChild(el);
  CC.els.push(el);

  el.addEventListener('click', e => { e.stopPropagation(); if (CC.done) return;
    if (good) {
      CC.got++;
      document.getElementById('cc-score').textContent = `线索 ${CC.got}/${CC.need}`;
      sparks(e.clientX, e.clientY, 10, '#4FC3F7');
      el.remove();
      if (CC.got >= CC.need) finCC();
    } else {
      el.style.opacity = '.1'; el.style.pointerEvents = 'none';
      setTimeout(() => el.remove(), 300);
      sparks(e.clientX, e.clientY, 4, '#FF3B30');
      toast('这是乱码！', 'arch', 1000);
    }
  });

  setTimeout(() => { el.remove(); const i = CC.els.indexOf(el); if (i >= 0) CC.els.splice(i, 1); }, 5000);
}

function finCC() {
  if (CC.done) return; CC.done = true;
  clearInterval(CC.st); clearInterval(CC.tm);
  CC.els.forEach(e => e.remove()); CC.els = [];
  document.getElementById('cc-guide').style.display = 'none';
  if (CC.got > 0) {
    const all = shuffle(['mural','scripture','buddha','statue']);
    for (let i = 0; i < CC.got; i++) GameState.cluesCollected.push(all[i]);
  }
  GameState.calcCountdown();
  Dialogue.play(Dialogues.arch_clue_ok).then(() => {
    const d = GameState.countdownMinutes + ':' + String(GameState.countdownSeconds).padStart(2, '0');
    const m = showModal({ theme:'arch', title:'⚠ 洞窟坍塌倒计时', text:`洞窟将在 <b style="color:var(--gold-light);font-size:22px">${d}</b> 后坍塌<br><span style="font-size:10px;opacity:.4">必须在倒计时结束前找到文物并离开</span>`, btn:'走入洞窟', onConfirm(){ goExplore(); } });
    setTimeout(() => { if (m.ov.parentNode) { m.close(); goExplore(); } }, 6000);
  });
}

function goExplore() {
  Dialogue.play(Dialogues.arch_timer).then(() => {
    SM.go('scene-cave-explore').then(() => initCaveExplore(GameState.totalSec));
  });
}
