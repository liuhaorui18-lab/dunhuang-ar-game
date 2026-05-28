/* 敦煌复苏计划 — mural-puzzle.js · 先对话后界面 */
function initMural(ov, cb) {
  var hasClue = GameState.hasClue('mural');
  ov.innerHTML = '';

  var dialogue = hasClue ? Dialogues.mural_ok : Dialogues.mural_no;
  Dialogue.play(dialogue).then(function() { showUI(); });

  var P=Config.mural.pieces, R=Config.mural.rot;
  var imgSrc=['assets/壁画碎片/壁画碎片页面/普通状态碎片.png','assets/壁画碎片/壁画碎片页面/普通状态碎片2.png','assets/壁画碎片/壁画碎片页面/普通状态碎片3.png'];
  var data=[], sel=null, drag=null, placed=0;

  function showUI() {
    ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px;width:100%;max-width:440px">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">修复壁画</div>' +
      '<div id="m-stage" style="position:relative;width:320px;height:240px;border:1px solid rgba(200,150,60,.2);border-radius:4px;overflow:hidden;background:rgba(200,150,60,.03)"></div>' +
      '<div id="m-info" style="font-size:10px;opacity:.5;text-align:center">拖动碎片到正确位置 · 点击旋转</div>' +
      '<button class="btn btn-arch" id="m-retry" style="display:none">重新尝试</button>' +
      '<button class="btn btn-skip" id="m-skip">跳过此文物</button></div>';
    startM();
    document.getElementById('m-retry').addEventListener('click', function() { cleanup(); startM(); });
    document.getElementById('m-skip').addEventListener('click', function() { cleanup(); Dialogue.play(Dialogues.mural_lose).then(function() { ov.classList.remove('active'); cb(false); }); });
  }

  function cleanup() { document.removeEventListener('mousemove',onDrag); document.removeEventListener('mouseup',endDrag); document.removeEventListener('touchmove',onDrag); document.removeEventListener('touchend',endDrag); }

  function startM() {
    cleanup(); placed=0; sel=null; drag=null; data=[];
    document.getElementById('m-stage').innerHTML='';
    document.getElementById('m-info').textContent='拖动碎片到正确位置 · 点击旋转';
    document.getElementById('m-retry').style.display='none';
    document.getElementById('m-skip').style.display='';

    for(var i=0;i<P;i++) {
      var cx=(i%2)*160, cy=Math.floor(i/2)*120;
      data.push({id:i,cx,cy,x:randInt(20,180),y:randInt(10,180),a:randInt(0,R-1),ca:Answers.muralAngles[i]||0,ok:false});
      var el=document.createElement('img'); el.className='mural-piece';
      el.src=imgSrc[i%3];
      el.style.cssText='position:absolute;left:'+data[i].x+'px;top:'+data[i].y+'px;width:120px;height:100px;object-fit:cover;border:1px solid rgba(200,150,60,.2);border-radius:3px;cursor:grab;transform:rotate('+data[i].a*(360/R)+'deg);z-index:5;';
      el.addEventListener('mousedown',function(e){startDrag(i,e);});
      el.addEventListener('touchstart',function(e){e.preventDefault();startDrag(i,e);});
      el.addEventListener('click',function(e){if(!drag)rotP(i);});
      document.getElementById('m-stage').appendChild(el);
    }
    document.addEventListener('mousemove',onDrag); document.addEventListener('mouseup',endDrag);
    document.addEventListener('touchmove',onDrag,{passive:false}); document.addEventListener('touchend',endDrag);
  }

  function startDrag(id,e){sel=id;var p=getPos(e),r=document.getElementById('m-stage').getBoundingClientRect();drag={ox:data[id].x,oy:data[id].y,sx:p.x-r.left,sy:p.y-r.top};}
  function onDrag(e){if(sel===null)return;e.preventDefault();var p=getPos(e),r=document.getElementById('m-stage').getBoundingClientRect();data[sel].x=clamp(p.x-r.left-drag.sx+drag.ox,0,320-120);data[sel].y=clamp(p.y-r.top-drag.sy+drag.oy,0,240-100);var el=document.querySelector('#m-stage img:nth-child('+(sel+1)+')');if(el){el.style.left=data[sel].x+'px';el.style.top=data[sel].y+'px';}}
  function endDrag(){if(sel!==null){var d=data[sel];if(Math.abs(d.x-d.cx)<30&&Math.abs(d.y-d.cy)<30&&(Math.abs(d.a-d.ca)<2||Math.abs(d.a-d.ca)>=R-2)){d.ok=true;d.x=d.cx;d.y=d.cy;d.a=d.ca;placed++;var el=document.querySelector('#m-stage img:nth-child('+(sel+1)+')');if(el){el.style.left=d.cx+'px';el.style.top=d.cy+'px';el.style.transform='rotate(0deg)';el.style.border='2px solid var(--gold)';el.style.cursor='default';}if(placed>=P)winM();}}sel=null;drag=null;}
  function rotP(id){if(data[id].ok)return;data[id].a=(data[id].a+1)%R;var el=document.querySelector('#m-stage img:nth-child('+(id+1)+')');if(el)el.style.transform='rotate('+data[id].a*(360/R)+'deg)';}

  function winM() {
    document.getElementById('m-info').textContent='壁画修复完成！'; document.getElementById('m-skip').style.display='none';
    document.getElementById('m-stage').innerHTML='<img src="assets/壁画碎片/拼合成功页面/完整壁画.png" style="width:100%;height:100%;object-fit:contain;animation:fade-in .8s">';
    setTimeout(function(){ Dialogue.play(Dialogues.mural_win).then(function(){ ov.classList.remove('active'); cb(true); }); },500);
  }
}
