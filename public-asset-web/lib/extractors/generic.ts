
import { chromium } from 'playwright';
import { Extractor, MediaItem } from './types';

export class GenericExtractor implements Extractor {
    platform = 'Generic';

    canHandle(url: string): boolean {
        return true; // Fallback
    }

    async extract(url: string): Promise<MediaItem[]> {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

            const images = await page.evaluate(() => {
                const els = Array.from(document.querySelectorAll('img'));
                return els
                    .filter(img => img.width > 300 && img.height > 300) // Filter small icons
                    .map((img, i) => ({
                        id: `gen-${i}`,
                        title: img.alt || `Image ${i}`,
                        type: 'image' as const,
                        ext: img.src.split('.').pop()?.split('?')[0] || 'jpg',
                        thumbUrl: img.src,
                        downloadUrl: img.src
                    }));
            });

            return images;
        } catch (e) {
            console.error('Generic extract error', e);
            return [];
        } finally {
            await browser.close();
        }
    }
}
