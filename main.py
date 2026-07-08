import tkinter as tk
from database import init_db, get_customer, save_bill, get_last_bill_no

init_db()

# ================= BILL NO GENERATOR =================
def generate_bill_no():
    last = get_last_bill_no()

    if last is None:
        return "B000001"
    else:
        num = int(last[1:]) + 1
        return f"B{num:06d}"

# ================= SEARCH CUSTOMER =================
def search_customer():
    mobile = mobile_entry.get()
    data = get_customer(mobile)

    if data:
        name_entry.delete(0, tk.END)
        name_entry.insert(0, data[0])

        address_entry.delete(0, tk.END)
        address_entry.insert(0, data[2])

        status_label.config(text="✔️ Customer Found")
    else:
        status_label.config(text="❌ Not Found")

# ================= SAVE BOOKING =================
def save_booking():
    bill_no = generate_bill_no()
    mobile = mobile_entry.get()
    rent_date = rent_entry.get()
    return_date = return_entry.get()
    advance = advance_entry.get()

    total = float(total_entry.get() or 0)
    advance_val = float(advance or 0)
    balance = total - advance_val

    data = (
        bill_no,
        mobile,
        rent_date,
        return_date,
        advance_val,
        total,
        balance,
        "BOOKED"
    )

    save_bill(data)

    status_label.config(text=f"✔️ Booking Saved: {bill_no}")

# ================= UI =================
root = tk.Tk()
root.title("සජී සාරි POS - Phase 2")
root.geometry("900x600")

tk.Label(root, text="👗 Booking System", font=("Arial", 20)).pack(pady=10)

# Mobile Search
frame = tk.Frame(root)
frame.pack(pady=10)

tk.Label(frame, text="Mobile").grid(row=0, column=0)
mobile_entry = tk.Entry(frame)
mobile_entry.grid(row=0, column=1)

tk.Button(frame, text="Search", command=search_customer).grid(row=0, column=2)

# Auto Fill
tk.Label(frame, text="Name").grid(row=1, column=0)
name_entry = tk.Entry(frame)
name_entry.grid(row=1, column=1)

tk.Label(frame, text="Address").grid(row=2, column=0)
address_entry = tk.Entry(frame)
address_entry.grid(row=2, column=1)

# Booking details
tk.Label(frame, text="Rent Date").grid(row=3, column=0)
rent_entry = tk.Entry(frame)
rent_entry.grid(row=3, column=1)

tk.Label(frame, text="Return Date").grid(row=4, column=0)
return_entry = tk.Entry(frame)
return_entry.grid(row=4, column=1)

tk.Label(frame, text="Advance").grid(row=5, column=0)
advance_entry = tk.Entry(frame)
advance_entry.grid(row=5, column=1)

tk.Label(frame, text="Total").grid(row=6, column=0)
total_entry = tk.Entry(frame)
total_entry.grid(row=6, column=1)

# Save button
tk.Button(root, text="💾 Save Booking", command=save_booking).pack(pady=10)

status_label = tk.Label(root, text="", fg="green")
status_label.pack()

root.mainloop()
from database import create_saree_table, add_saree, get_saree
create_saree_table()
def generate_saree_code():
    return f"SR{str(len(saree_list)+1).zfill(4)}"
saree_list = []
def save_saree():
    code = generate_saree_code()
    name = saree_name_entry.get()
    price = saree_price_entry.get()

    if name == "" or price == "":
        status_label.config(text="❌ Fill Saree details")
        return

    add_saree(code, name, float(price))

    saree_list.append(code)

    status_label.config(text=f"✔️ Saree Added: {code}")

    saree_name_entry.delete(0, tk.END)
    saree_price_entry.delete(0, tk.END)
    tk.Label(root, text="👗 Saree Register", font=("Arial", 16)).pack(pady=10)

saree_frame = tk.Frame(root)
saree_frame.pack()

tk.Label(saree_frame, text="Saree Name").grid(row=0, column=0)
saree_name_entry = tk.Entry(saree_frame)
saree_name_entry.grid(row=0, column=1)

tk.Label(saree_frame, text="Price").grid(row=1, column=0)
saree_price_entry = tk.Entry(saree_frame)
saree_price_entry.grid(row=1, column=1)

tk.Button(root, text="💾 Add Saree", command=save_saree).pack(pady=5)