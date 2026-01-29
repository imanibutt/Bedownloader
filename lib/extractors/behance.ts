import * as cheerio from 'cheerio';
import axios from 'axios';
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
        try {
            // Use axios with a browser-like user agent
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);

            // Look for the project data script
            const scriptId = 'beconfig-store_state';
            const scriptContent = $(`#${scriptId}`).html();

            let projectData: any = null;

            if (scriptContent) {
                try {
                    projectData = JSON.parse(scriptContent);
                } catch (e) {
                    console.error('Error parsing Behance script content:', e);
                }
            }

            // Fallback: search all scripts for the project JSON
            if (!projectData) {
                $('script').each((_, script) => {
                    const content = $(script).html() || '';
                    if (content.includes('"project":') && content.includes('"modules":')) {
                        const startIdx = content.indexOf('{"project":');
                        if (startIdx !== -1) {
                            try {
                                const endIdx = content.lastIndexOf('}');
                                if (endIdx > startIdx) {
                                    projectData = JSON.parse(content.substring(startIdx, endIdx + 1));
                                    return false; // Break loop
                                }
                            } catch (e) { }
                        }
                    }
                });
            }

            if (!projectData) {
                console.warn('No project data found in Behance page');
                return [];
            }

            // Extract project and modules
            const project = projectData.project?.project || projectData.project || {};
            const modules = project.allModules || project.modules || [];
            const results: MediaItem[] = [];
            const seen = new Set();

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
                    if (imageSizes[key]) {
                        const item = imageSizes[key];
                        return typeof item === 'string' ? item : (item.url || item.src);
                    }
                }
                return null;
            };

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

                        // Generic Embed
                        addAsset({
                            id: `be-emb-${mod.id || index}`,
                            title: mod.caption || `Embedded Media`,
                            type: 'video',
                            ext: 'mp4',
                            thumbUrl: '',
                            downloadUrl: src
                        });
                    }
                }
            });

            return results;
        } catch (error) {
            console.error('Behance extraction failed:', error);
            throw error;
        }
    }
}
