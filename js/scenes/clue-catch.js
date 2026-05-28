/* 敦煌复苏计划 — clue-catch.js · 0条线索也自动继续 */
const CC = { els: [], got: 0, need: 2, rem: 20, st: null, tm: null, done: false };

function initClueCatch() {
  CC.done = false; CC.got = 0; CC.rem = Config.cc.dur; CC.els = [];
  document.getElementById('cc-score').textContent = `线索 ${CC.got}/${CC.need}`;
  document.getElementById('cc-timer').textContent = CC.rem + 's';
  document.getElementById('cc-guide').style.display = '';

  CC.st = setInterval(() => { if (!CC.done) spClue(); }, Config.cc.spawnMs);
  for (let i = 0; i < 5; i++) setTimeout(() => spClue(), i * 250);

  CC.tm = setInterval(() => { CC.rem--; document.getElementById('cc-timer').textContent = CC.rem + 's'; if (CC.rem <= 0) finCC(); }, 1000);

  onSceneCleanup(() => { CC.done = true; clearInterval(CC.st); clearInterval(CC.tm); CC.els.forEach(e => e.remove()); CC.els = []; });
}

function spClue() {
  if (CC.done) return;
  const good = Math.random() > .4;
  const types = good ? ['mural','scripture','buddha','statue'] : ['junk1','junk2','junk3','junk4'];
  const t = types[randInt(0, types.length - 1)];
  const bgMap = { mural: 'var(--img-clue-mural)', scripture: 'var(--img-clue-script)', buddha: 'var(--img-clue-buddha)', statue: 'var(--img-clue-statue)', junk1: 'var(--img-clue-junk1)', junk2: 'var(--img-clue-junk2)', junk3: 'var(--img-clue-junk3)', junk4: 'var(--img-clue-junk4)' };

  const el = document.createElement('div'); el.className = 'clue-card';
  const startY = randInt(30, innerHeight - 100);
  el.style.cssText = `position:fixed;z-index:25;left:-90px;top:${startY}px;width:75px;height:75px;background:${bgMap[t] || (good ? '#4FC3F7' : '#FF3B30')} center/contain no-repeat;cursor:pointer;transition:left 4.5s linear;`;
  document.getElementById('scene-clue-catch').appendChild(el);
  CC.els.push(el);

  requestAnimationFrame(() => { el.style.left = (innerWidth + 20) + 'px'; });

  el.addEventListener('click', e => { e.stopPropagation(); if (CC.done) return;
    if (good) { CC.got++; document.getElementById('cc-score').textContent = `线索 ${CC.got}/${CC.need}`; sparks(e.clientX, e.clientY, 10, '#4FC3F7'); el.remove(); if (CC.got >= CC.need) finCC(); }
    else { el.style.filter = 'brightness(2.5)'; setTimeout(() => el.remove(), 200); sparks(e.clientX, e.clientY, 4, '#FF3B30'); toast('这是乱码！', 'arch', 1000); }
  });

  setTimeout(() => { el.remove(); const i = CC.els.indexOf(el); if (i >= 0) CC.els.splice(i, 1); }, 5000);
}

function finCC() {
  if (CC.done) return; CC.done = true;
  clearInterval(CC.st); clearInterval(CC.tm);
  CC.els.forEach(e => e.remove()); CC.els = [];
  document.getElementById('cc-guide').style.display = 'none';
  // Always give at least the clues they caught
  if (CC.got > 0) { const all = shuffle(['mural','scripture','buddha','statue']); for (let i = 0; i < CC.got; i++) GameState.cluesCollected.push(all[i]); }
  GameState.calcCountdown();
  Dialogue.play(Dialogues.arch_clue_ok).then(() => {
    const d = GameState.countdownMinutes + ':' + String(GameState.countdownSeconds).padStart(2, '0');
    const m = showModal({ theme: 'arch', title: '⚠ 洞窟坍塌倒计时', text: `洞窟将在 <b style="color:var(--gold-light);font-size:22px">${d}</b> 后坍塌<br><span style="font-size:10px;opacity:.4">必须在倒计时结束前找到文物并离开</span>`, btn: '走入洞窟', onConfirm() { goExplore(); } });
    setTimeout(() => { if (m.ov.parentNode) { m.close(); goExplore(); } }, 6000);
  });
}

function goExplore() {
  Dialogue.play(Dialogues.arch_timer).then(() => {
    SM.go('scene-cave-explore').then(() => initCaveExplore(GameState.totalSec));
  });
}
