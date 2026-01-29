import { chromium } from 'playwright';
import { Extractor, MediaItem } from './types';

export class BehanceExtractor implements Extractor {
    platform = 'Behance';

    canHandle(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname.toLowerCase().includes('behance.net');
        } catch {
            return false;
        }
    }

    async extract(url: string): Promise<MediaItem[]> {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            // Block heavy or unnecessary resources for faster extraction
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,font,woff2}', (route) => route.abort());
            await page.route('**/google-analytics.com/**', (route) => route.abort());
            await page.route('**/facebook.net/**', (route) => route.abort());
            await page.route('**/segment.com/**', (route) => route.abort());

            // Navigate and wait for DOM, not full load
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait specifically for the project data script
            try {
                await page.waitForSelector('#beconfig-store_state', { timeout: 10000 });
            } catch (e) {
                console.warn('Data script not found within 10s, proceeding with available DOM');
            }

            // Scroll is still useful for some lazy-loaded project structures if we need more than the script data
            // but we'll cap it significantly for speed
            try {
                let totalHeight = 0;
                const distance = 800;
                while (totalHeight < 8000) {
                    const prevHeight = await page.evaluate(() => document.body.scrollHeight);
                    await page.mouse.wheel(0, distance);
                    totalHeight += distance;
                    await page.waitForTimeout(100);

                    const newHeight = await page.evaluate(() => document.body.scrollHeight);
                    if (totalHeight >= newHeight && prevHeight === newHeight) break; // Reached bottom
                }
            } catch (e) {
                console.warn('Scroll failed, proceeding with available content:', e);
            }

            // Brief wait for any final lazy assets
            await page.waitForTimeout(1000);

            const items = await page.evaluate(() => {
                const getBestUrl = (imageSizes: any) => {
                    if (!imageSizes) return null;
                    const all = imageSizes.allAvailable || [];
                    const preferredTypes = ['fs_webp', 'original_webp', 'max_3840_webp', 'max_1920_webp'];

                    if (all.length > 0) {
                        for (const type of preferredTypes) {
                            const match = all.find((s: any) => s.type === type || s.key === type);
                            if (match && match.url) return match.url;
                        }
                        const source = all.find((s: any) => s.type === 'source' || s.type === 'original');
                        if (source && source.url) return source.url;
                        const sorted = [...all].sort((a: any, b: any) => (parseInt(b.width) || 0) - (parseInt(a.width) || 0));
                        if (sorted[0] && sorted[0].url) return sorted[0].url;
                    }

                    const priority = ['fs_webp', 'source', 'max_3840', 'size_2560', 'size_2000', 'size_1400', 'size_1200'];
                    for (const key of priority) {
                        if (imageSizes[key]) return typeof imageSizes[key] === 'string' ? imageSizes[key] : (imageSizes[key].url || imageSizes[key].src);
                    }
                    return null;
                };

                const scriptId = 'beconfig-store_state';
                const script = document.getElementById(scriptId);
                let projectData: any = null;

                if (script) {
                    try { projectData = JSON.parse(script.textContent || '{}'); } catch (e) { }
                } else {
                    if ((window as any).__INITIAL_STATE__) projectData = (window as any).__INITIAL_STATE__;
                    else {
                        const scripts = Array.from(document.querySelectorAll('script'));
                        for (const s of scripts) {
                            const content = s.textContent || '';
                            if (content.includes('"project":') && content.includes('"modules":')) {
                                const startIdx = content.indexOf('{"project":');
                                if (startIdx !== -1) {
                                    try {
                                        const endIdx = content.lastIndexOf('}');
                                        if (endIdx > startIdx) {
                                            projectData = JSON.parse(content.substring(startIdx, endIdx + 1));
                                            break;
                                        }
                                    } catch (e) { }
                                }
                            }
                        }
                    }
                }

                if (!projectData) return [];

                const project = projectData.project?.project || projectData.project || {};
                const modules = project.allModules || project.modules || [];
                const results: any[] = [];
                const seen = new Set();

                const addAsset = (asset: any) => {
                    if (!asset.downloadUrl || seen.has(asset.downloadUrl)) return;
                    seen.add(asset.downloadUrl);

                    const lowerUrl = asset.downloadUrl.toLowerCase();
                    if (lowerUrl.includes('.gif')) {
                        asset.type = 'animation';
                        asset.ext = 'gif';
                    }

                    results.push(asset);
                };

                modules.forEach((mod: any, index: number) => {
                    const type = mod.__typename || mod.type;

                    if (type === 'ImageModule' || type === 'image') {
                        const url = getBestUrl(mod.imageSizes || {});
                        if (url) {
                            addAsset({
                                id: `be-${mod.id || index}`,
                                title: mod.caption || mod.altText || `Image ${index + 1}`,
                                type: 'image',
                                ext: url.split('.').pop()?.split('?')[0] || 'jpg',
                                thumbUrl: url,
                                downloadUrl: url
                            });
                        }
                    } else if (type === 'MediaCollectionModule' || type === 'image_set' || type === 'media_collection') {
                        const components = mod.components || mod.images || [];
                        components.forEach((comp: any, cIdx: number) => {
                            const url = getBestUrl(comp.imageSizes || comp.sizes || {});
                            if (url) {
                                addAsset({
                                    id: `be-${mod.id || index}-${cIdx}`,
                                    title: comp.caption || `Asset ${index + 1}-${cIdx + 1}`,
                                    type: 'image',
                                    ext: url.split('.').pop()?.split('?')[0] || 'jpg',
                                    thumbUrl: url,
                                    downloadUrl: url
                                });
                            }
                        });
                    } else if (type === 'EmbedModule' || type === 'video' || type === 'VideoModule' || type === 'ExternalVideoModule') {
                        const embedHtml = (mod.originalEmbed || mod.fluidEmbed || mod.embed || mod.html || '').replace(/&amp;/g, '&');

                        // 1. Try to find direct video/gif in embed
                        const srcMatch = embedHtml.match(/src="([^"]+)"/i);
                        const src = srcMatch ? srcMatch[1] : null;

                        if (src) {
                            if (src.includes('.gif')) {
                                addAsset({
                                    id: `be-gif-${mod.id || index}`,
                                    title: mod.caption || `Animation ${index + 1}`,
                                    type: 'animation',
                                    ext: 'gif',
                                    thumbUrl: src,
                                    downloadUrl: src
                                });
                                return;
                            }

                            // Vimeo
                            const vimeoMatch = src.match(/vimeo\.com\/video\/(\d+)/i);
                            if (vimeoMatch) {
                                addAsset({
                                    id: `be-v-1-${mod.id || index}`,
                                    title: mod.caption || `Vimeo Video`,
                                    type: 'video',
                                    ext: 'mp4',
                                    thumbUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`,
                                    downloadUrl: `https://vimeo.com/${vimeoMatch[1]}`
                                });
                                return;
                            }

                            // YouTube
                            const ytMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^"?&]+)/i);
                            if (ytMatch) {
                                addAsset({
                                    id: `be-y-1-${mod.id || index}`,
                                    title: mod.caption || `YouTube Video`,
                                    type: 'video',
                                    ext: 'mp4',
                                    thumbUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
                                    downloadUrl: `https://youtube.com/watch?v=${ytMatch[1]}`
                                });
                                return;
                            }

                            // Generic Stream/Embed
                            addAsset({
                                id: `be-emb-${mod.id || index}`,
                                title: mod.caption || `Embedded Media`,
                                type: 'video', // Assume video for embeds
                                ext: 'mp4',
                                thumbUrl: '', // Hard to get generic thumb
                                downloadUrl: src
                            });
                        }
                    }
                });

                return results;
            });

            return items as MediaItem[];
        } finally {
            await browser.close();
        }
    }
}
