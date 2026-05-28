/* 敦煌复苏计划 — ending.js · 考古结束→过渡→程序员→结算 */
function showEnding() {
  const c = document.getElementById('ending-content');
  const n = GameState.artifactsCompleted.length;
  const all = ['mural','scripture','buddha','statue'];
  const icons = { mural:'🖼', scripture:'📜', buddha:'🗿', statue:'🕯' };
  const names = { mural:'壁画复原', scripture:'经卷整理', buddha:'大佛像扫描', statue:'小佛像' };

  let items = all.map(id => {
    const ok = GameState.artifactsCompleted.includes(id);
    return `<div class="collection-item${ok ? '' : ' lost'}">${icons[id]}</div>`;
  }).join('');

  c.innerHTML = `<div class="ending-title arch">洞窟探索结束</div>
    <div class="collection-row">${items}</div>
    <div class="ending-desc">文物抢救：${n}/4</div>`;

  Dialogue.play(Dialogues.arch_ending).then(() => {
    // Transition to programmer chapter
    SM.go('scene-arch-transition').then(() => {
      setTimeout(() => {
        GameState.phase = 'prog'; GameState.cluesCollected = [];
        GameState.rhythmScore = 0; GameState.rhythmMistakes = 0;
        document.body.setAttribute('data-theme', 'prog');
        Motion.clear(); clearAllUI();
        SM.go('scene-prog-perm');
        // Setup prog perm button
        const b = document.getElementById('prog-perm-btn');
        b.onclick = () => { SM.go('scene-wall-scan').then(() => startWallScan()); };
      }, 3200);
    });
  });
}

function showProgEnding() {
  Dialogue.play(Dialogues.prog_ending).then(() => {
    SM.go('scene-results').then(() => {
      const c = document.getElementById('results-content');
      c.innerHTML = `<div class="ending-title prog">修复完成</div>
        <div class="ending-desc">文物数据已全部修复。<br>在虚拟空间中，整座洞窟得以重建。</div>
        <div style="margin-top:12px;font-size:11px;opacity:.35">"用代码保存那些注定要消失的东西。"</div>`;
    });
  });
}
