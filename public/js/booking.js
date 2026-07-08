let currentCustomerId = null;
let currentScannedSaree = null;
let billItems = [];

// Customer Search
async function searchCustomer() {
    const phone = document.getElementById('customer-phone').value.trim();
    if (!phone) return;

    try {
        const response = await fetch(`${API_BASE}/customers/search/${phone}`);
        const statusEl = document.getElementById('customer-search-status');
        
        if (response.ok) {
            const customer = await response.json();
            currentCustomerId = customer.id;
            document.getElementById('customer-name').value = customer.name;
            document.getElementById('customer-address').value = customer.address || '';
            
            statusEl.innerHTML = '<span style="color: var(--success)">✔️ පාරිභෝගිකයා හමු විය</span>';
        } else {
            currentCustomerId = null;
            statusEl.innerHTML = '<span style="color: var(--warning)">ℹ️ නව පාරිභෝගිකයෙකි</span>';
        }
    } catch (err) {
        console.error(err);
    }
}

// Auto-search on enter
document.getElementById('customer-phone')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchCustomer();
    }
});

// Barcode Scan for Booking
async function scanBarcodeForBooking() {
    const barcode = document.getElementById('booking-barcode-input').value.trim();
    if (!barcode) return;

    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;

    if (!pickupDate) {
        showNotification('කරුණාකර පළමුව රැගෙන යන දිනය තෝරන්න', 'warning');
        document.getElementById('booking-barcode-input').value = '';
        return;
    }

    try {
        // Check availability for specific dates
        let url = `${API_BASE}/bookings/availability/${barcode}?pickup=${pickupDate}`;
        if (returnDate) {
            url += `&return=${returnDate}`;
        }
        
        const resBooking = await fetch(url);
        if (!resBooking.ok) {
            showNotification('සාරිය හමු නොවීය', 'error');
            document.getElementById('booking-barcode-input').value = '';
            return;
        }

        const data = await resBooking.json();
        const saree = data.saree;

        if (!data.isAvailable) {
            showNotification('මෙම දිනයන් සඳහා සාරිය වෙන් කර ඇත!', 'error');
            document.getElementById('booking-barcode-input').value = '';
            // Show overlapping booking details without action buttons
            if (data.conflictingBooking && typeof viewBookingDetails === 'function') {
                viewBookingDetails(data.conflictingBooking.id, false);
            }
            return;
        }

        // Show saree preview
        currentScannedSaree = saree;
        document.getElementById('scanned-item-preview').style.display = 'block';
        document.getElementById('scanned-name').textContent = saree.name;
        document.getElementById('scanned-barcode-display').textContent = saree.barcode;
        document.getElementById('scanned-img').src = saree.image_path || '';
        document.getElementById('scanned-price').value = saree.default_price || '';
        document.getElementById('scanned-price').focus();
        
        document.getElementById('booking-barcode-input').value = '';

    } catch (err) {
        console.error(err);
    }
}

document.getElementById('booking-barcode-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        scanBarcodeForBooking();
    }
});

// Add scanned item to bill
function addScannedItemToBooking() {
    if (!currentScannedSaree) return;

    const price = parseFloat(document.getElementById('scanned-price').value);
    if (isNaN(price)) {
        showNotification('නිවැරදි මිලක් ඇතුලත් කරන්න', 'error');
        return;
    }

    // Check if already in bill
    if (billItems.some(i => i.saree_id === currentScannedSaree.id)) {
        showNotification('මෙම සාරිය දැනටමත් බිල්පතේ ඇත', 'warning');
        return;
    }

    billItems.push({
        saree_id: currentScannedSaree.id,
        item_name: currentScannedSaree.name,
        price: price,
        item_type: 'saree',
        barcode: currentScannedSaree.barcode
    });

    renderBillItems();
    
    // Reset scanner
    currentScannedSaree = null;
    document.getElementById('scanned-item-preview').style.display = 'none';
    document.getElementById('scanned-price').value = '';
    document.getElementById('booking-barcode-input').focus();
}

// Add manual item
function addManualItem() {
    const name = document.getElementById('manual-item-name').value.trim();
    const price = parseFloat(document.getElementById('manual-item-price').value);

    if (!name || isNaN(price)) {
        showNotification('නම සහ මිල ඇතුලත් කරන්න', 'error');
        return;
    }

    billItems.push({
        saree_id: null,
        item_name: name,
        price: price,
        item_type: 'manual'
    });

    renderBillItems();

    document.getElementById('manual-item-name').value = '';
    document.getElementById('manual-item-price').value = '';
}

// Render Bill
function renderBillItems() {
    const container = document.getElementById('bill-items');
    
    if (billItems.length === 0) {
        container.innerHTML = '<div class="empty-state empty-sm"><p>බඩු එකතු කර නැත</p></div>';
        updateTotals();
        return;
    }

    let html = '';
    billItems.forEach((item, index) => {
        html += `
            <div class="bill-item">
                <div class="bill-item-info">
                    <div class="bill-item-name">${item.item_name}</div>
                    ${item.barcode ? `<div class="bill-item-code">${item.barcode}</div>` : '<div class="bill-item-code">අතින් එකතු කළ</div>'}
                </div>
                <div class="bill-item-price">${formatCurrency(item.price)}</div>
                <button class="btn btn-ghost btn-sm" onclick="removeBillItem(${index})" style="color: var(--danger)">✕</button>
            </div>
        `;
    });

    container.innerHTML = html;
    updateTotals();
}

function removeBillItem(index) {
    billItems.splice(index, 1);
    renderBillItems();
}

function updateTotals() {
    const total = billItems.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('bill-total').textContent = formatCurrency(total);
    updateBalance();
}

function updateBalance() {
    const total = billItems.reduce((sum, item) => sum + item.price, 0);
    const advance = parseFloat(document.getElementById('advance-payment').value) || 0;
    const balance = total - advance;
    document.getElementById('bill-balance').textContent = formatCurrency(balance);
}

// Save Booking
async function saveBooking() {
    // Validations
    const phone = document.getElementById('customer-phone').value.trim();
    const name = document.getElementById('customer-name').value.trim();
    const pickupDate = document.getElementById('pickup-date').value;

    if (!phone || !name || !pickupDate) {
        showNotification('පාරිභෝගික තොරතුරු සහ දිනය ඇතුලත් කරන්න', 'error');
        return;
    }

    if (billItems.length === 0) {
        showNotification('බිල්පතට එක බඩුවක් හෝ එකතු කරන්න', 'error');
        return;
    }

    // Step 1: Save/Update Customer
    let customerId = currentCustomerId;
    try {
        const custRes = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                phone,
                address: document.getElementById('customer-address').value
            })
        });
        const custData = await custRes.json();
        customerId = custData.id;
    } catch (err) {
        showNotification('පාරිභෝගිකයා සුරැකීමේ දෝෂයක්', 'error');
        return;
    }

    // Step 2: Save Booking
    const totalAmount = billItems.reduce((sum, item) => sum + item.price, 0);
    const advancePayment = parseFloat(document.getElementById('advance-payment').value) || 0;

    const bookingData = {
        customer_id: customerId,
        pickup_date: pickupDate,
        return_date: document.getElementById('return-date').value || null,
        advance_payment: advancePayment,
        total_amount: totalAmount,
        notes: document.getElementById('booking-notes').value,
        items: billItems
    };

    try {
        const bookRes = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (bookRes.ok) {
            const result = await bookRes.json();
            showNotification(`Booking සාර්ථකයි! බිල්පත් අංකය: ${result.bill_no}`);
            clearBookingForm();
            loadDashboard(); // Refresh dashboard stats
            
            // Removed automatic popup
        } else {
            const err = await bookRes.json();
            showNotification(err.error || 'Booking දෝෂයක්', 'error');
        }
    } catch (err) {
        showNotification('සේවාදායකය හා සම්බන්ධ වීමේ දෝෂයක්', 'error');
    }
}

function clearBookingForm() {
    currentCustomerId = null;
    currentScannedSaree = null;
    billItems = [];
    
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-search-status').innerHTML = '';
    
    document.getElementById('pickup-date').value = '';
    document.getElementById('return-date').value = '';
    
    document.getElementById('scanned-item-preview').style.display = 'none';
    document.getElementById('booking-barcode-input').value = '';
    
    document.getElementById('advance-payment').value = '';
    document.getElementById('booking-notes').value = '';
    
    renderBillItems();
}
