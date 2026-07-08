async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        const data = await response.json();

        // Update top cards
        document.getElementById('stat-total-sarees').textContent = data.totalSarees;
        
        let activeBookings = 0;
        const bookedStat = data.bookingStats.find(s => s.status === 'Booking');
        if (bookedStat) activeBookings = bookedStat.count;
        document.getElementById('stat-active-bookings').textContent = activeBookings;

        document.getElementById('stat-today-pickups').textContent = data.todayBookings.length;
        document.getElementById('stat-overdue').textContent = data.overdue.length + (data.overdueReturns ? data.overdueReturns.length : 0);
        document.getElementById('stat-today-returns').textContent = data.todayReturns ? data.todayReturns.length : 0;

        // Show/hide overdue card
        const overdueCard = document.getElementById('overdue-card');
        const allOverdue = [...(data.overdue || []), ...(data.overdueReturns || [])];
        if (allOverdue.length > 0) {
            overdueCard.style.display = 'block';
            renderBookingList('overdue-bookings-list', allOverdue);
        } else {
            overdueCard.style.display = 'none';
        }

        // Render sections
        renderBookingList('today-bookings-list', data.todayBookings, 'අද රැගෙන යන Bookings නොමැත');
        renderBookingList('tomorrow-bookings-list', data.tomorrowPickups || [], 'හෙට රැගෙන යන Bookings නොමැත');
        renderBookingList('today-returns-list', data.todayReturns || [], 'අද ආපසු දෙන Bookings නොමැත');
        renderBookingList('upcoming-bookings-list', data.upcoming, 'ළඟදී එන Bookings නොමැත');

    } catch (err) {
        console.error('Error loading dashboard:', err);
        showNotification('දත්ත ලබා ගැනීමේ දෝෂයක්', 'error');
    }
}

function renderBookingList(containerId, bookings, emptyMessage = 'Bookings නොමැත') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `<div class="empty-state empty-sm">${emptyMessage}</div>`;
        return;
    }

    let html = '';
    bookings.forEach(b => {
        const balance = b.total_amount - b.advance_payment;
        const statusColor = b.status === 'Booking' ? 'var(--warning)' : 
                           b.status === 'රැගෙන ගොස් ඇත' ? '#60a5fa' : 'var(--success-light)';
        
        html += `
            <div class="dashboard-booking-card" onclick="viewBookingDetails(${b.id})">
                <div class="dbc-left">
                    <div class="dbc-name">${b.customer_name}</div>
                    <div class="dbc-sub">${b.customer_phone} | බිල්පත: ${b.bill_no}</div>
                </div>
                <div class="dbc-right">
                    <div class="dbc-balance">ගෙවිය යුතු: ${formatCurrency(balance)}</div>
                    <div class="dbc-info">
                        <span class="dbc-date">${b.pickup_date}</span>
                        <span class="status-badge ${b.status === 'Booking' ? 'badge-booked' : b.status === 'රැගෙන ගොස් ඇත' ? 'badge-rented' : 'badge-completed'}">${b.status}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterDashboard(type) {
    const today = document.getElementById('today-card');
    const tomorrow = document.getElementById('tomorrow-card');
    const upcoming = document.getElementById('upcoming-card');
    const overdue = document.getElementById('overdue-card');
    const returns = document.getElementById('returns-card');
    
    // Show all by default
    today.style.display = 'block';
    tomorrow.style.display = 'block';
    upcoming.style.display = 'block';
    returns.style.display = 'block';
    
    const overdueCount = parseInt(document.getElementById('stat-overdue').textContent);
    overdue.style.display = overdueCount > 0 ? 'block' : 'none';

    if (type === 'today') {
        tomorrow.style.display = 'none';
        upcoming.style.display = 'none';
        overdue.style.display = 'none';
        returns.style.display = 'none';
        today.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'upcoming') {
        today.style.display = 'none';
        tomorrow.style.display = 'none';
        overdue.style.display = 'none';
        returns.style.display = 'none';
        upcoming.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'overdue' && overdueCount > 0) {
        today.style.display = 'none';
        tomorrow.style.display = 'none';
        upcoming.style.display = 'none';
        returns.style.display = 'none';
        overdue.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'returns') {
        today.style.display = 'none';
        tomorrow.style.display = 'none';
        upcoming.style.display = 'none';
        overdue.style.display = 'none';
        returns.scrollIntoView({ behavior: 'smooth' });
    }
}
