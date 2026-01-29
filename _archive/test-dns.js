const dns = require('dns');

console.log('Testing DNS resolution for google.com...');
dns.lookup('google.com', (err, address, family) => {
    if (err) {
        console.error('DNS Lookup Failed:', err);
    } else {
        console.log('google.com resolved to:', address);
    }
});

console.log('Testing DNS resolution for mir-s3-cdn-cf.behance.net...');
dns.lookup('mir-s3-cdn-cf.behance.net', (err, address, family) => {
    if (err) {
        console.error('DNS Lookup Failed:', err);
    } else {
        console.log('mir-s3-cdn-cf.behance.net resolved to:', address);
    }
});

console.log('Testing DNS resolution for www.behance.net...');
dns.lookup('www.behance.net', (err, address, family) => {
    if (err) {
        console.error('DNS Lookup Failed:', err);
    } else {
        console.log('www.behance.net resolved to:', address);
    }
});
