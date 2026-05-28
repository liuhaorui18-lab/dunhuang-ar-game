/* 敦煌复苏计划 — data-shoot.js · 即使被击中也能继续 */
const DS = { nodes: [], rnd: 0, hp: 5, maxHp: 5, prog: 0, active: false, st: null, done: false };

function initDataShoot() {
  DS.done = false; DS.rnd = 0; DS.hp = DS.maxHp; DS.nodes = []; DS.prog = 0;
  updDS(); document.getElementById('ds-rounds').textContent = '数据包 0/' + Config.ds.rounds;
  document.getElementById('ds-progress-bar').style.width = '0%';
  startDS();
  onSceneCleanup(() => { DS.done = true; DS.active = false; clearInterval(DS.st); DS.nodes.forEach(e => e.remove()); DS.nodes = []; });
}

function startDS() { DS.rnd++; DS.prog = 0; DS.active = true; document.getElementById('ds-rounds').textContent = `数据包 ${DS.rnd}/${Config.ds.rounds}`; document.getElementById('ds-progress-bar').style.width = '0%';
  DS.st = setInterval(() => { if (!DS.active) return; spDS(); }, Config.ds.spawnMs);
  let p = 0; const pt = setInterval(() => { if (!DS.active) { clearInterval(pt); return; } p += 2; DS.prog = p; document.getElementById('ds-progress-bar').style.width = Math.min(p, 100) + '%'; if (p >= 100) { clearInterval(pt); DS.active = false; clearInterval(DS.st); clrDS(); if (DS.rnd >= Config.ds.rounds) finDS(); else setTimeout(startDS, 600); } }, 180);
}

function spDS() {
  const el = document.createElement('div'); el.className = 'data-node';
  const red = Math.random() > .3;
  const x = randInt(30, innerWidth - 80), y = -50;
  const sz = red ? randInt(40, 60) : randInt(30, 44);
  const imgs = red ? ['var(--img-data-red1)','var(--img-data-red2)','var(--img-data-red3)'] : ['var(--img-data-blue1)','var(--img-data-blue2)','var(--img-data-blue3)'];
  el.style.cssText = `position:fixed;z-index:20;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;border-radius:${red?'3px':'50%'};background:${imgs[randInt(0,2)]} center/contain no-repeat;cursor:pointer;filter:drop-shadow(0 0 8px ${red?'rgba(255,60,50,.5)':'rgba(0,180,255,.5)'});`;
  document.getElementById('scene-data-shoot').appendChild(el); DS.nodes.push(el);

  el.addEventListener('click', e => { e.stopPropagation();
    if (red) { sparks(e.clientX, e.clientY, 6, '#FF3B30'); el.remove(); DS.nodes = DS.nodes.filter(n => n !== el); }
    else { DS.hp--; updDS(); sparks(e.clientX, e.clientY, 3, '#F00'); el.style.transform = 'scale(1.4)'; setTimeout(() => el.remove(), 200); DS.nodes = DS.nodes.filter(n => n !== el);
      if (DS.hp <= 0) { DS.active = false; clearInterval(DS.st); clrDS(); toast('系统重启中……', 'prog', 2000); DS.hp = DS.maxHp; updDS(); setTimeout(startDS, 2000); } }
  });

  const spd = red ? Config.ds.redSpd : Config.ds.blueSpd;
  let cy = y;
  const ft = setInterval(() => { cy += spd; el.style.top = cy + 'px'; if (cy > innerHeight + 80) { clearInterval(ft); el.remove(); DS.nodes = DS.nodes.filter(n => n !== el); } }, 16);
}

function clrDS() { DS.nodes.forEach(e => e.remove()); DS.nodes = []; }
function updDS() { const c = document.getElementById('ds-health'); c.innerHTML = ''; for (let i = 0; i < DS.maxHp; i++) { const d = document.createElement('div'); d.className = 'ds-dot' + (i >= DS.hp ? ' lost' : ''); c.appendChild(d); } }

function finDS() { DS.done = true; clearInterval(DS.st); clrDS();
  Dialogue.play(Dialogues.prog_shoot_ok).then(() => { SM.go('scene-maze').then(() => initMaze()); }); }
