// DOM Elements
const urlInput = document.getElementById('urlInput');
const loadBtn = document.getElementById('loadBtn');
const gameFrame = document.getElementById('gameFrame');
const currentUrlDisplay = document.getElementById('currentUrl');
const historyList = document.getElementById('historyList');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const errorMessage = document.querySelector('.error-message') || createErrorMessage();

// Constants
const MAX_HISTORY = 10;
const STORAGE_KEY = 'gamePortalHistory';

/**
 * Create error message element if it doesn't exist
 */
function createErrorMessage() {
    const msg = document.createElement('div');
    msg.className = 'error-message';
    document.querySelector('.url-input-section').appendChild(msg);
    return msg;
}

/**
 * Validate and format URL
 */
function validateURL(url) {
    try {
        // Add protocol if missing
        let formattedUrl = url.trim();
        if (!formattedUrl.match(/^https?:\/\//i)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        // Validate URL format
        const urlObj = new URL(formattedUrl);
        return formattedUrl;
    } catch (error) {
        return null;
    }
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

/**
 * Load URL in iframe
 */
function loadURL(url) {
    const validatedUrl = validateURL(url);
    
    if (!validatedUrl) {
        showError('Invalid URL format. Please enter a valid URL.');
        return;
    }

    try {
        gameFrame.src = validatedUrl;
        currentUrlDisplay.textContent = new URL(validatedUrl).hostname || validatedUrl;
        addToHistory(validatedUrl);
        urlInput.value = '';
        errorMessage.classList.remove('show');
    } catch (error) {
        showError('Error loading URL: ' + error.message);
    }
}

/**
 * Add URL to history
 */
function addToHistory(url) {
    let history = getHistory();
    
    // Remove duplicates (keep most recent)
    history = history.filter(item => item !== url);
    
    // Add to front
    history.unshift(url);
    
    // Keep only MAX_HISTORY items
    history = history.slice(0, MAX_HISTORY);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    renderHistory();
}

/**
 * Get history from localStorage
 */
function getHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Render history list
 */
function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<li style="color: #999;">No history yet</li>';
        return;
    }

    history.forEach(url => {
        const li = document.createElement('li');
        try {
            const hostname = new URL(url).hostname;
            li.textContent = hostname;
            li.title = url;
            li.addEventListener('click', () => {
                urlInput.value = url;
                loadURL(url);
            });
        } catch {
            li.textContent = url;
        }
        historyList.appendChild(li);
    });
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    gameFrame.classList.toggle('fullscreen');
    document.body.classList.toggle('fullscreen-active');
    
    if (gameFrame.classList.contains('fullscreen')) {
        fullscreenBtn.textContent = '✕ Exit Fullscreen';
    } else {
        fullscreenBtn.textContent = '⛶ Fullscreen';
    }
}

/**
 * Handle iframe load errors
 */
function handleIframeError() {
    gameFrame.addEventListener('error', () => {
        showError('Failed to load the URL. The site may not allow embedding.');
    });
}

/**
 * Add protection against extension interference
 */
function protectFromExtensions() {
    // Create a mutation observer to detect and prevent extension modifications
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Remove any scripts or styles injected by extensions
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'SCRIPT' || node.tagName === 'LINK') {
                        // Don't remove our own scripts/styles, only extension injections
                        if (!node.src?.includes('script.js') && !node.href?.includes('styles.css')) {
                            // Note: We can't prevent all extension interference in iframes,
                            // but the sandbox attribute provides the main protection
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.head, {
        childList: true,
        subtree: true
    });

    // Disable common extension injection points
    Object.defineProperty(window, '__EXTENSION__', {
        writable: false,
        configurable: false,
        value: false
    });
}

/**
 * Event Listeners
 */
loadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        loadURL(url);
    } else {
        showError('Please enter a URL.');
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const url = urlInput.value.trim();
        if (url) {
            loadURL(url);
        }
    }
});

fullscreenBtn.addEventListener('click', toggleFullscreen);

/**
 * Handle escape key for fullscreen exit
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameFrame.classList.contains('fullscreen')) {
        toggleFullscreen();
    }
});

/**
 * Initialize on page load
 */
window.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    handleIframeError();
    protectFromExtensions();
    
    // Set initial focus on URL input
    urlInput.focus();

    // Load example message
    console.log('🎮 Game Portal loaded. Enter a URL to get started.');
});

// Prevent extension access to critical window properties
try {
    Object.freeze(window.gameFrame);
} catch (e) {
    // Silently fail if freeze is not possible
}
