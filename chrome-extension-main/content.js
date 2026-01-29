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
    btn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        padding: 12px 20px;
        background: #000;
        color: #fff;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        gap: 10px;
        letter-spacing: -0.2px;
        backdrop-filter: blur(8px);
    `;
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Extract with BD</span>
    `;

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