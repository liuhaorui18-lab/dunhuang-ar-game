/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — engine.js
   场景管理 · 游戏状态 · 相机 · 陀螺仪 · 工具
   ═══════════════════════════════════════════════════════ */

const GameState = {
  phase: 'arch', rhythmScore: 0, rhythmMistakes: 0,
  cluesCollected: [], countdownMinutes: 3, countdownSeconds: 50,
  artifactsCompleted: [], failedArtifacts: [],
  hasNotebook: false, cameraReady: false, motionReady: false,
  isMobile: false,

  reset() {
    this.phase = 'arch'; this.rhythmScore = 0; this.rhythmMistakes = 0;
    this.cluesCollected = []; this.artifactsCompleted = []; this.failedArtifacts = [];
    this.hasNotebook = false;
  },

  calcCountdown() {
    const m = this.rhythmMistakes;
    let lo, hi;
    if (m <= 2) { lo = 4; hi = 5; } else if (m <= 5) { lo = 3; hi = 4; } else { lo = 2; hi = 3; }
    const sec = randInt(lo * 60, hi * 60);
    this.countdownMinutes = Math.floor(sec / 60);
    this.countdownSeconds = sec % 60;
    return sec;
  },
  get totalSec() { return this.countdownMinutes * 60 + this.countdownSeconds; },
  hasClue(id) { return this.cluesCollected.includes(id); }
};

// ─── Cleanup ───────────────────────────────────────────
const _cleanups = [];
function onSceneCleanup(fn) { _cleanups.push(fn); }
function runCleanup() { _cleanups.slice().forEach(fn => { try { fn(); } catch(e) {} }); _cleanups.length = 0; }
function clearAllUI() {
  document.querySelectorAll('.modal-overlay,.toast,.spark,.clue-card,.data-node,.mural-piece,.candle-light').forEach(e => e.remove());
  const db = document.getElementById('dialogue-bar'); if (db) db.style.display = 'none';
}

// ─── Scene Manager ─────────────────────────────────────
const SM = {
  _map: new Map(), _cur: null, _fade: null, _locking: false, _last: 0,

  init(el) { this._fade = el; },
  register(id, el) { this._map.set(id, el); },

  go(id, cb) {
    const now = Date.now();
    if (now - this._last < 600) return Promise.resolve();
    this._last = now;
    if (this._locking) return Promise.resolve();

    return new Promise(resolve => {
      const doIt = () => {
        this._locking = false;
        runCleanup();
        clearAllUI();
        this._map.forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
        const next = this._map.get(id);
        if (next) { next.style.display = ''; void next.offsetWidth; next.classList.add('active'); }
        this._cur = id;
        if (this._fade) this._fade.classList.remove('active');
        if (cb) cb();
        resolve();
      };
      if (this._fade) { this._locking = true; this._fade.classList.add('active'); setTimeout(doIt, 500); }
      else { doIt(); }
    });
  },
  get current() { return this._cur; }
};

// ─── Camera ────────────────────────────────────────────
const Camera = {
  stream: null,
  async init(videoEl) {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      this.stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }),
        new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 8000))
      ]);
      videoEl.srcObject = this.stream; videoEl.style.display = '';
      await videoEl.play(); GameState.cameraReady = true; return true;
    } catch (e) {
      videoEl.style.display = 'none'; GameState.cameraReady = false; return false;
    }
  },
  stop() { if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; } }
};

// ─── Motion ────────────────────────────────────────────
const Motion = {
  a: 0, b: 0, g: 0, ax: 0, ay: 0, az: 0, _ls: [],

  async requestPerm() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try { return (await DeviceMotionEvent.requestPermission()) === 'granted'; } catch { return false; }
    }
    return true;
  },

  start() {
    window.addEventListener('deviceorientation', e => {
      this.a = e.alpha || 0; this.b = e.beta || 0; this.g = e.gamma || 0;
      this._ls.forEach(fn => fn({ type: 'orient', alpha: this.a, beta: this.b, gamma: this.g }));
    });
    window.addEventListener('devicemotion', e => {
      const a = e.accelerationIncludingGravity || {};
      this.ax = a.x || 0; this.ay = a.y || 0; this.az = a.z || 0;
      this._ls.forEach(fn => fn({ type: 'motion', ax: this.ax, ay: this.ay, az: this.az }));
    });
    GameState.motionReady = true;
  },

  on(fn) { this._ls.push(fn); return fn; },
  off(fn) { this._ls = this._ls.filter(f => f !== fn); },
  clear() { this._ls.length = 0; }
};

// ─── Preload ───────────────────────────────────────────
const Preloader = {
  n: 0, t: 0,
  load(urls) { this.t = urls.length; this.n = 0; return Promise.all(urls.map(u => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => { this.n++; r(); }; i.src = u; }))); },
  pct() { return this.t ? Math.round(this.n / this.t * 100) : 100; }
};

// ─── Countdown Timer ───────────────────────────────────
class Timer {
  constructor(sec, tick, end) { this.rem = sec; this.tick = tick; this.end = end; this._id = null; }
  start() { this._id = setInterval(() => { this.rem--; if (this.tick) this.tick(this.rem); if (this.rem <= 0) { this.stop(); if (this.end) this.end(); } }, 1000); }
  stop() { if (this._id) { clearInterval(this._id); this._id = null; } }
  fmt() { const m = Math.floor(this.rem / 60); return m + ':' + String(this.rem % 60).padStart(2, '0'); }
}

// ─── Utils ─────────────────────────────────────────────
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function randFloat(a, b) { return Math.random() * (b - a) + a; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fmtTime(s) { const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
function getPos(e) {
  if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches?.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}
function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
