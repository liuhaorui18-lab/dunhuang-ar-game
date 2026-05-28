/* 敦煌复苏计划 — mural-puzzle.js · 拖动碎片到对应编号虚线框 */
function initMural(ov, cb) {
  var hasClue = GameState.hasClue('mural');
  ov.innerHTML = '';
  Dialogue.play(hasClue ? Dialogues.mural_ok : Dialogues.mural_no).then(function() { showUI(); });

  var imgSrc=['assets/壁画碎片/壁画碎片页面/普通状态碎片.png','assets/壁画碎片/壁画碎片页面/普通状态碎片2.png','assets/壁画碎片/壁画碎片页面/普通状态碎片3.png'];
  var placed=0, total=4, selIdx=null, dragInfo=null, pieces=[], slots=[];

  function showUI() {
    ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px;width:100%;max-width:440px">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">修复壁画</div>' +
      '<div style="font-size:11px;opacity:.6;text-align:center">把碎片<b style="color:var(--gold-light)">拖入对应编号</b>的虚线框</div>' +
      '<div id="m-stage" style="position:relative;width:320px;height:200px;border:1px solid rgba(200,150,60,.2);border-radius:4px;overflow:hidden;background:rgba(0,0,0,.3);touch-action:none"></div>' +
      '<div id="m-info" style="font-size:12px;color:var(--gold-light)">已拼合 0/4</div>' +
      '<button class="btn btn-arch" id="m-retry" style="display:none">重试</button>' +
      '<button class="btn btn-skip" id="m-skip">跳过</button></div>';
    startM();
    document.getElementById('m-retry').addEventListener('click', startM);
    document.getElementById('m-skip').addEventListener('click', function() { Dialogue.play(Dialogues.mural_lose).then(function() { ov.classList.remove('active'); cb(false); }); });
  }

  function startM() {
    placed=0; selIdx=null; dragInfo=null; pieces=[]; slots=[];
    var stg=document.getElementById('m-stage'); stg.innerHTML='';
    document.getElementById('m-info').textContent='已拼合 0/4';
    document.getElementById('m-retry').style.display='none';
    document.getElementById('m-skip').style.display='';

    // 画四个目标虚线框（编号1-4）
    var positions=[{x:10,y:10},{x:165,y:10},{x:10,y:105},{x:165,y:105}];
    positions.forEach(function(pos, i) {
      var box=document.createElement('div');
      box.style.cssText='position:absolute;left:'+pos.x+'px;top:'+pos.y+'px;width:145px;height:85px;border:2px dashed rgba(200,150,60,.25);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:28px;color:rgba(200,150,60,.12);z-index:1';
      box.textContent=''+(i+1);
      box.id='m-slot-'+(i+1);
      stg.appendChild(box);
    });

    // 创建四个碎片（打乱顺序和位置）
    var order=shuffle([0,1,2,3]);
    order.forEach(function(id, idx) {
      var el=document.createElement('img');
      el.src=imgSrc[id%3];
      el.dataset.id=id+1; // 1-4
      el.style.cssText='position:absolute;left:'+randInt(10,175)+'px;top:'+randInt(10,115)+'px;width:140px;height:80px;object-fit:cover;border:1px solid rgba(200,150,60,.3);border-radius:4px;cursor:grab;z-index:5;background:rgba(0,0,0,.4);';
      // 碎片上也标数字
      el.title='碎片'+(id+1);

      el.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); startD(el, id+1, e.touches[0]); });
      el.addEventListener('touchmove', function(e) { e.preventDefault(); if (selIdx===id+1) moveD(e.touches[0]); });
      el.addEventListener('touchend', function(e) { endD(el, id+1); });
      el.addEventListener('mousedown', function(e) { e.preventDefault(); startD(el, id+1, e); });
      stg.appendChild(el);
      pieces.push(el);
    });

    document.addEventListener('mousemove', function(e) { if (selIdx!==null) moveD(e); });
    document.addEventListener('mouseup', function(e) { if (selIdx!==null) { var el=null; pieces.forEach(function(p){ if(parseInt(p.dataset.id)===selIdx) el=p; }); endD(el, selIdx); } });
  }

  function startD(el, id, pos) {
    selIdx=id; dragInfo={el:el, sx:pos.clientX, sy:pos.clientY, ox:parseInt(el.style.left), oy:parseInt(el.style.top), moved:false};
    el.style.zIndex='10';
  }

  function moveD(pos) {
    if (selIdx===null||!dragInfo) return;
    var dx=pos.clientX-dragInfo.sx, dy=pos.clientY-dragInfo.sy;
    if (Math.abs(dx)>2||Math.abs(dy)>2) dragInfo.moved=true;
    dragInfo.el.style.left=clamp(dragInfo.ox+dx, 0, 180)+'px';
    dragInfo.el.style.top=clamp(dragInfo.oy+dy, 0, 120)+'px';
  }

  function endD(el, id) {
    if (!el || !dragInfo) { selIdx=null; dragInfo=null; return; }
    el.style.zIndex='5';
    if (!dragInfo.moved) { selIdx=null; dragInfo=null; return; } // 没拖动不判断

    // 检查是否在正确的目标框内
    var targetPos={1:{x:10,y:10},2:{x:165,y:10},3:{x:10,y:105},4:{x:165,y:105}};
    var t=targetPos[id];
    var ex=parseInt(el.style.left), ey=parseInt(el.style.top);
    var dx=Math.abs(ex-t.x), dy=Math.abs(ey-t.y);

    if (dx<35 && dy<30) {
      // 正确！锁定到目标位置
      el.style.left=t.x+'px'; el.style.top=t.y+'px';
      el.style.border='2px solid var(--gold)'; el.style.cursor='default';
      el.style.zIndex='3';
      placed++;
      document.getElementById('m-info').textContent='已拼合 '+placed+'/4';
      sparks(t.x+70, t.y+40, 6);
      // 隐藏对应的虚线框
      var slot=document.getElementById('m-slot-'+id);
      if (slot) slot.style.opacity='0';
      if (placed>=4) winM();
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
