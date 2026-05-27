/* ─── shared.js ─── Camera, Motion, Dialogue, Utils ─── */

// ─── Camera ───────────────────────────────────────────
const Camera = {
  stream: null,
  el: null,

  async init(videoEl) {
    this.el = videoEl;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      videoEl.srcObject = this.stream;
      await videoEl.play();
      return true;
    } catch (e) {
      console.warn('Camera unavailable:', e);
      videoEl.style.display = 'none';
      document.body.style.background = '#0D0804';
      return false;
    }
  },

  stop() {
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }
};

// ─── Motion ───────────────────────────────────────────
const Motion = {
  alpha: 0, beta: 0, gamma: 0,
  ax: 0, ay: 0, az: 0,
  _listeners: [],

  async requestPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        return res === 'granted';
      } catch { return false; }
    }
    return true; // Android / non-iOS
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
      this.ax = a.x || 0;
      this.ay = a.y || 0;
      this.az = a.z || 0;
      this._listeners.forEach(fn => fn('motion', this));
    });
  },

  on(fn) { this._listeners.push(fn); },
  off(fn) { this._listeners = this._listeners.filter(f => f !== fn); }
};

// ─── Dialogue ─────────────────────────────────────────
class DialogueSystem {
  constructor(boxEl, theme = 'arch') {
    this.box = boxEl;
    this.theme = theme;
    this.lines = [];
    this.idx = 0;
    this.onComplete = null;
    this.typing = false;
    this.skipQueue = false;

    boxEl.addEventListener('click', () => this._advance());
    boxEl.addEventListener('touchend', e => { e.preventDefault(); this._advance(); });
  }

  // lines: array of { speaker: '*'|'-', text: string }
  // '*' = programmer (cyan), '-' = archaeologist (gold)
  play(lines, onComplete) {
    this.lines = lines;
    this.idx = 0;
    this.onComplete = onComplete;
    this.box.innerHTML = '';
    this._show();
  }

  _show() {
    if (this.idx >= this.lines.length) {
      if (this.onComplete) this.onComplete();
      return;
    }
    const line = this.lines[this.idx];
    const wrap = document.createElement('div');
    wrap.className = 'dialogue-line';

    const speakerEl = document.createElement('span');
    speakerEl.className = 'speaker';
    if (line.speaker === '*') {
      speakerEl.className += ' speaker-prog';
      speakerEl.textContent = '程序员';
    } else {
      speakerEl.className += ' speaker-arch';
      speakerEl.textContent = '考古学家';
    }

    const textEl = document.createElement('span');
    wrap.appendChild(speakerEl);
    wrap.appendChild(textEl);

    // Remove old hint
    const oldHint = this.box.querySelector('.dialogue-tap-hint');
    if (oldHint) oldHint.remove();

    this.box.appendChild(wrap);
    this.box.scrollTop = this.box.scrollHeight;

    // Typing animation
    this.typing = true;
    let i = 0;
    const text = line.text;
    const tick = () => {
      if (this.skipQueue) {
        textEl.textContent = text;
        this._afterTyping();
        return;
      }
      if (i < text.length) {
        textEl.textContent += text[i++];
        this.box.scrollTop = this.box.scrollHeight;
        setTimeout(tick, 28);
      } else {
        this._afterTyping();
      }
    };
    tick();
  }

  _afterTyping() {
    this.typing = false;
    this.skipQueue = false;
    const hint = document.createElement('div');
    hint.className = 'dialogue-tap-hint';
    hint.textContent = this.idx < this.lines.length - 1 ? '点击继续 ▾' : '点击完成 ✓';
    this.box.appendChild(hint);
  }

  _advance() {
    if (this.typing) {
      this.skipQueue = true;
    } else {
      this.idx++;
      this._show();
    }
  }
}

// ─── Scene Manager ────────────────────────────────────
class SceneManager {
  constructor() {
    this.current = null;
    this.scenes = {};
  }

  register(id, el) { this.scenes[id] = el; }

  go(id, onEnter) {
    const fadeEl = document.getElementById('fade-overlay');
    const run = () => {
      if (this.current) {
        const prev = this.scenes[this.current];
        if (prev) { prev.classList.remove('active'); prev.style.display = 'none'; }
      }
      const next = this.scenes[id];
      if (next) { next.style.display = ''; next.classList.add('active'); }
      this.current = id;
      if (fadeEl) fadeEl.classList.remove('active');
      if (onEnter) onEnter();
    };
    if (fadeEl) {
      fadeEl.classList.add('active');
      setTimeout(run, 400);
    } else {
      run();
    }
  }
}

// ─── Timer ────────────────────────────────────────────
class CountdownTimer {
  constructor(seconds, onTick, onEnd) {
    this.total = seconds;
    this.remaining = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this._id = null;
    this.running = false;
  }

  start() {
    this.running = true;
    this._id = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        this.onEnd();
      }
    }, 1000);
  }

  stop() {
    this.running = false;
    clearInterval(this._id);
  }

  formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}

// ─── Utils ────────────────────────────────────────────
function toast(msg, type = 'arch', duration = 2200) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function showModal(opts) {
  // opts: { theme, title, content, timer, btnText, onClose }
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const box = document.createElement('div');
  box.className = `modal-box ${opts.theme || 'arch'}`;

  if (opts.title) {
    const t = document.createElement('div');
    t.className = 'modal-title';
    t.textContent = opts.title;
    box.appendChild(t);
  }
  if (opts.content) {
    const c = document.createElement('div');
    c.className = 'modal-content';
    c.innerHTML = opts.content;
    box.appendChild(c);
  }
  if (opts.timer) {
    const d = document.createElement('div');
    d.className = `modal-timer ${opts.theme || 'arch'}`;
    d.textContent = opts.timer;
    box.appendChild(d);
    opts._timerEl = d;
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

// Random int between min and max inclusive
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Clamp
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Format mm:ss
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Touch / mouse unified event position
function getPos(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}
