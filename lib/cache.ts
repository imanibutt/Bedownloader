import { LRUCache } from 'lru-cache';

// Singleton cache instance to be shared across API routes
// Note: In serverless deployments (Vercel), this might not persist across different lambda invocations
// if they are cold-booted separately. However, for a local dev tool or a stateful container, this works.
// Given this is a local tool ("Behance downloader"), looking at package.json "start" script, it runs as a next server.
// It should share memory in the same process.

const globalForCache = global as unknown as { extractionCache: LRUCache<string, any> };

export const extractionCache =
    globalForCache.extractionCache ||
    new LRUCache<string, any>({
        max: 500,
        ttl: 1000 * 60 * 10, // 10 minutes
    });

if (process.env.NODE_ENV !== 'production') {
    globalForCache.extractionCache = extractionCache;
}
