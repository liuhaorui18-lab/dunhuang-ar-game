/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — buddha-dust.js
   大佛像清扫灰尘：滑动擦除灰尘，显露出佛像
   ═══════════════════════════════════════════════════════ */

function initBuddhaDust(wrap, callback) {
  const hasClue = GameState.hasClue('buddha');
  const totalPatches = GameConfig.buddha.dustPatches; // 5 patches
  let clearedPatches = 0;
  let completed = false;

  wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;width:100%;">
      <div style="font-size:14px;font-weight:700;color:var(--gold-light)">清扫碎石表面</div>
      <div id="dust-canvas-wrap" style="position:relative;width:300px;height:300px;touch-action:none;border-radius:8px;overflow:hidden;">
        <div id="dust-reveal-img" style="
          position:absolute;inset:0;
          background:var(--statue-dust) center/cover no-repeat;
          z-index:1;
        "></div>
        <canvas id="dust-canvas" style="
          position:absolute;inset:0;z-index:2;
          width:300px;height:300px;
        "></canvas>
      </div>
      <div style="font-size:11px;opacity:.5;text-align:center">用手指擦去灰尘 · 清理 ${totalPatches} 处灰层</div>
      <div id="dust-progress" style="font-size:13px;color:var(--gold-light)">已清理 0/${totalPatches}</div>
      <button class="btn btn-skip" id="dust-skip">跳过</button>
    </div>
  `;

  if (!hasClue) {
    Dialogue.play(Dialogues.buddha_no_clue).then(() => callback(false));
    return;
  }

  Dialogue.play(Dialogues.buddha_has_clue).then(() => {
    setupDustCanvas();
  });

  function setupDustCanvas() {
    const canvas = document.getElementById('dust-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 300;

    // Fill with "dust" color
    ctx.fillStyle = 'rgba(60,40,20,0.9)';
    ctx.fillRect(0, 0, 300, 300);

    // Add texture (noise)
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 300;
      const y = Math.random() * 300;
      ctx.fillStyle = `rgba(${80+Math.random()*40},${50+Math.random()*30},${20+Math.random()*30},${0.1+Math.random()*0.3})`;
      ctx.fillRect(x, y, randInt(2, 6), randInt(2, 6));
    }

    // Define dust patch areas (hidden circles)
    const patchCenters = [];
    for (let i = 0; i < totalPatches; i++) {
      patchCenters.push({
        x: randInt(60, 240),
        y: randInt(60, 240),
        r: randInt(30, 50),
        cleared: false
      });
    }

    let isDrawing = false;

    function eraseAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      // Erase dust in a circle
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Check if any patch center is cleared
      patchCenters.forEach(p => {
        if (p.cleared) return;
        const dist = Math.hypot(x - p.x, y - p.y);
        if (dist < p.r) {
          p.cleared = true;
          clearedPatches++;
          document.getElementById('dust-progress').textContent = `已清理 ${clearedPatches}/${totalPatches}`;
          spawnSparks(rect.left + p.x / scaleX, rect.top + p.y / scaleY, 8);
          checkAllCleared();
        }
      });
    }

    canvas.addEventListener('mousedown', e => { isDrawing = true; eraseAt(e.clientX, e.clientY); });
    canvas.addEventListener('mousemove', e => { if (isDrawing) eraseAt(e.clientX, e.clientY); });
    canvas.addEventListener('mouseup', () => { isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; });

    canvas.addEventListener('touchstart', e => { e.preventDefault(); isDrawing = true; eraseAt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (isDrawing) eraseAt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchend', () => { isDrawing = false; });
  }

  function checkAllCleared() {
    if (clearedPatches >= totalPatches) {
      completed = true;
      document.getElementById('dust-skip').style.display = 'none';
      // Reveal completed image
      const reveal = document.getElementById('dust-reveal-img');
      const canvas = document.getElementById('dust-canvas');
      if (canvas) canvas.style.opacity = '0.3';

      setTimeout(() => {
        Dialogue.play(Dialogues.buddha_success).then(() => callback(true));
      }, 600);
    }
  }

  wrap.querySelector('#dust-skip').addEventListener('click', () => {
    Dialogue.play(Dialogues.buddha_fail).then(() => callback(false));
  });
}
