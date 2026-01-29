import * as cheerio from 'cheerio';
import axios from 'axios';
import { Extractor, MediaItem } from './types';

export class GenericExtractor implements Extractor {
    platform = 'Generic';

    canHandle(url: string): boolean {
        return true; // Fallback
    }

    async extract(url: string): Promise<MediaItem[]> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const results: MediaItem[] = [];
            const seen = new Set<string>();

            $('img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && !seen.has(src)) {
                    // Try to filter out very small images/icons if possible, but without browser metrics 
                    // we can only guess by URL or common patterns
                    if (src.startsWith('http') && !src.includes('analytics') && !src.includes('icon')) {
                        seen.add(src);
                        results.push({
                            id: `gen-${i}`,
                            title: $(el).attr('alt') || `Image ${i}`,
                            type: 'image',
                            ext: src.split('.').pop()?.split('?')[0] || 'jpg',
                            thumbUrl: src,
                            downloadUrl: src
                        });
                    }
                }
            });

            return results;
        } catch (e) {
            console.error('Generic extract error:', e);
            return [];
        }
    }
}
