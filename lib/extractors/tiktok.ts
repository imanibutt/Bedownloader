import * as cheerio from 'cheerio';
import axios from 'axios';
import { Extractor, MediaItem } from './types';

export class TikTokExtractor implements Extractor {
    platform = 'TikTok';

    canHandle(url: string): boolean {
        return url.includes('tiktok.com');
    }

    async extract(url: string): Promise<MediaItem[]> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);

            // TikTok often hides data in a script tag with ID __UNIVERSAL_DATA_FOR_REHYDRATION__
            const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();

            if (scriptData) {
                try {
                    const json = JSON.parse(scriptData);
                    const videoData = json['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;

                    if (videoData) {
                        return [{
                            id: `tt-${videoData.id}`,
                            title: `${videoData.author?.nickname || 'TikTok'} - ${videoData.desc || 'Video'}`,
                            type: 'video',
                            ext: 'mp4',
                            thumbUrl: videoData.video?.cover || '',
                            downloadUrl: videoData.video?.downloadAddr || videoData.video?.playAddr || ''
                        }];
                    }
                } catch (e) {
                    console.error('Error parsing TikTok script data:', e);
                }
            }

            // Fallback to meta tags
            const meta = {
                video: $('meta[property="og:video"]').attr('content'),
                image: $('meta[property="og:image"]').attr('content'),
                title: $('meta[property="og:title"]').attr('content') || 'TikTok Video',
            };

            if (meta.video || meta.image) {
                return [{
                    id: 'tt-meta',
                    title: meta.title,
                    type: meta.video ? 'video' : 'image',
                    ext: meta.video ? 'mp4' : 'jpg',
                    thumbUrl: meta.image || '',
                    downloadUrl: meta.video || meta.image || ''
                }];
            }

            throw new Error('TikTok content not found. This video might be restricted or require a browser-based session.');
        } catch (error: any) {
            console.error('TikTok extraction failed:', error.message);
            throw error;
        }
    }
}
