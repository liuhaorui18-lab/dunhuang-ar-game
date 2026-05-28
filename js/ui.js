/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — ui.js
   字幕对话系统 + 弹窗 + HUD + Toast
   ═══════════════════════════════════════════════════════ */

// ─── Dialogue System ───────────────────────────────────
class DialogueSystem {
  constructor() {
    this._lines = [];
    this._idx = 0;
    this._typing = false;
    this._skipFlag = false;
    this._onComplete = null;
    this._lastTap = 0;
    this._resolved = false;
    this._createBar();
  }

  _createBar() {
    // Remove existing if any
    const old = document.getElementById('dialogue-bar');
    if (old) old.remove();

    this.el = document.createElement('div');
    this.el.id = 'dialogue-bar';
    this.el.className = 'dialogue-bar';
    this.el.innerHTML = `
      <div class="dialogue-bg"></div>
      <div class="dialogue-content">
        <span class="dialogue-speaker"></span>
        <span class="dialogue-text"></span>
        <span class="dialogue-hint"></span>
      </div>
    `;
    document.body.appendChild(this.el);

    this._speakerEl = this.el.querySelector('.dialogue-speaker');
    this._textEl = this.el.querySelector('.dialogue-text');
    this._hintEl = this.el.querySelector('.dialogue-hint');

    // Click handler
    this._clickFn = (e) => {
      e.preventDefault();
      this._advance();
    };
    this.el.addEventListener('click', this._clickFn);
    this.el.addEventListener('touchend', e => {
      e.preventDefault();
      this._advance();
    });
  }

  // Play dialogue and return Promise
  play(lines) {
    return new Promise(resolve => {
      this._lines = lines;
      this._idx = 0;
      this._onComplete = resolve;
      this._resolved = false;
      this.el.style.display = '';
      this._show();
    });
  }

  _show() {
    if (this._idx >= this._lines.length) {
      this._done();
      return;
    }
    const line = this._lines[this._idx];

    // Speaker
    this._speakerEl.textContent = line.speaker === '*' ? '程序员' : '考古学家';
    this._speakerEl.className = 'dialogue-speaker ' + (line.speaker === '*' ? 'sp-prog' : 'sp-arch');

    // Text typing
    this._textEl.textContent = '';
    this._hintEl.style.display = 'none';
    this._typing = true;
    this._skipFlag = false;

    const text = line.text;
    let i = 0;
    this._typeTimer = setInterval(() => {
      if (this._skipFlag) {
        clearInterval(this._typeTimer);
        this._textEl.textContent = text;
        this._finishTyping();
        return;
      }
      if (i < text.length) {
        this._textEl.textContent += text[i++];
      } else {
        clearInterval(this._typeTimer);
        this._finishTyping();
      }
    }, 25);
  }

  _finishTyping() {
    this._typing = false;
    this._skipFlag = false;
    this._hintEl.style.display = 'inline-block';
  }

  _advance() {
    const now = Date.now();
    if (now - this._lastTap < 150) return;
    this._lastTap = now;

    if (this._typing) {
      this._skipFlag = true;
    } else {
      this._idx++;
      this._show();
    }
  }

  _done() {
    this.el.style.display = 'none';
    if (!this._resolved) {
      this._resolved = true;
      if (this._onComplete) this._onComplete();
    }
  }

  destroy() {
    if (this._typeTimer) clearInterval(this._typeTimer);
    if (this.el) {
      this.el.removeEventListener('click', this._clickFn);
      this.el.remove();
    }
  }
}

// ─── Modal System ──────────────────────────────────────
class ModalSystem {
  create(opts) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const box = document.createElement('div');
    box.className = `modal-box ${opts.theme || 'arch'}`;

    // Decorative frame
    const frame = document.createElement('div');
    frame.className = 'modal-frame';
    box.appendChild(frame);

    if (opts.title) {
      const t = document.createElement('div');
      t.className = 'modal-title';
      t.textContent = opts.title;
      box.appendChild(t);
    }

    if (opts.content) {
      const c = document.createElement('div');
      c.className = 'modal-content';
      if (typeof opts.content === 'string') {
        c.innerHTML = opts.content;
      } else {
        c.appendChild(opts.content);
      }
      box.appendChild(c);
    }

    if (opts.timer) {
      const d = document.createElement('div');
      d.className = `modal-timer ${opts.theme || 'arch'}`;
      d.textContent = opts.timer;
      box.appendChild(d);
      opts._timerEl = d;
    }

    // Close button with design PNG
    const closeBtn = document.createElement('div');
    closeBtn.className = 'modal-close-btn';
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      if (opts.onClose) opts.onClose();
    });
    box.appendChild(closeBtn);

    if (opts.btnText) {
      const btn = document.createElement('button');
      btn.className = `btn btn-${opts.theme || 'arch'}`;
      btn.textContent = opts.btnText;
      btn.addEventListener('click', () => {
        overlay.remove();
        if (opts.onConfirm) opts.onConfirm();
      });
      box.appendChild(btn);
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    return {
      overlay,
      timerEl: opts._timerEl || null,
      close() { overlay.remove(); },
      updateTimer(text) { if (opts._timerEl) opts._timerEl.textContent = text; }
    };
  }
}

// ─── Toast ─────────────────────────────────────────────
function toast(msg, theme = 'arch', duration = 2000) {
  const el = document.createElement('div');
  el.className = `toast toast-${theme}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 400);
  }, duration);
}

// ─── HUD Elements ─────────────────────────────────────
function createHUDTimer(id, theme = 'arch') {
  const el = document.createElement('div');
  el.id = id;
  el.className = `hud-timer ${theme}`;
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}

function createHUDScore(id) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'hud-score';
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}

// ─── Spark Particles ──────────────────────────────────
function spawnSparks(x, y, count = 8, color = 'var(--gold)') {
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.backgroundColor = color;
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const dist = randInt(20, 50);
    s.style.setProperty('--sx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--sy', Math.sin(angle) * dist + 'px');
    s.style.width = s.style.height = randInt(3, 6) + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 550);
  }
}

// ─── Singleton instances ───────────────────────────────
const Dialogue = new DialogueSystem();
const Modal = new ModalSystem();

// ─── Fullscreen hint (for iOS PWA) ───────────────────
function showFullscreenHint() {
  const el = document.createElement('div');
  el.className = 'fullscreen-hint';
  el.innerHTML = '<span>上滑隐藏浏览器工具栏可获得更好体验</span>';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
