/* 敦煌复苏计划 — scripture-sort.js · 经卷排序 */
function initScrip(ov, cb) {
  const hasClue = GameState.hasClue('scripture');
  ov.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;width:100%">
    <div style="font-size:15px;font-weight:700;color:var(--gold-light)">整理经卷顺序</div>
    <div id="s-row" style="display:flex;align-items:flex-end;gap:6px;height:160px;justify-content:center"></div>
    <div style="font-size:10px;opacity:.5;text-align:center">点击选中后再点击目标位置交换</div>
    <button class="btn btn-arch" id="s-retry" style="display:none">重新排序</button>
    <button class="btn btn-skip" id="s-skip">跳过此文物</button></div>`;

  if (!hasClue) { Dialogue.play(Dialogues.scrip_no).then(() => cb(false)); return; }
  Dialogue.play(Dialogues.scrip_ok).then(() => startS());

  const scripImgs = [
    { off: 'var(--img-scrip-l1-off)', on: 'var(--img-scrip-l1-on)', fixed: 'var(--img-scrip-l1-f)' },
    { off: 'var(--img-scrip-l2-off)', on: 'var(--img-scrip-l2-on)', fixed: 'var(--img-scrip-l2-f)' },
    { off: 'var(--img-scrip-l3-off)', on: 'var(--img-scrip-l3-on)', fixed: 'var(--img-scrip-l3-f)' },
    { off: 'var(--img-scrip-l4-off)', on: 'var(--img-scrip-l4-on)', fixed: 'var(--img-scrip-l4-f)' },
    { off: 'var(--img-scrip-l5-off)', on: 'var(--img-scrip-l5-on)', fixed: 'var(--img-scrip-l5-f)' },
    { off: 'var(--img-scrip-l6-off)', on: 'var(--img-scrip-l6-on)' },
  ];
  const hts = [140, 155, 120, 145, 125, 115];
  let order = [], selIdx = -1, done = false;

  function startS() {
    order = shuffle([0,1,2,3,4,5]); selIdx = -1; done = false;
    document.getElementById('s-retry').style.display = 'none';
    document.getElementById('s-skip').style.display = '';
    render();
  }

  function render() {
    const row = document.getElementById('s-row'); if (!row) return;
    row.innerHTML = '';
    order.forEach((orig, pos) => {
      const el = document.createElement('div');
      el.style.cssText = `width:46px;height:${hts[pos]}px;border-radius:4px;cursor:pointer;background:${pos === selIdx ? (scripImgs[orig].on || scripImgs[orig].fixed) : (scripImgs[orig].off || scripImgs[orig].fixed)} center/contain no-repeat;border:2px solid ${pos === selIdx ? 'var(--gold)' : 'transparent'};box-shadow:${pos === selIdx ? '0 0 10px var(--gold-glow)' : 'none'};transition:all .3s;`;
      el.addEventListener('click', () => {
        if (done) return;
        if (selIdx === -1) { selIdx = pos; render(); }
        else { [order[selIdx], order[pos]] = [order[pos], order[selIdx]]; selIdx = -1; render(); if (order.every((v, i) => v === Answers.scripOrder[i])) winS(); }
      });
      row.appendChild(el);
    });
  }

  function winS() {
    done = true; document.getElementById('s-skip').style.display = 'none';
    document.getElementById('s-row').querySelectorAll('div').forEach((el, i) => {
      el.style.border = '2px solid var(--gold)';
      el.style.background = (scripImgs[order[i]].fixed || scripImgs[order[i]].on) + ' center/contain no-repeat';
    });
    setTimeout(() => Dialogue.play(Dialogues.scrip_win).then(() => cb(true)), 400);
  }

  document.getElementById('s-retry').addEventListener('click', () => startS());
  document.getElementById('s-skip').addEventListener('click', () => { Dialogue.play(Dialogues.scrip_lose).then(() => cb(false)); });
}
