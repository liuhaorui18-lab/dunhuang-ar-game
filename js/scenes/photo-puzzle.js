/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — photo-puzzle.js
   程序员：照片拼图 — 将碎片拖到正确位置修复文物
   ═══════════════════════════════════════════════════════ */

const PP = {
  currentPuzzle: 0,
  totalPuzzles: 2,
  pieces: 6,
  placedCount: 0,
  targetSlots: [],
  timer: null,
  timerDisplay: null,
  done: false,
};

function initPhotoPuzzle() {
  PP.done = false;
  PP.currentPuzzle = 0;
  PP.totalPuzzles = GameConfig.photoPuzzle.puzzles;
  PP.pieces = GameConfig.photoPuzzle.pieces;

  const totalSec = GameState.totalSeconds;
  PP.timerDisplay = document.getElementById('prog-timer');
  PP.timerDisplay.style.display = '';
  PP.timerDisplay.textContent = fmtTime(totalSec);

  PP.timer = new CountdownTimer(totalSec, (rem) => {
    PP.timerDisplay.textContent = fmtTime(rem);
    if (rem <= 30) PP.timerDisplay.style.color = 'var(--danger-red)';
    else if (rem <= 60) PP.timerDisplay.style.color = '#FFA726';
  }, () => {
    finishPhotoPuzzle();
  });
  PP.timer.start();

  setupPuzzleRound();

  onSceneCleanup(() => {
    PP.done = true;
    if (PP.timer) PP.timer.stop();
    PP.timerDisplay.style.display = 'none';
  });
}

function setupPuzzleRound() {
  const container = document.getElementById('pp-container');
  PP.placedCount = 0;
  PP.targetSlots = [];

  container.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:var(--prog-cyan);text-align:center">
      文物数字修复 ${PP.currentPuzzle + 1}/${PP.totalPuzzles}
    </div>
    <div style="font-size:11px;opacity:.4;text-align:center">
      将碎片拖到正确位置
    </div>
    <div class="pp-drop-zone" id="pp-drop-zone">
      ${Array.from({length: PP.pieces}, (_, i) => `
        <div class="pp-slot" data-slot="${i}" style="
          width:80px;height:80px;border:1px dashed rgba(0,212,255,.2);
          border-radius:4px;display:flex;align-items:center;justify-content:center;
          font-size:10px;opacity:.4;color:var(--prog-cyan);
        ">${i+1}</div>
      `).join('')}
    </div>
    <div class="pp-pieces" id="pp-pieces"></div>
    <button class="btn btn-skip" id="pp-skip">跳过此拼图</button>
  `;

  // Generate shuffled pieces
  const pieces = shuffle([...Array(PP.pieces).keys()]);
  const piecesContainer = document.getElementById('pp-pieces');

  pieces.forEach(id => {
    const el = document.createElement('div');
    el.className = 'pp-piece';
    el.draggable = true;
    el.dataset.id = id;
    // Use mural fragment images for the pieces
    const bgIdx = (id % 3) + 1;
    const bgMap = ['var(--mural-move1)', 'var(--mural-move2)', 'var(--mural-move3)', 'var(--mural-move4)'];
    el.style.backgroundImage = bgMap[id % 4];
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';

    // Touch drag (simpler than true HTML5 drag)
    let isDragging = false;
    let startX, startY, origLeft, origTop;

    el.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origLeft = el.offsetLeft;
      origTop = el.offsetTop;
      el.style.position = 'fixed';
      el.style.left = e.clientX - 30 + 'px';
      el.style.top = e.clientY - 30 + 'px';
      el.style.zIndex = '100';
    });

    el.addEventListener('touchstart', e => {
      e.preventDefault();
      isDragging = true;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      el.style.position = 'fixed';
      el.style.left = t.clientX - 30 + 'px';
      el.style.top = t.clientY - 30 + 'px';
      el.style.zIndex = '100';
    }, { passive: false });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      el.style.left = e.clientX - 30 + 'px';
      el.style.top = e.clientY - 30 + 'px';
    });

    document.addEventListener('touchmove', e => {
      if (!isDragging || PP.done) return;
      const t = e.touches[0];
      el.style.left = t.clientX - 30 + 'px';
      el.style.top = t.clientY - 30 + 'px';
    });

    const endDrag = e => {
      if (!isDragging) return;
      isDragging = false;
      const p = e.type.startsWith('touch') ? getTouchEnd(e) : { x: e.clientX, y: e.clientY };

      // Check if over any slot
      const slots = document.querySelectorAll('.pp-slot');
      let placed = false;
      slots.forEach(slot => {
        const sr = slot.getBoundingClientRect();
        if (p.x >= sr.left && p.x <= sr.right && p.y >= sr.top && p.y <= sr.bottom) {
          const slotId = parseInt(slot.dataset.slot);
          if (slotId === id) {
            // Correct slot!
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
            el.style.zIndex = '';
            el.style.opacity = '1';
            el.style.border = '2px solid var(--prog-cyan)';
            slot.appendChild(el);
            slot.style.border = 'none';
            slot.style.opacity = '1';
            placed = true;
            PP.placedCount++;
            spawnSparks(sr.left + sr.width / 2, sr.top + sr.height / 2, 6, '#00D4FF');
            checkPPComplete();
          } else {
            // Wrong slot
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
            el.style.zIndex = '';
            toast('不是这里！', 'prog', 1000);
          }
        }
      });
      if (!placed) {
        // Return to pieces area
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        el.style.zIndex = '';
        piecesContainer.appendChild(el);
      }
    };

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    piecesContainer.appendChild(el);
  });

  function getTouchEnd(e) {
    if (e.changedTouches && e.changedTouches.length) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: 0, y: 0 };
  }

  container.querySelector('#pp-skip').addEventListener('click', () => {
    PP.currentPuzzle++;
    if (PP.currentPuzzle >= PP.totalPuzzles) {
      finishPhotoPuzzle();
    } else {
      setupPuzzleRound();
    }
  });
}

function checkPPComplete() {
  if (PP.placedCount >= PP.pieces) {
    toast('拼图完成！', 'prog', 1500);
    PP.currentPuzzle++;
    if (PP.currentPuzzle >= PP.totalPuzzles) {
      setTimeout(() => finishPhotoPuzzle(), 1000);
    } else {
      setTimeout(() => setupPuzzleRound(), 1200);
    }
  }
}

function finishPhotoPuzzle() {
  if (PP.done) return;
  PP.done = true;
  if (PP.timer) PP.timer.stop();
  if (PP.timerDisplay) PP.timerDisplay.style.display = 'none';

  SM.go('scene-ending').then(() => showProgEnding());
}
