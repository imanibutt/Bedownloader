import fetch from 'node-fetch';
import fs from 'fs';

async function testZip() {
    console.log('Testing ZIP generation...');
    try {
        const assets = [
            {
                url: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/fa55ff236606811.68ef5a268c57f.png',
                filename: 'ayari-test-webp.png'
            }
        ];

        const response = await fetch('http://localhost:3000/api/download-zip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assets,
                filename: 'test-custom-name.zip'
            })
        });

        console.log(`Response Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        console.log(`Content-Disposition: ${response.headers.get('content-disposition')}`);

        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            console.log(`WARNING: Content-Length is present: ${contentLength} (Expected streaming/chunked)`);
        } else {
            console.log('SUCCESS: Content-Length is absent (Streaming verified)');
        }

        const buffer = await response.arrayBuffer();
        const bufferNode = Buffer.from(buffer);
        console.log(`Response Size: ${bufferNode.length} bytes`);

        if (bufferNode.length > 0) {
            const signature = bufferNode.slice(0, 4).toString('hex');
            console.log(`File Signature (Hex): ${signature}`);

            if (signature === '504b0304') {
                console.log('SUCCESS: Valid ZIP header detected.');
                fs.writeFileSync('test_output.zip', bufferNode);
                console.log('Saved to test_output.zip');
            } else {
                console.log('FAILURE: Invalid ZIP header.');
                console.log('First 100 char of content:', bufferNode.slice(0, 100).toString());
            }
        } else {
            console.log('FAILURE: Empty response.');
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testZip();
