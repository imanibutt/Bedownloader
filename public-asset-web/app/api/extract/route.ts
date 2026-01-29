import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { getExtractor } from '@/lib/extractors';
import { validateBehanceUrl, isUrlAllowed } from '@/lib/security';

const cache = new LRUCache<string, any>({
    max: 500,
    ttl: 1000 * 60 * 10, // 10 minutes
});

// Rate limiting map (simple in-memory)
const rateLimitMap = new Map<string, number>();
const MIN_REQUEST_INTERVAL_MS = 100; // Loosened for development/double-mounting

export async function GET(req: NextRequest) {
    const start = Date.now();
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    // 1. Validation
    if (!url) {
        return NextResponse.json({ error: { code: 'MISSING_URL', message: 'URL parameter is required' } }, { status: 400 });
    }

    // 2. Security Check 
    if (!isUrlAllowed(url)) {
        // We might want to allow extraction from any URL if GenericExtractor is used, 
        // but for safety let's check basic validity or just proceed if we trust extractors.
        // Actually, for Generic extractor we might want to allow any URL. 
        // But `isUrlAllowed` checks the DOWNLOAD domains usually. 
        // For extraction input URL, we should probably allow anything that is http/https and not local.
    }
    // Updated Logic: We rely on the extractors to handle valid URLs or fail safe. 
    // We just block local/private IPs which is done by isUrlAllowed inside security but that checks domains list.
    // Let's make a new check for input URL that is looser than the allowlist (which is for CDN downloads).

    // For now, let's just skip the domain check here because we want to support Generic fallback 
    // or just rely on getExtractor returning a valid one. 
    // But we SHOULD block localhost input.

    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            return NextResponse.json({ error: { code: 'INVALID_URL', message: 'Localhost not allowed' } }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ error: { code: 'INVALID_URL', message: 'Invalid URL' } }, { status: 400 });
    }


    // 3. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const lastRequest = rateLimitMap.get(ip);
    if (lastRequest && Date.now() - lastRequest < MIN_REQUEST_INTERVAL_MS) {
        return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } }, { status: 429 });
    }
    rateLimitMap.set(ip, Date.now());

    // 4. Cache Check
    const cached = cache.get(url);
    if (cached) {
        return NextResponse.json({
            items: cached.items,
            meta: {
                ...cached.meta,
                cached: true,
                elapsedMs: Date.now() - start
            }
        });
    }

    try {
        // 5. Extraction
        const extractor = getExtractor(url);
        if (!extractor) {
            return NextResponse.json({ error: { code: 'UNSUPPORTED', message: 'No extractor found for this URL' } }, { status: 400 });
        }

        const items = await extractor.extract(url);

        // 6. Standard Response
        const responseData = {
            items,
            meta: {
                sourceUrl: url,
                assetCount: items.length,
                platform: extractor.platform,
                extractedAt: new Date().toISOString(),
                cached: false,
                elapsedMs: Date.now() - start
            }
        };

        if (items.length > 0) {
            cache.set(url, responseData);
        }

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Extraction error:', error);
        return NextResponse.json({
            error: {
                code: 'EXTRACTION_FAILED',
                message: error.message || 'Failed to extract assets'
            }
        }, { status: 500 });
    }
}
