/* 敦煌复苏计划 — maze.js */
var MZ = { c:null, x:null, cols:13, rows:17, cs:30, grid:[], p:{x:1,y:1}, e:{x:0,y:0}, done:false, aid:null, _mfn:null, _kfn:null, _lastM:0 };

function initMaze() {
  MZ.cols=Config.maze.cols; MZ.rows=Config.maze.rows; MZ.cs=Config.maze.cell; MZ.done=false; MZ._lastM=0;
  MZ.c=document.getElementById('maze-canvas'); MZ.x=MZ.c.getContext('2d');
  MZ.grid=genMZ(MZ.cols,MZ.rows);
  MZ.p={x:1,y:1};
  // 出口放在右下角奇数位置（路径可达）
  MZ.e={x:MZ.cols-2, y:MZ.rows-2};
  // 确保出口周围有通路
  MZ.grid[MZ.e.y][MZ.e.x].w=false;
  // 确保出口左右有通路
  if (MZ.e.x>1) MZ.grid[MZ.e.y][MZ.e.x-1].w=false;
  if (MZ.e.y>1) MZ.grid[MZ.e.y-1][MZ.e.x].w=false;

  MZ.c.width=MZ.cols*MZ.cs; MZ.c.height=MZ.rows*MZ.cs;
  var sc=Math.min(innerWidth*.85/(MZ.cols*MZ.cs), innerHeight*.55/(MZ.rows*MZ.cs), 1.5);
  MZ.c.style.width=(MZ.cols*MZ.cs*sc)+'px'; MZ.c.style.height=(MZ.rows*MZ.cs*sc)+'px';
  renderMZ();

  // 陀螺仪：灵敏度提高，冷却降低
  MZ._mfn=function(d){
    if(MZ.done||d.type!=='orient')return;
    var now=Date.now(); if(now-MZ._lastM<150)return;
    var dx=clamp((d.gamma||0)/50,-1,1), dy=clamp((d.beta||0)/50,-1,1);
    if(Math.abs(dx)<.2&&Math.abs(dy)<.2)return;
    MZ._lastM=now;
    mvMZ(Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp'));
  };
  Motion.on(MZ._mfn);

  MZ._kfn=function(e){if(SM.current!=='scene-maze'||MZ.done)return;mvMZ(e.key);};
  window.addEventListener('keydown',MZ._kfn);

  document.getElementById('maze-skip-btn').addEventListener('click',function(){
    MZ.done=true;cancelAnimationFrame(MZ.aid);Motion.off(MZ._mfn);window.removeEventListener('keydown',MZ._kfn);
    Dialogue.play(Dialogues.prog_maze_ok).then(function(){showProgCD();});
  });

  onSceneCleanup(function(){MZ.done=true;cancelAnimationFrame(MZ.aid);Motion.off(MZ._mfn);window.removeEventListener('keydown',MZ._kfn);});
}

function genMZ(cs,rs){
  var g=[];
  for(var y=0;y<rs;y++){g[y]=[];for(var x=0;x<cs;x++)g[y][x]={w:true,v:false};}
  function carve(x,y){
    g[y][x].w=false;g[y][x].v=true;
    shuffle([[2,0],[-2,0],[0,2],[0,-2]]).forEach(function(d){
      var nx=x+d[0],ny=y+d[1];
      if(nx>0&&nx<cs-1&&ny>0&&ny<rs-1&&!g[ny][nx].v){g[y+d[1]/2][x+d[0]/2].w=false;carve(nx,ny);}
    });
  }
  carve(1,1);
  return g;
}

function mvMZ(key){
  if(MZ.done)return;
  var nx=MZ.p.x, ny=MZ.p.y;
  switch(key){case'ArrowUp':ny--;break;case'ArrowDown':ny++;break;case'ArrowLeft':nx--;break;case'ArrowRight':nx++;break;default:return;}
  if(nx<0||ny<0||nx>=MZ.cols||ny>=MZ.rows)return;
  if(MZ.grid[ny]&&MZ.grid[ny][nx]&&MZ.grid[ny][nx].w)return;
  MZ.p.x=nx;MZ.p.y=ny;renderMZ();

  // 到达出口或出口相邻格
  var ex=MZ.e.x, ey=MZ.e.y;
  if((nx===ex&&ny===ey)||(nx===ex-1&&ny===ey)||(nx===ex&&ny===ey-1)||(Math.abs(nx-ex)<=1&&Math.abs(ny-ey)<=1)){
    MZ.done=true;cancelAnimationFrame(MZ.aid);Motion.off(MZ._mfn);window.removeEventListener('keydown',MZ._kfn);
    toast('找到出口了！','prog',1800);
    setTimeout(function(){Dialogue.play(Dialogues.prog_maze_ok).then(function(){showProgCD();});},1000);
  }
}

function renderMZ(){
  var ctx=MZ.x, cs=MZ.cs;
  ctx.clearRect(0,0,MZ.c.width,MZ.c.height);
  for(var y=0;y<MZ.rows;y++)for(var x=0;x<MZ.cols;x++)if(MZ.grid[y][x].w){ctx.fillStyle='rgba(0,212,255,.05)';ctx.fillRect(x*cs,y*cs,cs,cs);}
  // 出口区域画大一点
  ctx.fillStyle='rgba(0,255,100,.2)';
  ctx.fillRect(MZ.e.x*cs, MZ.e.y*cs, cs, cs);
  ctx.fillRect((MZ.e.x-1)*cs, MZ.e.y*cs, cs, cs);
  ctx.fillRect(MZ.e.x*cs, (MZ.e.y-1)*cs, cs, cs);
  ctx.fillStyle='#fff';ctx.font=Math.floor(cs*.8)+'px sans-serif';
  ctx.fillText('🚪', MZ.e.x*cs, MZ.e.y*cs+cs-2);
  ctx.fillStyle='#00D4FF';ctx.beginPath();ctx.arc(MZ.p.x*cs+cs/2,MZ.p.y*cs+cs/2,cs/3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
  MZ.aid=requestAnimationFrame(renderMZ);
}

function showProgCD(){
  GameState.calcCountdown();
  var d=GameState.countdownMinutes+':'+String(GameState.countdownSeconds).padStart(2,'0');
  var m=showModal({theme:'prog',title:'⚠ 洞窟坍塌倒计时',text:'剩余时间 <b style="color:var(--prog-cyan);font-size:20px">'+d+'</b>',btn:'开始修复',onConfirm:function(){startPP();}});
  setTimeout(function(){if(m.ov.parentNode){m.close();startPP();}},5000);
}

function startPP(){Dialogue.play(Dialogues.prog_countdown).then(function(){SM.go('scene-photo-puzzle').then(function(){initPhotoPuzzle();});});}
