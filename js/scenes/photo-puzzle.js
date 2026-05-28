/* 敦煌复苏计划 — photo-puzzle.js · 点击选择→点击放置 */
const PP = { cur: 0, ttl: 2, pcs: 6, plc: 0, tm: null, td: null, done: false, sel: null };

function initPhotoPuzzle() {
  PP.done = false; PP.cur = 0; PP.ttl = Config.pp.count; PP.pcs = Config.pp.pieces; PP.sel = null;
  var sec = GameState.totalSec;
  PP.td = document.getElementById('prog-timer'); PP.td.style.display = ''; PP.td.textContent = fmtTime(sec);
  PP.tm = new Timer(sec, function(r) { PP.td.textContent = fmtTime(r); if (r <= 30) PP.td.style.color = 'var(--danger-red)'; else if (r <= 60) PP.td.style.color = '#FFA726'; }, function() { finPP(); });
  PP.tm.start();
  roundPP();
  onSceneCleanup(function() { PP.done = true; if (PP.tm) PP.tm.stop(); PP.td.style.display = 'none'; });
}

function roundPP() {
  PP.plc = 0; PP.sel = null;
  var c = document.getElementById('pp-container');
  var imgs = ['assets/壁画碎片/壁画移动页面/普通状态碎片.png','assets/壁画碎片/壁画移动页面/普通状态碎片2.png','assets/壁画碎片/壁画移动页面/普通状态碎片3.png','assets/壁画碎片/壁画移动页面/普通状态碎片 4.png'];
  var order = shuffle(Array.from({length:PP.pcs}, function(_,i) { return i; }));

  var html = '<div style="font-size:14px;font-weight:700;color:var(--prog-cyan);text-align:center;margin-bottom:4px">文物数字修复 ' + (PP.cur + 1) + '/' + PP.ttl + '</div>';
  html += '<div style="font-size:11px;opacity:.5;text-align:center;margin-bottom:8px">👆 先点击下方碎片选中 · 再点击上方空位放入</div>';
  html += '<div id="pp-drop" class="pp-drop" style="min-height:140px;display:flex;flex-wrap:wrap;gap:6px;padding:8px;justify-content:center;background:rgba(0,212,255,.03);border:1px dashed rgba(0,212,255,.15);border-radius:8px">';
  for (var i = 0; i < PP.pcs; i++) {
    html += '<div class="pp-slot" id="pp-slot-' + i + '" style="width:80px;height:80px;border:1px dashed rgba(0,212,255,.25);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;color:rgba(0,212,255,.2)">' + (i + 1) + '</div>';
  }
  html += '</div>';
  html += '<div id="pp-pieces" class="pp-pieces" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:4px">';
  order.forEach(function(id) {
    html += '<div class="pp-piece" data-id="' + id + '" style="width:80px;height:80px;background-image:url(' + imgs[id % 4] + ');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all .2s"></div>';
  });
  html += '</div>';
  html += '<button class="btn btn-skip" id="pp-skip" style="margin-top:6px">跳过此拼图</button>';
  c.innerHTML = html;

  // Click-on-piece: select it
  document.getElementById('pp-pieces').querySelectorAll('.pp-piece').forEach(function(el) {
    el.addEventListener('click', function() {
      if (PP.sel === el) {
        // Deselect
        el.style.border = '2px solid transparent';
        el.style.transform = 'scale(1)';
        PP.sel = null;
        return;
      }
      // Deselect previous
      if (PP.sel) { PP.sel.style.border = '2px solid transparent'; PP.sel.style.transform = 'scale(1)'; }
      PP.sel = el;
      el.style.border = '2px solid var(--prog-cyan)';
      el.style.transform = 'scale(1.08)';
    });
  });

  // Click-on-slot: place selected piece
  document.getElementById('pp-drop').querySelectorAll('.pp-slot').forEach(function(slot) {
    slot.addEventListener('click', function() {
      if (!PP.sel) { toast('请先点击下方选择一个碎片', 'prog', 1500); return; }
      var id = parseInt(PP.sel.dataset.id);
      var sid = parseInt(slot.id.replace('pp-slot-', ''));
      if (id !== sid) { toast('不是这里！再试一次', 'prog', 1000); return; }

      // Correct! Move piece into slot
      PP.sel.style.cssText = 'width:80px;height:80px;background-size:cover;background-position:center;border-radius:6px;border:2px solid var(--prog-cyan);';
      // Copy background
      slot.innerHTML = '';
      slot.appendChild(PP.sel);
      slot.style.border = 'none';
      PP.sel = null;
      PP.plc++;
      sparks(slot.getBoundingClientRect().left + 40, slot.getBoundingClientRect().top + 40, 8, '#00D4FF');

      if (PP.plc >= PP.pcs) {
        toast('拼图完成！', 'prog', 1200);
        PP.cur++;
        if (PP.cur >= PP.ttl) {
          setTimeout(function() { finPP(); }, 1000);
        } else {
          setTimeout(function() { roundPP(); }, 1200);
        }
      }
    });
  });

  document.getElementById('pp-skip').addEventListener('click', function() {
    PP.cur++;
    if (PP.cur >= PP.ttl) finPP(); else roundPP();
  });
}

function finPP() { if (PP.done) return; PP.done = true; if (PP.tm) PP.tm.stop(); PP.td.style.display = 'none'; SM.go('scene-ending').then(function() { showProgEnding(); }); }
