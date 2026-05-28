/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — ui.js
   对话 · 弹窗 · Toast · 粒子  严格使用设计素材
   ═══════════════════════════════════════════════════════ */

class DialogueSystem {
  constructor() { this._ls = []; this._i = 0; this._typing = false; this._skip = false; this._cb = null; this._last = 0; this._done = false; this._make(); }

  _make() {
    const o = document.getElementById('dialogue-bar'); if (o) o.remove();
    this.el = document.createElement('div'); this.el.id = 'dialogue-bar'; this.el.className = 'dialogue-bar';
    this._sp = document.createElement('div'); this._sp.className = 'dialogue-speaker'; this.el.appendChild(this._sp);
    this._tx = document.createElement('div'); this._tx.className = 'dialogue-text'; this.el.appendChild(this._tx);
    this._hint = document.createElement('div'); this._hint.className = 'dialogue-next'; this._hint.style.display = 'none'; this.el.appendChild(this._hint);
    document.body.appendChild(this.el);
    this._fn = e => { e.preventDefault(); this._next(); };
    this.el.addEventListener('click', this._fn);
  }

  play(lines) {
    return new Promise(resolve => {
      this._ls = lines; this._i = 0; this._cb = resolve; this._done = false;
      this.el.style.display = ''; this._show();
    });
  }

  _show() {
    if (this._i >= this._ls.length) { this._finish(); return; }
    const L = this._ls[this._i];
    const isP = L.speaker === '*';
    this._sp.textContent = isP ? '程序员' : '考古学家';
    this._sp.className = 'dialogue-speaker ' + (isP ? 'prog' : 'arch');
    this._tx.textContent = ''; this._hint.style.display = 'none';
    this._typing = true; this._skip = false;
    let j = 0; const txt = L.text;
    this._timer = setInterval(() => {
      if (this._skip) { clearInterval(this._timer); this._tx.textContent = txt; this._endType(); return; }
      if (j < txt.length) { this._tx.textContent += txt[j++]; }
      else { clearInterval(this._timer); this._endType(); }
    }, 22);
  }

  _endType() { this._typing = false; this._skip = false; this._hint.style.display = ''; }

  _next() {
    if (Date.now() - this._last < 150) return; this._last = Date.now();
    if (this._typing) { this._skip = true; } else { this._i++; this._show(); }
  }

  _finish() { this.el.style.display = 'none'; if (!this._done) { this._done = true; if (this._cb) this._cb(); } }

  destroy() { if (this._timer) clearInterval(this._timer); if (this.el) { this.el.removeEventListener('click', this._fn); this.el.remove(); } }
}

// ─── Modal ─────────────────────────────────────────────
function showModal(opts) {
  const ov = document.createElement('div'); ov.className = 'modal-overlay';
  const box = document.createElement('div'); box.className = 'modal-box ' + (opts.theme || 'arch');
  if (opts.title) { const t = document.createElement('div'); t.className = 'modal-title'; t.textContent = opts.title; box.appendChild(t); }
  if (opts.text) { const c = document.createElement('div'); c.className = 'modal-text'; c.innerHTML = opts.text; box.appendChild(c); }
  if (opts.timer) { const d = document.createElement('div'); d.className = 'modal-timer ' + (opts.theme || 'arch'); d.textContent = opts.timer; box.appendChild(d); opts._tEl = d; }
  if (opts.btn) {
    const b = document.createElement('button'); b.className = 'btn btn-' + (opts.theme || 'arch');
    b.textContent = opts.btn; b.addEventListener('click', () => { ov.remove(); if (opts.onConfirm) opts.onConfirm(); });
    box.appendChild(b);
  }
  ov.appendChild(box); document.body.appendChild(ov);
  return { ov, tEl: opts._tEl, close() { ov.remove(); }, upd(t) { if (opts._tEl) opts._tEl.textContent = t; } };
}

// ─── Toast ─────────────────────────────────────────────
function toast(msg, theme, dur) {
  theme = theme || 'arch'; dur = dur || 2000;
  const e = document.createElement('div'); e.className = 'toast toast-' + theme; e.textContent = msg;
  document.body.appendChild(e);
  setTimeout(() => { e.classList.add('toast-out'); setTimeout(() => e.remove(), 400); }, dur);
}

// ─── Sparks ───────────────────────────────────────────
function sparks(x, y, n, c) {
  n = n || 8; c = c || 'var(--gold)';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div'); s.className = 'spark';
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.backgroundColor = c;
    const a = (Math.PI * 2 / n) * i + Math.random() * .5;
    const d = randInt(18, 44);
    s.style.setProperty('--sx', Math.cos(a) * d + 'px');
    s.style.setProperty('--sy', Math.sin(a) * d + 'px');
    s.style.width = s.style.height = randInt(3, 5) + 'px';
    document.body.appendChild(s); setTimeout(() => s.remove(), 550);
  }
}

const Dialogue = new DialogueSystem();
