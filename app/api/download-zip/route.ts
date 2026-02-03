import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import http from 'http';
import https from 'https';
import { isUrlAllowed } from '@/lib/security';

export const runtime = 'nodejs'; // Ensure Node.js runtime

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 32 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 32 });

const client = axios.create({
    httpAgent,
    httpsAgent,
    maxRedirects: 3,
    timeout: 60000,
    validateStatus: (s) => s >= 200 && s < 400,
});

async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function fetchStreamWithRetry(url: string, attempt = 0): Promise<any> {
    try {
        return await client({
            method: 'get',
            url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Referer: 'https://www.behance.net/',
            },
        });
    } catch (err: any) {
        const status = err?.response?.status;
        const retryable = status === 429 || (status >= 500 && status <= 599) || !status;
        if (retryable && attempt < 2) {
            await sleep(350 * Math.pow(2, attempt));
            return fetchStreamWithRetry(url, attempt + 1);
        }
        throw err;
    }
}

export async function POST(req: NextRequest) {
    let outputFilename = 'behance-assets.zip';
    let assets: any[] = [];

    try {
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const body = await req.json();
            assets = body.assets;
            if (body.filename) outputFilename = body.filename;
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const assetsString = formData.get('assets');
            const filenameString = formData.get('filename');

            if (assetsString) assets = JSON.parse(assetsString as string);
            if (filenameString) outputFilename = filenameString as string;
        }

        // Sanitize filename
        outputFilename = outputFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        if (!outputFilename.toLowerCase().endsWith('.zip')) {
            outputFilename += '.zip';
        }

        if (!assets || !Array.isArray(assets) || assets.length === 0) {
            return NextResponse.json({ error: { code: 'MISSING_ASSETS', message: 'Assets array is required' } }, { status: 400 });
        }

        const archive = archiver('zip', {
            zlib: { level: 0 },
            store: true // true stored entries (no compression)
        });
        const stream = new PassThrough({ highWaterMark: 1024 * 1024 });

        // Error handling for archive
        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            stream.destroy(err);
        });

        archive.pipe(stream);

        // Push a tiny file first so the response starts immediately (avoids "resuming" feel)
        archive.append(
            Buffer.from(
                `BeDownloader\n\nThis ZIP is streamed as assets are fetched.\nIf a project is large, the download may appear to pause while files are being added.\n\nPublic projects only.\n`
            ),
            { name: 'README.txt' }
        );

        // Background Processing
        (async () => {
            try {
                // Too high concurrency can trigger upstream throttling; this is a safer default.
                const CONCURRENCY_LIMIT = 6;
                const queue = [...assets];

                const runWorker = async () => {
                    while (queue.length > 0) {
                        const asset = queue.shift();
                        if (!asset || !asset.url || !isUrlAllowed(asset.url)) continue;

                        try {
                            const response = await fetchStreamWithRetry(asset.url);

                            const filename = (asset.filename || `asset-${Math.random().toString(36).substring(7)}.bin`)
                                .toString()
                                .replace(/[^a-zA-Z0-9.\-_]/g, '_');

                            // Wait for this stream to finish before taking the next item in this worker
                            // (keeps open connections bounded and plays nicely with zip entry ordering).
                            const entryFinished = new Promise((resolve) => {
                                response.data.on('end', resolve);
                                response.data.on('error', resolve);
                            });

                            archive.append(response.data, { name: filename });
                            await entryFinished;
                        } catch (err: any) {
                            console.error(`Failed to download ${asset.url}: ${err?.message || err}`);
                        }
                    }
                };

                const workers = [];
                for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, assets.length); i++) {
                    workers.push(runWorker());
                }

                await Promise.all(workers);
                await archive.finalize();
            } catch (err) {
                console.error('ZIP processing error:', err);
                archive.abort();
            }
        })();

        // Streaming iterator for Next.js response
        async function* streamIterator() {
            for await (const chunk of stream) {
                yield chunk;
            }
        }

        return new NextResponse(streamIterator() as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${outputFilename}"`,
                'Cache-Control': 'no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error: any) {
        console.error('ZIP Endpoint Error:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to initiate ZIP download' } }, { status: 500 });
    }
}
