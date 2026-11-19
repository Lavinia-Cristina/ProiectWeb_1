/**
 * public/js/app.js
 * Modul comun pentru gestionarea temei (Light/Dark) și conexiunea SSE în timp real.
 */

// 1. Gestiune Temă
(function initTheme() {
  const saved = localStorage.getItem('kt-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('kt-theme', next);

  // Actualizare text buton dacă există
  const btn = document.getElementById('theme-toggle-label');
  if (btn) {
    btn.textContent = next === 'dark' ? '☀️ Mod Luminos' : '🌙 Mod Întunecat';
  }
}

// 2. Conexiune SSE în timp real (D-002)
class KonTikiSSE {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.connect();
  }

  connect() {
    this.eventSource = new EventSource('/api/events');

    this.eventSource.onopen = () => {
      console.log('✓ SSE conectat la serverul Kon Tiki');
      this.updateConnectionBadge(true);
    };

    this.eventSource.onerror = (err) => {
      console.warn('Conexiune SSE întreruptă, reîncercare automată...', err);
      this.updateConnectionBadge(false);
    };

    // Înregistrare evenimente uzuale
    const eventTypes = ['connected', 'order:new', 'order:status', 'table:status', 'stock:update', 'payment:done', 'system:reset'];
    for (const type of eventTypes) {
      this.eventSource.addEventListener(type, (e) => {
        try {
          const data = JSON.parse(e.data);
          this.trigger(type, data);
        } catch (err) {
          console.error(`Eroare parsare SSE [${type}]:`, err);
        }
      });
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  trigger(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    for (const cb of callbacks) {
      try {
        cb(data);
      } catch (err) {
        console.error(`Eroare callback [${eventType}]:`, err);
      }
    }
  }

  updateConnectionBadge(connected) {
    const badge = document.getElementById('sse-status-badge');
    if (!badge) return;
    if (connected) {
      badge.textContent = '● Live';
      badge.className = 'badge badge-success';
    } else {
      badge.textContent = '○ Reconectare...';
      badge.className = 'badge badge-warning';
    }
  }
}

const sseClient = new KonTikiSSE();

// 3. Notificări Toast
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'success') toast.style.borderLeftColor = 'var(--color-success)';
  if (type === 'danger' || type === 'error') toast.style.borderLeftColor = 'var(--color-danger)';
  if (type === 'warning') toast.style.borderLeftColor = 'var(--color-warning)';

  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
