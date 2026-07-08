const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(path.join(__dirname, 'node_modules')));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sarees', require('./routes/sarees'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.post('/api/log', (req, res) => {
    console.error('🔴 CLIENT ERROR:', req.body);
    res.sendStatus(200);
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database (async because sql.js is async) then start server
async function start() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`\n🎉 සාරි POS System ක්‍රියාත්මකයි!`);
        console.log(`🌐 Browser එකෙන් මෙතැනට යන්න: http://localhost:${PORT}`);
        console.log(`\n📁 Database: ./data/saree_pos.db`);
        console.log(`📷 Images: ./uploads/\n`);
    });
}

start().catch(err => {
    console.error('❌ Server start failed:', err);
    process.exit(1);
});

module.exports = app;
