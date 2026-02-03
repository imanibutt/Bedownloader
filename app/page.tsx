'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function isLikelyBehanceUrl(input: string) {
  try {
    const u = new URL(input);
    return u.hostname.includes('behance.net');
  } catch {
    return false;
  }
}

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const hint = useMemo(() => {
    const v = url.trim();
    if (!v) return 'Press Enter to extract';
    if (isLikelyBehanceUrl(v)) return 'Looks like a Behance URL — ready to extract';
    return 'Paste a public Behance project URL';
  }, [url]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = url.trim();
    if (v) router.push(`/extract?url=${encodeURIComponent(v)}`);
  };

  return (
    <main className="container section-padding fade-in">
      <div className="hero-wrap">
        <nav className="brandbar">
          <img src="/logo.png?v=1" alt="BeDownloader Logo" className="brandmark" />
          <span className="brandname">BeDownloader</span>
          <span className="pill">Dribbble — Coming soon</span>
        </nav>

        <section className="hero">
          <h1 className="hero-title">Download Behance assets in original quality</h1>
          <p className="hero-subtitle">
            Paste a public Behance project URL and extract images (and videos) in seconds — no login.
          </p>

          <form onSubmit={handleSearch} className="input-group" aria-label="Extract assets">
            <input
              type="url"
              className="input-main"
              placeholder="Paste a Behance project URL (e.g., https://www.behance.net/gallery/…)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
            />
            <button type="submit" className="input-submit" aria-label="Extract assets">
              Extract assets
              <span className="btn-icon-inline" aria-hidden>
                →
              </span>
            </button>
          </form>

          <div className="hero-hint text-secondary">{hint}</div>

          <div className="trustline">
            <span className="trustitem">
              <span className="dot dot-green" /> Public projects only
            </span>
            <span className="trustitem">
              <span className="dot dot-green" /> Original resolution
            </span>
            <span className="trustitem">
              <span className="dot dot-blue" /> No watermarking
            </span>
          </div>

          <div className="how">
            <div className="how-item">
              <div className="how-num">1</div>
              <div>
                <div className="how-title">Paste URL</div>
                <div className="how-desc text-secondary">Drop a public Behance project link.</div>
              </div>
            </div>
            <div className="how-item">
              <div className="how-num">2</div>
              <div>
                <div className="how-title">Extract</div>
                <div className="how-desc text-secondary">We parse assets instantly.</div>
              </div>
            </div>
            <div className="how-item">
              <div className="how-num">3</div>
              <div>
                <div className="how-title">Download originals</div>
                <div className="how-desc text-secondary">Save files in their best quality.</div>
              </div>
            </div>
          </div>

          <div className="features">
            <div className="feature card">
              <div className="feature-title">Original quality</div>
              <div className="feature-desc text-secondary">
                Grab the highest available resolution from the project — perfect for reference and archival.
              </div>
            </div>
            <div className="feature card">
              <div className="feature-title">Fast + clean</div>
              <div className="feature-desc text-secondary">
                One input, one click. Built for designers who want results, not friction.
              </div>
            </div>
            <div className="feature card">
              <div className="feature-title">Safe by design</div>
              <div className="feature-desc text-secondary">
                Publicly accessible content only. Clear boundaries, predictable behavior.
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="footer">
        <div className="footer-top" />
        <p className="text-secondary footer-copy">&copy; {new Date().getFullYear()} BeDownloader. Made for designers.</p>
      </footer>
    </main>
  );
}
