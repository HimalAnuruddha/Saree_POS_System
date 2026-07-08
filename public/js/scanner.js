// Scanner Page Logic

async function scanBarcode() {
    const barcode = document.getElementById('scanner-barcode-input').value.trim();
    if (!barcode) return;

    try {
        if (barcode.toUpperCase().startsWith('B')) {
            // Bill Barcode - open booking detail popup directly
            const response = await fetch(`${API_BASE}/bookings/bill/${barcode.toUpperCase()}`);
            if (!response.ok) {
                showNotification('බිල්පත හමු නොවීය', 'error');
                return;
            }
            const booking = await response.json();
            document.getElementById('scanner-barcode-input').value = '';
            viewBookingDetails(booking.id); // Open modal from reports.js
            return;
        }

        const response = await fetch(`${API_BASE}/bookings/saree-status/${barcode}`);
        
        if (!response.ok) {
            showNotification('සාරිය හමු නොවීය', 'error');
            document.getElementById('scan-result-card').style.display = 'none';
            return;
        }

        const data = await response.json();
        const saree = data.saree;
        const booking = data.booking;

        // Display Saree Info
        document.getElementById('scan-result-card').style.display = 'block';
        document.getElementById('scan-result-img').src = saree.image_path || '';
        document.getElementById('scan-result-img').style.display = saree.image_path ? 'block' : 'none';
        document.getElementById('scan-result-name').textContent = saree.name;
        document.getElementById('scan-result-barcode').textContent = saree.barcode;
        document.getElementById('scan-result-description').textContent = saree.description || 'විස්තර නැත';
        document.getElementById('scan-result-price').textContent = formatCurrency(saree.default_price);

        const badge = document.getElementById('scan-result-status-badge');
        badge.textContent = saree.status;
        badge.className = 'status-badge ' + 
            (saree.status === 'Booking' ? 'badge-booked' : 
             saree.status === 'තිබේ' ? 'status-available' : 
             saree.status === 'රැගෙන ගොස් ඇත' ? 'badge-rented' : 'badge-completed');

        // Display Booking Info if booked
        const bookingSection = document.getElementById('scan-result-booking');
        if (data.isBooked && booking) {
            bookingSection.style.display = 'block';
            document.getElementById('scan-booking-bill').textContent = booking.bill_no;
            document.getElementById('scan-booking-customer').textContent = booking.customer_name;
            document.getElementById('scan-booking-phone').textContent = booking.customer_phone;
            document.getElementById('scan-booking-date').textContent = formatDate(booking.pickup_date);
            document.getElementById('scan-booking-status').textContent = booking.status;
            
            // Show "View Booking" button
            document.getElementById('scan-view-booking-btn').style.display = 'block';
            document.getElementById('scan-view-booking-btn').onclick = function() {
                viewBookingDetails(booking.id);
            };
        } else {
            bookingSection.style.display = 'none';
            document.getElementById('scan-view-booking-btn').style.display = 'none';
        }

        document.getElementById('scanner-barcode-input').value = '';
        document.getElementById('scanner-barcode-input').focus();

    } catch (err) {
        console.error(err);
        showNotification('දත්ත ලබාගැනීමේ දෝෂයක්', 'error');
    }
}

// Support hitting Enter to scan
document.getElementById('scanner-barcode-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        scanBarcode();
    }
});

// Auto-focus the scanner input when entering the scanner page
document.getElementById('nav-scanner')?.addEventListener('click', () => {
    setTimeout(() => {
        document.getElementById('scanner-barcode-input').focus();
    }, 100);
});
