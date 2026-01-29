export async function downloadZipFromApi(apiUrl: string, filename: string, body?: any) {
    // We use a hidden form to trigger a native browser download.
    // This allows streaming to happen directly, instead of buffering the whole ZIP in memory via fetch.blob().

    const form = document.createElement("form");
    form.method = "POST";
    form.action = apiUrl;
    form.style.display = "none";

    if (body) {
        Object.keys(body).forEach(key => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            // If the value is an object (like our assets array), stringify it
            input.value = typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key];
            form.appendChild(input);
        });
    }

    document.body.appendChild(form);
    form.submit();

    // Cleanup form after a short delay
    setTimeout(() => {
        document.body.removeChild(form);
    }, 2000);
}
