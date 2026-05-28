/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — init.js
   场景注册 + 权限请求
   ═══════════════════════════════════════════════════════ */

// ─── Register All Scenes ────────────────────────────────
(function registerAllScenes() {
  const ids = [
    'scene-loading', 'scene-title',
    'scene-perm', 'scene-wall-scan',
    'scene-excavation', 'scene-clue-catch',
    'scene-countdown-reveal',
    'scene-cave-explore',
    'scene-arch-transition',
    'scene-data-shoot', 'scene-maze', 'scene-photo-puzzle',
    'scene-ending', 'scene-results'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) SM.register(id, el);
  });
  SM.init(document.getElementById('fade-overlay'));
})();

// ─── Permissions ───────────────────────────────────────
const permBtn = document.getElementById('perm-btn');
let _permClicked = false;

permBtn.addEventListener('click', async () => {
  if (_permClicked) return;
  _permClicked = true;
  permBtn.textContent = '正在请求权限……';
  permBtn.disabled = true;

  const camOk = await Camera.init(document.getElementById('camera-video'));
  let motOk = false;
  try { motOk = await Motion.requestPermission(); } catch (e) { console.warn('Motion:', e); }
  Motion.start();

  const v = document.getElementById('camera-video');
  if (v) v.style.display = camOk ? '' : 'none';
  if (!camOk) { document.querySelector('.cam-darken').style.background = 'rgba(0,0,0,0.85)'; }

  if (GameState.isMobile) { setTimeout(showFullscreenHint, 800); }

  await SM.go('scene-wall-scan');
  startWallScan();
  _permClicked = false;
});
