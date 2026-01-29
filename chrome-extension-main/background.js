'use strict';

/**
 * BeDownloader Background Service Worker
 * 
 * Responsibilities:
 * - Listen for requests from content scripts to open the web app.
 * - Handle browser action (icon click) if necessary.
 */

const WEB_APP_URL = 'http://localhost:3000/extract';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openInBeDownloader' && message.url) {
        const targetUrl = `${WEB_APP_URL}?url=${encodeURIComponent(message.url)}`;

        chrome.tabs.create({
            url: targetUrl,
            active: true
        });
    }
});

// Optional: Open web app when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.startsWith('http')) {
        const targetUrl = `${WEB_APP_URL}?url=${encodeURIComponent(tab.url)}`;
        chrome.tabs.create({
            url: targetUrl,
            active: true
        });
    } else {
        // Fallback for non-supported pages
        chrome.tabs.create({
            url: 'http://localhost:3000',
            active: true
        });
    }
});