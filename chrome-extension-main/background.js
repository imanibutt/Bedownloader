'use strict';

const DEFAULT_WEB_APP_URL = 'http://localhost:3000';

const getWebAppUrl = async () => {
    const result = await chrome.storage.local.get({ webAppUrl: DEFAULT_WEB_APP_URL });
    return result.webAppUrl;
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'openInBeDownloader' && message.url) {
        const baseUrl = await getWebAppUrl();
        const targetUrl = `${baseUrl}/extract?url=${encodeURIComponent(message.url)}`;

        chrome.tabs.create({
            url: targetUrl,
            active: true
        });
    }

    if (message.action === 'cacheAndOpen' && message.data) {
        const baseUrl = await getWebAppUrl();
        const cacheApiUrl = `${baseUrl}/api/cache`;

        try {
            // Push data to server
            await fetch(cacheApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: message.url,
                    items: message.data.items,
                    meta: message.data.meta
                })
            });

            // Open extraction page (which will now hit the cache)
            const targetUrl = `${baseUrl}/extract?url=${encodeURIComponent(message.url)}`;
            chrome.tabs.create({
                url: targetUrl,
                active: true
            });

        } catch (error) {
            console.error('Failed to cache data:', error);
            // Fallback: Just open the URL anyway
            const targetUrl = `${baseUrl}/extract?url=${encodeURIComponent(message.url)}`;
            chrome.tabs.create({
                url: targetUrl,
                active: true
            });
        }
    }

    if (message.action === 'download' && message.url) {
        chrome.downloads.download({
            url: message.url
        });
    }
});

// Open web app when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    const baseUrl = await getWebAppUrl();

    if (tab.url && tab.url.startsWith('http')) {
        const targetUrl = `${baseUrl}/extract?url=${encodeURIComponent(tab.url)}`;
        chrome.tabs.create({
            url: targetUrl,
            active: true
        });
    } else {
        chrome.tabs.create({
            url: baseUrl,
            active: true
        });
    }
});