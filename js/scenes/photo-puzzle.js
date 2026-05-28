/* 敦煌复苏计划 — photo-puzzle.js · 可跳过 */
const PP = { cur: 0, ttl: 2, pcs: 6, plc: 0, tm: null, td: null, done: false };

function initPhotoPuzzle() {
  PP.done = false; PP.cur = 0; PP.ttl = Config.pp.count; PP.pcs = Config.pp.pieces;
  const sec = GameState.totalSec;
  PP.td = document.getElementById('prog-timer'); PP.td.style.display = ''; PP.td.textContent = fmtTime(sec);
  PP.tm = new Timer(sec, r => { PP.td.textContent = fmtTime(r); if (r <= 30) PP.td.style.color = 'var(--danger-red)'; else if (r <= 60) PP.td.style.color = '#FFA726'; }, () => finPP());
  PP.tm.start();
  roundPP();
  onSceneCleanup(() => { PP.done = true; if (PP.tm) PP.tm.stop(); PP.td.style.display = 'none'; });
}

function roundPP() {
  const c = document.getElementById('pp-container'); PP.plc = 0;
  c.innerHTML = `<div style="font-size:14px;font-weight:700;color:var(--prog-cyan);text-align:center">文物数字修复 ${PP.cur + 1}/${PP.ttl}</div>
    <div style="font-size:10px;opacity:.4;text-align:center">将碎片拖到正确的位置</div>
    <div class="pp-drop" id="pp-drop">${Array.from({length:PP.pcs},(_,i)=>`<div class="pp-slot" data-s="${i}">${i+1}</div>`).join('')}</div>
    <div class="pp-pieces" id="pp-pieces"></div>
    <button class="btn btn-skip" id="pp-skip">跳过此拼图</button>`;

  const pcCont = document.getElementById('pp-pieces');
  const imgs = ['var(--img-mural-move-n1)','var(--img-mural-move-n2)','var(--img-mural-move-n3)','var(--img-mural-move-n4)'];
  shuffle([...Array(PP.pcs).keys()]).forEach(id => {
    const el = document.createElement('div'); el.className = 'pp-piece'; el.draggable = true;
    el.style.backgroundImage = imgs[id % 4]; el.dataset.id = id;
    let dragging = false, sx, sy;

    el.addEventListener('mousedown', e => { dragging = true; sx = e.clientX; sy = e.clientY; el.style.position = 'fixed'; el.style.left = (e.clientX - 28) + 'px'; el.style.top = (e.clientY - 28) + 'px'; el.style.zIndex = '100'; });
    el.addEventListener('touchstart', e => { e.preventDefault(); dragging = true; const t = e.touches[0]; sx = t.clientX; sy = t.clientY; el.style.position = 'fixed'; el.style.left = (t.clientX - 28) + 'px'; el.style.top = (t.clientY - 28) + 'px'; el.style.zIndex = '100'; });
    document.addEventListener('mousemove', e => { if (!dragging) return; el.style.left = (e.clientX - 28) + 'px'; el.style.top = (e.clientY - 28) + 'px'; });
    document.addEventListener('touchmove', e => { if (!dragging) return; const t = e.touches[0]; el.style.left = (t.clientX - 28) + 'px'; el.style.top = (t.clientY - 28) + 'px'; });
    const end = e => { if (!dragging) return; dragging = false; const p = e.type.startsWith('touch') ? (e.changedTouches?.[0] || { clientX: 0, clientY: 0 }) : { clientX: e.clientX, clientY: e.clientY };
      document.querySelectorAll('.pp-slot').forEach(slot => {
        const sr = slot.getBoundingClientRect();
        if (p.clientX >= sr.left && p.clientX <= sr.right && p.clientY >= sr.top && p.clientY <= sr.bottom) {
          const sid = parseInt(slot.dataset.s);
          if (sid === id) { el.style.cssText = ''; el.style.border = '2px solid var(--prog-cyan)'; slot.appendChild(el); slot.style.border = 'none'; PP.plc++; sparks(sr.left + sr.width/2, sr.top + sr.height/2, 5, '#00D4FF'); if (PP.plc >= PP.pcs) { PP.cur++; if (PP.cur >= PP.ttl) { setTimeout(() => finPP(), 800); } else { setTimeout(() => roundPP(), 1000); } } return; }
          else { toast('不是这里！', 'prog', 800); }
        }
      });
      el.style.cssText = ''; pcCont.appendChild(el);
    };
    document.addEventListener('mouseup', end); document.addEventListener('touchend', end);
    pcCont.appendChild(el);
  });

  document.getElementById('pp-skip').addEventListener('click', () => { PP.cur++; if (PP.cur >= PP.ttl) finPP(); else roundPP(); });
}

function finPP() { if (PP.done) return; PP.done = true; if (PP.tm) PP.tm.stop(); PP.td.style.display = 'none'; SM.go('scene-ending').then(() => showProgEnding()); }
