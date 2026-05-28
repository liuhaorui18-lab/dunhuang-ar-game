/* 敦煌复苏计划 — wall-scan.js */
let _sr = false, _st = null;

function startWallScan() {
  _sr = false; clearTimeout(_st);
  const btn = document.getElementById('scan-tap-btn');
  const label = document.getElementById('scan-label');
  const isP = GameState.phase === 'prog';

  btn.className = 'btn ' + (isP ? 'btn-prog' : 'btn-arch') + ' scan-btn';
  label.style.color = '';
  label.textContent = isP ? '正在初始化数字敦煌系统……' : '将摄像头对准附近的岩壁……';
  btn.classList.remove('visible');

  _st = setTimeout(() => {
    _sr = true;
    label.style.color = isP ? 'var(--prog-cyan)' : 'var(--gold)';
    label.textContent = isP ? '✓ 系统连接成功！' : '✓ 检测到可开凿岩壁！';
    btn.textContent = isP ? '系统就绪，开始任务' : '锚定此处，开始开凿';
    btn.classList.add('visible');
  }, 2500);

  btn.onclick = () => {
    if (!_sr) return; _sr = false; btn.classList.remove('visible');
    if (GameState.phase === 'arch') {
      Dialogue.play(Dialogues.arch_open).then(() => {
        Dialogue.play(Dialogues.arch_wall_ok).then(() => {
          SM.go('scene-excavation').then(() => initExcavation());
        });
      });
    } else {
      Dialogue.play(Dialogues.prog_open).then(() => {
        Dialogue.play(Dialogues.prog_init).then(() => {
          SM.go('scene-data-shoot').then(() => initDataShoot());
        });
      });
    }
  };
  onSceneCleanup(() => { clearTimeout(_st); _sr = false; });
}
