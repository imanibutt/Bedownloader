
import { chromium } from 'playwright';
import { Extractor, MediaItem } from './types';

export class InstagramExtractor implements Extractor {
    platform = 'Instagram';

    canHandle(url: string): boolean {
        return url.includes('instagram.com');
    }

    async extract(url: string): Promise<MediaItem[]> {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Basic extraction logic for Instagram (meta tags or specific selectors)
            // This is a simplified version; production IG extraction is hard due to login walls.
            // We'll try open graph tags first.

            const meta = await page.evaluate(() => {
                const getMeta = (name: string) => document.querySelector(`meta[property="${name}"]`)?.getAttribute('content');
                return {
                    image: getMeta('og:image'),
                    video: getMeta('og:video'),
                    title: getMeta('og:title') || 'Instagram Post',
                    type: getMeta('og:type')
                };
            });

            const results: MediaItem[] = [];

            if (meta.video) {
                results.push({
                    id: 'ig-video',
                    title: meta.title,
                    type: 'video',
                    ext: 'mp4',
                    thumbUrl: meta.image || '',
                    downloadUrl: meta.video
                });
            } else if (meta.image) {
                results.push({
                    id: 'ig-image',
                    title: meta.title,
                    type: 'image',
                    ext: 'jpg',
                    thumbUrl: meta.image,
                    downloadUrl: meta.image
                });
            } else {
                // Fallback: try to find image in DOM
                const img = await page.$eval('img', (el) => el.src).catch(() => null);
                if (img) {
                    results.push({
                        id: 'ig-image-fallback',
                        title: 'Instagram Image',
                        type: 'image',
                        ext: 'jpg',
                        thumbUrl: img,
                        downloadUrl: img
                    });
                }
            }

            return results;

        } catch (e) {
            console.error('IG Extract error', e);
            throw new Error('Failed to extract Instagram content. Login may be required.');
        } finally {
            await browser.close();
        }
    }
}
