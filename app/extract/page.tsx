'use client';

import React, { useEffect, useState, Suspense } from 'react';
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

    const handleDownloadAll = async () => {
        if (!isConfirmed || results.length === 0) return;

        setDownloading(true);
        try {
            const projectName = targetUrl?.split('/').pop()?.split('?')[0] || 'downloaded-assets';
            const zipFilename = `${projectName}-assets.zip`;

            const selectedAssets = results.map(r => ({
                url: r.downloadUrl,
                filename: `${r.title}.${r.ext}`
            }));

            await downloadZipFromApi('/api/download-zip', zipFilename, {
                assets: selectedAssets,
                filename: zipFilename
            });
        } catch (err) {
            console.error('Download failed', err);
        } finally {
            setDownloading(false);
        }
    };

    const downloadByType = async (type: string) => {
        if (!isConfirmed || results.length === 0) return;

        const filtered = results.filter(item => {
            if (type === 'image') return item.type === 'image';
            if (type === 'video') return item.type === 'video';
            if (type === 'gif') return item.type.includes('gif') || item.downloadUrl.toLowerCase().endsWith('.gif');
            return false;
        });

        if (filtered.length === 0) return;

        setDownloading(true);
        try {
            const projectName = targetUrl?.split('/').pop()?.split('?')[0] || 'assets';
            const zipFilename = `${projectName}-${type}s.zip`;

            await downloadZipFromApi('/api/download-zip', zipFilename, {
                assets: filtered.map(r => ({ url: r.downloadUrl, filename: `${r.title}.${r.ext}` })),
                filename: zipFilename
            });
        } catch (err) {
            console.error(`Download failed for ${type}s`, err);
        } finally {
            setDownloading(false);
        }
    };

    const hasImages = results.some(item => item.type === 'image');
    const hasVideos = results.some(item => item.type === 'video');
    const hasGifs = results.some(item => item.type.includes('gif') || item.downloadUrl.toLowerCase().endsWith('.gif'));

    const handleVariantChange = (assetId: string, newUrl: string) => {
        setResults(prev => prev.map(item => {
            if (item.id === assetId) {
                return { ...item, downloadUrl: newUrl };
            }
            return item;
        }));
    };

    if (loading) {
        return (
            <div className="container section-padding text-center fade-in">
                <nav style={{ marginBottom: '64px' }}>
                    <img
                        src="/logo.png?v=1"
                        alt="BeDownloader"
                        style={{ height: '40px', width: '40px', objectFit: 'contain', cursor: 'pointer' }}
                        onClick={() => router.push('/')}
                    />
                </nav>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '100px' }}>
                    <div className="spinner"></div>
                    <p className="text-secondary">Analyzing content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container section-padding text-center fade-in">
                <nav style={{ marginBottom: '64px' }}>
                    <img
                        src={`/logo.png?v=${Date.now()}`}
                        alt="BeDownloader"
                        style={{ height: '40px', width: '40px', objectFit: 'contain', cursor: 'pointer' }}
                        onClick={() => router.push('/')}
                    />
                </nav>
                <div style={{ marginTop: '100px' }}>
                    <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>Extraction Failed</h2>
                    <p className="text-secondary" style={{ marginBottom: '32px' }}>
                        {typeof error === 'string' ? error : (error as any).message || 'An unexpected error occurred'}
                    </p>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>Try Another URL</button>
                </div>
            </div>
        );
    }

    return (
        <main className="container section-padding fade-in">
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '64px' }}>
                <img
                    src="/logo.png?v=1"
                    alt="BeDownloader"
                    style={{ height: '40px', width: '40px', objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => router.push('/')}
                />
                <button className="btn btn-secondary" onClick={() => router.push('/')}>New Extraction</button>
            </nav>

            <div style={{
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <div>
                    <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Extraction Finished</h2>
                    <p className="text-secondary" style={{ fontSize: '14px' }}>Found {results.length} assets from the project</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginRight: '12px' }} className="text-secondary">
                        <input
                            type="checkbox"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }}
                        />
                        Confirm public access
                    </label>
                    <button
                        className="btn btn-primary"
                        disabled={!isConfirmed || downloading}
                        onClick={handleDownloadAll}
                        style={{ minWidth: '140px' }}
                    >
                        {downloading ? 'Preparing...' : `All ${results.length}`}
                    </button>
                    {hasImages && (
                        <button
                            className="btn btn-secondary"
                            disabled={!isConfirmed || downloading}
                            onClick={() => downloadByType('image')}
                            style={{ minWidth: '140px', borderColor: '#10B981', color: '#10B981' }}
                        >
                            Only Images
                        </button>
                    )}
                    {hasGifs && (
                        <button
                            className="btn btn-secondary"
                            disabled={!isConfirmed || downloading}
                            onClick={() => downloadByType('gif')}
                            style={{ minWidth: '140px', borderColor: '#F59E0B', color: '#F59E0B' }}
                        >
                            Only GIFs
                        </button>
                    )}
                    {hasVideos && (
                        <button
                            className="btn btn-secondary"
                            disabled={!isConfirmed || downloading}
                            onClick={() => downloadByType('video')}
                            style={{ minWidth: '140px', borderColor: '#6366F1', color: '#6366F1' }}
                        >
                            Only Videos
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {results.map((asset) => (
                    <div key={asset.id} className="card">
                        <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000' }}>
                            <img
                                src={asset.thumbUrl}
                                alt={asset.title}
                                loading="lazy"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                padding: '4px 8px',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}>
                                {asset.ext}
                            </div>
                        </div>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                {asset.title}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
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
                                        style={{
                                            background: 'var(--surface-hover)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            padding: '0 8px',
                                            height: '36px',
                                            fontSize: '12px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {asset.variants.map(v => (
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
                ))}
            </div>
        </main>
    );
}

export default function ExtractPage() {
    return (
        <Suspense fallback={<div className="container section-padding text-center">Loading...</div>}>
            <ExtractionContent />
        </Suspense>
    );
}
