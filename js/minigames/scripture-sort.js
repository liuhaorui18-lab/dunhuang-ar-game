/* 敦煌复苏计划 — scripture-sort.js · 用img标签显示经书图 */
function initScrip(ov, cb) {
  var hasClue = GameState.hasClue('scripture');
  ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px;width:100%;max-width:440px">' +
    '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">整理经卷顺序</div>' +
    '<div id="s-row" style="display:flex;align-items:flex-end;gap:4px;height:180px;justify-content:center;background:rgba(200,150,60,.05);padding:10px 6px;border-radius:8px;min-width:300px;border:1px solid rgba(200,150,60,.1)"></div>' +
    '<div style="font-size:10px;opacity:.5;text-align:center">点击选中一张 · 再点击另一张交换位置</div>' +
    '<div style="font-size:11px;color:var(--gold-light)" id="s-status"></div>' +
    '<button class="btn btn-arch" id="s-retry" style="display:none">重新排序</button>' +
    '<button class="btn btn-skip" id="s-skip">跳过此文物</button></div>';

  if (!hasClue) { Dialogue.play(Dialogues.scrip_no).then(function() { cb(false); }); return; }
  Dialogue.play(Dialogues.scrip_ok).then(function() { startS(); });

  // 经书图片路径
  var offSrc = [
    'assets/经书/左1未选中.png', 'assets/经书/左2未选中.PNG', 'assets/经书/左3未选中.png',
    'assets/经书/左4未选中.png', 'assets/经书/左5未选中.png', 'assets/经书/左6未选中.png'
  ];
  var onSrc = [
    'assets/经书/左1选中.png', 'assets/经书/左2选中.png', 'assets/经书/左3选中.png',
    'assets/经书/左4选中.png', 'assets/经书/左5选中.png', 'assets/经书/左6选中.png'
  ];
  var fixSrc = [
    'assets/经书/左1固定.png', 'assets/经书/左2固定.png', 'assets/经书/左3固定.png',
    'assets/经书/左4固定.png', 'assets/经书/左5固定.png', null
  ];
  var hts = [148, 160, 128, 150, 132, 120];
  var order = [], sel = -1, solved = false;

  function startS() {
    order = shuffle([0,1,2,3,4,5]); sel = -1; solved = false;
    document.getElementById('s-retry').style.display = 'none';
    document.getElementById('s-skip').style.display = '';
    document.getElementById('s-status').textContent = '';
    render();
  }

  function render() {
    var row = document.getElementById('s-row'); if (!row) return;
    row.innerHTML = '';
    order.forEach(function(orig, pos) {
      var isSel = pos === sel;
      var src = isSel ? onSrc[orig] : offSrc[orig];
      var el = document.createElement('img');
      el.src = src;
      el.style.cssText = 'width:44px;height:' + hts[pos] + 'px;object-fit:contain;border-radius:3px;cursor:pointer;border:' + (isSel ? '2px solid var(--gold)' : '1px solid transparent') + ';box-shadow:' + (isSel ? '0 0 14px var(--gold-glow)' : 'none') + ';transition:all .3s;flex-shrink:0;';
      el.addEventListener('click', function() {
        if (solved) return;
        if (sel === -1) { sel = pos; render(); }
        else {
          var tmp = order[sel]; order[sel] = order[pos]; order[pos] = tmp;
          sel = -1; render();
          if (order.every(function(v, i) { return v === Answers.scripOrder[i]; })) winS();
        }
      });
      row.appendChild(el);
    });
  }

  function winS() {
    solved = true;
    document.getElementById('s-status').textContent = '✓ 顺序正确！';
    document.getElementById('s-skip').style.display = 'none';
    var row = document.getElementById('s-row');
    var imgs = row.querySelectorAll('img');
    imgs.forEach(function(el, i) {
      var orig = order[i];
      el.src = fixSrc[orig] || onSrc[orig];
      el.style.border = '2px solid var(--gold)';
      el.style.cursor = 'default';
    });
    setTimeout(function() { Dialogue.play(Dialogues.scrip_win).then(function() { cb(true); }); }, 500);
  }

  document.getElementById('s-retry').addEventListener('click', function() { startS(); });
  document.getElementById('s-skip').addEventListener('click', function() { Dialogue.play(Dialogues.scrip_lose).then(function() { cb(false); }); });
}
