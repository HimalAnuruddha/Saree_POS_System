// Base API URL
const API_BASE = '/api';

// Format currency
function formatCurrency(amount) {
    return `රු. ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Show notification
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    const notifText = document.getElementById('notification-text');
    const notifIcon = document.getElementById('notification-icon');

    notifText.textContent = message;
    
    if (type === 'success') {
        notifIcon.textContent = '✅';
        notif.style.borderLeftColor = 'var(--success)';
    } else if (type === 'error') {
        notifIcon.textContent = '❌';
        notif.style.borderLeftColor = 'var(--danger)';
    } else {
        notifIcon.textContent = 'ℹ️';
        notif.style.borderLeftColor = 'var(--info)';
    }

    notif.style.display = 'flex';

    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// Navigation logic
document.addEventListener('DOMContentLoaded', () => {
    // Set current date in header
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('si-LK', options);
    }

    // Initialize Flatpickr for date inputs
    flatpickr(".datepicker", {
        dateFormat: "Y-m-d", // Value sent to backend
        altInput: true,
        altFormat: "d/m/Y", // Value shown to user
    });

    // Set default date for specific inputs
    const pickupDateFp = document.getElementById('pickup-date')?._flatpickr;
    if (pickupDateFp) pickupDateFp.setDate(new Date());

    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            
            // Add active to clicked
            item.classList.add('active');
            const pageId = `page-${item.getAttribute('data-page')}`;
            document.getElementById(pageId).classList.add('active');

            // Trigger specific page load functions
            const pageName = item.getAttribute('data-page');
            if (pageName === 'dashboard') loadDashboard();
            if (pageName === 'inventory') loadSarees();
            if (pageName === 'bookings-list') {
                const fp = document.getElementById('search-date')._flatpickr;
                if (fp) fp.clear();
                loadAllBookings();
            }
        });
    });

    // Initial load
    loadDashboard();
});
