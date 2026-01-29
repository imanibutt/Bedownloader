
export async function downloadFileFromApi(apiUrl: string, filename: string) {
    try {
        const res = await fetch(apiUrl);

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Download failed (${res.status}). ${text}`);
        }

        // Try to get filename from Content-Disposition header
        let finalFilename = filename;
        const disposition = res.headers.get('Content-Disposition');
        if (disposition && disposition.includes('filename=')) {
            const parts = disposition.split('filename=');
            if (parts.length > 1) {
                const dbFilename = parts[1].split(';')[0].replace(/['"]/g, '').trim();
                if (dbFilename.length > 0) {
                    finalFilename = dbFilename;
                }
            }
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Received empty file");

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        a.download = finalFilename;

        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 2000);

    } catch (err: any) {
        console.error("Single file download failed:", err);
        // Fallback to direct link if blob fails (though it might show UUID name)
        window.open(apiUrl, '_blank');
    }
}
