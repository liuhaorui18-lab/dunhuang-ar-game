/* 敦煌复苏计划 — scripture-sort.js · 按高度排序 */
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
  // 每本书的固定高度（递增排列即为正确答案）
  var itemHts=[130,112,148,140,120,134];
  // 正确顺序：高度从低到高 => items [1(112),4(120),0(130),5(134),3(140),2(148)]
  var correct=[1,4,0,5,3,2];
  var order=[], sel=-1, solved=false;

  function showUI() {
    ov.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;width:100%;max-width:460px">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold-light)">整理经卷顺序</div>' +
      '<div style="font-size:11px;opacity:.6;text-align:center">📐 从左到右按<strong style="color:var(--gold-light)">高度从低到高</strong>排列</div>' +
      '<div style="font-size:10px;opacity:.4;text-align:center">点击一本选中 · 再点击另一本交换位置</div>' +
      '<div id="s-row" style="display:flex;align-items:flex-end;gap:5px;height:170px;justify-content:center;padding:6px;border-radius:8px;min-width:300px;background:rgba(200,150,60,.04);border:1px solid rgba(200,150,60,.08)"></div>' +
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
      el.style.cssText='width:44px;height:'+h+'px;object-fit:contain;border-radius:3px;cursor:pointer;border:'+(isSel?'2px solid var(--gold)':'1px solid transparent')+';box-shadow:'+(isSel?'0 0 14px var(--gold-glow)':'none')+';transition:all .3s;flex-shrink:0;background:rgba(200,150,60,'+(isSel?'.1':'.03')+');';
      el.addEventListener('click',function(){
        if(solved)return;
        if(sel===-1){sel=pos;render();}
        else{var t=order[sel];order[sel]=order[pos];order[pos]=t;sel=-1;render();
          if(order.every(function(v,i){return v===correct[i];})) winS();
          else{var match=0;for(var j=0;j<order.length;j++)if(order[j]===correct[j])match++;
            document.getElementById('s-status').textContent='已对齐 '+match+'/6 本';
          }
        }
      });
      row.appendChild(el);
    });
  }

  function winS(){solved=true;document.getElementById('s-status').textContent='✓ 顺序正确！';document.getElementById('s-skip').style.display='none';
    var imgs=document.getElementById('s-row').querySelectorAll('img');
    imgs.forEach(function(el,i){var item=order[i];el.src=fixSrc[item]||onSrc[item];el.style.border='2px solid var(--gold)';el.style.cursor='default';});
    setTimeout(function(){Dialogue.play(Dialogues.scrip_win).then(function(){ov.classList.remove('active');cb(true);});},500);
  }
}
