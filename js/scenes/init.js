/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — init.js
   场景注册 + 权限请求 + 主流程启动
   ═══════════════════════════════════════════════════════ */

// ─── Scene Registration ────────────────────────────────
// Register all scenes with SM
(function registerAllScenes() {
  const sceneIds = [
    'scene-loading', 'scene-title',
    'scene-perm', 'scene-wall-scan',
    'scene-excavation', 'scene-clue-catch',
    'scene-countdown-reveal',
    'scene-cave-explore',
    'scene-data-shoot', 'scene-maze', 'scene-photo-puzzle',
    'scene-ending', 'scene-results'
  ];

  sceneIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) SM.register(id, el);
  });

  // Init fade
  SM.init(document.getElementById('fade-overlay'));
})();

// ─── Permissions ───────────────────────────────────────
const permBtn = document.getElementById('perm-btn');

permBtn.addEventListener('click', async () => {
  permBtn.textContent = '正在请求权限……';
  permBtn.disabled = true;

  // Camera
  const camOk = await Camera.init(document.getElementById('camera-video'));

  // Motion
  let motOk = false;
  try { motOk = await Motion.requestPermission(); } catch (e) { console.warn('Motion:', e); }
  Motion.start();

  // Update camera display
  const v = document.getElementById('camera-video');
  if (v) v.style.display = camOk ? '' : 'none';

  // Feedback
  if (!camOk) {
    document.querySelector('.cam-darken').style.background = 'rgba(0,0,0,0.85)';
    console.warn('Camera not available, using dark background');
  }
  if (!motOk) {
    console.warn('Motion sensors not available');
  }

  // Show fullscreen hint on mobile
  if (GameState.isMobile) {
    setTimeout(showFullscreenHint, 800);
  }

  // Proceed to wall scan
  await SM.go('scene-wall-scan');
  startWallScan();
});
