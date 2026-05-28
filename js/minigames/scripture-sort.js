/* 敦煌复苏计划 — scripture-sort.js · 右低左高排序 */
function initScrip(ov, cb) {
  var hasClue = GameState.hasClue('scripture');
  ov.innerHTML = '';

  if (!hasClue) {
    Dialogue.play(Dialogues.scrip_no).then(function() { ov.classList.remove('active'); cb(false); });
    return;
  }
  Dialogue.play(Dialogues.scrip_ok).then(function() { showUI(); });

  var offSrc=['assets/经书/左1未选中.png','assets/经书/左2未选中.PNG','assets/经书/左3未选中.png','assets/经书/左4未选中.png','assets/经书/左5未选中.png','assets/经书/左6未选中.png'];
  var onSrc=['assets/经书/左1选中.png','assets/经书/左2选中.png','assets/经书/左3选中.png','assets/经书/左4选中.png','assets/经书/左5选中.png','assets/经书/左6选中.png'];
  var fixSrc=['assets/经书/左1固定.png','assets/经书/左2固定.png','assets/经书/左3固定.png','assets/经书/左4固定.png','assets/经书/左5固定.png',null];
  // 每本书固定高度——差距拉大便于分辨
  var itemHts=[162,118,178,146,128,156];
  // 右低左高：左边最高→右边最低 = [2(178), 0(162), 5(156), 3(146), 4(128), 1(118)]
  var correct=[2,0,5,3,4,1];
  var order=[], sel=-1, solved=false;

  function showUI() {
    ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;width:100%;max-width:480px">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">整理经卷顺序</div>' +
      '<div style="display:flex;align-items:center;gap:10px;width:100%;justify-content:center;margin:4px 0">' +
        '<span style="font-size:11px;color:var(--gold-light);font-weight:700">⬅ 高</span>' +
        '<span style="font-size:11px;opacity:.6">从右到左 · 从低到高排列</span>' +
        '<span style="font-size:11px;color:var(--gold-light);font-weight:700">低 ➜</span>' +
      '</div>' +
      '<div style="font-size:10px;opacity:.4;text-align:center">点击一本选中 · 再点击另一本交换位置</div>' +
      '<div id="s-row" style="display:flex;align-items:flex-end;gap:5px;height:200px;justify-content:center;padding:8px 6px;border-radius:8px;min-width:320px;background:rgba(200,150,60,.04);border:1px solid rgba(200,150,60,.08)"></div>' +
      '<div style="font-size:12px;color:var(--gold-light)" id="s-status"></div>' +
      '<button class="btn btn-arch" id="s-retry" style="display:none">重新排序</button>' +
      '<button class="btn btn-skip" id="s-skip">跳过此文物</button></div>';
    startS();
    document.getElementById('s-retry').addEventListener('click', startS);
    document.getElementById('s-skip').addEventListener('click', function() { Dialogue.play(Dialogues.scrip_lose).then(function() { ov.classList.remove('active'); cb(false); }); });
  }

  function startS() { order=shuffle([0,1,2,3,4,5]); sel=-1; solved=false; document.getElementById('s-retry').style.display='none'; document.getElementById('s-skip').style.display=''; document.getElementById('s-status').textContent=''; render(); }

  function render() {
    var row=document.getElementById('s-row'); if(!row)return;
    row.innerHTML='';
    order.forEach(function(item,pos){
      var isSel=pos===sel;
      var el=document.createElement('img');
      el.src=isSel?onSrc[item]:offSrc[item];
      var h=itemHts[item];
      el.style.cssText='width:46px;height:'+h+'px;object-fit:contain;border-radius:4px;cursor:pointer;border:'+(isSel?'3px solid var(--gold)':'1px solid rgba(200,150,60,.15)')+';box-shadow:'+(isSel?'0 0 16px var(--gold-glow)':'none')+';transition:all .3s;flex-shrink:0;background:rgba(200,150,60,'+(isSel?'.12':'.04')+');';
      el.addEventListener('click',function(){
        if(solved)return;
        if(sel===-1){sel=pos;render();}
        else{var t=order[sel];order[sel]=order[pos];order[pos]=t;sel=-1;render();
          if(order.every(function(v,i){return v===correct[i];})) winS();
          else{var match=0;for(var j=0;j<order.length;j++)if(order[j]===correct[j])match++;
            document.getElementById('s-status').textContent='已对齐 '+match+'/6 本 · '+(match>=4?'快了！':'继续调整');
          }
        }
      });
      row.appendChild(el);
    });
  }

  function winS(){solved=true;document.getElementById('s-status').textContent='✓ 顺序正确！';document.getElementById('s-skip').style.display='none';
    var imgs=document.getElementById('s-row').querySelectorAll('img');
    imgs.forEach(function(el,i){var item=order[i];el.src=fixSrc[item]||onSrc[item];el.style.border='2px solid var(--gold)';el.style.cursor='default';el.style.boxShadow='0 0 12px var(--gold-glow)';});
    setTimeout(function(){Dialogue.play(Dialogues.scrip_win).then(function(){ov.classList.remove('active');cb(true);});},500);
  }
}
