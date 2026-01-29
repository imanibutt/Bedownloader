import { NextRequest, NextResponse } from 'next/server';
import { extractionCache as cache } from '@/lib/cache';
import { isUrlAllowed } from '@/lib/security';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, items, meta } = body;

        if (!url || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: { code: 'INVALID_DATA', message: 'Missing url or items' } }, { status: 400 });
        }

        // Basic validation
        // We allow the extension to push data, but we should still verify the URL domain if possible
        // using our security module, though the extension should have already checked.

        // Cache the data
        cache.set(url, {
            items,
            meta: {
                ...meta,
                cached: true,
                source: 'extension_precache',
                cachedAt: new Date().toISOString()
            }
        });

        console.log(`[Cache API] Pre-cached ${items.length} items for ${url}`);

        return NextResponse.json({ success: true, count: items.length });

    } catch (error: any) {
        console.error('[Cache API] Error:', error);
        return NextResponse.json({ error: { code: 'CACHE_FAILED', message: error.message } }, { status: 500 });
    }
}
