'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { downloadZipFromApi } from '@/lib/downloadZip';
import { downloadFileFromApi } from '@/lib/downloadFile';

interface MediaItem {
    id: string;
    type: string;
    title: string;
    thumbUrl: string;
    downloadUrl: string;
    ext: string;
    resolution?: string;
    variants?: { resolution: string; downloadUrl: string }[];
}

function ExtractionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const targetUrl = searchParams.get('url');

    const [results, setResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        if (!targetUrl) {
            router.push('/');
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            try {
                const response = await fetch(`/api/extract?url=${encodeURIComponent(targetUrl)}`, { signal });
                const data = await response.json();

                if (response.ok) {
                    setResults(data.items || []);
                } else {
                    setError(data.error || 'Failed to extract assets');
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                setError('An unexpected error occurred');
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [targetUrl, router]);

    const projectName = useMemo(() => {
        const safe = targetUrl?.split('/').pop()?.split('?')[0] || 'downloaded-assets';
        return safe || 'downloaded-assets';
    }, [targetUrl]);

    const handleDownloadAll = async () => {
        if (!isConfirmed || results.length === 0) return;

        setDownloading(true);
        try {
            const zipFilename = `${projectName}-assets.zip`;

            const selectedAssets = results.map((r) => ({
                url: r.downloadUrl,
                filename: `${r.title}.${r.ext}`,
            }));

            await downloadZipFromApi('/api/download-zip', zipFilename, {
                assets: selectedAssets,
                filename: zipFilename,
            });
        } catch (err) {
            console.error('Download failed', err);
        } finally {
            setDownloading(false);
        }
    };

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const selectedItems = useMemo(() => {
        if (selectedIds.size === 0) return [] as MediaItem[];
        const set = selectedIds;
        return results.filter((r) => set.has(r.id));
    }, [results, selectedIds]);

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(results.map((r) => r.id)));
    const clearSelection = () => setSelectedIds(new Set());

    const handleDownloadSelected = async () => {
        if (!isConfirmed || selectedItems.length === 0) return;

        setDownloading(true);
        try {
            const zipFilename = `${projectName}-selected-assets.zip`;
            await downloadZipFromApi('/api/download-zip', zipFilename, {
                assets: selectedItems.map((r) => ({ url: r.downloadUrl, filename: `${r.title}.${r.ext}` })),
                filename: zipFilename,
            });
        } catch (err) {
            console.error('Selected download failed', err);
        } finally {
            setDownloading(false);
        }
    };

    const downloadByType = async (type: string) => {
        if (!isConfirmed || results.length === 0) return;

        const filtered = results.filter((item) => {
            if (type === 'image') return item.type === 'image';
            if (type === 'video') return item.type === 'video';
            if (type === 'gif') return item.type.includes('gif') || item.downloadUrl.toLowerCase().endsWith('.gif');
            return false;
        });

        if (filtered.length === 0) return;

        setDownloading(true);
        try {
            const zipFilename = `${projectName}-${type}s.zip`;

            await downloadZipFromApi('/api/download-zip', zipFilename, {
                assets: filtered.map((r) => ({ url: r.downloadUrl, filename: `${r.title}.${r.ext}` })),
                filename: zipFilename,
            });
        } catch (err) {
            console.error(`Download failed for ${type}s`, err);
        } finally {
            setDownloading(false);
        }
    };

    const hasImages = results.some((item) => item.type === 'image');
    const hasVideos = results.some((item) => item.type === 'video');
    const hasGifs = results.some((item) => item.type.includes('gif') || item.downloadUrl.toLowerCase().endsWith('.gif'));

    const handleVariantChange = (assetId: string, newUrl: string) => {
        setResults((prev) =>
            prev.map((item) => {
                if (item.id === assetId) return { ...item, downloadUrl: newUrl };
                return item;
            })
        );
    };

    if (loading) {
        return (
            <div className="container section-padding text-center fade-in">
                <nav className="topbar topbar-center">
                    <button className="brandbutton" onClick={() => router.push('/')} aria-label="Back to home">
                        <img src="/logo.png?v=2" alt="BeDownloader" className="brandmark" />
                        <span className="brandname">BeDownloader</span>
                    </button>
                </nav>

                <div className="loading-card" role="status" aria-live="polite">
                    <div className="loader" aria-hidden />
                    <div className="loading-title">Analyzing content</div>
                    <div className="text-secondary loading-sub">
                        Large projects can take 10–30 seconds.
                    </div>

                    <div className="loading-steps">
                        <div className="step done">
                            <span className="step-dot" /> Fetching project
                        </div>
                        <div className="step active">
                            <span className="step-dot" /> Extracting assets
                        </div>
                        <div className="step">
                            <span className="step-dot" /> Preparing downloads
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container section-padding text-center fade-in">
                <nav className="topbar topbar-center">
                    <button className="brandbutton" onClick={() => router.push('/')} aria-label="Back to home">
                        <img src="/logo.png?v=2" alt="BeDownloader" className="brandmark" />
                        <span className="brandname">BeDownloader</span>
                    </button>
                </nav>

                <div className="error-wrap">
                    <h2 className="error-title">Extraction failed</h2>
                    <p className="text-secondary error-subtitle">
                        {typeof error === 'string' ? error : (error as any).message || 'An unexpected error occurred'}
                    </p>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>Try another URL</button>
                </div>
            </div>
        );
    }

    return (
        <main className="container section-padding fade-in">
            <nav className="topbar">
                <button className="brandbutton" onClick={() => router.push('/')} aria-label="Back to home">
                    <img src="/logo.png?v=2" alt="BeDownloader" className="brandmark" />
                    <span className="brandname">BeDownloader</span>
                </button>

                <button className="btn btn-secondary" onClick={() => router.push('/')}>New extraction</button>
            </nav>

            <div className="summary">
                <div className="summary-left">
                    <div className="summary-kicker">Extraction finished</div>
                    <div className="summary-title">{results.length} assets ready</div>
                    <div className="summary-sub text-secondary">
                        Project: <span className="mono">{projectName}</span>
                    </div>
                </div>

                <div className="summary-right">
                    <label className="confirm">
                        <input
                            type="checkbox"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                        />
                        <span>
                            Confirm public access
                            <span className="confirm-sub text-secondary">Required before downloads</span>
                        </span>
                    </label>

                    <div className="chiprow">
                        <button className="chip chip-primary" disabled={!isConfirmed || downloading} onClick={handleDownloadAll}>
                            {downloading ? 'Preparing…' : `Download all (${results.length})`}
                        </button>

                        <button
                            className="chip chip-selected"
                            disabled={!isConfirmed || downloading || selectedItems.length === 0}
                            onClick={handleDownloadSelected}
                            title={selectedItems.length === 0 ? 'Select assets below' : 'Download selected as ZIP'}
                        >
                            {downloading ? 'Preparing…' : `Download selected (${selectedItems.length})`}
                        </button>

                        <button className="chip" disabled={downloading || results.length === 0} onClick={selectAll}>
                            Select all
                        </button>
                        <button className="chip" disabled={downloading || selectedItems.length === 0} onClick={clearSelection}>
                            Clear
                        </button>

                        {hasImages && (
                            <button className="chip chip-green" disabled={!isConfirmed || downloading} onClick={() => downloadByType('image')}>
                                Images
                            </button>
                        )}
                        {hasGifs && (
                            <button className="chip chip-amber" disabled={!isConfirmed || downloading} onClick={() => downloadByType('gif')}>
                                GIFs
                            </button>
                        )}
                        {hasVideos && (
                            <button className="chip chip-indigo" disabled={!isConfirmed || downloading} onClick={() => downloadByType('video')}>
                                Videos
                            </button>
                        )}
                    </div>

                    <div className="text-secondary selection-note">
                        Tip: click any card to select it — selected items get a blue ring.
                    </div>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="empty">
                    <div className="empty-title">No assets found</div>
                    <div className="text-secondary empty-sub">Try a different public Behance project URL.</div>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>New extraction</button>
                </div>
            ) : (
                <div className="asset-grid">
                    {results.map((asset) => {
                        const isSelected = selectedIds.has(asset.id);
                        return (
                            <div
                                key={asset.id}
                                className={`asset card ${isSelected ? 'asset-selected' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleSelected(asset.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        toggleSelected(asset.id);
                                    }
                                }}
                                aria-label={`Select asset ${asset.title}`}
                            >
                                <div className="asset-thumb">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={asset.thumbUrl} alt={asset.title} loading="lazy" />
                                    <div className="asset-badge">{asset.ext}</div>
                                    <div className={`asset-check ${isSelected ? 'asset-check-on' : ''}`} aria-hidden>
                                        ✓
                                    </div>
                                </div>

                                <div className="asset-meta">
                                    <div className="asset-title" title={asset.title}>{asset.title}</div>

                                    <div className="asset-actions" onClick={(e) => e.stopPropagation()}>
                                        <a
                                            href={asset.downloadUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-icon"
                                            title="Open source"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </a>

                                        {asset.variants && asset.variants.length > 1 && (
                                            <select
                                                onChange={(e) => handleVariantChange(asset.id, e.target.value)}
                                                value={asset.downloadUrl}
                                                className="variant"
                                                aria-label="Choose resolution"
                                            >
                                                {asset.variants.map((v) => (
                                                    <option key={v.resolution} value={v.downloadUrl}>
                                                        {v.resolution}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        <button
                                            onClick={() => {
                                                const proxyUrl = `/api/proxy?url=${encodeURIComponent(asset.downloadUrl)}&filename=${encodeURIComponent(asset.title)}.${asset.ext}`;
                                                downloadFileFromApi(proxyUrl, `${asset.title}.${asset.ext}`);
                                            }}
                                            className="btn-icon"
                                            title="Download"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default function ExtractPage() {
    return (
        <Suspense fallback={<div className="container section-padding text-center">Loading…</div>}>
            <ExtractionContent />
        </Suspense>
    );
}
