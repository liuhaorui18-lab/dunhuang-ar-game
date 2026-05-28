/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — ending.js
   结局展示 + 结算页面
   ═══════════════════════════════════════════════════════ */

// ─── Archaeologist Ending ──────────────────────────────
function showEnding() {
  const container = document.getElementById('ending-content');

  const countCompleted = GameState.artifactsCompleted.length;
  const allFour = ['mural', 'scripture', 'buddha', 'statue'];
  const nameMap = { mural: '壁画', scripture: '经书', buddha: '大佛像', statue: '小佛像' };

  if (countCompleted > 0) {
    // Success — found at least some artifacts
    container.innerHTML = `
      <div class="ending-title arch">探索结束</div>
      <div style="font-size:13px;opacity:.5;text-align:center;line-height:1.6">
        洞窟坍塌前，你成功抢救了 ${countCompleted} 件文物。
      </div>
      <div class="results-list" id="results-list"></div>
      <button class="btn btn-arch" id="ending-continue-btn">查看结算</button>
    `;

    const list = container.querySelector('#results-list');
    allFour.forEach(id => {
      const item = document.createElement('div');
      item.className = 'result-item arch' + (GameState.artifactsCompleted.includes(id) ? '' : ' failed');
      item.textContent = { mural: '🖼', scripture: '📜', buddha: '🗿', statue: '🕯' }[id];
      list.appendChild(item);
    });

    container.querySelector('#ending-continue-btn').addEventListener('click', () => {
      // Play ending dialogue
      Dialogue.play(Dialogues.arch_ending).then(() => {
        checkNotebook();
      });
    });

  } else {
    // Failed — found nothing
    container.innerHTML = `
      <div class="ending-title arch">时间耗尽</div>
      <div style="font-size:13px;opacity:.5;text-align:center;line-height:1.6">
        洞窟坍塌了，你没能找到任何文物……<br>
        但你的探索为未来的研究提供了宝贵的数据。
      </div>
      <div style="margin-top:8px;font-size:11px;opacity:.35">
        "把火把拿远一点，会晃到摄像头，对，我看不……等等，注意时间！"
      </div>
      <button class="btn btn-arch" id="ending-continue-btn">查看结算</button>
    `;

    container.querySelector('#ending-continue-btn').addEventListener('click', () => {
      showResults();
    });
  }
}

// ─── Check for notebook trigger ────────────────────────
function checkNotebook() {
  // Notebook unlocks if all 4 artifacts are completed
  if (GameState.artifactsCompleted.length >= 4) {
    GameState.hasNotebook = true;
    Dialogue.play(Dialogues.notebook_found).then(() => {
      showNotebookPuzzle();
    });
  } else {
    showResults();
  }
}

function showNotebookPuzzle() {
  const container = document.getElementById('ending-content');
  container.innerHTML = `
    <div class="ending-title arch">发现笔记本</div>
    <div style="font-size:12px;opacity:.5;text-align:center;line-height:1.6">
      一个破破烂烂的笔记本，里面夹着很多照片和手绘的草稿。<br>
      需要输入四位数字密码才能打开。
    </div>
    <div style="display:flex;gap:8px;margin-top:12px" id="notebook-code-display">
      <input type="number" id="nb-d1" style="width:40px;text-align:center;font-size:20px" maxlength="1" max="9">
      <input type="number" id="nb-d2" style="width:40px;text-align:center;font-size:20px" maxlength="1" max="9">
      <input type="number" id="nb-d3" style="width:40px;text-align:center;font-size:20px" maxlength="1" max="9">
      <input type="number" id="nb-d4" style="width:40px;text-align:center;font-size:20px" maxlength="1" max="9">
    </div>
    <button class="btn btn-arch" id="nb-submit">确认</button>
    <div style="font-size:10px;opacity:.3;margin-top:4px">提示：会不会是谁的生日？</div>
  `;

  // Auto-focus
  setTimeout(() => document.getElementById('nb-d1').focus(), 300);

  // Auto-tab between inputs
  ['nb-d1', 'nb-d2', 'nb-d3', 'nb-d4'].forEach((id, i, arr) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (el.value && i < arr.length - 1) {
        document.getElementById(arr[i + 1]).focus();
      }
    });
  });

  document.getElementById('nb-submit').addEventListener('click', () => {
    const d1 = document.getElementById('nb-d1').value;
    const d2 = document.getElementById('nb-d2').value;
    const d3 = document.getElementById('nb-d3').value;
    const d4 = document.getElementById('nb-d4').value;
    const code = d1 + d2 + d3 + d4;

    if (code === PuzzleAnswers.notebookCode) {
      toast('笔记本解锁成功！', 'arch', 2000);
      Dialogue.play(Dialogues.notebook_unlocked).then(() => {
        showResults();
      });
    } else {
      toast('密码错误……', 'arch', 1500);
    }
  });
}

// ─── Results Screen ────────────────────────────────────
function showResults() {
  SM.go('scene-results').then(() => {
    const container = document.getElementById('results-content');
    const allFour = ['mural', 'scripture', 'buddha', 'statue'];
    const icons = { mural: '🖼', scripture: '📜', buddha: '🗿', statue: '🕯' };
    const names = { mural: '壁画复原', scripture: '经卷整理', buddha: '佛像扫描', statue: '小佛像' };

    const archDone = GameState.artifactsCompleted.length;
    const hasNotebook = GameState.hasNotebook;

    let itemsHTML = allFour.map(id => {
      const done = GameState.artifactsCompleted.includes(id);
      return `<div class="result-item arch${done ? '' : ' failed'}">${icons[id]}</div>`;
    }).join('');

    if (hasNotebook) {
      itemsHTML += `<div class="result-item arch" style="border-color:var(--gold)">📓</div>`;
    }

    container.innerHTML = `
      <div class="ending-title arch">收集结算</div>
      <div class="results-list">${itemsHTML}</div>
      <div style="font-size:12px;opacity:.4;text-align:center;line-height:1.6">
        文物抢救：${archDone}/4${hasNotebook ? '<br>🎉 解锁隐藏物品：笔记本' : ''}
      </div>
      <button class="btn btn-arch" onclick="location.reload()" style="margin-top:12px">重新开始</button>
    `;
  });
}

// ─── Programmer Ending ─────────────────────────────────
function showProgEnding() {
  Dialogue.play(Dialogues.prog_ending).then(() => {
    SM.go('scene-results').then(() => {
      const container = document.getElementById('results-content');

      container.innerHTML = `
        <div class="ending-title prog">数据传输完成</div>
        <div style="font-size:13px;opacity:.5;text-align:center;line-height:1.6">
          文物数据已全部修复。<br>
          在虚拟空间中，整座洞窟得以重建。
        </div>
        <div style="margin-top:12px;font-size:11px;opacity:.35;text-align:center">
          "用代码保存那些注定要消失的东西。"
        </div>
        <button class="btn btn-prog" onclick="location.reload()" style="margin-top:16px">重新开始</button>
      `;
    });
  });
}
