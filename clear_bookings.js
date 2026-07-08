const fs = require('fs');
const initSqlJs = require('sql.js');

async function clear() {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync('data/saree_pos.db');
    const db = new SQL.Database(buffer);
    
    db.run("DELETE FROM booking_items");
    db.run("DELETE FROM bookings");
    db.run("UPDATE sarees SET status = 'තිබේ'");
    
    const data = db.export();
    fs.writeFileSync('data/saree_pos.db', Buffer.from(data));
    console.log("✅ All bookings cleared successfully.");
}

clear().catch(console.error);
