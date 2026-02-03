import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Behance Downloader | Download Behance Project Images in Full Resolution',
  description:
    'BeDownloader helps you download high-resolution images and assets from any public Behance project. Paste a link, extract assets, and download in seconds.',
  alternates: {
    canonical: '/behance-downloader'
  },
  openGraph: {
    title: 'Behance Downloader | BeDownloader',
    description:
      'Download high-resolution assets from any public Behance project. Fast extraction, clean filenames, and bulk downloads.',
    url: '/behance-downloader',
    type: 'website'
  }
};

const faqs = [
  {
    q: 'Is this Behance downloader free?',
    a: 'Yes. You can paste a public Behance project link and extract the available assets. Some projects may restrict access or block downloads.'
  },
  {
    q: 'Can I download an entire Behance project at once?',
    a: 'Yes. After extraction, you can download assets individually or download everything as a ZIP.'
  },
  {
    q: 'Does it work for private Behance projects?',
    a: 'No. It only supports publicly accessible content.'
  },
  {
    q: 'Will file names be clean and usable?',
    a: 'Yes. We generate readable filenames and keep formats intact (jpg, png, gif, mp4 when available).' 
  },
  {
    q: 'Is BeDownloader affiliated with Behance?',
    a: 'No. BeDownloader is an independent tool and is not affiliated with Behance or Adobe.'
  }
];

export default function BehanceDownloaderPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };

  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BeDownloader',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description:
      'Behance downloader for extracting high-resolution images and assets from public Behance projects.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />

      <div className="container py-10 px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="brand-link">
            <div className="icon-container-sm">
              <img src="/logo.png?v=2" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">BeDownloader</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-secondary">Open App</Link>
            <a
              href="https://github.com/imanibutt/Bedownloader"
              target="_blank"
              className="btn btn-secondary"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>

        <section className="mt-14 max-w-3xl">
          <p className="text-slate-400 text-sm">SEO landing page</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-3">
            Behance Downloader
          </h1>
          <p className="text-slate-400 text-lg mt-5 leading-relaxed">
            Download high-resolution images and assets from any public Behance project.
            Paste the project URL, extract the assets, then download individual files or a ZIP.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/" className="btn btn-primary">Try it now</Link>
            <a
              href="#how-it-works"
              className="btn btn-secondary"
            >
              How it works
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="text-sm font-semibold">Full resolution</div>
              <div className="text-slate-400 text-sm mt-2">We pick the best available sizes from the project.</div>
            </div>
            <div className="card p-5">
              <div className="text-sm font-semibold">ZIP download</div>
              <div className="text-slate-400 text-sm mt-2">Download everything in one click when possible.</div>
            </div>
            <div className="card p-5">
              <div className="text-sm font-semibold">Safe by default</div>
              <div className="text-slate-400 text-sm mt-2">Public content only. SSRF protections enabled.</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-4 space-y-3 text-slate-300">
            <li>1) Copy a public Behance project link.</li>
            <li>2) Paste it into BeDownloader and click Extract.</li>
            <li>3) Select assets or download everything as a ZIP.</li>
          </ol>

          <div className="mt-6 card p-5">
            <div className="text-sm font-semibold">Example Behance URL</div>
            <div className="text-slate-400 text-sm mt-2 break-words">
              https://www.behance.net/gallery/.../Project-Name
            </div>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-4">
            {faqs.map(item => (
              <div key={item.q} className="card p-5">
                <div className="font-semibold">{item.q}</div>
                <div className="text-slate-400 text-sm mt-2 leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">Notes</h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed">
            Always respect the original creator rights and only download content you have permission to use.
            BeDownloader is not affiliated with Behance or Adobe.
          </p>
        </section>

        <footer className="mt-16 pt-8 border-t border-white-5 text-slate-500 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>© {new Date().getFullYear()} BeDownloader</div>
            <div className="flex gap-4">
              <Link href="/terms" className="footer-link">Terms</Link>
              <Link href="/privacy" className="footer-link">Privacy</Link>
              <Link href="/fair-use" className="footer-link">Fair Use</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
