// Reports and Bookings List

async function searchBookingsByDate() {
    const date = document.getElementById('search-date').value;
    if (!date) return;
    
    try {
        const response = await fetch(`${API_BASE}/bookings/date/${date}`);
        const bookings = await response.json();
        renderBookingsTable(bookings);
    } catch (err) {
        showNotification('දෝෂයක් මතු විය', 'error');
    }
}

async function searchBookingsGeneral() {
    const query = document.getElementById('search-query').value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`${API_BASE}/bookings/search?q=${encodeURIComponent(query)}`);
        const bookings = await response.json();
        renderBookingsTable(bookings);
    } catch (err) {
        showNotification('දෝෂයක් මතු විය', 'error');
    }
}

document.getElementById('search-query')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBookingsGeneral();
    }
});

async function loadAllBookings() {
    try {
        document.getElementById('search-date').value = '';
        document.getElementById('search-query').value = '';
        const response = await fetch(`${API_BASE}/bookings`);
        const bookings = await response.json();
        renderBookingsTable(bookings);
    } catch (err) {
        showNotification('දෝෂයක් මතු විය', 'error');
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Booking': return 'badge-booked';
        case 'රැගෙන ගොස් ඇත': return 'badge-rented';
        case 'ආපසු ලැබුණා': return 'badge-completed';
        case 'අවලංගු කළා': return 'badge-cancelled';
        default: return 'badge-booked';
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'Booking': return 'var(--warning)';
        case 'රැගෙන ගොස් ඇත': return '#60a5fa';
        case 'ආපසු ලැබුණා': return 'var(--success-light)';
        case 'අවලංගු කළා': return 'var(--danger-light)';
        default: return 'var(--primary-light)';
    }
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-cell" style="text-align: center; padding: 30px;">වෙන්කිරීම් හමු නොවීය</td></tr>';
        return;
    }

    let html = '';
    bookings.forEach(b => {
        const badgeClass = getStatusBadgeClass(b.status);

        html += `
            <tr style="cursor: pointer;" onclick="viewBookingDetails(${b.id})">
                <td style="font-weight: 600;">${b.bill_no}</td>
                <td>${b.customer_name}</td>
                <td>${b.customer_phone}</td>
                <td>${formatDate(b.pickup_date)}</td>
                <td>${formatCurrency(b.total_amount)}</td>
                <td>${formatCurrency(b.advance_payment)}</td>
                <td style="color: var(--warning); font-weight: 600;">${formatCurrency(b.balance)}</td>
                <td><span class="status-badge ${badgeClass}">${b.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewBookingDetails(${b.id})">බලන්න</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Booking Details Modal
async function viewBookingDetails(id, showActions = true) {
    try {
        const response = await fetch(`${API_BASE}/bookings/${id}`);
        const booking = await response.json();
        
        const content = document.getElementById('booking-detail-content');
        const footer = document.getElementById('booking-detail-footer');
        
        // Items HTML - clickable items with photo preview
        let itemsHtml = `
            <table class="data-table" style="margin-top: 15px;">
                <thead>
                    <tr>
                        <th>අයිතමය</th>
                        <th style="text-align: right;">මිල</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        booking.items.forEach(item => {
            const hasImage = item.image_path;
            const clickAttr = hasImage ? 
                `onclick="showItemDetail('${item.item_name.replace(/'/g, "\\'")}', '${item.image_path || ''}', '${item.barcode || ''}')" style="cursor: pointer; color: var(--primary-light); text-decoration: underline;"` : 
                '';
            
            itemsHtml += `
                <tr>
                    <td>
                        <div class="item-row-clickable">
                            ${hasImage ? `<img src="${item.image_path}" class="item-thumb" alt="">` : ''}
                            <div>
                                <div ${clickAttr}>${item.item_name}</div>
                                ${item.barcode ? `<div style="font-size: 11px; color: var(--text-muted);">${item.barcode}</div>` : '<div style="font-size: 11px; color: var(--text-muted);">අතින් එකතු කළ</div>'}
                            </div>
                        </div>
                    </td>
                    <td style="text-align: right;">${formatCurrency(item.price)}</td>
                </tr>
            `;
        });
        
        itemsHtml += '</tbody></table>';

        const statusColor = getStatusColor(booking.status);

        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 15px;">
                <div>
                    <h2 style="color: var(--primary-light); margin-bottom: 5px;">${booking.bill_no}</h2>
                    <div>දිනය: ${formatDate(booking.created_at)}</div>
                    <div>තත්ත්වය: <strong style="color: ${statusColor}">${booking.status}</strong></div>
                </div>
                <div style="text-align: right;">
                    <strong>${booking.customer_name}</strong><br>
                    ${booking.customer_phone}<br>
                    ${booking.customer_address || ''}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-sm);">
                    <div style="color: var(--text-muted); font-size: 12px;">රැගෙන යන දිනය</div>
                    <div style="font-weight: 600;">${formatDate(booking.pickup_date)}</div>
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-sm);">
                    <div style="color: var(--text-muted); font-size: 12px;">ආපසු දෙන දිනය</div>
                    <div style="font-weight: 600;">${formatDate(booking.return_date) || '-'}</div>
                </div>
            </div>

            ${itemsHtml}

            <div style="margin-top: 20px; text-align: right; font-size: 16px;">
                <div style="margin-bottom: 5px;">මුළු මුදල: <strong>${formatCurrency(booking.total_amount)}</strong></div>
                <div style="margin-bottom: 5px;">අත්තිකාරම්: <strong>${formatCurrency(booking.advance_payment)}</strong></div>
                <div style="color: var(--warning); font-size: 20px; font-weight: bold; border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 10px;">
                    ඉතිරි මුදල: ${formatCurrency(booking.balance)}
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <svg id="bill-barcode-display"></svg>
            </div>
        `;

        // Build footer with workflow actions based on status
        let footerHtml = `<button class="btn btn-ghost" onclick="closeBookingDetail()">වසන්න</button>`;
        
        if (showActions) {
            if (booking.status === 'Booking') {
                footerHtml += `
                    <button class="btn btn-primary" onclick="markBookingComplete(${booking.id})">💰 හිඟ මුදල ගෙවා අවසන්</button>
                    <button class="btn btn-danger" onclick="markBookingCancelled(${booking.id})">❌ අවලංගු කරන්න</button>
                `;
            } else if (booking.status === 'රැගෙන ගොස් ඇත') {
                footerHtml += `
                    <button class="btn btn-success" onclick="markBookingReturned(${booking.id})" style="background: var(--success); color: white; border: none;">📦 ගනුදෙනුව සම්පූර්ණයි</button>
                `;
            }
        }
        
        footer.innerHTML = footerHtml;
        
        document.getElementById('booking-detail-modal').style.display = 'flex';
        
        // Render barcode - FIXED: using a fixed ID instead of dynamic template
        try {
            JsBarcode("#bill-barcode-display", booking.bill_no, {
                format: "CODE128",
                width: 1.5,
                height: 50,
                displayValue: true,
                background: "transparent",
                lineColor: "#fff"
            });
        } catch(e) {
            console.warn('Barcode render failed:', e);
        }
        
    } catch (err) {
        console.error('Error loading booking details:', err);
        showNotification('දෝෂයක් මතු විය', 'error');
    }
}

// Show item detail popup (photo + info)
function showItemDetail(name, imagePath, barcode) {
    const modal = document.getElementById('item-detail-modal');
    document.getElementById('item-detail-name').textContent = name;
    document.getElementById('item-detail-barcode').textContent = barcode || '';
    const img = document.getElementById('item-detail-img');
    if (imagePath) {
        img.src = imagePath;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
    modal.style.display = 'flex';
}

function closeItemDetail(e) {
    if (e && e.target.id !== 'item-detail-modal') return;
    document.getElementById('item-detail-modal').style.display = 'none';
}

function closeBookingDetail(e) {
    if (e && e.target.id !== 'booking-detail-modal' && e.target.className === 'modal-overlay') return;
    document.getElementById('booking-detail-modal').style.display = 'none';
}

async function markBookingComplete(id) {
    if (confirm('ඉතිරි මුදල ගෙවා අවසන් බව තහවුරු කරනවාද?\n(සාරි පාරිභෝගිකයාට භාරදෙනු ලැබේ)')) {
        try {
            const response = await fetch(`${API_BASE}/bookings/${id}/complete`, { method: 'PUT' });
            if (response.ok) {
                showNotification('✅ ගෙවීම සම්පූර්ණයි! බඩු රැගෙන ගොස් ඇත.');
                closeBookingDetail();
                loadDashboard();
                // Refresh bookings list if visible
                if (document.getElementById('page-bookings-list').classList.contains('active')) {
                    loadAllBookings();
                }
            }
        } catch (err) {
            showNotification('දෝෂයක් මතු විය', 'error');
        }
    }
}

async function markBookingReturned(id) {
    if (confirm('බඩු ආපසු භාරගත් බව තහවුරු කරනවාද?\n(සාරි නැවත ලබාගත හැකි තත්ත්වයට පත් වේ)')) {
        try {
            const response = await fetch(`${API_BASE}/bookings/${id}/return`, { method: 'PUT' });
            if (response.ok) {
                showNotification('✅ බඩු ආපසු භාරගන්නා ලදී! සාරි නැවත ලබා ගත හැක.');
                closeBookingDetail();
                loadDashboard();
                if (document.getElementById('page-bookings-list').classList.contains('active')) {
                    loadAllBookings();
                }
            }
        } catch (err) {
            showNotification('දෝෂයක් මතු විය', 'error');
        }
    }
}

async function markBookingCancelled(id) {
    if (confirm('මෙම Booking එක අවලංගු කරනවාද?\n(සාරි නැවත ලබාගත හැකි තත්ත්වයට පත් වේ)')) {
        try {
            const response = await fetch(`${API_BASE}/bookings/${id}/status`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'අවලංගු කළා' })
            });
            if (response.ok) {
                showNotification('Booking එක අවලංගු කරන ලදී');
                closeBookingDetail();
                loadDashboard();
                if (document.getElementById('page-bookings-list').classList.contains('active')) {
                    loadAllBookings();
                }
            }
        } catch (err) {
            showNotification('දෝෂයක් මතු විය', 'error');
        }
    }
}
