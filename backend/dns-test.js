const dns = require('dns');

console.log('Testing DNS resolution...');

// Test SRV record lookup (what MongoDB uses)
dns.resolveSrv('_mongodb._tcp.cluster0.ikblls2.mongodb.net', (err, res) => {
    if (err) {
        console.error('❌ SRV lookup failed:', err.code, err.message);
    } else {
        console.log('✅ SRV records found:', res);
    }
});

// Test regular DNS lookup
dns.lookup('cluster0.ikblls2.mongodb.net', { family: 4 }, (err, address) => {
    if (err) {
        console.error('❌ IPv4 lookup failed:', err.message);
    } else {
        console.log('✅ IPv4 address:', address);
    }
});

dns.lookup('cluster0.ikblls2.mongodb.net', { family: 6 }, (err, address) => {
    if (err) {
        console.error('❌ IPv6 lookup failed:', err.message);
    } else {
        console.log('✅ IPv6 address:', address);
    }
});