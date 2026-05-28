/* 敦煌复苏计划 — shared.js — Camera, Motion, Subtitle, Utils */

// ─── Camera ───────────────────────────────────────────
const Camera = {
  stream: null, el: null,

  async init(videoEl, timeoutMs = 12000) {
    this.el = videoEl;
    try {
      this.stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode:'environment', width:{ideal:1280}, height:{ideal:720} },
          audio: false
        }),
        new Promise((_,r) => setTimeout(() => r(new Error('CAMERA_TIMEOUT')), timeoutMs))
      ]);
      videoEl.srcObject = this.stream;
      await videoEl.play();
      return true;
    } catch(e) {
      console.warn('Camera:', e.message || e);
      videoEl.style.display = 'none';
      videoEl.style.pointerEvents = 'none';
      return false;
    }
  },

  stop() { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); }
};

// ─── Motion ───────────────────────────────────────────
const Motion = {
  alpha:0, beta:0, gamma:0, ax:0, ay:0, az:0,
  _listeners:[],

  async requestPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try { const r = await DeviceMotionEvent.requestPermission(); return r === 'granted'; }
      catch { return false; }
    }
    return true;
  },

  start() {
    window.addEventListener('deviceorientation', e => {
      this.alpha = e.alpha || 0;
      this.beta  = e.beta  || 0;
      this.gamma = e.gamma || 0;
      this._listeners.forEach(fn => fn('orient', this));
    });
    window.addEventListener('devicemotion', e => {
      const a = e.accelerationIncludingGravity || {};
      this.ax = a.x || 0; this.ay = a.y || 0; this.az = a.z || 0;
      this._listeners.forEach(fn => fn('motion', this));
    });
  },

  on(fn) { this._listeners.push(fn); },
  off(fn) { this._listeners = this._listeners.filter(f => f !== fn); }
};

// ─── Subtitle System (top bar, replaces bottom dialogue) ─
class SubtitleSystem {
  constructor(theme = 'arch') {
    this.theme = theme;
    this.lines = []; this.idx = 0;
    this.onComplete = null;
    this.typing = false; this.skipQueue = false;
    this._lastTap = 0;

    // Create bar if not exists
    this.bar = document.getElementById('subtitle-bar');
    if (!this.bar) {
      this.bar = document.createElement('div');
      this.bar.id = 'subtitle-bar';
      this.bar.className = 'subtitle-bar';
      document.body.appendChild(this.bar);
    }
    this.bar.style.display = 'none';

    // Click to advance
    this._clickHandler = () => this._advance();
    this.bar.addEventListener('click', this._clickHandler);
    this.bar.addEventListener('touchend', e => {
      if (this.bar.contains(e.target)) { e.preventDefault(); this._advance(); }
    });
  }

  play(lines, onComplete) {
    this.lines = lines; this.idx = 0;
    this.onComplete = onComplete;
    this.bar.innerHTML = '';
    this.bar.style.display = 'flex';
    this._show();
  }

  _show() {
    if (this.idx >= this.lines.length) {
      this.bar.style.display = 'none';
      if (this.onComplete) this.onComplete();
      return;
    }
    const line = this.lines[this.idx];
    this.bar.innerHTML = '';

    const speakerEl = document.createElement('span');
    speakerEl.className = 'subtitle-speaker';
    speakerEl.classList.add(line.speaker === '*' ? 'speaker-prog' : 'speaker-arch');
    speakerEl.textContent = line.speaker === '*' ? '程序员' : '考古学家';

    const textEl = document.createElement('span');
    textEl.className = 'subtitle-text typing';

    const hintEl = document.createElement('span');
    hintEl.className = 'subtitle-hint';

    this.bar.appendChild(speakerEl);
    this.bar.appendChild(textEl);
    this.bar.appendChild(hintEl);

    // Typing animation
    this.typing = true;
    let i = 0;
    const text = line.text;
    const tick = () => {
      if (this.skipQueue) {
        textEl.textContent = text;
        textEl.classList.remove('typing');
        this._afterTyping(hintEl);
        return;
      }
      if (i < text.length) {
        textEl.textContent += text[i++];
        setTimeout(tick, 24);
      } else {
        textEl.classList.remove('typing');
        this._afterTyping(hintEl);
      }
    };
    tick();
  }

  _afterTyping(hintEl) {
    this.typing = false; this.skipQueue = false;
    hintEl.textContent = this.idx < this.lines.length - 1 ? '点击继续 ▾' : '点击完成 ✓';
  }

  _advance() {
    const now = Date.now();
    if (now - this._lastTap < 100) return;
    this._lastTap = now;
    if (this.typing) { this.skipQueue = true; }
    else { this.idx++; this._show(); }
  }

  destroy() {
    this.bar.removeEventListener('click', this._clickHandler);
    this.bar.style.display = 'none';
  }
}

// ─── Scene Manager ────────────────────────────────────
class SceneManager {
  constructor() {
    this.current = null;
    this.scenes = {};
    this._transitioning = false;
  }

  register(id, el) { this.scenes[id] = el; }

  go(id, onEnter) {
    const fadeEl = document.getElementById('fade-overlay');
    if (this._transitioning && fadeEl) fadeEl.classList.remove('active');

    return new Promise(resolve => {
      const run = () => {
        this._transitioning = false;
        if (this.current) {
          const prev = this.scenes[this.current];
          if (prev) { prev.classList.remove('active'); prev.style.display = 'none'; }
        }
        const next = this.scenes[id];
        if (next) { next.style.display = ''; next.classList.add('active'); }
        this.current = id;
        if (fadeEl) fadeEl.classList.remove('active');
        if (onEnter) onEnter();
        resolve();
      };
      if (fadeEl) {
        this._transitioning = true;
        fadeEl.classList.add('active');
        setTimeout(run, 400);
      } else { run(); }
    });
  }
}

// ─── Countdown Timer ──────────────────────────────────
class CountdownTimer {
  constructor(seconds, onTick, onEnd) {
    this.total = seconds; this.remaining = seconds;
    this.onTick = onTick; this.onEnd = onEnd;
    this._id = null; this.running = false;
  }

  start() {
    this.running = true;
    this._id = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);
      if (this.remaining <= 0) { this.stop(); this.onEnd(); }
    }, 1000);
  }

  stop() { this.running = false; clearInterval(this._id); }

  formatTime(s) {
    const m = Math.floor(s/60);
    return `${m}:${(s%60).toString().padStart(2,'0')}`;
  }
}

// ─── Utils ────────────────────────────────────────────
function toast(msg, type='arch', duration=2000) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function showModal(opts) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const box = document.createElement('div');
  box.className = `modal-box ${opts.theme || 'arch'}`;

  if (opts.title) { const t = document.createElement('div'); t.className = 'modal-title'; t.textContent = opts.title; box.appendChild(t); }
  if (opts.content) { const c = document.createElement('div'); c.className = 'modal-content'; c.innerHTML = opts.content; box.appendChild(c); }
  if (opts.timer) {
    const d = document.createElement('div'); d.className = `modal-timer ${opts.theme||'arch'}`; d.textContent = opts.timer; box.appendChild(d); opts._timerEl = d;
  }

  const btn = document.createElement('button');
  btn.className = `btn btn-${opts.theme || 'arch'}`;
  btn.textContent = opts.btnText || '确认';
  btn.onclick = () => { overlay.remove(); if (opts.onClose) opts.onClose(); };
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  return { overlay, timerEl: opts._timerEl };
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmtTime(s) { const m = Math.floor(s/60); return `${m}:${(s%60).toString().padStart(2,'0')}`; }
function getPos(e) {
  if (e.touches && e.touches.length) return { x:e.touches[0].clientX, y:e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches.length) return { x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY };
  return { x:e.clientX, y:e.clientY };
}

// ─── Spark particles ──────────────────────────────────
function spawnSparks(x, y, count=8) {
  for (let i=0; i<count; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = x + 'px'; s.style.top = y + 'px';
    const angle = (Math.PI*2/count)*i + Math.random()*0.5;
    const dist = randInt(20, 50);
    s.style.setProperty('--sx', Math.cos(angle)*dist + 'px');
    s.style.setProperty('--sy', Math.sin(angle)*dist + 'px');
    s.style.width = s.style.height = randInt(3,6) + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 550);
  }
}
