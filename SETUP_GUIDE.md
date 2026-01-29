# Chrome Extension Installation Guide

1.  Open **Google Chrome**.
2.  Navigate to `chrome://extensions/`.
3.  Turn on **Developer mode** (top right toggle).
4.  Click **Load unpacked**.
5.  Select the `chrome-extension-main` folder from your project directory:
    `/Users/eimani/Downloads/Behance downloader/chrome-extension-main`
6.  The extension is now installed! You should see the BD icon in your extension bar.

# Fixing YouTube "Bot" Error

YouTube blocks server-side tools (like Vercel or local scripts) if it detects too many requests from the same IP or if the IP belongs to a data center.

### Solution: Use Cookies
To fix this, you need to provide a "cookies" string to the extractor. This tells YouTube you are a real user.

1.  Install the **Get cookies.txt LOCALLY** extension in Chrome.
2.  Go to YouTube.com and export your cookies.
3.  We can then add these cookies to the `lib/extractors/youtube.ts` file.
