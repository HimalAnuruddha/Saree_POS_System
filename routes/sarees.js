const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createSaree, getSareeByBarcode, getAllSarees, updateSaree, deleteSaree, updateSareeStatus } = require('../database/db');

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `saree_${Date.now()}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('අනුමත නොවූ ගොනු වර්ගයකි'));
        }
    }
});

// සියලු සාරි ලබාගන්න
router.get('/', (req, res) => {
    try {
        const sarees = getAllSarees();
        res.json(sarees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// බාර්කෝඩ් අංකයෙන් සොයන්න
router.get('/barcode/:barcode', (req, res) => {
    try {
        const saree = getSareeByBarcode(req.params.barcode);
        if (saree) {
            res.json(saree);
        } else {
            res.status(404).json({ error: 'සාරිය හමු නොවීය' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// නව සාරියක් එකතු කරන්න
router.post('/', upload.single('image'), (req, res) => {
    try {
        const { name, description, default_price } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'සාරියේ නම අවශ්‍යයි' });
        }
        
        const data = {
            name,
            description: description || '',
            default_price: parseFloat(default_price) || 0,
            image_path: req.file ? `/uploads/${req.file.filename}` : null
        };

        const saree = createSaree(data);
        res.json(saree);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// සාරිය යාවත්කාලීන කරන්න
router.put('/:id', upload.single('image'), (req, res) => {
    try {
        const { name, description, default_price } = req.body;
        const data = {
            id: parseInt(req.params.id),
            name,
            description: description || '',
            default_price: parseFloat(default_price) || 0,
            image_path: req.file ? `/uploads/${req.file.filename}` : null
        };

        updateSaree(data);
        res.json({ success: true, message: 'සාරිය යාවත්කාලීන කරන ලදී' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// සාරිය මකන්න
router.delete('/:id', (req, res) => {
    try {
        deleteSaree(parseInt(req.params.id));
        res.json({ success: true, message: 'සාරිය මකා දමන ලදී' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
