document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('enabledToggle');
    const openBtn = document.getElementById('openDashboard');
    const statusMsg = document.getElementById('statusMessage');

    // 1. Load state
    chrome.storage.local.get({ extensionEnabled: true }, (result) => {
        toggle.checked = result.extensionEnabled;
        updateStatus(result.extensionEnabled);
    });

    // 2. Handle Toggle
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
            updateStatus(isEnabled);
        });
    });

    // 3. Handle Dashboard Button
    openBtn.addEventListener('click', () => {
        chrome.storage.local.get({ webAppUrl: 'http://localhost:3000' }, (result) => {
            chrome.tabs.create({ url: result.webAppUrl });
        });
    });

    function updateStatus(enabled) {
        if (enabled) {
            statusMsg.textContent = 'Active on supported sites';
            statusMsg.style.color = 'rgba(255,255,255,0.4)';
        } else {
            statusMsg.textContent = 'Extension is disabled';
            statusMsg.style.color = '#ff4444';
        }
    }
});
