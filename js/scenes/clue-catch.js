/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — clue-catch.js
   考古学家：线索捕捉小游戏
   ═══════════════════════════════════════════════════════ */

const CC = {
  clues: [],            // flying clue elements
  caught: 0,           // caught useful clues
  target: 2,           // need 2 useful clues
  timer: null,
  remaining: 18,
  spawnTimer: null,
  done: false,
  bounds: { w: 0, h: 0 },
};

function initClueCatch() {
  const cfg = GameConfig.clueCatch;
  CC.done = false;
  CC.caught = 0;
  CC.target = cfg.targetClues;
  CC.remaining = cfg.duration;
  CC.clues = [];
  CC.bounds.w = window.innerWidth;
  CC.bounds.h = window.innerHeight;

  document.getElementById('cc-score').textContent = `线索 ${CC.caught}/${CC.target}`;
  document.getElementById('cc-timer').textContent = `${CC.remaining}s`;

  // Spawn clues periodically
  CC.spawnTimer = setInterval(() => {
    if (CC.done) return;
    spawnClue();
  }, cfg.spawnInterval);

  // Initial batch
  for (let i = 0; i < 4; i++) {
    setTimeout(() => spawnClue(), i * 300);
  }

  // Register cleanup
  onSceneCleanup(() => {
    CC.done = true;
    clearInterval(CC.spawnTimer);
    clearInterval(CC.timer);
    CC.clues.forEach(el => el.remove());
    CC.clues = [];
    document.querySelectorAll('.clue-flyer').forEach(el => el.remove());
  });

  // Countdown
  CC.timer = setInterval(() => {
    CC.remaining--;
    document.getElementById('cc-timer').textContent = `${CC.remaining}s`;
    if (CC.remaining <= 0) {
      finishClueCatch();
    }
  }, 1000);
}

function spawnClue() {
  if (CC.done) return;

  const isUseful = Math.random() > 0.45; // 55% chance useful (not junk)
  const types = isUseful ? GameConfig.clueCatch.clueTypes : GameConfig.clueCatch.junkTypes;
  const type = types[randInt(0, types.length - 1)];

  const el = document.createElement('div');
  el.className = 'clue-flyer';
  el.dataset.type = type;
  el.dataset.useful = isUseful ? '1' : '0';

  // Random start position (any edge)
  const w = CC.bounds.w, h = CC.bounds.h;
  const edge = randInt(0, 3);
  let startX, startY, endX, endY;
  if (edge === 0) { startX = -80; startY = randInt(0, h); endX = w + 80; endY = randInt(0, h); }
  else if (edge === 1) { startX = w + 80; startY = randInt(0, h); endX = -80; endY = randInt(0, h); }
  else if (edge === 2) { startX = randInt(0, w); startY = -80; endX = randInt(0, w); endY = h + 80; }
  else { startX = randInt(0, w); startY = h + 80; endX = randInt(0, w); endY = -80; }

  el.style.cssText = `
    position:fixed; z-index:20;
    left:${startX}px; top:${startY}px;
    width:70px; height:70px;
    background:center/contain no-repeat;
    cursor:pointer;
    animation:clue-fly ${randFloat(3, 6)}s linear forwards;
  `;

  // Set background based on type
  const bgMap = {
    mural: 'var(--clue-mural)', scripture: 'var(--clue-script)',
    buddha: 'var(--clue-buddha)', statue: 'var(--clue-statue)',
    junk1: 'var(--clue-junk1)', junk2: 'var(--clue-junk2)',
    junk3: 'var(--clue-junk3)', junk4: 'var(--clue-junk4)',
  };

  if (bgMap[type]) {
    el.style.backgroundImage = bgMap[type];
  } else {
    // Fallback colored dots
    el.style.borderRadius = '50%';
    el.style.background = isUseful ? 'rgba(0,180,240,.8)' : 'rgba(255,60,50,.8)';
  }

  // Fly animation
  const flyStyle = document.createElement('style');
  flyStyle.textContent = `
    @keyframes clue-fly {
      to { left:${endX}px; top:${endY}px; opacity:0.2; }
    }
  `;
  document.head.appendChild(flyStyle);

  // Click handler
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (CC.done) return;
    if (isUseful) {
      CC.caught++;
      document.getElementById('cc-score').textContent = `线索 ${CC.caught}/${CC.target}`;
      spawnSparks(e.clientX, e.clientY, 12, '#4FC3F7');
      el.remove();

      if (CC.caught >= CC.target) {
        finishClueCatch();
      }
    } else {
      // Junk - negative feedback
      el.style.filter = 'brightness(2)';
      setTimeout(() => el.remove(), 200);
      spawnSparks(e.clientX, e.clientY, 4, '#FF3B30');
      toast('这是乱码数据！', 'arch', 1000);
    }
  });

  document.getElementById('scene-clue-catch').appendChild(el);
  CC.clues.push(el);

  // Auto-remove after animation
  setTimeout(() => {
    el.remove();
    // Remove from array
    const idx = CC.clues.indexOf(el);
    if (idx >= 0) CC.clues.splice(idx, 1);
    // Clean up style
    flyStyle.remove();
  }, 6500);
}

function finishClueCatch() {
  if (CC.done) return;
  CC.done = true;
  clearInterval(CC.spawnTimer);
  clearInterval(CC.timer);

  // Store collected clues
  if (CC.caught > 0) {
    // Assign random clue types based on what was caught
    const types = shuffle(GameConfig.clueCatch.clueTypes);
    for (let i = 0; i < CC.caught; i++) {
      GameState.cluesCollected.push(types[i]);
    }
  }

  // Clean up remaining clue elements
  CC.clues.forEach(el => el.remove());
  CC.clues = [];

  // Calculate countdown
  GameState.calcCountdown();

  // Dialogue → Countdown reveal
  Dialogue.play(Dialogues.arch_clue_done).then(() => {
    SM.go('scene-countdown-reveal').then(() => {
      showCountdownThenExplore();
    });
  });
}

// ─── Countdown Reveal ──────────────────────────────────
function showCountdownThenExplore() {
  const totalSec = GameState.totalSeconds;
  const display = `${GameState.countdownMinutes}:${GameState.countdownSeconds.toString().padStart(2, '0')}`;

  const modal = Modal.create({
    theme: 'arch',
    title: '⚠ 洞窟坍塌倒计时',
    content: `<p>洞窟将在 <span style="font-size:20px;color:var(--gold-light)">${display}</span> 后坍塌</p><p style="font-size:11px;opacity:.5;margin-top:8px">必须在倒计时结束前离开洞窟</p>`,
    btnText: '走入洞窟',
    onConfirm: () => {
      Dialogue.play(Dialogues.arch_countdown).then(() => {
        SM.go('scene-cave-explore').then(() => {
          initCaveExplore(totalSec);
        });
      });
    }
  });

  // Auto-close if no interaction after 5s
  setTimeout(() => {
    if (modal.overlay.parentNode) {
      modal.close();
      SM.go('scene-cave-explore').then(() => initCaveExplore(totalSec));
    }
  }, 5000);
}
