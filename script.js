// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInfo = document.getElementById('fileInfo');
const viewerSection = document.getElementById('viewerSection');
const previewFrame = document.getElementById('previewFrame');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const container = document.querySelector('.container');

let currentFile = null;
let currentContent = null;

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
    
    // Add preview-mode class to container to hide header and upload section
    container.classList.add('preview-mode');
    
    // Show file info and viewer
    fileInfo.style.display = 'block';
    viewerSection.style.display = 'flex';
    
    // Display preview
    previewFrame.srcdoc = content;
}

// Clear
clearBtn.addEventListener('click', () => {
    currentFile = null;
    currentContent = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    viewerSection.style.display = 'none';
    previewFrame.srcdoc = '';
    
    // Remove preview-mode class to show header and upload section again
    container.classList.remove('preview-mode');
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
