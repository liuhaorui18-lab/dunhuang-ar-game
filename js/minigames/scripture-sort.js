/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — scripture-sort.js
   经卷排序：点击拖动调整高低顺序（正确排序）
   ═══════════════════════════════════════════════════════ */

function initScriptureSort(wrap, callback) {
  const hasClue = GameState.hasClue('scripture');
  const totalItems = GameConfig.scripture.items; // 6 items
  let currentOrder = shuffle([0, 1, 2, 3, 4, 5]);
  let completed = false;

  wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px;width:100%;">
      <div style="font-size:14px;font-weight:700;color:var(--gold-light)">整理经卷顺序</div>
      <div class="scripture-row" id="scripture-row" style="
        display:flex; align-items:flex-end; gap:8px;
        height:200px; justify-content:center;
        width:100%; max-width:360px;
      "></div>
      <div style="font-size:11px;opacity:.5;text-align:center">根据高低大小排列经卷 · 点击选中后点击目标位置交换</div>
      <button class="btn btn-skip" id="scrip-skip">跳过</button>
    </div>
  `;

  if (!hasClue) {
    Dialogue.play(Dialogues.scripture_no_clue).then(() => callback(false));
    return;
  }

  Dialogue.play(Dialogues.scripture_has_clue).then(() => {
    renderScriptures();
  });

  // Scripture image mapping
  const scripImgs = [
    { fixed: 'var(--scrip-l1-fixed)', off: 'var(--scrip-l1-off)', on: 'var(--scrip-l1-on)' },
    { fixed: 'var(--scrip-l2-fixed)', off: 'var(--scrip-l2-off)', on: 'var(--scrip-l2-on)' },
    { fixed: 'var(--scrip-l3-fixed)', off: 'var(--scrip-l3-off)', on: 'var(--scrip-l3-on)' },
    { fixed: 'var(--scrip-l4-fixed)', off: 'var(--scrip-l4-off)', on: 'var(--scrip-l4-on)' },
    { fixed: 'var(--scrip-l5-fixed)', off: 'var(--scrip-l5-off)', on: 'var(--scrip-l5-on)' },
    { off: 'var(--scrip-l6-off)', on: 'var(--scrip-l6-on)' },
  ];

  let selectedIdx = -1;

  function renderScriptures() {
    const row = document.getElementById('scripture-row');
    if (!row) return;
    row.innerHTML = '';

    currentOrder.forEach((origIdx, pos) => {
      const el = document.createElement('div');
      el.className = 'scrip-item';
      el.dataset.pos = pos;
      el.dataset.orig = origIdx;

      // Height varies by position
      const heights = [140, 160, 120, 150, 130, 110];
      const h = heights[pos];

      el.style.cssText = `
        width:50px; height:${h}px;
        border-radius:4px; cursor:pointer;
        transition:all .3s;
        background:center/contain no-repeat;
        border:2px solid transparent;
      `;

      // Background image
      el.style.backgroundImage = scripImgs[origIdx].off || scripImgs[origIdx].fixed;

      if (pos === selectedIdx) {
        el.style.border = '2px solid var(--gold)';
        el.style.boxShadow = '0 0 12px var(--gold-glow)';
        el.style.backgroundImage = scripImgs[origIdx].on || scripImgs[origIdx].fixed;
      }

      el.addEventListener('click', () => {
        if (completed) return;
        if (selectedIdx === -1) {
          selectedIdx = pos;
          renderScriptures();
        } else {
          // Swap
          [currentOrder[selectedIdx], currentOrder[pos]] = [currentOrder[pos], currentOrder[selectedIdx]];
          selectedIdx = -1;
          renderScriptures();
          checkOrder();
        }
      });

      row.appendChild(el);
    });
  }

  function checkOrder() {
    const correct = PuzzleAnswers.scriptureOrder; // [0,2,4,1,3,5]
    if (currentOrder.every((v, i) => v === correct[i])) {
      completed = true;
      document.getElementById('scrip-skip').style.display = 'none';
      // Show all as "fixed" state
      currentOrder.forEach((origIdx, pos) => {
        const el = document.querySelector(`.scrip-item[data-pos="${pos}"]`);
        if (el) {
          el.style.backgroundImage = scripImgs[origIdx].fixed || scripImgs[origIdx].on;
          el.style.border = '2px solid var(--gold)';
        }
      });
      setTimeout(() => {
        Dialogue.play(Dialogues.scripture_success).then(() => callback(true));
      }, 400);
    }
  }

  wrap.querySelector('#scrip-skip').addEventListener('click', () => {
    Dialogue.play(Dialogues.scripture_fail).then(() => callback(false));
  });
}
