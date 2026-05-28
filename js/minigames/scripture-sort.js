/* 敦煌复苏计划 — scripture-sort.js · 经卷排序 · 直接使用图素材 */
function initScrip(ov, cb) {
  const hasClue = GameState.hasClue('scripture');
  ov.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px;width:100%;max-width:440px">
    <div style="font-size:15px;font-weight:700;color:var(--gold-light)">整理经卷顺序</div>
    <div id="s-row" style="display:flex;align-items:flex-end;gap:5px;height:170px;justify-content:center;background:url(assets/常用ui/操作提示框.png) center/100% 100% no-repeat;padding:12px 8px;border-radius:8px;min-width:300px"></div>
    <div style="font-size:10px;opacity:.5;text-align:center">点击选中一张 · 再点击另一张交换位置</div>
    <div style="font-size:11px;color:var(--gold-light)" id="s-status"></div>
    <button class="btn btn-arch" id="s-retry" style="display:none">重新排序</button>
    <button class="btn btn-skip" id="s-skip">跳过此文物</button></div>`;

  if (!hasClue) { Dialogue.play(Dialogues.scrip_no).then(() => cb(false)); return; }
  Dialogue.play(Dialogues.scrip_ok).then(() => startS());

  // 直接图片路径
  const imgs = [
    { off: 'url(assets/经书/左1未选中.png)', on: 'url(assets/经书/左1选中.png)', fixed: 'url(assets/经书/左1固定.png)' },
    { off: 'url(assets/经书/左2未选中.PNG)', on: 'url(assets/经书/左2选中.png)', fixed: 'url(assets/经书/左2固定.png)' },
    { off: 'url(assets/经书/左3未选中.png)', on: 'url(assets/经书/左3选中.png)', fixed: 'url(assets/经书/左3固定.png)' },
    { off: 'url(assets/经书/左4未选中.png)', on: 'url(assets/经书/左4选中.png)', fixed: 'url(assets/经书/左4固定.png)' },
    { off: 'url(assets/经书/左5未选中.png)', on: 'url(assets/经书/左5选中.png)', fixed: 'url(assets/经书/左5固定.png)' },
    { off: 'url(assets/经书/左6未选中.png)', on: 'url(assets/经书/左6选中.png)' },
  ];
  const hts = [148, 160, 128, 150, 132, 120];
  let order = [], sel = -1, solved = false;

  function startS() {
    order = shuffle([0,1,2,3,4,5]); sel = -1; solved = false;
    document.getElementById('s-retry').style.display = 'none';
    document.getElementById('s-skip').style.display = '';
    document.getElementById('s-status').textContent = '';
    render();
  }

  function render() {
    const row = document.getElementById('s-row'); if (!row) return;
    row.innerHTML = '';
    order.forEach((orig, pos) => {
      const el = document.createElement('div');
      const isSel = pos === sel;
      const imgSrc = isSel ? (imgs[orig].on || imgs[orig].fixed) : (imgs[orig].off || imgs[orig].fixed);
      el.style.cssText = `
        width:44px; height:${hts[pos]}px;
        border-radius:3px; cursor:pointer;
        background:${imgSrc} center/contain no-repeat;
        border:${isSel ? '2px solid var(--gold)' : '1px solid transparent'};
        box-shadow:${isSel ? '0 0 14px var(--gold-glow)' : 'none'};
        transition:all .3s; flex-shrink:0;
      `;
      el.addEventListener('click', () => {
        if (solved) return;
        if (sel === -1) { sel = pos; render(); }
        else {
          [order[sel], order[pos]] = [order[pos], order[sel]];
          sel = -1; render();
          if (order.every((v, i) => v === Answers.scripOrder[i])) winS();
        }
      });
      row.appendChild(el);
    });
  }

  function winS() {
    solved = true;
    document.getElementById('s-status').textContent = '✓ 顺序正确！';
    document.getElementById('s-skip').style.display = 'none';
    const row = document.getElementById('s-row');
    row.querySelectorAll('div').forEach((el, i) => {
      const orig = order[i];
      el.style.background = (imgs[orig].fixed || imgs[orig].on) + ' center/contain no-repeat';
      el.style.border = '2px solid var(--gold)';
      el.style.cursor = 'default';
      sparks(el.getBoundingClientRect().left + 22, el.getBoundingClientRect().top + hts[i]/2, 6);
    });
    setTimeout(() => Dialogue.play(Dialogues.scrip_win).then(() => cb(true)), 500);
  }

  document.getElementById('s-retry').addEventListener('click', () => startS());
  document.getElementById('s-skip').addEventListener('click', () => { Dialogue.play(Dialogues.scrip_lose).then(() => cb(false)); });
}
