/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — wall-scan.js
   AR墙壁扫描场景 · 支持考古学家和程序员
   ═══════════════════════════════════════════════════════ */

let _scanReady = false;
let _scanTimer = null;

function startWallScan() {
  _scanReady = false;
  clearTimeout(_scanTimer);

  const btn = document.getElementById('scan-tap-btn');
  const label = document.getElementById('scan-label');
  const isProg = GameState.phase === 'prog';

  btn.className = `btn ${isProg ? 'btn-prog' : 'btn-arch'} scan-tap-btn`;
  label.className = `scan-label ${isProg ? 'prog' : 'arch'}`;
  label.textContent = isProg ? '正在初始化数字敦煌系统……' : '将摄像头对准附近的岩壁……';
  label.style.color = '';
  btn.classList.remove('visible');

  _scanTimer = setTimeout(() => {
    _scanReady = true;
    label.textContent = isProg ? '✓ 系统连接成功！检测到岩壁数据' : '✓ 检测到可开凿岩壁！';
    label.style.color = isProg ? 'var(--prog-cyan)' : 'var(--gold)';
    btn.textContent = isProg ? '系统就绪，开始任务' : '锚定此处，开始开凿';
    btn.classList.add('visible');
  }, 2500);

  btn.onclick = () => {
    if (!_scanReady) return;
    _scanReady = false;
    btn.classList.remove('visible');

    if (GameState.phase === 'arch') {
      Dialogue.play(Dialogues.arch_opening).then(() => {
        Dialogue.play(Dialogues.arch_wall_can).then(() => {
          SM.go('scene-excavation').then(() => initExcavation());
        });
      });
    } else {
      // Programmer — handled by ending.js startProgrammerWallScan
      Dialogue.play(Dialogues.prog_wall_init).then(() => {
        SM.go('scene-data-shoot').then(() => initDataShoot());
      });
    }
  };

  onSceneCleanup(() => {
    clearTimeout(_scanTimer);
    _scanReady = false;
  });
}
