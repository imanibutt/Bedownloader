# BeDownloader

BeDownloader is a professional-grade asset extraction tool designed for creators and designers. It allows you to quickly download high-resolution media from Behance, YouTube, Instagram, and TikTok.

## Features

- **Multi-Platform Support**: Extract media from Behance, YouTube, Instagram, and TikTok.
- **High Quality**: Always attempts to fetch the highest resolution available (Original/4K).
- **Format Support**: Handles Images (JPG, PNG, WebP), Animations (GIF), and Videos (MP4).
- **ZIP Downloads**: Real-time streamed ZIP generation for downloading multiple assets at once.
- **Smart Proxy**: Proxies downloads to bypass CORS and enforce proper file naming.
- **Security First**: Built-in SSRF protection and domain allowlisting.

## Setup

### Requirements
- Node.js 18+
- [Playwright](https://playwright.dev/) (auto-installed with dependencies)

### Installation

1. Navigate to the web app directory:
   ```bash
   cd public-asset-web
   ```

2. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## Configuration

Copy `.env.example` to `.env.local` to configure the application.

```bash
# Cache Configuration
CACHE_TTL=600  # 10 minutes
```

## API Documentation

### 1. Extract Assets
Parses a URL and returns a standardized list of media items.

**Endpoint:** `GET /api/extract`

**Query Parameters:**
- `url` (required): The URL of the project or post.

**Response:**
```json
{
  "items": [
    {
      "id": "item-123",
      "title": "Mountain Peak",
      "type": "image",
      "ext": "jpg",
      "thumbUrl": "https://...",
      "downloadUrl": "https://..."
    }
  ],
  "meta": {
    "sourceUrl": "...",
    "assetCount": 1,
    "platform": "Behance",
    "extractedAt": "2024-01-01T12:00:00Z",
    "elapsedMs": 120
  }
}
```

### 2. Download Proxy
Fetches a single file to bypass CORS or enforce a filename.

**Endpoint:** `GET /api/proxy`

**Query Parameters:**
- `url` (required): The direct URL of the asset.
- `filename` (optional): Desired filename.

### 3. Download ZIP
Creates a ZIP archive of multiple assets on the fly using Node.js streams.

**Endpoint:** `POST /api/download-zip`

**Body (JSON):**
```json
{
  "filename": "my-assets.zip",
  "assets": [
    {
      "url": "https://...",
      "filename": "image-01.jpg"
    }
  ]
}
```

## Troubleshooting

- **Module Not Found**: If you see import errors, ensure you've run `npm install` and that `lib/extractors/index.ts` only imports existing files.
- **403 Forbidden**: Some assets (especially YouTube/Instagram) may be protected or require fresh headers. The proxy handles basic cases.
- **Workspace Warning**: If Next.js warns about multiple lockfiles, ensure the root `package-lock.json` is removed and keep only the one in `public-asset-web/`.

## Compliance & Privacy

This tool is intended for personal backup and educational purposes. Always respect the copyright of creators. It does not bypass paywalls or access private content.
