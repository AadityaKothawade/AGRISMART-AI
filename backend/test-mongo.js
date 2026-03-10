require('dotenv').config();
const mongoose = require('mongoose');
console.log(process.env.MONGODB_URI);
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connection successful');
        console.log('Database:', mongoose.connection.name);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });