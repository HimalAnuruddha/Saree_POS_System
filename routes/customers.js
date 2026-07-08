const express = require('express');
const router = express.Router();
const { createCustomer, getCustomerByPhone, getAllCustomers, searchCustomers } = require('../database/db');

// සියලු පාරිභෝගිකයින් ලබාගන්න
router.get('/', (req, res) => {
    try {
        const customers = getAllCustomers();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// දුරකථන අංකයෙන් සොයන්න
router.get('/search/:phone', (req, res) => {
    try {
        const customer = getCustomerByPhone(req.params.phone);
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ error: 'පාරිභෝගිකයා හමු නොවීය' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// පාරිභෝගිකයින් සොයන්න (නම හෝ දුරකථනය)
router.get('/query', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const customers = searchCustomers(q);
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// නව පාරිභෝගිකයෙක් එකතු කරන්න
router.post('/', (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ error: 'නම සහ දුරකථන අංකය අවශ්‍යයි' });
        }
        const customer = createCustomer({ name, phone, address: address || '' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
