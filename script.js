const homepage = document.getElementById('homepage');
const contentFrame = document.getElementById('contentFrame');
const addressInput = document.getElementById('addressInput');
const searchInput = document.getElementById('searchInput');
const goBtn = document.getElementById('goBtn');
const searchBtn = document.getElementById('searchBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const refreshBtn = document.getElementById('refreshBtn');
const homeBtn = document.getElementById('homeBtn');

let history = [];
let historyIndex = -1;
let currentUrl = '';

function showHomepage() {
    homepage.classList.add('active');
    contentFrame.classList.remove('visible');
    contentFrame.src = 'about:blank';
    currentUrl = '';
    addressInput.value = '';
}

function loadUrl(rawValue) {
    const value = rawValue.trim();
    if (!value) return;

    let url = value;

    if (!/^https?:\/\//i.test(url)) {
        if (/^\S+\.\S+$/.test(url)) {
            url = 'https://' + url;
        } else {
            const query = encodeURIComponent(value);
            url = `https://duckduckgo.com/?q=${query}`;
        }
    }

    try {
        const parsed = new URL(url);
        currentUrl = parsed.href;

        homepage.classList.remove('active');
        contentFrame.classList.add('visible');
        contentFrame.src = parsed.href;

        if (!history.length || history[historyIndex] !== parsed.href) {
            history = history.slice(0, historyIndex + 1);
            history.push(parsed.href);
            historyIndex = history.length - 1;
        }

        addressInput.value = parsed.href;
    } catch (error) {
        alert('Please enter a valid URL or search term.');
    }
}

function goBack() {
    if (historyIndex > 0) {
        historyIndex -= 1;
        const previous = history[historyIndex];
        contentFrame.src = previous;
        addressInput.value = previous;
    }
}

function goForward() {
    if (historyIndex < history.length - 1) {
        historyIndex += 1;
        const next = history[historyIndex];
        contentFrame.src = next;
        addressInput.value = next;
    }
}

function refreshPage() {
    if (contentFrame.src && contentFrame.src !== 'about:blank') {
        contentFrame.src = contentFrame.src;
    }
}

goBtn.addEventListener('click', () => loadUrl(addressInput.value));
searchBtn.addEventListener('click', () => loadUrl(searchInput.value));

addressInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        loadUrl(addressInput.value);
    }
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        loadUrl(searchInput.value);
    }
});

backBtn.addEventListener('click', goBack);
forwardBtn.addEventListener('click', goForward);
refreshBtn.addEventListener('click', refreshPage);
homeBtn.addEventListener('click', showHomepage);

showHomepage();
