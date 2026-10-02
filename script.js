// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInfo = document.getElementById('fileInfo');
const viewerSection = document.getElementById('viewerSection');
const sourceView = document.getElementById('sourceView');
const previewView = document.getElementById('previewView');
const sourceCode = document.getElementById('sourceCode');
const previewFrame = document.getElementById('previewFrame');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const viewSourceBtn = document.getElementById('viewSourceBtn');
const viewPreviewBtn = document.getElementById('viewPreviewBtn');

let currentFile = null;
let currentContent = null;
let isResizing = false;
let previewHeight = 50; // percentage

// File Selection
selectBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        // Check if file is HTML
        if (isHTMLFile(file)) {
            handleFile(file);
        } else {
            showError('Please drop an HTML file (.html or .htm)');
        }
    }
});

// Resizer
const resizer = document.getElementById('resizer');
if (resizer) {
    resizer.addEventListener('mousedown', startResize);
    resizer.addEventListener('touchstart', startResize);
}

function startResize(e) {
    isResizing = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('touchmove', resize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchend', stopResize);
    e.preventDefault();
}

function resize(e) {
    if (!isResizing) return;
    
    const viewerSection = document.getElementById('viewerSection');
    if (!viewerSection) return;
    
    const rect = viewerSection.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newHeight = ((clientY - rect.top) / rect.height) * 100;
    
    if (newHeight > 20 && newHeight < 80) {
        previewHeight = newHeight;
        updatePreviewLayout();
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('touchmove', resize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchend', stopResize);
}

function updatePreviewLayout() {
    const previewView = document.getElementById('previewView');
    const sourceView = document.getElementById('sourceView');
    
    if (previewView && sourceView) {
        previewView.style.flex = `0 0 ${previewHeight}%`;
        sourceView.style.flex = `0 0 ${100 - previewHeight}%`;
    }
}

// File Handling
function isHTMLFile(file) {
    const htmlExtensions = ['.html', '.htm'];
    const fileName = file.name.toLowerCase();
    return htmlExtensions.some(ext => fileName.endsWith(ext)) || 
           file.type === 'text/html';
}

function handleFile(file) {
    currentFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        currentContent = e.target.result;
        displayFile(file, currentContent);
    };
    
    reader.onerror = () => {
        showError('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

function displayFile(file, content) {
    // Update file info
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileType.textContent = file.type || 'text/html';
    
    // Show file info and viewer
    fileInfo.style.display = 'block';
    viewerSection.style.display = 'flex';
    dropZone.parentElement.style.display = 'none';
    
    // Display content
    displayContent(content);
    updatePreviewLayout();
}

function displayContent(content) {
    // Display source code
    sourceCode.textContent = content;
    highlightSource();
    
    // Display preview
    previewFrame.srcdoc = content;
    
    // Show preview by default
    showPreview();
}

function highlightSource() {
    // Simple syntax highlighting for HTML
    let highlighted = sourceCode.textContent;
    
    // This is a basic implementation. For production, use a library like Highlight.js
    const htmlEscaped = highlighted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    sourceCode.textContent = htmlEscaped;
}

function showPreview() {
    previewView.style.display = 'flex';
    sourceView.style.display = 'flex';
    viewPreviewBtn.style.backgroundColor = 'var(--primary-color)';
    viewPreviewBtn.style.color = 'white';
    viewSourceBtn.style.backgroundColor = 'white';
    viewSourceBtn.style.color = 'var(--text-dark)';
}

function showSource() {
    previewView.style.display = 'flex';
    sourceView.style.display = 'flex';
    viewSourceBtn.style.backgroundColor = 'var(--primary-color)';
    viewSourceBtn.style.color = 'white';
    viewPreviewBtn.style.backgroundColor = 'white';
    viewPreviewBtn.style.color = 'var(--text-dark)';
}

// View Toggle
viewPreviewBtn.addEventListener('click', showPreview);
viewSourceBtn.addEventListener('click', showSource);

// Clear
clearBtn.addEventListener('click', () => {
    currentFile = null;
    currentContent = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    viewerSection.style.display = 'none';
    dropZone.parentElement.style.display = 'block';
    previewHeight = 50;
});

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function showError(message) {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Prevent default drag behavior on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
