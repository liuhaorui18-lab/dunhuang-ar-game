/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — engine.js
   场景管理 + 游戏状态 + 事件总线 + 工具函数
   ═══════════════════════════════════════════════════════ */

// ─── Event Bus ─────────────────────────────────────────
class EventBus {
  constructor() { this._map = new Map(); }
  on(event, fn) {
    if (!this._map.has(event)) this._map.set(event, []);
    this._map.get(event).push(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    const fns = this._map.get(event);
    if (fns) { const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); }
  }
  emit(event, data) {
    const fns = this._map.get(event);
    if (fns) fns.slice().forEach(fn => fn(data));
  }
  once(event, fn) {
    const off = this.on(event, data => { off(); fn(data); });
  }
}

// ─── Game State ────────────────────────────────────────
const GameState = {
  character: null,        // 'arch' | 'prog'
  rhythmScore: 0,         // 第一轮音游完美次数
  rhythmMistakes: 0,      // 第一轮音游失误次数
  cluesCollected: [],     // 已收集的线索ID
  countdownMinutes: 3,    // 探窟倒计时分钟
  countdownSeconds: 50,   // 探窟倒计时秒（实际=分*60+秒）
  artifactsCompleted: [], // 已完成的文物 ['mural','scripture','buddha','statue']
  failedArtifacts: [],    // 未完成的文物
  hasNotebook: false,     // 是否解锁笔记本
  cameraReady: false,     // 摄像头是否就绪
  motionReady: false,     // 陀螺仪是否就绪
  isMobile: false,        // 是否为移动设备

  reset() {
    this.character = null;
    this.rhythmScore = 0;
    this.rhythmMistakes = 0;
    this.cluesCollected = [];
    this.artifactsCompleted = [];
    this.failedArtifacts = [];
    this.hasNotebook = false;
    this.cameraReady = false;
    this.motionReady = false;
  },

  // 根据音游表现计算倒计时
  calcCountdown() {
    // 失误次数决定倒计时区间
    const mistakes = this.rhythmMistakes;
    let minMin, maxMin;
    if (mistakes <= 2) { minMin = 4; maxMin = 5; }
    else if (mistakes <= 5) { minMin = 3; maxMin = 4; }
    else { minMin = 2; maxMin = 3; }

    const totalSec = randInt(minMin * 60, maxMin * 60);
    this.countdownMinutes = Math.floor(totalSec / 60);
    this.countdownSeconds = totalSec % 60;
    return totalSec;
  },

  get totalSeconds() { return this.countdownMinutes * 60 + this.countdownSeconds; },

  hasClue(id) { return this.cluesCollected.includes(id); }
};

// ─── Scene Manager ─────────────────────────────────────
const SM = {
  _scenes: new Map(),
  _current: null,
  _fade: null,
  _transitioning: false,

  init(fadeEl) { this._fade = fadeEl; },

  register(id, el) { this._scenes.set(id, el); },

  go(id, onEnter) {
    if (this._transitioning) return Promise.resolve();
    return new Promise(resolve => {
      const run = () => {
        this._transitioning = false;
        // hide all scenes first (including initially active ones)
        this._scenes.forEach((el, key) => {
          el.classList.remove('active');
          el.style.display = 'none';
        });
        // show next
        const next = this._scenes.get(id);
        if (next) {
          next.style.display = '';
          void next.offsetWidth; // force reflow
          next.classList.add('active');
        }
        this._current = id;
        if (this._fade) this._fade.classList.remove('active');
        if (onEnter) onEnter();
        resolve();
      };
      if (this._fade) {
        this._transitioning = true;
        this._fade.classList.add('active');
        setTimeout(run, 500);
      } else {
        run();
      }
    });
  },

  get current() { return this._current; }
};

// ─── Camera ────────────────────────────────────────────
const Camera = {
  stream: null,
  el: null,

  async init(videoEl, timeoutMs = 8000) {
    this.el = videoEl;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Camera: getUserMedia not available');
      return false;
    }
    try {
      this.stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        }),
        new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), timeoutMs))
      ]);
      videoEl.srcObject = this.stream;
      videoEl.style.display = '';
      await videoEl.play();
      GameState.cameraReady = true;
      return true;
    } catch (e) {
      console.warn('Camera init failed:', e.message || e);
      videoEl.style.display = 'none';
      GameState.cameraReady = false;
      return false;
    }
  },

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    GameState.cameraReady = false;
  }
};

// ─── Motion ────────────────────────────────────────────
const Motion = {
  alpha: 0, beta: 0, gamma: 0,
  ax: 0, ay: 0, az: 0,
  _listeners: [],

  async requestPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const r = await DeviceMotionEvent.requestPermission();
        return r === 'granted';
      } catch { return false; }
    }
    return true; // Android / desktop
  },

  start() {
    window.addEventListener('deviceorientation', e => {
      this.alpha = e.alpha || 0;
      this.beta = e.beta || 0;
      this.gamma = e.gamma || 0;
      this._listeners.forEach(fn => fn({ type: 'orient', alpha: this.alpha, beta: this.beta, gamma: this.gamma }));
    });
    window.addEventListener('devicemotion', e => {
      const a = e.accelerationIncludingGravity || {};
      this.ax = a.x || 0; this.ay = a.y || 0; this.az = a.z || 0;
      this._listeners.forEach(fn => fn({ type: 'motion', ax: this.ax, ay: this.ay, az: this.az }));
    });
    GameState.motionReady = true;
  },

  on(fn) { this._listeners.push(fn); },
  off(fn) { this._listeners = this._listeners.filter(f => f !== fn); },

  // 检测摇晃
  shakeDetector(threshold = 15, callback) {
    let lastX = 0, lastY = 0, lastZ = 0, lastTime = 0;
    return Motion.on(data => {
      if (data.type !== 'motion') return;
      const now = Date.now();
      const delta = Math.abs(data.ax - lastX) + Math.abs(data.ay - lastY) + Math.abs(data.az - lastZ);
      if (delta > threshold && now - lastTime > 300) {
        lastTime = now;
        callback(delta);
      }
      lastX = data.ax; lastY = data.ay; lastZ = data.az;
    });
  }
};

// ─── Preloader ─────────────────────────────────────────
const Preloader = {
  loaded: 0, total: 0,

  preload(urls) {
    this.total = urls.length; this.loaded = 0;
    return Promise.all(urls.map(url => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => { this.loaded++; resolve(); };
      img.src = url;
    })));
  },

  progress() {
    return this.total ? Math.round(this.loaded / this.total * 100) : 100;
  }
};

// ─── Countdown Timer ───────────────────────────────────
class CountdownTimer {
  constructor(seconds, onTick, onEnd) {
    this.remaining = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this._id = null;
  }

  start() {
    this._id = setInterval(() => {
      this.remaining--;
      if (this.onTick) this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onEnd) this.onEnd();
      }
    }, 1000);
  }

  stop() { if (this._id) { clearInterval(this._id); this._id = null; } }

  fmt() {
    const m = Math.floor(this.remaining / 60);
    const s = this.remaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

// ─── Utils ─────────────────────────────────────────────
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function getPos(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// ─── Keyboard Helper (desktop debug) ───────────────────
const Keys = { _down: new Set() };
window.addEventListener('keydown', e => Keys._down.add(e.key));
window.addEventListener('keyup', e => Keys._down.delete(e.key));
Keys.isDown = key => Keys._down.has(key);
