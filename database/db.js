const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Database file path
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'saree_pos.db');

let db;

// =================== INITIALIZATION ===================
async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            address TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sarees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            default_price REAL DEFAULT 0,
            image_path TEXT,
            status TEXT DEFAULT 'තිබේ',
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_no TEXT UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL,
            pickup_date TEXT NOT NULL,
            return_date TEXT,
            advance_payment REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            balance REAL DEFAULT 0,
            status TEXT DEFAULT 'Booking',
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS booking_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            saree_id INTEGER,
            item_name TEXT NOT NULL,
            price REAL NOT NULL,
            item_type TEXT DEFAULT 'saree',
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (saree_id) REFERENCES sarees(id)
        )
    `);

    // Migrate old data
    db.run("UPDATE bookings SET status = 'Booking' WHERE status = 'වෙන් කර ඇත'");
    db.run("UPDATE sarees SET status = 'Booking' WHERE status = 'වෙන් කර ඇත'");

    saveDatabase();
    console.log('✅ Database initialized successfully');
}

// Save database to file
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Helper: run query and return rows as array of objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper: run query and return first row as object
function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper: run insert/update and return lastInsertRowid
function runSql(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    const result = queryOne("SELECT last_insert_rowid() as id");
    return result ? result.id : null;
}

// =================== CUSTOMER FUNCTIONS ===================
function createCustomer(data) {
    // Check if customer exists
    const existing = queryOne('SELECT * FROM customers WHERE phone = ?', [data.phone]);
    if (existing) {
        db.run('UPDATE customers SET name = ?, address = ? WHERE phone = ?', [data.name, data.address, data.phone]);
        saveDatabase();
        return queryOne('SELECT * FROM customers WHERE phone = ?', [data.phone]);
    }
    runSql('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)', [data.name, data.phone, data.address || '']);
    return queryOne('SELECT * FROM customers WHERE phone = ?', [data.phone]);
}

function getCustomerByPhone(phone) {
    return queryOne('SELECT * FROM customers WHERE phone = ?', [phone]);
}

function getAllCustomers() {
    return queryAll('SELECT * FROM customers ORDER BY created_at DESC');
}

function searchCustomers(query) {
    const like = `%${query}%`;
    return queryAll("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name LIMIT 20", [like, like]);
}

// =================== SAREE FUNCTIONS ===================
function generateBarcode() {
    const last = queryOne("SELECT barcode FROM sarees ORDER BY id DESC LIMIT 1");
    if (!last) return 'SR0001';
    const num = parseInt(last.barcode.replace('SR', '')) + 1;
    return `SR${String(num).padStart(4, '0')}`;
}

function createSaree(data) {
    data.barcode = generateBarcode();
    runSql(
        'INSERT INTO sarees (barcode, name, description, default_price, image_path) VALUES (?, ?, ?, ?, ?)',
        [data.barcode, data.name, data.description || '', data.default_price || 0, data.image_path || null]
    );
    return queryOne('SELECT * FROM sarees WHERE barcode = ?', [data.barcode]);
}

function getSareeByBarcode(barcode) {
    return queryOne('SELECT * FROM sarees WHERE barcode = ?', [barcode]);
}

function getAllSarees() {
    return queryAll('SELECT * FROM sarees ORDER BY created_at DESC');
}

function updateSareeStatus(id, status) {
    db.run('UPDATE sarees SET status = ? WHERE id = ?', [status, id]);
    saveDatabase();
}

function updateSaree(data) {
    if (data.image_path) {
        db.run('UPDATE sarees SET name = ?, description = ?, default_price = ?, image_path = ? WHERE id = ?',
            [data.name, data.description || '', data.default_price || 0, data.image_path, data.id]);
    } else {
        db.run('UPDATE sarees SET name = ?, description = ?, default_price = ? WHERE id = ?',
            [data.name, data.description || '', data.default_price || 0, data.id]);
    }
    saveDatabase();
}

function deleteSaree(id) {
    db.run('DELETE FROM sarees WHERE id = ?', [id]);
    saveDatabase();
}

// =================== BOOKING FUNCTIONS ===================
function generateBillNo() {
    const last = queryOne("SELECT bill_no FROM bookings ORDER BY id DESC LIMIT 1");
    if (!last) return 'B000001';
    const num = parseInt(last.bill_no.replace('B', '')) + 1;
    return `B${String(num).padStart(6, '0')}`;
}

function createBooking(bookingData, items) {
    bookingData.bill_no = generateBillNo();

    runSql(
        `INSERT INTO bookings (bill_no, customer_id, pickup_date, return_date, advance_payment, total_amount, balance, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Booking')`,
        [bookingData.bill_no, bookingData.customer_id, bookingData.pickup_date,
        bookingData.return_date || null, bookingData.advance_payment || 0,
        bookingData.total_amount || 0, bookingData.balance || 0, bookingData.notes || '']
    );

    const booking = queryOne('SELECT * FROM bookings WHERE bill_no = ?', [bookingData.bill_no]);

    for (const item of items) {
        runSql(
            'INSERT INTO booking_items (booking_id, saree_id, item_name, price, item_type) VALUES (?, ?, ?, ?, ?)',
            [booking.id, item.saree_id || null, item.item_name, item.price, item.item_type || 'saree']
        );
        if (item.saree_id) {
            const saree = getSareeByBarcode(item.barcode);
            if (saree && saree.status === 'තිබේ') {
                updateSareeStatus(item.saree_id, 'Booking');
            }
        }
    }

    return getBookingById(booking.id);
}

function getBookingById(id) {
    const booking = queryOne(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.id = ?
    `, [id]);
    if (booking) {
        booking.items = queryAll(`
            SELECT bi.*, s.barcode, s.image_path
            FROM booking_items bi LEFT JOIN sarees s ON bi.saree_id = s.id
            WHERE bi.booking_id = ?
        `, [id]);
    }
    return booking;
}

function getBookingByBillNo(billNo) {
    const booking = queryOne(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.bill_no = ?
    `, [billNo]);
    if (booking) {
        booking.items = queryAll(`
            SELECT bi.*, s.barcode, s.image_path
            FROM booking_items bi LEFT JOIN sarees s ON bi.saree_id = s.id
            WHERE bi.booking_id = ?
        `, [booking.id]);
    }
    return booking;
}

function getBookingsByDate(date) {
    const bookings = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.pickup_date = ?
        ORDER BY b.created_at DESC
    `, [date]);
    for (const b of bookings) {
        b.items = queryAll(`
            SELECT bi.*, s.barcode, s.image_path
            FROM booking_items bi LEFT JOIN sarees s ON bi.saree_id = s.id
            WHERE bi.booking_id = ?
        `, [b.id]);
    }
    return bookings;
}

function getAllBookings() {
    return queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        ORDER BY b.created_at DESC
    `);
}

function completeBooking(id) {
    const items = queryAll('SELECT * FROM booking_items WHERE booking_id = ?', [id]);
    for (const item of items) {
        if (item.saree_id) {
            updateSareeStatus(item.saree_id, 'රැගෙන ගොස් ඇත');
        }
    }
    db.run("UPDATE bookings SET status = 'රැගෙන ගොස් ඇත', balance = 0, advance_payment = total_amount WHERE id = ?", [id]);
    saveDatabase();
}

function returnBooking(id) {
    const items = queryAll('SELECT * FROM booking_items WHERE booking_id = ?', [id]);
    for (const item of items) {
        if (item.saree_id) {
            updateSareeStatus(item.saree_id, 'තිබේ');
        }
    }
    db.run("UPDATE bookings SET status = 'ආපසු ලැබුණා' WHERE id = ?", [id]);
    saveDatabase();
}

function updateBookingStatus(id, status) {
    if (status === 'අවලංගු කළා') {
        const items = queryAll('SELECT * FROM booking_items WHERE booking_id = ?', [id]);
        for (const item of items) {
            if (item.saree_id) {
                updateSareeStatus(item.saree_id, 'තිබේ');
            }
        }
    }
    db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    saveDatabase();
}

function getSareeBookingStatus(sareeId) {
    return queryOne(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM booking_items bi
        JOIN bookings b ON bi.booking_id = b.id
        JOIN customers c ON b.customer_id = c.id
        WHERE bi.saree_id = ? AND (b.status = 'Booking' OR b.status = 'රැගෙන ගොස් ඇත')
        ORDER BY b.created_at DESC LIMIT 1
    `, [sareeId]);
}

function checkSareeAvailability(barcode, pickupDate, returnDate) {
    const saree = getSareeByBarcode(barcode);
    if (!saree) return { exists: false };

    // Find any overlapping bookings
    // Overlap condition: existing_pickup <= requested_return AND existing_return >= requested_pickup
    // We treat missing returnDate as same as pickupDate for availability checking purposes
    const retDate = returnDate || pickupDate;

    const conflictingBooking = queryOne(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM booking_items bi
        JOIN bookings b ON bi.booking_id = b.id
        JOIN customers c ON b.customer_id = c.id
        WHERE bi.saree_id = ? 
        AND b.status IN ('Booking', 'රැගෙන ගොස් ඇත')
        AND (b.pickup_date <= ?) AND (IFNULL(b.return_date, b.pickup_date) >= ?)
        ORDER BY b.pickup_date ASC LIMIT 1
    `, [saree.id, retDate, pickupDate]);

    return {
        exists: true,
        saree,
        isAvailable: !conflictingBooking,
        conflictingBooking: conflictingBooking || null
    };
}

function searchBookings(query) {
    const like = `%${query}%`;
    return queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.bill_no LIKE ? OR c.phone LIKE ? OR c.name LIKE ?
        ORDER BY b.created_at DESC LIMIT 30
    `, [like, like, like]);
}

// =================== DASHBOARD FUNCTIONS ===================
function getDashboardStats() {
    const totalSarees = queryOne('SELECT COUNT(*) as count FROM sarees');
    const sareeStats = queryAll('SELECT status, COUNT(*) as count FROM sarees GROUP BY status');
    const bookingStats = queryAll('SELECT status, COUNT(*) as count FROM bookings GROUP BY status');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const todayBookings = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.pickup_date = ? AND b.status = 'Booking'
        ORDER BY b.created_at DESC
    `, [today]);

    const tomorrowPickups = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.pickup_date = ? AND b.status = 'Booking'
        ORDER BY b.created_at DESC
    `, [tomorrow]);

    const todayReturns = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.return_date = ? AND b.status = 'රැගෙන ගොස් ඇත'
        ORDER BY b.created_at DESC
    `, [today]);

    const upcoming = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.pickup_date >= ? AND b.status = 'Booking'
        ORDER BY b.pickup_date ASC LIMIT 20
    `, [today]);

    const overdue = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.pickup_date < ? AND b.status = 'Booking'
        ORDER BY b.pickup_date ASC
    `, [today]);

    const overdueReturns = queryAll(`
        SELECT b.*, c.name as customer_name, c.phone as customer_phone
        FROM bookings b JOIN customers c ON b.customer_id = c.id
        WHERE b.return_date < ? AND b.status = 'රැගෙන ගොස් ඇත'
        ORDER BY b.return_date ASC
    `, [today]);

    return {
        totalSarees: totalSarees ? totalSarees.count : 0,
        sareeStats,
        bookingStats,
        todayBookings,
        tomorrowPickups,
        todayReturns,
        upcoming,
        overdue,
        overdueReturns
    };
}

module.exports = {
    initDatabase,
    createCustomer, getCustomerByPhone, getAllCustomers, searchCustomers,
    createSaree, getSareeByBarcode, getAllSarees, updateSareeStatus, updateSaree, deleteSaree, generateBarcode,
    createBooking, getBookingById, getBookingByBillNo, getBookingsByDate, getAllBookings,
    completeBooking, returnBooking, updateBookingStatus, getSareeBookingStatus, searchBookings, generateBillNo,
    getDashboardStats, checkSareeAvailability
};
