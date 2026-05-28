/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — cave-explore.js
   洞窟探索：视角转动 + 文物查找 + 微解密调度
   ═══════════════════════════════════════════════════════ */

const Cave = {
  timer: null,
  timerDisplay: null,
  totalTime: 0,
  angle: 0,          // current view angle (0-360 deg mapped to artifacts)
  maxAngle: 360,
  artifactAngles: {
    mural: 0,        // 壁画 at 0°
    scripture: 90,   // 经书 at 90°
    buddha: 180,     // 大佛像 at 180°
    statue: 270,     // 小佛像 at 270°
  },
  threshold: 25,    // degrees within which artifact is "in view"
  nearArtifact: null,
  _lastGamma: 0,
  _touchStart: null,
  _touchAngle: 0,
};

function initCaveExplore(totalSec) {
  Cave.totalTime = totalSec;
  Cave.angle = 0;
  Cave.nearArtifact = null;

  // Timer display
  Cave.timerDisplay = document.getElementById('cave-timer');
  Cave.timerDisplay.style.display = '';
  Cave.timerDisplay.textContent = fmtTime(Cave.totalTime);
  Cave.timerDisplay.className = 'hud-timer arch';

  // Compass
  document.getElementById('compass-bar').style.display = '';
  updateCompass(0);

  // Torch glow follows touch/mouse
  const torch = document.getElementById('torch-glow');
  const hint = document.getElementById('artifact-hint');

  // Cave area touch handling
  const caveArea = document.getElementById('scene-cave-explore');
  caveArea.addEventListener('mousemove', e => {
    torch.style.left = e.clientX + 'px';
    torch.style.top = e.clientY + 'px';
  });
  caveArea.addEventListener('touchmove', e => {
    const p = getPos(e);
    torch.style.left = p.x + 'px';
    torch.style.top = p.y + 'px';
  }, { passive: true });

  // Rotation via touch drag (or device orientation)
  caveArea.addEventListener('touchstart', e => {
    Cave._touchStart = getPos(e);
    Cave._touchAngle = Cave.angle;
  });

  caveArea.addEventListener('touchmove', e => {
    if (!Cave._touchStart) return;
    const p = getPos(e);
    const dx = p.x - Cave._touchStart.x;
    Cave.angle = ((Cave._touchAngle - dx * 0.5) % 360 + 360) % 360;
    updateCompass(Cave.angle);
    checkNearArtifact();
  });

  caveArea.addEventListener('touchend', () => { Cave._touchStart = null; });

  // Device orientation for rotation
  Motion.on(data => {
    if (data.type !== 'orient') return;
    // Use gamma (left-right tilt) for rotation
    const gamma = data.gamma || 0;
    const smooth = Cave._lastGamma * 0.7 + gamma * 0.3;
    Cave._lastGamma = smooth;
    Cave.angle = ((smooth + 45) % 360 + 360) % 360;
    updateCompass(Cave.angle);
    checkNearArtifact();
  });

  // Keyboard for desktop: arrow keys
  const _keyHandler = e => {
    if (SM.current !== 'scene-cave-explore') return;
    if (e.key === 'ArrowLeft') { Cave.angle = (Cave.angle + 3) % 360; updateCompass(Cave.angle); checkNearArtifact(); }
    if (e.key === 'ArrowRight') { Cave.angle = (Cave.angle - 3 + 360) % 360; updateCompass(Cave.angle); checkNearArtifact(); }
  };
  window.addEventListener('keydown', _keyHandler);

  // Countdown
  Cave.timer = new CountdownTimer(Cave.totalTime, (rem) => {
    Cave.timerDisplay.textContent = fmtTime(rem);
    if (rem <= 30) Cave.timerDisplay.style.color = 'var(--danger-red)';
    else if (rem <= 60) Cave.timerDisplay.style.color = '#FFA726';
  }, () => {
    finishCaveExploration();
  });
  Cave.timer.start();

  // Register cleanup
  onSceneCleanup(() => {
    if (Cave.timer) Cave.timer.stop();
    Cave.timerDisplay.style.display = 'none';
    document.getElementById('compass-bar').style.display = 'none';
    document.getElementById('minigame-wrap').style.display = 'none';
    Motion.offAll();
    window.removeEventListener('keydown', _keyHandler);
  });
}

function updateCompass(angle) {
  const dot = document.getElementById('compass-dot');
  if (dot) {
    dot.style.left = ((angle % 360) / 360 * 100) + '%';
  }
}

function checkNearArtifact() {
  const hint = document.getElementById('artifact-hint');
  let nearest = null;
  let nearestDist = Infinity;

  for (const [name, targetDeg] of Object.entries(Cave.artifactAngles)) {
    // Check if this artifact was already completed
    if (GameState.artifactsCompleted.includes(name)) continue;

    let dist = Math.abs(Cave.angle - targetDeg);
    if (dist > 180) dist = 360 - dist;

    if (dist < Cave.threshold && dist < nearestDist) {
      nearestDist = dist;
      nearest = name;
    }
  }

  if (nearest !== Cave.nearArtifact) {
    Cave.nearArtifact = nearest;
    if (nearest) {
      const names = { mural: '壁画', scripture: '经书', buddha: '大佛像', statue: '小佛像' };
      hint.textContent = '发现' + names[nearest] + ' — 点击进入';
      hint.style.opacity = '1';
    } else {
      hint.style.opacity = '0';
    }
  }

  // Show clickable area
  if (nearest) {
    hint.style.cursor = 'pointer';
    hint.onclick = () => enterArtifact(nearest);
  }
}

function enterArtifact(name) {
  Cave.timer.stop();
  Cave.nearArtifact = null;
  document.getElementById('artifact-hint').style.opacity = '0';

  // Remove old minigame content
  const wrap = document.getElementById('minigame-wrap');
  wrap.innerHTML = '';
  wrap.style.display = '';

  // Launch appropriate minigame
  switch (name) {
    case 'mural':
      initMuralPuzzle(wrap, onMinigameComplete);
      break;
    case 'scripture':
      initScriptureSort(wrap, onMinigameComplete);
      break;
    case 'buddha':
      initBuddhaDust(wrap, onMinigameComplete);
      break;
    case 'statue':
      initCandleFind(wrap, onMinigameComplete);
      break;
  }

  function onMinigameComplete(success) {
    wrap.style.display = 'none';
    if (success) {
      GameState.artifactsCompleted.push(name);
    } else {
      GameState.failedArtifacts.push(name);
    }

    // Check if all artifacts attempted (or all 4 done)
    const allDone = GameState.artifactsCompleted.length + GameState.failedArtifacts.length >= 4;
    // Or if all 4 are completed
    if (GameState.artifactsCompleted.length >= 4 || allDone) {
      finishCaveExploration();
    } else {
      // Resume exploration
      Cave.timer.start();
      document.getElementById('artifact-hint').style.opacity = '0';
    }
  }
}

function finishCaveExploration() {
  if (Cave.timer) Cave.timer.stop();
  Cave.timerDisplay.style.display = 'none';
  document.getElementById('compass-bar').style.display = 'none';
  document.getElementById('minigame-wrap').style.display = 'none';

  SM.go('scene-ending').then(() => showEnding());
}
