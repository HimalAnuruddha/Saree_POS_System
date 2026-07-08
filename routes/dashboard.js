const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../database/db');

// Dashboard සංඛ්‍යාලේඛන
router.get('/stats', (req, res) => {
    try {
        const stats = getDashboardStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
