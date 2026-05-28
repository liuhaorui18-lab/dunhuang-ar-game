/* 敦煌复苏计划 — mural-puzzle.js */
function initMural(ov, cb) {
  var hasClue = GameState.hasClue('mural');
  ov.innerHTML = '';
  Dialogue.play(hasClue ? Dialogues.mural_ok : Dialogues.mural_no).then(function() { showUI(); });

  var P=4, R=8;
  var imgSrc=['assets/壁画碎片/壁画碎片页面/普通状态碎片.png','assets/壁画碎片/壁画碎片页面/普通状态碎片2.png','assets/壁画碎片/壁画碎片页面/普通状态碎片3.png'];
  var data=[], els=[], selIdx=null, dragInfo=null, placed=0;

  function showUI() {
    ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px;width:100%;max-width:440px">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">修复壁画</div>' +
      '<div id="m-stage" style="position:relative;width:320px;height:240px;border:1px solid rgba(200,150,60,.2);border-radius:4px;overflow:hidden;background:rgba(0,0,0,.3);touch-action:none;user-select:none"></div>' +
      '<div id="m-info" style="font-size:10px;opacity:.5;text-align:center"></div>' +
      '<button class="btn btn-arch" id="m-retry" style="display:none">重试</button>' +
      '<button class="btn btn-skip" id="m-skip">跳过</button></div>';
    startM();
    document.getElementById('m-retry').addEventListener('click', startM);
    document.getElementById('m-skip').addEventListener('click', function() { Dialogue.play(Dialogues.mural_lose).then(function() { ov.classList.remove('active'); cb(false); }); });
  }

  function startM() {
    placed=0; selIdx=null; dragInfo=null; data=[]; els=[];
    var stg=document.getElementById('m-stage'); stg.innerHTML='';
    document.getElementById('m-info').textContent='拖到正确位置 · 双击旋转';
    document.getElementById('m-retry').style.display='none';
    document.getElementById('m-skip').style.display='';

    for(var i=0;i<P;i++) {
      var cx=(i%2)*160, cy=Math.floor(i/2)*120;
      data.push({id:i, cx:cx, cy:cy, x:randInt(15,185), y:randInt(5,145), a:randInt(0,R-1), ca:Answers.muralAngles[i]||0, ok:false});
      var el=document.createElement('img');
      el.src=imgSrc[i%3];
      el.style.cssText='position:absolute;left:'+data[i].x+'px;top:'+data[i].y+'px;width:120px;height:100px;object-fit:cover;border:1px solid rgba(200,150,60,.25);border-radius:3px;cursor:grab;transform:rotate('+data[i].a*(360/R)+'deg);z-index:5;';
      (function(idx) {
        el.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); startD(idx, e.touches[0]); });
        el.addEventListener('touchmove', function(e) { e.preventDefault(); if (selIdx===idx) moveD(e.touches[0]); });
        el.addEventListener('touchend', function(e) { endD(e); });
        el.addEventListener('mousedown', function(e) { e.preventDefault(); startD(idx, e); });
      })(i);
      stg.appendChild(el);
      els.push(el);
    }
    document.addEventListener('mousemove', function(e) { if (selIdx!==null) moveD(e); });
    document.addEventListener('mouseup', function(e) { endD(e); });
  }

  function startD(i, pos) {
    if (data[i].ok) return;
    selIdx=i; dragInfo={sx:pos.clientX, sy:pos.clientY, ox:data[i].x, oy:data[i].y, moved:false};
    els[i].style.zIndex='10';
  }

  function moveD(pos) {
    if (selIdx===null||!dragInfo) return;
    var dx=pos.clientX-dragInfo.sx, dy=pos.clientY-dragInfo.sy;
    if (Math.abs(dx)>3||Math.abs(dy)>3) dragInfo.moved=true;
    data[selIdx].x=clamp(dragInfo.ox+dx, 0, 200);
    data[selIdx].y=clamp(dragInfo.oy+dy, 0, 140);
    els[selIdx].style.left=data[selIdx].x+'px';
    els[selIdx].style.top=data[selIdx].y+'px';
  }

  function endD() {
    if (selIdx===null||!dragInfo) return;
    els[selIdx].style.zIndex='5';
    var i=selIdx;
    if (!dragInfo.moved) {
      // 点击 = 旋转
      if (!data[i].ok) { data[i].a=(data[i].a+1)%R; els[i].style.transform='rotate('+data[i].a*(360/R)+'deg)'; }
    } else {
      // 检查放置位置
      var d=data[i];
      if (Math.abs(d.x-d.cx)<30 && Math.abs(d.y-d.cy)<30 && (Math.abs(d.a-d.ca)<2||Math.abs(d.a-d.ca)>=R-2)) {
        d.ok=true; d.x=d.cx; d.y=d.cy; d.a=d.ca; placed++;
        els[i].style.left=d.cx+'px'; els[i].style.top=d.cy+'px';
        els[i].style.transform='rotate(0deg)'; els[i].style.border='2px solid var(--gold)';
        els[i].style.cursor='default';
        document.getElementById('m-info').textContent='已拼合 '+placed+'/4';
        sparks(d.cx+60, d.cy+50, 6);
        if (placed>=P) winM();
      }
    }
    selIdx=null; dragInfo=null;
  }

  function winM() {
    document.getElementById('m-info').textContent='壁画修复完成！';
    document.getElementById('m-skip').style.display='none';
    document.getElementById('m-stage').innerHTML='<img src="assets/壁画碎片/拼合成功页面/完整壁画.png" style="width:100%;height:100%;object-fit:contain;animation:fade-in .8s">';
    setTimeout(function() { Dialogue.play(Dialogues.mural_win).then(function() { ov.classList.remove('active'); cb(true); }); }, 500);
  }
}
