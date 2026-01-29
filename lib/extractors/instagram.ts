import * as cheerio from 'cheerio';
import axios from 'axios';
import { Extractor, MediaItem } from './types';

export class InstagramExtractor implements Extractor {
    platform = 'Instagram';

    canHandle(url: string): boolean {
        return url.includes('instagram.com');
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

            const meta = {
                image: $('meta[property="og:image"]').attr('content'),
                video: $('meta[property="og:video"]').attr('content'),
                title: $('meta[property="og:title"]').attr('content') || 'Instagram Post',
            };

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
            }

            if (results.length === 0) {
                throw new Error('No public media found. This post may be private or requires login.');
            }

            return results;

        } catch (e: any) {
            console.error('IG Extract error:', e.message);
            throw new Error('Failed to extract Instagram content. Private posts or login-walls are not supported via web-extraction.');
        }
    }
}
