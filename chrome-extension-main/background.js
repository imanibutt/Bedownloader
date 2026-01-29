'use strict';

const DEFAULT_WEB_APP_URL = 'http://localhost:3000';

const getWebAppUrl = async () => {
    const result = await chrome.storage.local.get({ webAppUrl: DEFAULT_WEB_APP_URL });
    return result.webAppUrl;
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'openInBeDownloader' && message.url) {
        const baseUrl = await getWebAppUrl();
        const targetUrl = `${baseUrl}/extract?url=${encodeURIComponent(message.url)}`;

        chrome.tabs.create({
            url: targetUrl,
            active: true
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