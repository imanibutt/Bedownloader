import * as cheerio from 'cheerio';
import axios from 'axios';
import { Extractor, MediaItem } from './types';

export class DribbbleExtractor implements Extractor {
  platform = 'Dribbble';

  canHandle(url: string): boolean {
    try {
      const u = new URL(url);
      return u.hostname.toLowerCase().includes('dribbble.com');
    } catch {
      return false;
    }
  }

  async extract(url: string): Promise<MediaItem[]> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000,
      validateStatus: () => true
    });

    // Dribbble is frequently protected by WAF challenges for non-browser traffic.
    // When that happens, Dribbble returns 202 with empty body and x-amzn-waf-action: challenge.
    const wafAction = String((response.headers as any)?.['x-amzn-waf-action'] || '').toLowerCase();
    if (response.status === 202 || wafAction.includes('challenge')) {
      throw new Error(
        'Dribbble blocked this request (WAF challenge). Dribbble support needs a Chrome Extension flow. For now, please use Behance links.'
      );
    }

    if (response.status >= 400) {
      throw new Error(`Failed to fetch Dribbble page (HTTP ${response.status})`);
    }

    const $ = cheerio.load(response.data);
    const results: MediaItem[] = [];
    const seen = new Set<string>();

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      'Dribbble Shot';

    const add = (downloadUrl: string, opts?: { thumbUrl?: string; ext?: string; kind?: 'image' | 'video' }) => {
      if (!downloadUrl) return;
      if (!downloadUrl.startsWith('http')) return;
      if (seen.has(downloadUrl)) return;
      seen.add(downloadUrl);

      const ext =
        opts?.ext ||
        downloadUrl.split('.').pop()?.split('?')[0]?.toLowerCase() ||
        'jpg';

      results.push({
        id: `dr-${results.length + 1}`,
        title,
        type: opts?.kind || 'image',
        ext: ext,
        thumbUrl: opts?.thumbUrl || downloadUrl,
        downloadUrl
      });
    };

    // 1) OpenGraph featured media
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';
    if (ogImage) add(ogImage, { kind: 'image' });

    const ogVideo =
      $('meta[property="og:video"]').attr('content') ||
      $('meta[property="og:video:url"]').attr('content') ||
      '';
    if (ogVideo) add(ogVideo, { kind: 'video', ext: 'mp4', thumbUrl: ogImage || '' });

    // 2) Images in the shot container
    // Dribbble commonly uses srcset. We collect all candidates and keep unique.
    $('img').each((i, el) => {
      const srcset = $(el).attr('srcset') || '';
      const src = $(el).attr('src') || $(el).attr('data-src') || '';

      const urls: string[] = [];
      if (src) urls.push(src);
      if (srcset) {
        srcset
          .split(',')
          .map(s => s.trim().split(' ')[0])
          .filter(Boolean)
          .forEach(u => urls.push(u));
      }

      for (const u of urls) {
        // Filter obvious noise
        if (!u.startsWith('http')) continue;
        if (u.includes('logo') || u.includes('avatar') || u.includes('icon')) continue;
        if (u.includes('analytics') || u.includes('pixel')) continue;

        // Prefer CDNs; but still allow if looks like a shot
        if (u.includes('dribbble.com') || u.includes('cdn.dribbble.com') || u.includes('dribbbleusercontent.com')) {
          add(u, { kind: 'image' });
        }
      }
    });

    // 3) Video tags
    $('video source').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (src) add(src.startsWith('/') ? new URL(src, url).toString() : src, { kind: 'video', ext: 'mp4', thumbUrl: ogImage || '' });
    });

    // De-dupe and keep only meaningful assets (avoid tiny UI images)
    const filtered = results.filter(r => {
      const u = r.downloadUrl.toLowerCase();
      if (u.includes('sprite') || u.includes('badge')) return false;
      return true;
    });

    return filtered;
  }
}
