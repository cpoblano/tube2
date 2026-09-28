const form = document.getElementById('video-form');
const input = document.getElementById('youtube-url');
const errorMessage = document.getElementById('error-message');
const playerWrapper = document.getElementById('player-wrapper');
const emptyState = document.getElementById('empty-state');
const videoFrame = document.getElementById('video-frame');
const historyList = document.getElementById('history-list');

const STORAGE_KEY = 'tube-loader-history';
const MAX_HISTORY_ITEMS = 5;

function tryDecode(value) {
  // Try decoding multiple times safely
  try {
    let decoded = value;
    // decode up to 3 times to handle double-encoding
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    return decoded;
  } catch {
    return value;
  }
}

function getVideoIdFromUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();

  // If user pasted a plain video id already
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    let url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    // Handle common YouTube forms
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

    // Handle Google redirect wrappers like /url or /goto that have a 'url' or 'q' param
    if (hostname.endsWith('google.com')) {
      const inner = url.searchParams.get('url') || url.searchParams.get('q');
      if (inner) {
        const decoded = tryDecode(inner);
        // If decoded looks like a URL, recurse
        if (/^https?:\/\//i.test(decoded)) {
          return getVideoIdFromUrl(decoded);
        }
      }
    }

    // Some wrapper URLs may contain an encoded target inside the path or query — attempt to find a youtube.com or youtu.be substring
    const whole = tryDecode(trimmed);
    const youtubeIndex = whole.indexOf('youtube.com');
    const youtuIndex = whole.indexOf('youtu.be');
    if (youtubeIndex !== -1 || youtuIndex !== -1) {
      // attempt to extract the embedded URL portion
      const match = whole.match(/(https?:\\/\\/[^\s'"]*(youtube\.com|youtu\.be)[^\s'\"]*)/i);
      if (match && match[1]) return getVideoIdFromUrl(match[1]);
    }
  } catch (err) {
    // If parsing failed, try to decode and search for a youtube link inside the string
    const decoded = tryDecode(trimmed);
    const match = decoded.match(/(https?:\/\/[^\s'\"]*(youtube\.com|youtu\.be)[^\s'\"]*)/i);
    if (match && match[1]) return getVideoIdFromUrl(match[1]);
    return null;
  }

  return null;
}

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = '';
}

function loadVideo(videoId) {
  videoFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`;
  playerWrapper.classList.remove('hidden');
  emptyState.classList.add('hidden');
  clearError();
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function saveToHistory(url) {
  const next = [url, ...readHistory().filter((item) => item !== url)].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  renderHistory();
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
}

function handleVideoLoad(value) {
  const url = value.trim();
  if (!url) {
    showError('Please paste a YouTube link.');
    return;
  }

  const videoId = getVideoIdFromUrl(url);
  if (!videoId) {
    showError('Use a valid YouTube watch, Shorts, live, embed, youtu.be, or supported redirect link.');
    return;
  }

  loadVideo(videoId);
  saveToHistory(url);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  handleVideoLoad(input.value);
});

renderHistory();
