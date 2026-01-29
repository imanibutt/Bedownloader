
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

        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
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
    }
}
