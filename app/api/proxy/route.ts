import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { isUrlAllowed } from '@/lib/security';

// Force dynamic since we read searchParams
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download';

    // 1. Validation
    if (!targetUrl) {
        return NextResponse.json({ error: { code: 'MISSING_URL', message: 'URL is required' } }, { status: 400 });
    }

    // 2. Security Check (Prevent SSRF)
    if (!isUrlAllowed(targetUrl)) {
        console.warn(`Blocked proxy request to: ${targetUrl}`);
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'This domain is not allowed' } }, { status: 403 });
    }

    try {
        // 3. Streaming Fetch
        // We use axios with responseType: 'stream' to pass data through without buffering
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Don't forward all headers, just safe ones if needed
            },
            timeout: 10000 // 10s timeout
        });

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        // Sanitize filename
        const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');

        // 4. Return Stream
        // Next.js (App Router) expects an Iterator or Stream for the body
        // axios `data` is a Node.js Readable stream. We can pass it to NextResponse (mostly works in Node runtime)
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Long cache for immutable assets

        // Create a ReadableStream from the Node stream for potential Edge compatibility (though we use Node runtime)
        const stream = new ReadableStream({
            start(controller) {
                response.data.on('data', (chunk: Buffer) => controller.enqueue(chunk));
                response.data.on('end', () => controller.close());
                response.data.on('error', (err: any) => controller.error(err));
            }
        });

        return new NextResponse(stream, {
            status: 200,
            headers
        });

    } catch (error: any) {
        console.error('Proxy error:', error.message);
        if (error.response) {
            return NextResponse.json({ error: { code: 'FETCH_ERROR', message: `Upstream error: ${error.response.status}` } }, { status: error.response.status });
        }
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch the file' } }, { status: 500 });
    }
}
