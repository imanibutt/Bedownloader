
import { Extractor, MediaItem } from './types';
import ytdl from '@distube/ytdl-core';

export class YouTubeExtractor implements Extractor {
    platform = 'YouTube';

    canHandle(url: string): boolean {
        return url.includes('youtube.com') || url.includes('youtu.be');
    }

    async extract(url: string): Promise<MediaItem[]> {
        if (!ytdl.validateURL(url)) {
            throw new Error('Invalid YouTube URL');
        }

        try {
            const options: any = {
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    }
                }
            };

            // Add cookies if available in env to bypass bot detection
            if (process.env.YT_COOKIES) {
                try {
                    options.agent = ytdl.createAgent(JSON.parse(process.env.YT_COOKIES));
                } catch (e) {
                    console.error('Failed to parse YT_COOKIES, ensure it is a valid JSON array of cookies');
                }
            }

            const info = await ytdl.getInfo(url, options);
            const format = ytdl.chooseFormat(info.formats, {
                quality: 'highestvideo',
                filter: 'audioandvideo' // Ensure we get a stream with both
            });
            const thumb = info.videoDetails.thumbnails.pop()?.url || '';

            return [{
                id: info.videoDetails.videoId,
                title: info.videoDetails.title,
                type: 'video',
                ext: 'mp4',
                thumbUrl: thumb,
                downloadUrl: format.url,
                resolution: format.qualityLabel
            }];
        } catch (error: any) {
            console.error('YouTube extraction failed:', error.message);
            if (error.message.includes('403') || error.message.includes('bot')) {
                throw new Error('YouTube blocked the request. Please provide valid cookies in the YT_COOKIES env variable.');
            }
            throw error;
        }
    }
}
