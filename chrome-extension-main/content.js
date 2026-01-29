'use strict';

/**
 * BeDownloader Content Script
 * 
 * Responsibilities:
 * - Detect supported platforms.
 * - Inject a "Download with BD" button on each media asset.
 * - Communicate with background.js to open the web app.
 */

const SUPPORTED_PLATFORMS = [
    'youtube.com',
    'instagram.com',
    'tiktok.com',
    'behance.net',
];

const isSupportedPlatform = () => {
    const hostname = window.location.hostname;
    return SUPPORTED_PLATFORMS.some(platform => hostname.includes(platform));
};

const createDownloadButton = (isFloating = false) => {
    const btn = document.createElement('button');
    btn.className = 'bd-download-btn' + (isFloating ? ' bd-floating' : '');

    // Premium SVG Icon
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>${isFloating ? 'Extract with BD' : 'Download'}</span>
    `;

    // Base Styles (Universal for both types)
    const baseStyle = `
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    if (isFloating) {
        btn.style.cssText = `
            ${baseStyle}
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
        `;
    } else {
        btn.style.cssText = `
            ${baseStyle}
            position: absolute;
            top: 15px;
            right: 15px;
            padding: 8px 14px;
            opacity: 0;
            pointer-events: none;
            transform: translateY(-5px);
        `;
    }

    // Hover effects
    btn.onmouseover = () => {
        btn.style.background = '#000';
        btn.style.transform = isFloating ? 'translateY(-2px)' : 'translateY(0) scale(1.05)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    };
    btn.onmouseout = () => {
        btn.style.background = 'rgba(0, 0, 0, 0.85)';
        btn.style.transform = isFloating ? 'translateY(0)' : 'translateY(0)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    };

    return btn;
};

const handleButtonClick = (url) => {
    chrome.runtime.sendMessage({
        action: 'openInBeDownloader',
        url: url || window.location.href
    });
};

const injectGlobalButton = () => {
    if (document.getElementById('bd-global-btn')) return;
    const btn = createDownloadButton(true);
    btn.id = 'bd-global-btn';
    btn.onclick = () => handleButtonClick();
    document.body.appendChild(btn);
};

const injectBehanceButtons = () => {
    // Target image and video modules
    const modules = document.querySelectorAll('.project-module-image-inner-wrap, .project-module.video, .project-module.embed');

    modules.forEach(module => {
        if (module.querySelector('.bd-download-btn')) return;

        // Ensure module has relative positioning
        if (getComputedStyle(module).position === 'static') {
            module.style.position = 'relative';
        }

        const btn = createDownloadButton(false);

        // Match Behance UI: Show on hover
        module.addEventListener('mouseenter', () => {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.transform = 'translateY(0)';
        });
        module.addEventListener('mouseleave', () => {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            btn.style.transform = 'translateY(-5px)';
        });

        btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            // Behance galleries typically have a canonical URL or we use the current one
            handleButtonClick(window.location.href);
        };

        module.appendChild(btn);
    });
};

const init = () => {
    if (!isSupportedPlatform()) return;

    injectGlobalButton();

    if (window.location.hostname.includes('behance.net')) {
        injectBehanceButtons();
    }
};

// Start
init();

// Watch for changes (SPAs and Lazy Loading)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        init();
    } else if (window.location.hostname.includes('behance.net')) {
        // Behance loads assets as you scroll
        injectBehanceButtons();
    }
});

observer.observe(document.body, { subtree: true, childList: true });