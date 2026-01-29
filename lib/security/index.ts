
import { URL } from 'url';

const ALLOWED_DOMAINS = [
    'behance.net',
    'www.behance.net',
    'mir-s3-cdn-cf.behance.net',
    'mir-s3-cdn-cf.behance.com', // Just in case
    'mira.behance.net',
    'a5.behance.net',
    'bf.behance.net',
    // YouTube
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'googlevideo.com',
    'yt3.ggpht.com',
    // Instagram
    'instagram.com',
    'www.instagram.com',
    'cdninstagram.com',
    'scontent.cdninstagram.com',
    'fbcdn.net',
    // TikTok
    'tiktok.com',
    'www.tiktok.com',
    'tiktokcdn.com',
    'tiktokv.com',
    // Video Hosting/Embeds
    'adobe.io',
    'adobe.com',
    'vimeo.com',
    'vimeocdn.com',
    'akamaized.net' // Often used by Vimeo/Adobe CDNs
];

export function isUrlAllowed(inputUrl: string): boolean {
    try {
        const parsed = new URL(inputUrl);
        // Block non-http protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }

        // Block local addresses (basic check, can be improved with dns lookup but this catches localhost)
        const hostname = parsed.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.endsWith('.local')
        ) {
            return false;
        }

        return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch (e) {
        return false;
    }
}

export function validateBehanceUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('behance.net')) {
            return url;
        }
        return null;
    } catch {
        return null;
    }
}
