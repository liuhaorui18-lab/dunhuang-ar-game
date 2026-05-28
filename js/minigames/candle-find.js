/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — candle-find.js
   小佛像烛光寻找：黑暗中点中微弱烛光
   ═══════════════════════════════════════════════════════ */

function initCandleFind(wrap, callback) {
  const hasClue = GameState.hasClue('statue');
  const required = GameConfig.candle.requiredTaps; // 3 taps
  const visibleMs = GameConfig.candle.visibleDuration;
  const hideMs = GameConfig.candle.hideInterval;
  let taps = 0;
  let currentCandle = null;
  let showTimer = null;
  let hideTimer = null;
  let completed = false;

  wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;width:100%;">
      <div style="font-size:14px;font-weight:700;color:var(--gold-light)">黑暗中寻找烛光</div>
      <div id="candle-stage" style="
        position:relative; width:300px; height:300px;
        background:radial-gradient(ellipse at 50% 50%, rgba(20,12,5,.5), rgba(0,0,0,.95));
        border-radius:8px; overflow:hidden; cursor:crosshair;
        border:1px solid rgba(200,150,60,.1);
      ">
        <div style="position:absolute;inset:0;background:var(--small-statue) center/contain no-repeat;opacity:.15;pointer-events:none"></div>
      </div>
      <div style="font-size:11px;opacity:.5;text-align:center" id="candle-hint">黑暗中隐藏着小佛像……</div>
      <div style="font-size:13px;color:var(--gold-light)" id="candle-progress">烛光 0/${required}</div>
      <button class="btn btn-skip" id="candle-skip">跳过</button>
    </div>
  `;

  if (!hasClue) {
    Dialogue.play(Dialogues.statue_no_clue).then(() => callback(false));
    return;
  }

  Dialogue.play(Dialogues.statue_has_clue).then(() => {
    startCandleCycle();
  });

  function startCandleCycle() {
    if (completed) return;

    // Pick random position
    const stage = document.getElementById('candle-stage');
    if (!stage) return;

    // Remove old candle
    if (currentCandle) currentCandle.remove();

    const x = randInt(40, 260);
    const y = randInt(40, 260);

    const candle = document.createElement('div');
    candle.className = 'candle-light';
    candle.style.cssText = `
      position:absolute; left:${x}px; top:${y}px;
      width:32px; height:32px; border-radius:50%;
      background:var(--small-candle) center/contain no-repeat;
      filter:drop-shadow(0 0 8px rgba(255,180,40,.8)) drop-shadow(0 0 20px rgba(255,180,40,.4));
      opacity:0; transform:scale(.5);
      transition:opacity .8s, transform .8s;
      cursor:pointer; z-index:5;
      animation:candle-pulse 1.5s ease-in-out infinite;
    `;

    candle.addEventListener('click', e => {
      e.stopPropagation();
      if (completed) return;
      taps++;
      document.getElementById('candle-progress').textContent = `烛光 ${taps}/${required}`;
      spawnSparks(e.clientX, e.clientY, 10, '#FFB824');
      candle.remove();
      currentCandle = null;
      clearTimeout(showTimer);

      if (taps >= required) {
        completed = true;
        clearTimeout(hideTimer);
        document.getElementById('candle-hint').textContent = '小佛像找到了！';
        document.getElementById('candle-skip').style.display = 'none';
        // Show the statue
        const statueEl = document.createElement('div');
        statueEl.style.cssText = `
          position:absolute; inset:0;
          background:var(--small-statue) center/contain no-repeat;
          z-index:3; animation:fade-in 1s ease;
        `;
        document.getElementById('candle-stage').appendChild(statueEl);
        setTimeout(() => {
          Dialogue.play(Dialogues.statue_success).then(() => callback(true));
        }, 800);
      } else {
        // Cycle continues
        document.getElementById('candle-hint').textContent = '还有……再看看！';
        setTimeout(startCandleCycle, 800);
      }
    });

    stage.appendChild(candle);
    currentCandle = candle;

    // Fade in
    requestAnimationFrame(() => {
      candle.style.opacity = '1';
      candle.style.transform = 'scale(1)';
    });

    // Auto-hide after duration
    showTimer = setTimeout(() => {
      if (completed) return;
      candle.style.opacity = '0';
      candle.style.transform = 'scale(.5)';
      document.getElementById('candle-hint').textContent = '火光消失了……再找找？';

      hideTimer = setTimeout(() => {
        if (completed) return;
        startCandleCycle();
      }, 1000);
    }, visibleMs);
  }

  wrap.querySelector('#candle-skip').addEventListener('click', () => {
    Dialogue.play(Dialogues.statue_fail).then(() => callback(false));
  });

  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes candle-pulse {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(255,180,40,.8)) drop-shadow(0 0 20px rgba(255,180,40,.4)); }
      50% { filter: drop-shadow(0 0 14px rgba(255,180,40,1)) drop-shadow(0 0 30px rgba(255,180,40,.6)); }
    }
  `;
  document.head.appendChild(style);
}
