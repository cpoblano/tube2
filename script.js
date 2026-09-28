const form = document.getElementById('video-form');
const input = document.getElementById('youtube-url');
const errorMessage = document.getElementById('error-message');
const playerWrapper = document.getElementById('player-wrapper');
const emptyState = document.getElementById('empty-state');
const videoFrame = document.getElementById('video-frame');
const historyList = document.getElementById('history-list');

const STORAGE_KEY = 'tube-loader-history';
const MAX_HISTORY_ITEMS = 5;

// --- Debug panel (for users who can't open DevTools) ---
const DEBUG = true;
let debugLogs = [];
function createDebugPanel() {
  if (!DEBUG) return;
  let panel = document.getElementById('debug-panel');
  if (panel) return panel;

  const style = document.createElement('style');
  style.textContent = `#debug-panel{position:fixed;right:18px;bottom:18px;max-width:420px;max-height:48vh;overflow:auto;background:rgba(0,0,0,0.7);color:#e6eef8;border:1px solid rgba(255,255,255,0.06);padding:10px;border-radius:10px;font-family:monospace;font-size:12px;z-index:9999}#debug-panel h4{margin:0 0 8px 0;font-size:13px}#debug-panel pre{white-space:pre-wrap;margin:0}#debug-panel button{margin-top:8px;background:#334155;border:none;color:white;padding:6px 8px;border-radius:6px;cursor:pointer}`;
  document.head.appendChild(style);

  panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.innerHTML = `<h4>Debug Panel</h4><pre id="debug-pre">(logs will appear here)</pre><button id="debug-run">Run diagnostics</button> <button id="debug-clear">Clear</button>`;
  document.body.appendChild(panel);

  document.getElementById('debug-run').addEventListener('click', () => runDiagnostics(true));
  document.getElementById('debug-clear').addEventListener('click', () => { debugLogs = []; renderDebug();});
  renderDebug();
  return panel;
}

function logDebug(...args) {
  if (!DEBUG) return;
  const entry = args.map((a) => {
    try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
  }).join(' ');
  debugLogs.unshift(`[${new Date().toLocaleTimeString()}] ${entry}`);
  if (debugLogs.length > 200) debugLogs.pop();
  renderDebug();
}

function renderDebug() {
  const pre = document.getElementById('debug-pre');
  if (!pre) return;
  pre.textContent = debugLogs.slice(0, 80).join('\n');
}

function runDiagnostics(showAlert = false) {
  try {
    logDebug('Running diagnostics...');
    logDebug('Input value:', input.value || '(empty)');
    logDebug('Parser exists:', typeof getVideoIdFromUrl === 'function');
    try { logDebug('Parsed videoId:', getVideoIdFromUrl(input.value || '')); } catch (e) { logDebug('Parser threw', e.message || e); }
    logDebug('Iframe src:', videoFrame ? videoFrame.src : '(no iframe)');
    let hist = localStorage.getItem(STORAGE_KEY);
    logDebug('Saved history raw:', hist === null ? '(null)' : hist);
    try { logDebug('Saved history parsed:', JSON.parse(hist || '[]')); } catch (e) { logDebug('History parse error', e.message); }
    if (showAlert) alert('Diagnostics logged in the debug panel (bottom-right)');
  } catch (e) {
    logDebug('Diagnostics failed:', e.message || e);
  }
}

// create immediately so users see it without opening devtools
createDebugPanel();

function getVideoIdFromUrl(value) {
  try {
    if (!value || typeof value !== 'string') return null;
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) return videoId;

      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live'].includes(parts[0])) {
        return parts[1] || null;
      }
    }

    // If it's a google redirect with 'url' or 'q' param containing the real link, try to decode and parse it
    if (hostname.endsWith('google.com')) {
      const inner = url.searchParams.get('url') || url.searchParams.get('q');
      if (inner) {
        try {
          const decoded = decodeURIComponent(inner);
          logDebug('Decoded inner redirect:', decoded.slice(0, 200));
          if (/^https?:\/\//i.test(decoded)) return getVideoIdFromUrl(decoded);
        } catch (e) {
          logDebug('Failed to decode inner redirect:', e.message || e);
        }
      }
    }

    // fallback: search for any youtube or youtu.be substring inside the whole string
    const s = value.toString();
    const match = s.match(/(https?:\/\/[^\s'\"]*(youtube\.com|youtu\.be)[^\s'\"]*)/i);
    if (match && match[1]) return getVideoIdFromUrl(match[1]);

    return null;
  } catch (err) {
    logDebug('getVideoIdFromUrl error:', err.message || err);
    return null;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  logDebug('UI error shown:', message);
}

function clearError() {
  errorMessage.textContent = '';
}

function loadVideo(videoId) {
  try {
    const embed = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`;
    videoFrame.src = embed;
    logDebug('Loading embed URL:', embed);
    playerWrapper.classList.remove('hidden');
    emptyState.classList.add('hidden');
    clearError();
  } catch (e) {
    logDebug('loadVideo error:', e.message || e);
    showError('Failed to load video.');
  }
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(history) ? history : [];
  } catch (e) {
    logDebug('readHistory error:', e.message || e);
    return [];
  }
}

function saveToHistory(url) {
  try {
    const next = [url, ...readHistory().filter((item) => item !== url)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    renderHistory();
    logDebug('Saved to history:', next);
  } catch (e) {
    logDebug('saveToHistory error:', e.message || e);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function renderHistory() {
  try {
    const items = readHistory();
    historyList.innerHTML = items.length
      ? items.map((url) => `<li><button type="button" class="history-item" data-url="${escapeHtml(url)}">${escapeHtml(url)}</button></li>`).join('')
      : '<li class="history-item">No recent videos</li>';

    historyList.querySelectorAll('[data-url]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.url;
        handleVideoLoad(button.dataset.url);
      });
    });
  } catch (e) {
    logDebug('renderHistory error:', e.message || e);
  }
}

function handleVideoLoad(value) {
  try {
    const url = (value || '').trim();
    logDebug('handleVideoLoad input:', url);
    if (!url) {
      showError('Please paste a YouTube link.');
      return;
    }

    const videoId = getVideoIdFromUrl(url);
    logDebug('Extracted videoId:', videoId);
    if (!videoId) {
      showError('Use a valid YouTube watch, Shorts, live, embed, or youtu.be link.');
      return;
    }

    loadVideo(videoId);
    saveToHistory(url);
  } catch (e) {
    logDebug('handleVideoLoad error:', e.message || e);
    showError('An unexpected error occurred.');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  handleVideoLoad(input.value);
});

// expose a quick helper for users in the console if they can open it later
window.tubeRunDiagnostics = runDiagnostics;

renderHistory();
runDiagnostics();
