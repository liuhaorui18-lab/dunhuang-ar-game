/* 敦煌复苏计划 — mural-puzzle.js · 壁画拼图 · 直接图片路径 */
function initMural(ov, cb) {
  const hasClue = GameState.hasClue('mural');
  ov.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px;width:100%;max-width:440px">
    <div style="font-size:15px;font-weight:700;color:var(--gold-light)">修复壁画</div>
    <div id="m-stage" style="position:relative;width:320px;height:240px;border:1px solid rgba(200,150,60,.2);border-radius:4px;overflow:hidden;background:rgba(200,150,60,.03)"></div>
    <div id="m-info" style="font-size:10px;opacity:.5;text-align:center"></div>
    <button class="btn btn-arch" id="m-retry" style="display:none">重新尝试</button>
    <button class="btn btn-skip" id="m-skip">跳过此文物</button></div>`;

  if (!hasClue) { Dialogue.play(Dialogues.mural_no).then(() => cb(false)); return; }
  Dialogue.play(Dialogues.mural_ok).then(() => startM());

  const P = Config.mural.pieces, R = Config.mural.rot;
  const imgs = [
    'url(assets/壁画碎片/壁画碎片页面/普通状态碎片.png)',
    'url(assets/壁画碎片/壁画碎片页面/普通状态碎片2.png)',
    'url(assets/壁画碎片/壁画碎片页面/普通状态碎片3.png)',
  ];
  let data = [], sel = null, drag = null, placed = 0;

  function cleanup() { document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', endDrag); document.removeEventListener('touchmove', onDrag); document.removeEventListener('touchend', endDrag); }

  function startM() {
    cleanup(); placed = 0; sel = null; drag = null; data = [];
    document.getElementById('m-stage').innerHTML = '';
    document.getElementById('m-info').textContent = '拖动碎片到正确位置 · 点击旋转';
    document.getElementById('m-retry').style.display = 'none';
    document.getElementById('m-skip').style.display = '';

    for (let i = 0; i < P; i++) {
      const cx = (i % 2) * 160, cy = Math.floor(i / 2) * 120;
      data.push({ id:i, cx, cy, x:randInt(20,180), y:randInt(10,180), a:randInt(0,R-1), ca:Answers.muralAngles[i]||0, ok:false });
      const el = document.createElement('div'); el.className = 'mural-piece';
      el.style.cssText = `position:absolute;left:${data[i].x}px;top:${data[i].y}px;width:120px;height:100px;background:${imgs[i%3]} center/cover no-repeat;border:1px solid rgba(200,150,60,.2);border-radius:3px;cursor:grab;transform:rotate(${data[i].a*(360/R)}deg);z-index:5;`;
      el.addEventListener('mousedown', e => startDrag(i, e));
      el.addEventListener('touchstart', e => { e.preventDefault(); startDrag(i, e); });
      el.addEventListener('click', e => { if (!drag) rotP(i); });
      document.getElementById('m-stage').appendChild(el);
    }
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, {passive:false});
    document.addEventListener('touchend', endDrag);
  }

  function startDrag(id, e) { sel = id; const p = getPos(e); const r = document.getElementById('m-stage').getBoundingClientRect(); drag = { ox:data[id].x, oy:data[id].y, sx:p.x-r.left, sy:p.y-r.top }; }
  function onDrag(e) { if (sel===null) return; e.preventDefault(); const p = getPos(e); const r = document.getElementById('m-stage').getBoundingClientRect(); const nx = p.x-r.left - drag.sx + drag.ox; const ny = p.y-r.top - drag.sy + drag.oy; data[sel].x = clamp(nx,0,320-120); data[sel].y = clamp(ny,0,240-100); const el = document.querySelector(`#m-stage div:nth-child(${sel+1})`); if (el) { el.style.left = data[sel].x+'px'; el.style.top = data[sel].y+'px'; } }
  function endDrag() {
    if (sel!==null) {
      const d = data[sel];
      if (Math.abs(d.x-d.cx)<30 && Math.abs(d.y-d.cy)<30 && (Math.abs(d.a-d.ca)<2 || Math.abs(d.a-d.ca)>=R-2)) {
        d.ok=true; d.x=d.cx; d.y=d.cy; d.a=d.ca; placed++;
        const el = document.querySelector(`#m-stage div:nth-child(${sel+1})`);
        if (el) { el.style.left=d.cx+'px'; el.style.top=d.cy+'px'; el.style.transform='rotate(0deg)'; el.style.border='2px solid var(--gold)'; el.style.cursor='default'; }
        sparks(d.cx+60, d.cy+50, 6);
        if (placed>=P) winM();
      }
    }
    sel=null; drag=null;
  }
  function rotP(id) { if (data[id].ok) return; data[id].a = (data[id].a+1)%R; const el = document.querySelector(`#m-stage div:nth-child(${id+1})`); if (el) el.style.transform=`rotate(${data[id].a*(360/R)}deg)`; }

  function winM() {
    document.getElementById('m-info').textContent = '壁画修复完成！';
    document.getElementById('m-skip').style.display = 'none';
    document.getElementById('m-stage').innerHTML = `<div style="width:100%;height:100%;background:url(assets/壁画碎片/拼合成功页面/完整壁画.png) center/contain no-repeat;animation:fade-in .8s"></div>`;
    setTimeout(() => Dialogue.play(Dialogues.mural_win).then(() => cb(true)), 500);
  }

  document.getElementById('m-retry').addEventListener('click', () => startM());
  document.getElementById('m-skip').addEventListener('click', () => { cleanup(); Dialogue.play(Dialogues.mural_lose).then(() => cb(false)); });
}
