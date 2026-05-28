/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — excavation.js
   考古学家：开凿音游（节奏打击游戏）
   ═══════════════════════════════════════════════════════ */

const EX = {
  canvas: null, ctx: null,
  W: 0, H: 0,
  notes: [],            // falling notes
  lanes: 5,
  noteSpeed: 2.5,
  noteRadius: 22,
  hitZone: { y: 0, h: 56 },
  score: 0, perfect: 0,
  total: 12,            // total notes to hit
  spawned: 0,
  forceValue: 0.5,      // current simulated force (0~1)
  forceHistory: [],
  spawnTimer: null,
  animId: null,
  done: false,
  _lastTap: 0,
  _feedbacks: [],
};

function initExcavation() {
  EX.canvas = document.getElementById('excavation-canvas');
  EX.ctx = EX.canvas.getContext('2d');
  EX.done = false;
  EX.score = 0;
  EX.perfect = 0;
  EX.spawned = 0;
  EX.notes = [];
  EX.forceHistory = [];

  // Show HUD
  document.getElementById('ex-score').style.display = '';
  document.getElementById('ex-score').textContent = '0 / ' + EX.total;
  document.getElementById('force-meter').style.display = '';
  document.getElementById('ex-feedback').style.display = '';

  // Resize
  resizeExcavation();
  window.addEventListener('resize', resizeExcavation);

  // Hit zone at 80% height
  EX.hitZone.y = EX.H * 0.78;
  EX.hitZone.h = 56;

  // Touch / click handler
  EX.canvas.addEventListener('click', e => {
    e.preventDefault();
    handleExcavationTap(getPos(e));
  });
  EX.canvas.addEventListener('touchend', e => {
    e.preventDefault();
    handleExcavationTap(getPos(e));
  });

  // Simulate force from motion
  Motion.on(_updateForce);

  // Start spawning notes
  EX.spawnTimer = setInterval(() => {
    if (EX.done) return;
    if (EX.spawned >= EX.total) {
      clearInterval(EX.spawnTimer);
      return;
    }
    spawnNote();
    EX.spawned++;
  }, GameConfig.excavation.spawnInterval);

  // Start render loop
  EX.animId = requestAnimationFrame(drawExcavation);
}

function resizeExcavation() {
  EX.canvas.width = window.innerWidth;
  EX.canvas.height = window.innerHeight;
  EX.W = EX.canvas.width;
  EX.H = EX.canvas.height;
  EX.hitZone.y = EX.H * 0.78;
}

function spawnNote() {
  const laneW = EX.W / EX.lanes;
  const lane = randInt(0, EX.lanes - 1);
  EX.notes.push({
    x: lane * laneW + laneW / 2,
    y: -30,
    lane: lane,
    radius: EX.noteRadius,
    hit: false,
  });
}

function handleExcavationTap(pos) {
  if (EX.done) return;
  const now = Date.now();
  if (now - EX._lastTap < 80) return;
  EX._lastTap = now;

  // Check each note
  for (let i = EX.notes.length - 1; i >= 0; i--) {
    const n = EX.notes[i];
    if (n.hit) continue;
    const dist = Math.hypot(pos.x - n.x, pos.y - EX.hitZone.y);
    const dy = Math.abs(n.y - EX.hitZone.y);

    if (dy < GameConfig.excavation.goodWindow && dist < EX.noteRadius * 2) {
      n.hit = true;
      EX.score++;

      // Judge: perfect or good based on distance from center
      const isPerfect = dy < GameConfig.excavation.hitWindow;
      if (isPerfect) EX.perfect++;

      // Show feedback
      showExcavationFeedback(n.x, isPerfect ? 'perfect' : 'good');

      // Update HUD
      document.getElementById('ex-score').textContent = EX.score + ' / ' + EX.total;

      spawnSparks(n.x, EX.hitZone.y, isPerfect ? 10 : 5, isPerfect ? '#FFD700' : '#C8963C');

      // Check if done
      if (EX.score >= EX.total) {
        finishExcavation();
      }
      return;
    }
  }

  // Miss — penalize force
  showExcavationFeedback(pos.x, 'miss');
}

function showExcavationFeedback(x, type) {
  const el = document.getElementById('ex-feedback');
  if (type === 'perfect') {
    el.textContent = '完美！'; el.style.color = '#FFD700'; el.style.opacity = '1';
  } else if (type === 'good') {
    el.textContent = '不错'; el.style.color = 'var(--gold-light)'; el.style.opacity = '1';
  } else {
    el.textContent = '偏了'; el.style.color = 'var(--danger-red)'; el.style.opacity = '1';
  }
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.style.opacity = '0'; }, 600);
}

function _updateForce(data) {
  if (EX.done) return;
  if (data.type !== 'motion') return; // only process motion events
  // Map acceleration to force value (0~1)
  const mag = Math.abs(data.ay || 0);
  const f = clamp(mag / 15, 0.05, 1);
  EX.forceValue = f;
  EX.forceHistory.push(f);

  // Update force meter
  const fill = document.getElementById('force-fill');
  if (fill) fill.style.height = (f * 100) + '%';

  // Harsh force = bad
  if (f > 0.75 || f < 0.15) {
    GameState.rhythmMistakes++;
  }
}

function drawExcavation() {
  if (EX.done) return;
  const ctx = EX.ctx;
  const W = EX.W, H = EX.H;

  ctx.clearRect(0, 0, W, H);

  // Draw lane dividers
  const laneW = W / EX.lanes;
  ctx.strokeStyle = 'rgba(200,150,60,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < EX.lanes; i++) {
    ctx.beginPath();
    ctx.moveTo(i * laneW, 0);
    ctx.lineTo(i * laneW, H);
    ctx.stroke();
  }

  // Draw hit zone
  const hz = EX.hitZone;
  ctx.fillStyle = 'rgba(200,150,60,0.08)';
  ctx.fillRect(0, hz.y - hz.h / 2, W, hz.h);
  ctx.strokeStyle = 'rgba(200,150,60,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, hz.y);
  ctx.lineTo(W, hz.y);
  ctx.stroke();

  // Draw notes
  EX.notes.forEach(n => {
    if (n.hit) return;
    const alpha = n.y < 0 ? 0 : n.y > H ? 0 : 1;
    if (alpha === 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Note body
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
    grad.addColorStop(0, '#D4A853');
    grad.addColorStop(1, '#8B6914');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ring
    ctx.strokeStyle = 'rgba(200,150,60,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  });

  // Move notes
  EX.notes.forEach(n => {
    if (!n.hit) n.y += EX.noteSpeed;
  });

  // Check for missed notes (fell off screen)
  let missed = 0;
  EX.notes.forEach(n => {
    if (!n.hit && n.y > H + 30) {
      n.hit = true; // mark as "handled"
      missed++;
      GameState.rhythmMistakes++;
    }
  });

  EX.animId = requestAnimationFrame(drawExcavation);
}

function finishExcavation() {
  EX.done = true;
  clearInterval(EX.spawnTimer);
  cancelAnimationFrame(EX.animId);
  GameState.rhythmScore = EX.perfect;

  // Hide HUD
  document.getElementById('ex-score').style.display = 'none';
  document.getElementById('force-meter').style.display = 'none';
  document.getElementById('ex-feedback').style.display = 'none';

  // Cleanup
  Motion.off(_updateForce);

  // Play dialogue
  Dialogue.play(Dialogues.arch_excavation_done).then(() => {
    // Cave collapse animation
    Dialogue.play(Dialogues.arch_after_collapse).then(() => {
      SM.go('scene-clue-catch').then(() => initClueCatch());
    });
  });
}
