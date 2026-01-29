import { BehanceExtractor } from './behance';
import { YouTubeExtractor } from './youtube';
import { InstagramExtractor } from './instagram';
import { TikTokExtractor } from './tiktok';
import { GenericExtractor } from './generic';
import { Extractor } from './types';

const extractors: Extractor[] = [
    new BehanceExtractor(),
    new YouTubeExtractor(),
    new InstagramExtractor(),
    new TikTokExtractor(),
];

export function getExtractor(url: string): Extractor {
    const specific = extractors.find(extractor => extractor.canHandle(url));
    if (specific) return specific;

    return new GenericExtractor();
}
