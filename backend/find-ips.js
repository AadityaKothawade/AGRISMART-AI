// Create find-ips.js
const dns = require('dns');

// Try to resolve the main domain
dns.lookup('cluster0.ikblls2.mongodb.net', (err, address) => {
    if (err) {
        console.log('Trying to get IPs from alternate DNS...');
        // Try with Google DNS
        require('dns').resolve('cluster0.ikblls2.mongodb.net', (err, addresses) => {
            if (err) {
                console.log('Cannot resolve domain. You need to:');
                console.log('1. Use a VPN');
                console.log('2. Change DNS to 8.8.8.8');
                console.log('3. Use mobile hotspot');
            } else {
                console.log('IP addresses:', addresses);
            }
        });
    } else {
        console.log('IP address:', address);
    }
});