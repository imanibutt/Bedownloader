import axios from 'axios';

const url = 'https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/fa55ff236606811.68ef5a268c57f.png';

async function testFetch() {
    console.log(`Fetching: ${url}`);
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.behance.net/',
            },
            timeout: 10000
        });
        console.log(`Success! Status: ${response.status}`);
        console.log(`Content-Length: ${response.data.length}`);
    } catch (error) {
        if (error.response) {
            console.error(`Error Status: ${error.response.status}`);
            console.error('Error Headers:', error.response.headers);
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testFetch();
