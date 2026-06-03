// === Customer View - Order Status Page ===
// Fetches LIVE data from cloud - always shows latest update!

const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob';

// Level definitions
const LEVELS = {
    1: { name: 'Order Received', icon: 'fas fa-inbox' },
    2: { name: 'Design/Planning', icon: 'fas fa-pencil-ruler' },
    3: { name: 'In Progress', icon: 'fas fa-cog' },
    4: { name: 'Review/QC', icon: 'fas fa-search' },
    5: { name: 'Completed', icon: 'fas fa-check-circle' },
    6: { name: 'Delivered', icon: 'fas fa-truck' }
};

// Get blob ID from URL
function getBlobId() {
    // Try: customer.html?id=BLOB_ID
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Fetch order data from cloud
async function fetchOrderData(blobId) {
    try {
        const response = await fetch(`${JSONBLOB_API}/${blobId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Failed to fetch order:', err);
        return null;
    }
}

// Initialize
async function init() {
    const blobId = getBlobId();

    if (!blobId) {
        showError();
        return;
    }

    const data = await fetchOrderData(blobId);

    if (!data || !data.order) {
        showError();
        return;
    }

    renderOrderStatus(data.order, data.settings || {});
}

function showError() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
}

function renderOrderStatus(order, settings) {
    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('order-status').style.display = 'block';

    // Business info
    document.getElementById('c-business-name').textContent = settings.businessName || 'Order Status';
    document.getElementById('c-business-message').textContent = settings.businessMessage || '';

    // Customer greeting
    document.getElementById('c-customer-name').textContent = order.customerName || 'Customer';

    // Order info
    document.getElementById('c-order-title').textContent = order.title || 'Your Order';
    document.getElementById('c-order-desc').textContent = order.description || '';

    if (order.notes) {
        document.getElementById('c-order-notes').style.display = 'block';
        document.getElementById('c-order-notes').innerHTML = `<strong>Message:</strong> ${escapeHtml(order.notes)}`;
    }

    // Progress
    const level = parseInt(order.level) || 1;
    const progress = Math.round((level / 6) * 100);
    document.getElementById('c-progress-bar').style.width = `${progress}%`;
    document.getElementById('c-progress-text').textContent = `${progress}% Complete - Level ${level}`;

    // Level steps
    let stepsHtml = '';
    for (let i = 1; i <= 6; i++) {
        let stepClass = 'pending';
        let iconHtml = `<span>${i}</span>`;

        if (i < level) {
            stepClass = 'completed';
            iconHtml = '<i class="fas fa-check"></i>';
        } else if (i === level) {
            stepClass = 'current';
            iconHtml = `<i class="${LEVELS[i].icon}"></i>`;
        }

        stepsHtml += `
            <div class="level-step ${stepClass}">
                <div class="step-icon">${iconHtml}</div>
                <span>${LEVELS[i].name}</span>
            </div>
        `;
    }
    document.getElementById('c-level-steps').innerHTML = stepsHtml;

    // Time remaining
    if (order.deadline) {
        const deadline = new Date(order.deadline);
        const now = new Date();
        const diff = deadline - now;

        document.getElementById('c-deadline').textContent = formatDate(order.deadline);

        if (level >= 5) {
            document.getElementById('c-days-remaining').textContent = '-';
            document.getElementById('c-hours-remaining').textContent = '-';
            const msgEl = document.getElementById('c-time-message');
            msgEl.textContent = level === 6 ? 'Your order has been delivered!' : 'Your order is completed!';
            msgEl.className = 'time-message completed';
        } else if (diff < 0) {
            const overdueDays = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
            document.getElementById('c-days-remaining').textContent = `-${overdueDays}`;
            document.getElementById('c-hours-remaining').textContent = '0';
            const msgEl = document.getElementById('c-time-message');
            msgEl.textContent = 'We apologize for the delay. Your order is being prioritized.';
            msgEl.className = 'time-message overdue';
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            document.getElementById('c-days-remaining').textContent = days;
            document.getElementById('c-hours-remaining').textContent = hours;

            const msgEl = document.getElementById('c-time-message');
            if (days <= 1) {
                msgEl.textContent = 'Almost there! Your order will be ready very soon.';
                msgEl.className = 'time-message warning';
            } else {
                msgEl.textContent = 'Your order is on track and progressing well.';
                msgEl.className = 'time-message on-time';
            }
        }
    }

    // Payment
    const paymentBadge = document.getElementById('c-payment-badge');
    const paymentLabels = {
        paid: { text: 'Fully Paid', class: 'paid' },
        advance: { text: 'Advance Payment Made', class: 'advance' },
        unpaid: { text: 'Payment Pending', class: 'unpaid' }
    };
    const pInfo = paymentLabels[order.payment] || paymentLabels.unpaid;
    paymentBadge.innerHTML = `<span class="payment-badge ${pInfo.class}">${pInfo.text}</span>`;

    document.getElementById('c-total-amount').textContent = `Rs. ${(order.totalAmount || 0).toLocaleString()}`;
    document.getElementById('c-paid-amount').textContent = `Rs. ${(order.paidAmount || 0).toLocaleString()}`;

    const balance = (order.totalAmount || 0) - (order.paidAmount || 0);
    document.getElementById('c-balance').textContent = `Rs. ${balance.toLocaleString()}`;
    document.getElementById('c-balance').style.color = balance > 0 ? '#dc2626' : '#16a34a';

    // Footer
    const contactParts = [];
    if (settings.businessPhone) contactParts.push(`Phone: ${settings.businessPhone}`);
    document.getElementById('c-contact-info').textContent = contactParts.join(' | ') || '';
    document.getElementById('c-last-updated').textContent = formatDateTime(order.updatedAt || new Date().toISOString());
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Start
document.addEventListener('DOMContentLoaded', init);
