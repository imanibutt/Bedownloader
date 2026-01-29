const fetch = require('node-fetch');
const fs = require('fs');

async function testZip() {
    console.log('Testing ZIP generation...');
    try {
        // Use a known public image URL for testing
        const assets = [
            {
                url: 'https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5e410d182519139.652f9c3a3b0a5.jpg',
                filename: 'test-image.jpg'
            }
        ];

        // Construct Body for Form Data manually or just use JSON if the endpoint handles it (my code handles both)
        // Let's use JSON first as it's simpler
        const response = await fetch('http://localhost:3000/api/download-zip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assets })
        });

        console.log(`Response Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        console.log(`Content-Disposition: ${response.headers.get('content-disposition')}`);

        const buffer = await response.buffer();
        console.log(`Response Size: ${buffer.length} bytes`);

        if (buffer.length > 0) {
            const signature = buffer.slice(0, 4).toString('hex'); // Should be 504b0304 (PK..)
            console.log(`File Signature (Hex): ${signature}`);

            if (signature === '504b0304') {
                console.log('SUCCESS: Valid ZIP header detected.');
                fs.writeFileSync('test_output.zip', buffer);
                console.log('Saved to test_output.zip');
            } else {
                console.log('FAILURE: Invalid ZIP header.');
                console.log('First 100 char of content:', buffer.slice(0, 100).toString());
            }
        } else {
            console.log('FAILURE: Empty response.');
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testZip();
