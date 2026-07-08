import sqlite3

conn = sqlite3.connect("saree_pos.db")
c = conn.cursor()

def init_db():

    # Customers
    c.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        mobile TEXT UNIQUE,
        address TEXT
    )
    """)

    # Bills (Bookings)
    c.execute("""
    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_no TEXT UNIQUE,
        customer_mobile TEXT,
        rent_date TEXT,
        return_date TEXT,
        advance REAL,
        total REAL,
        balance REAL,
        status TEXT
    )
    """)

    conn.commit()

def get_customer(mobile):
    c.execute("SELECT name, mobile, address FROM customers WHERE mobile=?", (mobile,))
    return c.fetchone()

def save_bill(data):
    c.execute("""
    INSERT INTO bills (bill_no, customer_mobile, rent_date, return_date, advance, total, balance, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, data)
    conn.commit()

def get_last_bill_no():
    c.execute("SELECT bill_no FROM bills ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    return row[0] if row else None

# ================= SAREE TABLE =================
def create_saree_table():
    c.execute("""
    CREATE TABLE IF NOT EXISTS sarees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT,
        price REAL,
        status TEXT
    )
    """)
    conn.commit()


def add_saree(code, name, price):
    c.execute("""
    INSERT INTO sarees (code, name, price, status)
    VALUES (?, ?, ?, ?)
    """, (code, name, price, "AVAILABLE"))
    conn.commit()


def get_saree(code):
    c.execute("SELECT code, name, price, status FROM sarees WHERE code=?", (code,))
    return c.fetchone()


def update_saree_status(code, status):
    c.execute("UPDATE sarees SET status=? WHERE code=?", (status, code))
    conn.commit()