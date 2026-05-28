/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — data-shoot.js
   程序员：数据击碎音游（点击红色，避开蓝色）
   ═══════════════════════════════════════════════════════ */

const DS = {
  dataNodes: [],
  round: 0,
  totalRounds: 3,
  health: 5,
  maxHealth: 5,
  progress: 0,
  roundActive: false,
  spawnTimer: null,
  animId: null,
  done: false,
};

function initDataShoot() {
  const cfg = GameConfig.dataShoot;
  DS.done = false;
  DS.round = 0;
  DS.health = cfg.totalRounds > 0 ? 5 : 5;
  DS.totalRounds = cfg.totalRounds;
  DS.dataNodes = [];
  DS.progress = 0;

  updateDSHealth();
  document.getElementById('ds-rounds').textContent = `数据包 0/${DS.totalRounds}`;
  document.getElementById('ds-progress-bar').style.width = '0%';

  // Start first round
  startDSRound();

  onSceneCleanup(() => {
    DS.done = true;
    DS.roundActive = false;
    clearInterval(DS.spawnTimer);
    DS.dataNodes.forEach(el => el.remove());
    DS.dataNodes = [];
  });
}

function startDSRound() {
  DS.round++;
  DS.progress = 0;
  DS.roundActive = true;
  document.getElementById('ds-rounds').textContent = `数据包 ${DS.round}/${DS.totalRounds}`;
  document.getElementById('ds-progress-bar').style.width = '0%';

  const cfg = GameConfig.dataShoot;

  // Spawn data nodes
  DS.spawnTimer = setInterval(() => {
    if (!DS.roundActive) return;
    spawnDataNode();
  }, cfg.spawnInterval);

  // Auto-progress fill
  let prog = 0;
  const progTimer = setInterval(() => {
    if (!DS.roundActive) { clearInterval(progTimer); return; }
    prog += 2;
    DS.progress = prog;
    document.getElementById('ds-progress-bar').style.width = Math.min(prog, 100) + '%';

    if (prog >= 100) {
      clearInterval(progTimer);
      DS.roundActive = false;
      clearInterval(DS.spawnTimer);
      clearDataNodes();
      if (DS.round >= DS.totalRounds) {
        finishDataShoot();
      } else {
        setTimeout(startDSRound, 600);
      }
    }
  }, 200);
}

function spawnDataNode() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isRed = Math.random() > 0.35; // 65% red (destroy), 35% blue (avoid)

  const el = document.createElement('div');
  el.className = 'data-node';
  el.dataset.red = isRed ? '1' : '0';

  const x = randInt(40, w - 40);
  const startY = -60;
  const speed = isRed ? GameConfig.dataShoot.redSpeed : GameConfig.dataShoot.blueSpeed;

  const size = isRed ? randInt(36, 56) : randInt(28, 42);

  el.style.cssText = `
    position:fixed; z-index:15;
    left:${x}px; top:${startY}px;
    width:${size}px; height:${size}px;
    border-radius:${isRed ? '3px' : '50%'};
    background:center/contain no-repeat;
    cursor:pointer;
    transition:transform .1s;
  `;

  // Red = destroy, Blue = avoid
  if (isRed) {
    const redImgs = ['var(--data-red1)', 'var(--data-red2)', 'var(--data-red3)'];
    el.style.backgroundImage = redImgs[randInt(0, 2)];
    el.style.filter = 'drop-shadow(0 0 6px rgba(255,60,50,.6))';
  } else {
    const blueImgs = ['var(--data-blue1)', 'var(--data-blue2)', 'var(--data-blue3)'];
    el.style.backgroundImage = blueImgs[randInt(0, 2)];
    el.style.filter = 'drop-shadow(0 0 6px rgba(0,180,255,.6))';
  }

  // Click to destroy red nodes
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (isRed) {
      // Good — destroy red data
      spawnSparks(e.clientX, e.clientY, 8, '#FF3B30');
      el.remove();
      DS.dataNodes = DS.dataNodes.filter(n => n !== el);
    } else {
      // Bad — hit blue data
      DS.health--;
      updateDSHealth();
      spawnSparks(e.clientX, e.clientY, 4, '#FF0000');
      el.style.transform = 'scale(1.5)';
      setTimeout(() => el.remove(), 200);

      if (DS.health <= 0) {
        // Dead — retry round
        DS.roundActive = false;
        clearInterval(DS.spawnTimer);
        clearDataNodes();
        toast('电脑死机了！重新处理数据……', 'prog', 2500);
        setTimeout(() => {
          DS.health = DS.maxHealth;
          updateDSHealth();
          startDSRound();
        }, 2000);
      }
    }
  });

  document.getElementById('scene-data-shoot').appendChild(el);
  DS.dataNodes.push(el);

  // Animate falling
  const fallSpeed = isRed ? GameConfig.dataShoot.redSpeed : GameConfig.dataShoot.blueSpeed;
  let y = startY;
  const fallTimer = setInterval(() => {
    y += fallSpeed;
    el.style.top = y + 'px';
    if (y > h + 80) {
      clearInterval(fallTimer);
      el.remove();
      DS.dataNodes = DS.dataNodes.filter(n => n !== el);
    }
  }, 16);
}

function clearDataNodes() {
  DS.dataNodes.forEach(el => el.remove());
  DS.dataNodes = [];
}

function updateDSHealth() {
  const container = document.getElementById('ds-health');
  container.innerHTML = '';
  for (let i = 0; i < DS.maxHealth; i++) {
    const dot = document.createElement('div');
    dot.className = 'ds-health-dot' + (i >= DS.health ? ' lost' : '');
    container.appendChild(dot);
  }
}

function finishDataShoot() {
  DS.done = true;
  clearInterval(DS.spawnTimer);
  clearDataNodes();

  // Calculate performance
  GameState.rhythmScore = 3; // max score for programmer

  Dialogue.play(Dialogues.prog_shoot_done).then(() => {
    SM.go('scene-maze').then(() => initMaze());
  });
}
