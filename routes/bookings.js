const express = require('express');
const router = express.Router();
const {
    createBooking, getBookingById, getBookingByBillNo,
    getBookingsByDate, getAllBookings, completeBooking, returnBooking,
    updateBookingStatus, getSareeBookingStatus, getSareeByBarcode,
    searchBookings, checkSareeAvailability
} = require('../database/db');

// සියලු වෙන්කිරීම් ලබාගන්න
router.get('/', (req, res) => {
    try {
        const bookings = getAllBookings();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// වෙන්කිරීම් සොයන්න
router.get('/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const bookings = searchBookings(q);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// දිනයකට අනුව වෙන්කිරීම්
router.get('/date/:date', (req, res) => {
    try {
        const bookings = getBookingsByDate(req.params.date);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// බිල්පත් අංකයෙන් සොයන්න
router.get('/bill/:billNo', (req, res) => {
    try {
        const booking = getBookingByBillNo(req.params.billNo);
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ error: 'වෙන්කිරීම හමු නොවීය' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// සාරියක දින පදනම් වූ වෙන්කිරීම් තත්ත්වය පරීක්ෂා කරන්න
router.get('/availability/:barcode', (req, res) => {
    try {
        const { pickup, return: returnDate } = req.query;
        if (!pickup) {
            return res.status(400).json({ error: 'Pickup date is required' });
        }
        
        const availability = checkSareeAvailability(req.params.barcode, pickup, returnDate);
        if (!availability.exists) {
            return res.status(404).json({ error: 'සාරිය හමු නොවීය' });
        }
        
        res.json(availability);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// සාරියක වෙන්කිරීම් තත්ත්වය පරීක්ෂා කරන්න (Legacy - scanner page)
router.get('/saree-status/:barcode', (req, res) => {
    try {
        const saree = getSareeByBarcode(req.params.barcode);
        if (!saree) {
            return res.status(404).json({ error: 'සාරිය හමු නොවීය' });
        }
        
        const booking = getSareeBookingStatus(saree.id);
        res.json({
            saree,
            booking: booking || null,
            isBooked: !!booking
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ID එකෙන් වෙන්කිරීම ලබාගන්න
router.get('/:id', (req, res) => {
    try {
        const booking = getBookingById(parseInt(req.params.id));
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ error: 'වෙන්කිරීම හමු නොවීය' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// නව වෙන්කිරීමක් සාදන්න
router.post('/', (req, res) => {
    try {
        const { customer_id, pickup_date, return_date, advance_payment, total_amount, notes, items } = req.body;

        if (!customer_id || !pickup_date || !items || items.length === 0) {
            return res.status(400).json({ error: 'අවශ්‍ය තොරතුරු සම්පූර්ණ කරන්න' });
        }

        const balance = (total_amount || 0) - (advance_payment || 0);

        const bookingData = {
            customer_id,
            pickup_date,
            return_date: return_date || null,
            advance_payment: advance_payment || 0,
            total_amount: total_amount || 0,
            balance,
            notes: notes || ''
        };

        const booking = createBooking(bookingData, items);
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// වෙන්කිරීම සම්පූර්ණ කරන්න (මුළු මුදල ගෙවීම)
router.put('/:id/complete', (req, res) => {
    try {
        completeBooking(parseInt(req.params.id));
        const booking = getBookingById(parseInt(req.params.id));
        res.json({ success: true, message: 'ගෙවීම සම්පූර්ණයි', booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// බඩු ආපසු භාරදීම
router.put('/:id/return', (req, res) => {
    try {
        returnBooking(parseInt(req.params.id));
        const booking = getBookingById(parseInt(req.params.id));
        res.json({ success: true, message: 'බඩු ආපසු භාරගන්නා ලදී', booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// වෙන්කිරීම් තත්ත්වය වෙනස් කරන්න
router.put('/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        updateBookingStatus(parseInt(req.params.id), status);
        res.json({ success: true, message: 'තත්ත්වය යාවත්කාලීන කරන ලදී' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
