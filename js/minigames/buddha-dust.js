/* 敦煌复苏计划 — buddha-dust.js · 先对话后界面 */
function initBuddha(ov, cb) {
  var hasClue = GameState.hasClue('buddha');
  ov.innerHTML = '';

  var dialogue = hasClue ? Dialogues.buddha_ok : Dialogues.buddha_no;
  Dialogue.play(dialogue).then(function() { showUI(); });

  var cleared=0, patches=[], done=false, drawing=false;

  function showUI() {
    ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;width:100%">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">清扫碎石表面</div>' +
      '<div id="b-wrap" style="position:relative;width:280px;height:280px;touch-action:none;border-radius:8px;overflow:hidden;">' +
      '<img src="assets/神像碎片/神像5/清灰后.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1">' +
      '<canvas id="b-canvas" style="position:absolute;inset:0;z-index:2;width:280px;height:280px"></canvas></div>' +
      '<div style="font-size:10px;opacity:.5;text-align:center" id="b-hint">用手指擦去灰尘</div>' +
      '<div style="font-size:13px;color:var(--gold-light)" id="b-prog">已清理 0/'+Config.buddha.patches+'</div>' +
      '<button class="btn btn-arch" id="b-retry" style="display:none">重新清扫</button>' +
      '<button class="btn btn-skip" id="b-skip">跳过此文物</button></div>';
    startB();
    document.getElementById('b-retry').addEventListener('click', startB);
    document.getElementById('b-skip').addEventListener('click', function() { Dialogue.play(Dialogues.buddha_lose).then(function() { ov.classList.remove('active'); cb(false); }); });
  }

  function startB() {
    cleared=0; done=false; drawing=false;
    var P=Config.buddha.patches;
    patches=Array.from({length:P},function(){return{x:randInt(50,230),y:randInt(50,230),r:randInt(28,45),ok:false};});
    var c=document.getElementById('b-canvas'),ctx=c.getContext('2d');
    c.width=280;c.height=280;
    ctx.fillStyle='rgba(55,35,18,.88)';ctx.fillRect(0,0,280,280);
    for(var i=0;i<1500;i++) ctx.fillStyle='rgba('+(70+Math.random()*40)+','+(40+Math.random()*30)+','+(15+Math.random()*25)+','+(.08+Math.random()*.25)+')',ctx.fillRect(Math.random()*280,Math.random()*280,randInt(2,5),randInt(2,5));
    document.getElementById('b-prog').textContent='已清理 0/'+P;
    document.getElementById('b-hint').textContent='用手指擦去灰尘';
    document.getElementById('b-retry').style.display='none';
    document.getElementById('b-skip').style.display='';
  }

  function eraseAt(cx,cy) {
    var c=document.getElementById('b-canvas'),ctx=c.getContext('2d'),r=c.getBoundingClientRect(),sx=280/r.width,sy=280/r.height,x=(cx-r.left)*sx,y=(cy-r.top)*sy;
    ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();ctx.restore();
    patches.forEach(function(p){if(!p.ok&&Math.hypot(x-p.x,y-p.y)<p.r){p.ok=true;cleared++;document.getElementById('b-prog').textContent='已清理 '+cleared+'/'+Config.buddha.patches;sparks(r.left+p.x/sx,r.top+p.y/sy,6);if(cleared>=Config.buddha.patches)winB();}});
  }

  var cEl=document.getElementById('b-canvas');
  cEl.addEventListener('mousedown',function(e){drawing=true;eraseAt(e.clientX,e.clientY);});
  cEl.addEventListener('mousemove',function(e){if(drawing)eraseAt(e.clientX,e.clientY);});
  document.addEventListener('mouseup',function(){drawing=false;});
  cEl.addEventListener('touchstart',function(e){e.preventDefault();drawing=true;eraseAt(e.touches[0].clientX,e.touches[0].clientY);});
  cEl.addEventListener('touchmove',function(e){e.preventDefault();if(drawing)eraseAt(e.touches[0].clientX,e.touches[0].clientY);});
  document.addEventListener('touchend',function(){drawing=false;});

  function winB(){done=true;document.getElementById('b-hint').textContent='佛眼显现！';document.getElementById('b-skip').style.display='none';document.getElementById('b-canvas').style.opacity='.25';setTimeout(function(){Dialogue.play(Dialogues.buddha_win).then(function(){ov.classList.remove('active');cb(true);});},500);}
}
