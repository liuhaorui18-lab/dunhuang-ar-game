/* 敦煌复苏计划 — init.js */
['scene-loading','scene-title','scene-perm','scene-prog-perm','scene-wall-scan','scene-excavation','scene-clue-catch','scene-countdown-reveal','scene-cave-explore','scene-arch-transition','scene-data-shoot','scene-maze','scene-photo-puzzle','scene-ending','scene-results'].forEach(id => {
  const el = document.getElementById(id); if (el) SM.register(id, el);
});
SM.init(document.getElementById('fade-overlay'));

let _permDone = false;
document.getElementById('perm-btn').addEventListener('click', async () => {
  if (_permDone) return; _permDone = true;
  const btn = document.getElementById('perm-btn');
  btn.textContent = '正在请求权限……'; btn.disabled = true;
  await Camera.init(document.getElementById('camera-video'));
  try { await Motion.requestPerm(); } catch(e) {}
  Motion.start();
  if (!GameState.cameraReady) document.querySelector('.cam-darken').style.background = 'rgba(0,0,0,.85)';
  await SM.go('scene-wall-scan');
  startWallScan();
  _permDone = false;
});
