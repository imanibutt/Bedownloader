// Save options to chrome.storage
const saveOptions = () => {
    const webAppUrl = document.getElementById('webAppUrl').value.replace(/\/$/, ""); // Remove trailing slash

    chrome.storage.local.set({ webAppUrl }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved!';
        setTimeout(() => { status.textContent = ''; }, 2000);
    });
};

// Restore options from chrome.storage
const restoreOptions = () => {
    chrome.storage.local.get({ webAppUrl: 'http://localhost:3000' }, (items) => {
        document.getElementById('webAppUrl').value = items.webAppUrl;
    });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
