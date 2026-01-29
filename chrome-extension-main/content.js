'use strict';

/**
 * BeDownloader Content Script
 * 
 * Responsibilities:
 * - Detect supported platforms.
 * - Inject a "Open in BeDownloader" floating button.
 * - Communicate with background.js to open the web app.
 */

const SUPPORTED_PLATFORMS = [
    'youtube.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'reddit.com',
    'behance.net',
    'vimeo.com',
    'deviantart.com'
];

const isSupportedPlatform = () => {
    const hostname = window.location.hostname;
    return SUPPORTED_PLATFORMS.some(platform => hostname.includes(platform));
};

const injectButton = () => {
    if (!isSupportedPlatform()) return;
    if (document.getElementById('be-downloader-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'be-downloader-btn';
    btn.innerText = 'Open in BeDownloader';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        padding: 10px 16px;
        background: #000;
        color: #fff;
        border: 1px solid #444;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        display: flex;
        alignment: center;
        gap: 8px;
    `;

    // Add a small icon representation (Optional, using text for now)
    // btn.innerHTML = `<span>📂</span> Open in PublicAsset`;

    btn.onmouseover = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.background = '#222';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'translateY(0)';
        btn.style.background = '#000';
    };

    btn.onclick = () => {
        chrome.runtime.sendMessage({
            action: 'openInBeDownloader',
            url: window.location.href
        });
    };

    document.body.appendChild(btn);
};

// Inject button on load and on URL change (for SPAs)
injectButton();

// Observe for DOM changes or URL changes in SPAs
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        injectButton();
    }
}).observe(document, { subtree: true, childList: true });