'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      router.push(`/extract?url=${encodeURIComponent(url.trim())}`);
    }
  };

  return (
    <main className="container section-padding fade-in">
      <nav style={{ display: 'flex', justifyContent: 'center', marginBottom: '80px' }}>
        <img
          src="/logo.png?v=1"
          alt="BeDownloader Logo"
          style={{ height: '64px', width: '64px', objectFit: 'contain' }}
        />
      </nav>

      <section className="text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 700 }}>
          Download Assets from Behance, YouTube & More
        </h1>
        <p className="text-secondary" style={{ fontSize: '18px', marginBottom: '40px' }}>
          Extract high-resolution images and videos instantly from Behance, YouTube, Instagram, and TikTok.
          Professional utility for creators.
        </p>

        <form onSubmit={handleSearch} className="input-group">
          <input
            type="text"
            className="input-main"
            placeholder="Paste URL from Behance, YouTube, Instagram, or TikTok..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" className="input-submit">
            Extract
          </button>
        </form>

        <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'center', gap: '40px' }} className="text-secondary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }}></div>
            <span style={{ fontSize: '14px' }}>Publicly accessible content only</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }}></div>
            <span style={{ fontSize: '14px' }}>Original resolution</span>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: '120px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }} className="text-center text-secondary">
        <p style={{ fontSize: '13px' }}>
          &copy; {new Date().getFullYear()} BeDownloader. Universal Media Downloader.
        </p>
      </footer>
    </main>
  );
}
