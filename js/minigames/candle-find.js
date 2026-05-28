/* 敦煌复苏计划 — candle-find.js · 小佛像烛光 */
function initCandle(ov, cb) {
  const hasClue = GameState.hasClue('statue');
  ov.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;width:100%">
    <div style="font-size:15px;font-weight:700;color:var(--gold-light)">黑暗中寻找烛光</div>
    <div id="c-stage" style="position:relative;width:280px;height:280px;background:radial-gradient(ellipse at 50% 50%,rgba(20,12,5,.4),rgba(0,0,0,.95));border-radius:8px;overflow:hidden;cursor:crosshair;border:1px solid rgba(200,150,60,.08)"></div>
    <div style="font-size:10px;opacity:.5;text-align:center" id="c-hint">黑暗中隐藏着小佛像……</div>
    <div style="font-size:13px;color:var(--gold-light)" id="c-prog">烛光 0/${Config.candle.taps}</div>
    <button class="btn btn-arch" id="c-retry" style="display:none">重新寻找</button>
    <button class="btn btn-skip" id="c-skip">跳过此文物</button></div>`;

  if (!hasClue) { Dialogue.play(Dialogues.statue_no).then(() => cb(false)); return; }
  Dialogue.play(Dialogues.statue_ok).then(() => startC());

  let taps = 0, cur = null, sTm = null, hTm = null, done = false;

  function startC() {
    taps = 0; done = false; clearTimeout(sTm); clearTimeout(hTm);
    if (cur) cur.remove();
    document.getElementById('c-stage').querySelectorAll('.candle-light').forEach(e => e.remove());
    document.getElementById('c-prog').textContent = `烛光 0/${Config.candle.taps}`;
    document.getElementById('c-hint').textContent = '黑暗中隐藏着小佛像……';
    document.getElementById('c-retry').style.display = 'none';
    document.getElementById('c-skip').style.display = '';
    cycle();
  }

  function cycle() {
    if (done) return;
    if (cur) cur.remove();
    const stg = document.getElementById('c-stage'); if (!stg) return;
    const x = randInt(30, 240), y = randInt(30, 240);
    const el = document.createElement('div'); el.className = 'candle-light';
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:34px;height:34px;border-radius:50%;background:var(--img-sm-candle) center/contain no-repeat;filter:drop-shadow(0 0 10px rgba(255,180,40,.8)) drop-shadow(0 0 24px rgba(255,180,40,.4));opacity:0;transform:scale(.5);cursor:pointer;z-index:5;transition:opacity .7s,transform .7s;animation:pk 1.6s ease-in-out infinite;`;
    el.addEventListener('click', e => { e.stopPropagation(); if (done) return; taps++; document.getElementById('c-prog').textContent = `烛光 ${taps}/${Config.candle.taps}`; sparks(e.clientX, e.clientY, 8, '#FFB824'); el.remove(); cur = null; clearTimeout(sTm); if (taps >= Config.candle.taps) { winC(); } else { document.getElementById('c-hint').textContent = '还有……再看看！'; setTimeout(cycle, 700); } });
    stg.appendChild(el); cur = el;
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'scale(1)'; });
    sTm = setTimeout(() => { if (done) return; el.style.opacity = '0'; el.style.transform = 'scale(.5)'; document.getElementById('c-hint').textContent = '火光消失了……再找找？'; hTm = setTimeout(() => { if (!done) cycle(); }, 900); }, Config.candle.visible);
  }

  function winC() {
    done = true; clearTimeout(sTm); clearTimeout(hTm);
    document.getElementById('c-hint').textContent = '小佛像找到了！';
    document.getElementById('c-skip').style.display = 'none';
    const stg = document.getElementById('c-stage');
    const img = document.createElement('div');
    img.style.cssText = 'position:absolute;inset:0;background:var(--img-sm-statue) center/contain no-repeat;z-index:3;animation:fade-in .8s;';
    stg.appendChild(img);
    setTimeout(() => Dialogue.play(Dialogues.statue_win).then(() => cb(true)), 700);
  }

  document.getElementById('c-retry').addEventListener('click', () => startC());
  document.getElementById('c-skip').addEventListener('click', () => { done = true; clearTimeout(sTm); clearTimeout(hTm); Dialogue.play(Dialogues.statue_lose).then(() => cb(false)); });
}
