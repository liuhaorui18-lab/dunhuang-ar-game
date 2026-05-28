/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — mural-puzzle.js
   壁画碎片拼图：收集碎片→移动→旋转→拼合
   ═══════════════════════════════════════════════════════ */

function initMuralPuzzle(wrap, callback) {
  const hasClue = GameState.hasClue('mural');
  let phase = 'collect'; // collect → move → rotate → done
  const pieces = GameConfig.mural.pieces; // 4 pieces
  const rotSteps = GameConfig.mural.rotationSteps;

  // Container
  wrap.innerHTML = `
    <div class="mural-container" style="
      display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;
      width:100%;max-width:400px;
    ">
      <div style="font-size:14px;font-weight:700;color:var(--gold-light)">修复壁画</div>
      <div class="mural-stage" id="mural-stage" style="
        width:300px;height:260px;border:1px solid rgba(200,150,60,.2);
        border-radius:4px;position:relative;overflow:hidden;
        background:rgba(200,150,60,.03);
      "></div>
      <div class="mural-info" style="font-size:11px;opacity:.5;text-align:center"></div>
      <button class="btn btn-skip" id="mural-skip">跳过</button>
    </div>
  `;

  const stage = wrap.querySelector('#mural-stage');
  const info = wrap.querySelector('.mural-info');
  let pieceData = [];
  let selectedPiece = null;
  let dragStart = null;

  if (!hasClue) {
    info.textContent = '残破的壁画，内容已经分辨不清。';
    // No clue = can't fix
    Dialogue.play(Dialogues.mural_no_clue).then(() => callback(false));
    return;
  }

  // Has clue
  Dialogue.play(Dialogues.mural_has_clue).then(() => {
    info.textContent = '拖动碎片到正确位置 · 点击旋转';
    initPieces();
  });

  function initPieces() {
    phase = 'move';
    pieceData = [];

    for (let i = 0; i < pieces; i++) {
      const correctX = (i % 2) * 150;
      const correctY = Math.floor(i / 2) * 130;
      const angle = randInt(0, rotSteps - 1);

      pieceData.push({
        id: i,
        correctX, correctY,
        x: randInt(20, 200),
        y: randInt(20, 180),
        angle: angle,
        correctAngle: PuzzleAnswers.muralAngles[i] || 0,
        placed: false
      });

      const el = document.createElement('div');
      el.className = 'mural-piece';
      el.dataset.id = i;
      el.style.cssText = `
        position:absolute; left:${pieceData[i].x}px; top:${pieceData[i].y}px;
        width:130px; height:120px;
        background:center/cover no-repeat;
        border:1px solid rgba(200,150,60,.25);
        border-radius:3px; cursor:grab;
        transform:rotate(${angle * (360/rotSteps)}deg);
        opacity:0.9;
        z-index:5;
      `;

      // Use mural fragment images
      const bgIdx = (i % 3) + 1;
      if (bgIdx === 1) el.style.backgroundImage = 'var(--mural-normal1)';
      else if (bgIdx === 2) el.style.backgroundImage = 'var(--mural-normal2)';
      else el.style.backgroundImage = 'var(--mural-normal3)';

      // Touch/drag handling
      el.addEventListener('mousedown', e => startDrag(i, e));
      el.addEventListener('touchstart', e => { e.preventDefault(); startDrag(i, e); }, { passive: false });
      el.addEventListener('click', e => {
        if (dragStart && Math.abs(e.clientX - dragStart.x) < 5) {
          rotatePiece(i);
        }
      });

      stage.appendChild(el);
    }

    // Global drag
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  function startDrag(id, e) {
    selectedPiece = id;
    const p = getPos(e);
    dragStart = { x: p.x, y: p.y, origX: pieceData[id].x, origY: pieceData[id].y };
    const el = stage.querySelector(`[data-id="${id}"]`);
    if (el) el.style.zIndex = '10';
  }

  function onDrag(e) {
    if (selectedPiece === null || !dragStart) return;
    e.preventDefault();
    const p = getPos(e);
    const stageRect = stage.getBoundingClientRect();
    const newX = p.x - stageRect.left - (dragStart.x - stageRect.left - dragStart.origX);
    const newY = p.y - stageRect.top - (dragStart.y - stageRect.top - dragStart.origY);

    pieceData[selectedPiece].x = clamp(newX, 0, 300 - 130);
    pieceData[selectedPiece].y = clamp(newY, 0, 260 - 120);

    const el = stage.querySelector(`[data-id="${selectedPiece}"]`);
    if (el) { el.style.left = pieceData[selectedPiece].x + 'px'; el.style.top = pieceData[selectedPiece].y + 'px'; }
  }

  function endDrag() {
    if (selectedPiece !== null) {
      const el = stage.querySelector(`[data-id="${selectedPiece}"]`);
      if (el) el.style.zIndex = '5';

      // Check if close to correct position
      const pd = pieceData[selectedPiece];
      const dx = Math.abs(pd.x - pd.correctX);
      const dy = Math.abs(pd.y - pd.correctY);
      const da = Math.abs(pd.angle - pd.correctAngle);

      if (dx < 30 && dy < 30 && da < 2) {
        // Snap to place
        pd.placed = true;
        pd.x = pd.correctX;
        pd.y = pd.correctY;
        pd.angle = pd.correctAngle;
        if (el) {
          el.style.left = pd.correctX + 'px';
          el.style.top = pd.correctY + 'px';
          el.style.transform = 'rotate(0deg)';
          el.style.border = '2px solid var(--gold)';
          el.style.cursor = 'default';
          el.style.opacity = '1';
        }
        spawnSparks(
          stage.getBoundingClientRect().left + pd.correctX + 65,
          stage.getBoundingClientRect().top + pd.correctY + 60,
          6
        );
        checkAllPlaced();
      }
    }
    selectedPiece = null;
    dragStart = null;
  }

  function rotatePiece(id) {
    if (pieceData[id].placed) return;
    pieceData[id].angle = (pieceData[id].angle + 1) % rotSteps;
    const el = stage.querySelector(`[data-id="${id}"]`);
    if (el) el.style.transform = `rotate(${pieceData[id].angle * (360/rotSteps)}deg)`;
  }

  function checkAllPlaced() {
    if (pieceData.every(p => p.placed)) {
      phase = 'done';
      // Show completed mural
      setTimeout(() => {
        stage.innerHTML = `<div style="
          width:100%;height:100%;
          background:var(--mural-complete) center/contain no-repeat;
        "></div>`;
        info.textContent = '壁画修复完成！';
        document.getElementById('mural-skip').style.display = 'none';
        Dialogue.play(Dialogues.mural_success).then(() => callback(true));
      }, 500);
    }
  }

  wrap.querySelector('#mural-skip').addEventListener('click', () => {
    Dialogue.play(Dialogues.mural_fail).then(() => callback(false));
  });
}
