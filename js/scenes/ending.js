/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — ending.js
   结局展示 → 转场 → 程序员线 → 最终结算
   ═══════════════════════════════════════════════════════ */

// ─── Archaeologist Ending ──────────────────────────────
function showEnding() {
  const container = document.getElementById('ending-content');
  const countCompleted = GameState.artifactsCompleted.length;
  const allFour = ['mural', 'scripture', 'buddha', 'statue'];

  if (countCompleted > 0) {
    container.innerHTML = `
      <div class="ending-title arch">探索结束</div>
      <div class="ending-desc">
        洞窟坍塌前，你成功抢救了 ${countCompleted} 件文物。
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="ending-title arch">时间耗尽</div>
      <div class="ending-desc">
        洞窟坍塌了，你没能找到任何文物……<br>但你的探索为未来的研究提供了宝贵的数据。
      </div>
    `;
  }

  // Play ending dialogue then transition to programmer
  Dialogue.play(Dialogues.arch_ending).then(() => {
    // Check notebook
    if (GameState.artifactsCompleted.length >= 4 && !GameState.hasNotebook) {
      GameState.hasNotebook = true;
      Dialogue.play(Dialogues.notebook_found).then(() => {
        Dialogue.play(Dialogues.notebook_unlocked).then(() => {
          transitionToProgrammer();
        });
      });
    } else {
      transitionToProgrammer();
    }
  });
}

// ─── Archaeologist → Programmer Transition ─────────────
function transitionToProgrammer() {
  SM.go('scene-arch-transition').then(() => {
    // Show transition for 3 seconds then start programmer line
    setTimeout(() => {
      startProgrammerChapter();
    }, 3000);
  });
}

function startProgrammerChapter() {
  // Reset game state for programmer chapter
  GameState.phase = 'prog';
  GameState.character = 'prog';
  document.body.setAttribute('data-theme', 'prog');
  GameState.cluesCollected = [];
  GameState.rhythmScore = 0;
  GameState.rhythmMistakes = 0;

  // Full cleanup — clear all dynamic UI and scene artifacts
  clearDynamicUI();
  runSceneCleanup();
  Motion.offAll();

  // Start programmer opening dialogue → wall scan
  SM.go('scene-perm').then(() => {
    // Update perm screen for programmer
    document.getElementById('perm-icon').textContent = '💻';
    document.getElementById('perm-title').style.color = 'var(--prog-cyan)';
    document.getElementById('perm-desc').innerHTML =
      '你将远程协助一位洞窟中的考古学家。<br>游戏需要使用<strong>摄像头</strong>和<strong>运动传感器</strong>。<br>请在弹出的权限请求中点击"允许"。';
    document.querySelector('.perm-role-text').textContent = '身份：程序员';
    document.querySelector('.perm-role-text').style.color = 'var(--prog-cyan)';
    const permBtn = document.getElementById('perm-btn');
    permBtn.className = 'btn btn-prog';
    permBtn.textContent = '授权并开始';
    permBtn.disabled = false;

    // Override perm button handler for programmer
    const newBtn = permBtn.cloneNode(true);
    permBtn.parentNode.replaceChild(newBtn, permBtn);
    newBtn.addEventListener('click', async () => {
      newBtn.textContent = '正在请求权限……';
      newBtn.disabled = true;

      const camOk = await Camera.init(document.getElementById('camera-video'));
      let motOk = false;
      try { motOk = await Motion.requestPermission(); } catch (e) {}
      Motion.start();

      const v = document.getElementById('camera-video');
      if (v) v.style.display = camOk ? '' : 'none';

      await SM.go('scene-wall-scan');
      startProgrammerWallScan();
    });
  });
}

// ─── Programmer Wall Scan ──────────────────────────────
function startProgrammerWallScan() {
  const btn = document.getElementById('scan-tap-btn');
  const label = document.getElementById('scan-label');

  btn.className = 'btn btn-prog scan-tap-btn';
  label.textContent = '正在初始化数字敦煌系统……';
  btn.classList.remove('visible');

  setTimeout(() => {
    label.textContent = '✓ 系统连接成功！检测到岩壁数据';
    label.style.color = 'var(--prog-cyan)';
    btn.textContent = '系统就绪，开始任务';
    btn.classList.add('visible');
  }, 2500);

  btn.onclick = () => {
    if (!btn.classList.contains('visible')) return;
    btn.classList.remove('visible');

    Dialogue.play(Dialogues.prog_opening).then(() => {
      Dialogue.play(Dialogues.prog_wall_init).then(() => {
        SM.go('scene-data-shoot').then(() => initDataShoot());
      });
    });
  };
}

// ─── Programmer Ending ─────────────────────────────────
function showProgEnding() {
  Dialogue.play(Dialogues.prog_ending).then(() => {
    SM.go('scene-results').then(() => {
      const container = document.getElementById('results-content');
      container.innerHTML = `
        <div class="ending-title prog">数据传输完成</div>
        <div class="ending-desc">
          文物数据已全部修复。<br>在虚拟空间中，整座洞窟得以重建。
        </div>
        <div style="margin-top:12px;font-size:11px;opacity:.35;text-align:center">
          "用代码保存那些注定要消失的东西。"
        </div>
      `;
    });
  });
}
