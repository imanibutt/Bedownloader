
import { chromium } from 'playwright';
import { Extractor, MediaItem } from './types';

export class TikTokExtractor implements Extractor {
    platform = 'TikTok';

    canHandle(url: string): boolean {
        return url.includes('tiktok.com');
    }

    async extract(url: string): Promise<MediaItem[]> {
        const browser = await chromium.launch({ headless: true });
        // TikTok is picky about user agent
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();

        try {
            await page.goto(url, { waitUntil: 'load', timeout: 30000 });

            // Wait for video element
            try {
                await page.waitForSelector('video', { timeout: 10000 });
            } catch (e) { }

            const data = await page.evaluate(() => {
                const video = document.querySelector('video');
                const src = video?.src;
                const user = document.querySelector('[data-e2e="user-title"]')?.textContent || 'TikTok User';
                const desc = document.querySelector('[data-e2e="browse-video-desc"]')?.textContent || 'TikTok Video';
                const thumb = video?.poster || '';

                if (src) return { src, title: `${user} - ${desc}`, thumb };
                return null;
            });

            if (data && data.src) {
                return [{
                    id: 'tt-video',
                    title: data.title,
                    type: 'video',
                    ext: 'mp4',
                    thumbUrl: data.thumb,
                    downloadUrl: data.src
                }];
            }

            return [];
        } finally {
            await browser.close();
        }
    }
}
