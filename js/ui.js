/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — ui.js
   字幕对话系统 + 弹窗 + Toast
   严格使用设计素材 PNG，不自行捏造视觉样式
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
    const old = document.getElementById('dialogue-bar');
    if (old) old.remove();

    this.el = document.createElement('div');
    this.el.id = 'dialogue-bar';
    // Use subtitle PNG as the dialogue container background
    this.el.style.cssText = `
      position:fixed; bottom:0; left:0; right:0; z-index:100;
      padding:18px 16px calc(18px + env(safe-area-inset-bottom,4px));
      cursor:pointer;
      background:var(--ui-subtitle) center/100% 100% no-repeat;
      display:none;
    `;

    // Speaker label
    this._speakerEl = document.createElement('span');
    this._speakerEl.style.cssText = `
      display:inline-block; font-size:10px; font-weight:700;
      letter-spacing:.06em; margin-bottom:6px; padding:1px 6px;
      border-radius:2px;
    `;
    this.el.appendChild(this._speakerEl);

    // Text container
    this._textEl = document.createElement('div');
    this._textEl.style.cssText = `
      font-size:14px; line-height:1.65; color:var(--parchment);
      min-height:22px;
    `;
    this.el.appendChild(this._textEl);

    // Continue hint — uses the provided continue button PNG
    this._hintEl = document.createElement('div');
    this._hintEl.style.cssText = `
      display:none; position:absolute; right:12px; bottom:8px;
      width:24px; height:24px;
      background:var(--ui-subtitle-btn) center/contain no-repeat;
      animation: hint-bounce .8s ease infinite;
    `;
    this.el.appendChild(this._hintEl);

    document.body.appendChild(this.el);

    this._clickFn = (e) => { e.preventDefault(); this._advance(); };
    this.el.addEventListener('click', this._clickFn);
  }

  play(lines) {
    return new Promise(resolve => {
      clearDynamicUI();
      this._lines = lines;
      this._idx = 0;
      this._onComplete = resolve;
      this._resolved = false;
      this.el.style.display = '';
      this._show();
    });
  }

  _show() {
    if (this._idx >= this._lines.length) { this._done(); return; }
    const line = this._lines[this._idx];

    // Speaker
    const isProg = line.speaker === '*';
    this._speakerEl.textContent = isProg ? '程序员' : '考古学家';
    this._speakerEl.style.color = isProg ? 'var(--prog-cyan)' : 'var(--gold-light)';
    this._speakerEl.style.background = isProg ? 'rgba(0,212,255,.1)' : 'rgba(200,150,60,.1)';

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
    this._hintEl.style.display = '';
  }

  _advance() {
    const now = Date.now();
    if (now - this._lastTap < 150) return;
    this._lastTap = now;
    if (this._typing) { this._skipFlag = true; }
    else { this._idx++; this._show(); }
  }

  _done() {
    this.el.style.display = 'none';
    if (!this._resolved) { this._resolved = true; if (this._onComplete) this._onComplete(); }
  }

  destroy() {
    if (this._typeTimer) clearInterval(this._typeTimer);
    if (this.el) { this.el.removeEventListener('click', this._clickFn); this.el.remove(); }
  }
}

// ─── Modal System ──────────────────────────────────────
class ModalSystem {
  create(opts) {
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
      if (typeof opts.content === 'string') c.innerHTML = opts.content;
      else c.appendChild(opts.content);
      box.appendChild(c);
    }
    if (opts.timer) {
      const d = document.createElement('div');
      d.className = `modal-timer ${opts.theme || 'arch'}`;
      d.textContent = opts.timer;
      box.appendChild(d);
      opts._timerEl = d;
    }
    if (opts.btnText) {
      const btn = document.createElement('button');
      btn.className = `btn btn-${opts.theme || 'arch'}`;
      btn.textContent = opts.btnText;
      btn.addEventListener('click', () => { overlay.remove(); if (opts.onConfirm) opts.onConfirm(); });
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
function toast(msg, theme, duration) {
  theme = theme || 'arch';
  duration = duration || 2000;
  const el = document.createElement('div');
  el.className = `toast toast-${theme}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 400); }, duration);
}

// ─── Spark Particles ──────────────────────────────────
function spawnSparks(x, y, count, color) {
  count = count || 8;
  color = color || 'var(--gold)';
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

// ─── Singleton ──────────────────────────────────────────
const Dialogue = new DialogueSystem();
const Modal = new ModalSystem();

function showFullscreenHint() {
  const el = document.createElement('div');
  el.className = 'fullscreen-hint';
  el.innerHTML = '<span>上滑隐藏浏览器工具栏可获得更好体验</span>';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
