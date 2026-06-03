// === Customer Update System - Admin App ===

// Data Management
const DB = {
    getOrders: () => JSON.parse(localStorage.getItem('cu_orders') || '[]'),
    saveOrders: (orders) => localStorage.setItem('cu_orders', JSON.stringify(orders)),
    getTasks: () => JSON.parse(localStorage.getItem('cu_tasks') || '[]'),
    saveTasks: (tasks) => localStorage.setItem('cu_tasks', JSON.stringify(tasks)),
    getSettings: () => JSON.parse(localStorage.getItem('cu_settings') || '{}'),
    saveSettings: (settings) => localStorage.setItem('cu_settings', JSON.stringify(settings))
};

// Level definitions
const LEVELS = {
    1: { name: 'Order Received', icon: 'fas fa-inbox' },
    2: { name: 'Design/Planning', icon: 'fas fa-pencil-ruler' },
    3: { name: 'In Progress', icon: 'fas fa-cog' },
    4: { name: 'Review/QC', icon: 'fas fa-search' },
    5: { name: 'Completed', icon: 'fas fa-check-circle' },
    6: { name: 'Delivered', icon: 'fas fa-truck' }
};

// === Navigation ===
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`page-${pageName}`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Refresh page data
    if (pageName === 'dashboard') refreshDashboard();
    if (pageName === 'orders') refreshOrders();
    if (pageName === 'tasks') refreshTasks();
    if (pageName === 'settings') loadSettings();
}

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
});

// Mobile sidebar toggle
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (e.target.closest('.main-content') && e.clientX < 50 && e.clientY < 60) {
            sidebar.classList.toggle('open');
        } else if (!e.target.closest('.sidebar')) {
            sidebar.classList.remove('open');
        }
    }
});

// === Dashboard ===
function refreshDashboard() {
    const orders = DB.getOrders();
    const tasks = DB.getTasks();
    const today = new Date().toISOString().split('T')[0];

    // Stats
    const total = orders.length;
    const inProgress = orders.filter(o => o.level > 1 && o.level < 5).length;
    const completed = orders.filter(o => o.level >= 5).length;
    const overdue = orders.filter(o => {
        const deadline = new Date(o.deadline);
        return deadline < new Date() && o.level < 5;
    }).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-progress').textContent = inProgress;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-overdue').textContent = overdue;

    // Recent orders
    const recentOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentHtml = recentOrders.length ? recentOrders.map(o => `
        <div class="task-item" onclick="viewOrder('${o.id}')">
            <div class="task-info">
                <div class="task-title">${o.title}</div>
                <div class="task-meta">${o.customerName} - Level ${o.level}</div>
            </div>
            <span class="badge badge-${o.payment}">${o.payment}</span>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-box"></i><p>No orders yet</p></div>';
    document.getElementById('recent-orders').innerHTML = recentHtml;

    // Today's tasks
    const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
    const tasksHtml = todayTasks.length ? todayTasks.map(t => `
        <div class="task-item">
            <input type="checkbox" class="task-checkbox" onchange="toggleTask('${t.id}')">
            <div class="task-info">
                <div class="task-title">${t.title}</div>
                <div class="task-meta">${t.relatedOrder ? 'Order: ' + getOrderTitle(t.relatedOrder) : 'Personal task'}</div>
            </div>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No tasks for today</p></div>';
    document.getElementById('today-tasks').innerHTML = tasksHtml;
}

function getOrderTitle(orderId) {
    const order = DB.getOrders().find(o => o.id === orderId);
    return order ? order.title : 'Unknown';
}

// === Orders ===
function refreshOrders() {
    const orders = DB.getOrders();
    const search = document.getElementById('search-orders').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const paymentFilter = document.getElementById('filter-payment').value;

    let filtered = orders;

    if (search) {
        filtered = filtered.filter(o =>
            o.title.toLowerCase().includes(search) ||
            o.customerName.toLowerCase().includes(search)
        );
    }

    if (statusFilter !== 'all') {
        if (statusFilter === 'pending') filtered = filtered.filter(o => o.level === 1);
        else if (statusFilter === 'in-progress') filtered = filtered.filter(o => o.level > 1 && o.level < 5);
        else if (statusFilter === 'completed') filtered = filtered.filter(o => o.level >= 5);
        else if (statusFilter === 'delivered') filtered = filtered.filter(o => o.level === 6);
    }

    if (paymentFilter !== 'all') {
        filtered = filtered.filter(o => o.payment === paymentFilter);
    }

    const html = filtered.length ? filtered.map(o => {
        const timeLeft = getTimeLeft(o.deadline, o.level);
        return `
            <div class="order-card priority-${o.priority}" onclick="viewOrder('${o.id}')">
                <div class="order-header">
                    <div>
                        <h4>${o.title}</h4>
                        <span class="customer-name"><i class="fas fa-user"></i> ${o.customerName}</span>
                    </div>
                </div>
                <div class="order-meta">
                    <span class="badge badge-level">Level ${o.level} - ${LEVELS[o.level].name}</span>
                    <span class="badge badge-${o.payment}">${getPaymentLabel(o.payment)}</span>
                    ${timeLeft.overdue ? '<span class="badge badge-overdue">Overdue</span>' : ''}
                </div>
                <div class="time-left">${timeLeft.text}</div>
            </div>
        `;
    }).join('') : '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders found</p></div>';

    document.getElementById('orders-list').innerHTML = html;
}

function getPaymentLabel(payment) {
    const labels = { paid: 'Fully Paid', advance: 'Advance', unpaid: 'Unpaid' };
    return labels[payment] || payment;
}

function getTimeLeft(deadline, level) {
    if (level >= 5) return { text: 'Completed', overdue: false };
    
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl - now;

    if (diff < 0) {
        const days = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
        return { text: `Overdue by ${days} day(s)`, overdue: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return { text: `${days} days, ${hours} hours remaining`, overdue: false };
    return { text: `${hours} hours remaining`, overdue: false };
}

// Filter listeners
document.getElementById('search-orders').addEventListener('input', refreshOrders);
document.getElementById('filter-status').addEventListener('change', refreshOrders);
document.getElementById('filter-payment').addEventListener('change', refreshOrders);

// === Order Form ===
document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const orderId = document.getElementById('order-id').value;
    const order = {
        id: orderId || generateId(),
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        title: document.getElementById('order-title').value,
        description: document.getElementById('order-description').value,
        startDate: document.getElementById('order-start').value,
        deadline: document.getElementById('order-deadline').value,
        totalAmount: parseFloat(document.getElementById('order-amount').value) || 0,
        paidAmount: parseFloat(document.getElementById('order-paid').value) || 0,
        payment: document.getElementById('order-payment').value,
        level: parseInt(document.getElementById('order-level').value),
        priority: document.getElementById('order-priority').value,
        notes: document.getElementById('order-notes').value,
        createdAt: orderId ? (DB.getOrders().find(o => o.id === orderId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const orders = DB.getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);

    if (existingIndex >= 0) {
        orders[existingIndex] = order;
        showToast('Order updated successfully!');
    } else {
        orders.push(order);
        showToast('Order created successfully!');
    }

    DB.saveOrders(orders);
    resetForm();
    showPage('orders');

    // Auto-generate and show customer link after save
    setTimeout(() => showCustomerLinkPopup(order.id), 300);
});

function resetForm() {
    document.getElementById('order-form').reset();
    document.getElementById('order-id').value = '';
    document.getElementById('form-title').textContent = 'Create New Order';
    document.getElementById('order-start').value = new Date().toISOString().split('T')[0];
}

function editOrder(orderId) {
    const order = DB.getOrders().find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('order-id').value = order.id;
    document.getElementById('customer-name').value = order.customerName;
    document.getElementById('customer-phone').value = order.customerPhone || '';
    document.getElementById('customer-email').value = order.customerEmail || '';
    document.getElementById('order-title').value = order.title;
    document.getElementById('order-description').value = order.description || '';
    document.getElementById('order-start').value = order.startDate;
    document.getElementById('order-deadline').value = order.deadline;
    document.getElementById('order-amount').value = order.totalAmount || '';
    document.getElementById('order-paid').value = order.paidAmount || '';
    document.getElementById('order-payment').value = order.payment;
    document.getElementById('order-level').value = order.level;
    document.getElementById('order-priority').value = order.priority || 'medium';
    document.getElementById('order-notes').value = order.notes || '';
    document.getElementById('form-title').textContent = 'Edit Order';

    closeModal();
    showPage('add-order');
}

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    const orders = DB.getOrders().filter(o => o.id !== orderId);
    DB.saveOrders(orders);
    closeModal();
    showToast('Order deleted');
    refreshOrders();
    refreshDashboard();
}

// === Order Modal ===
function viewOrder(orderId) {
    const order = DB.getOrders().find(o => o.id === orderId);
    if (!order) return;

    const timeLeft = getTimeLeft(order.deadline, order.level);
    const progress = Math.round((order.level / 6) * 100);

    document.getElementById('modal-title').textContent = order.title;
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-detail-row">
            <span class="label">Customer</span>
            <span class="value">${order.customerName}</span>
        </div>
        ${order.customerPhone ? `<div class="modal-detail-row"><span class="label">Phone</span><span class="value">${order.customerPhone}</span></div>` : ''}
        <div class="modal-detail-row">
            <span class="label">Status Level</span>
            <span class="value">Level ${order.level} - ${LEVELS[order.level].name}</span>
        </div>
        <div class="modal-progress">
            <div class="modal-progress-bar">
                <div class="modal-progress-fill" style="width: ${progress}%"></div>
            </div>
        </div>
        <div class="modal-detail-row">
            <span class="label">Deadline</span>
            <span class="value">${formatDate(order.deadline)}</span>
        </div>
        <div class="modal-detail-row">
            <span class="label">Time Left</span>
            <span class="value" style="color: ${timeLeft.overdue ? 'var(--danger)' : 'var(--success)'}">${timeLeft.text}</span>
        </div>
        <div class="modal-detail-row">
            <span class="label">Payment</span>
            <span class="value"><span class="badge badge-${order.payment}">${getPaymentLabel(order.payment)}</span></span>
        </div>
        <div class="modal-detail-row">
            <span class="label">Total / Paid</span>
            <span class="value">Rs. ${order.totalAmount.toLocaleString()} / Rs. ${order.paidAmount.toLocaleString()}</span>
        </div>
        <div class="modal-detail-row">
            <span class="label">Priority</span>
            <span class="value" style="text-transform: capitalize">${order.priority}</span>
        </div>
        ${order.notes ? `<div class="modal-detail-row"><span class="label">Notes</span><span class="value">${order.notes}</span></div>` : ''}
    `;

    // Button actions
    document.getElementById('modal-share-btn').onclick = () => copyCustomerLink(order.id);
    document.getElementById('modal-edit-btn').onclick = () => editOrder(order.id);
    document.getElementById('modal-delete-btn').onclick = () => deleteOrder(order.id);

    document.getElementById('order-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('order-modal').classList.remove('active');
}

// Close modal on backdrop click
document.getElementById('order-modal').addEventListener('click', (e) => {
    if (e.target.id === 'order-modal') closeModal();
});

// === Customer Link ===
// Encode order data into URL so it works on ANY device/browser
function copyCustomerLink(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return showToast('Order not found');

    const settings = DB.getSettings();

    // Create data payload with only customer-visible info
    const payload = {
        order: {
            customerName: order.customerName,
            title: order.title,
            description: order.description,
            notes: order.notes,
            level: order.level,
            deadline: order.deadline,
            payment: order.payment,
            totalAmount: order.totalAmount,
            paidAmount: order.paidAmount,
            updatedAt: order.updatedAt || order.createdAt
        },
        settings: {
            businessName: settings.businessName || '',
            businessPhone: settings.businessPhone || '',
            businessMessage: settings.businessMessage || ''
        }
    };

    // Encode to base64
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    const baseUrl = window.location.href.replace(/\/[^\/]*$/, '/');
    const link = `${baseUrl}customer.html?data=${encoded}`;

    navigator.clipboard.writeText(link).then(() => {
        showToast('Customer link copied! Works on any device! ✓');
    }).catch(() => {
        // Fallback for older browsers
        showShareModal(link);
    });
}

function showShareModal(link) {
    const textarea = document.createElement('textarea');
    textarea.value = link;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Customer link copied! Works on any device! ✓');
}

// Show popup with customer link after order save/update
function showCustomerLinkPopup(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const settings = DB.getSettings();
    const payload = {
        order: {
            customerName: order.customerName,
            title: order.title,
            description: order.description,
            notes: order.notes,
            level: order.level,
            deadline: order.deadline,
            payment: order.payment,
            totalAmount: order.totalAmount,
            paidAmount: order.paidAmount,
            updatedAt: order.updatedAt || order.createdAt
        },
        settings: {
            businessName: settings.businessName || '',
            businessPhone: settings.businessPhone || '',
            businessMessage: settings.businessMessage || ''
        }
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    const baseUrl = window.location.href.replace(/\/[^\/]*$/, '/');
    const link = `${baseUrl}customer.html?data=${encoded}`;

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'link-popup-overlay';
    popup.innerHTML = `
        <div class="link-popup">
            <div class="link-popup-header">
                <h3><i class="fas fa-share-alt"></i> Customer Link Ready!</h3>
                <button class="modal-close" onclick="this.closest('.link-popup-overlay').remove()">&times;</button>
            </div>
            <p>Share this link with <strong>${order.customerName}</strong> to show order status:</p>
            <div class="link-box">
                <input type="text" value="${link}" id="popup-link-input" readonly>
            </div>
            <div class="link-popup-actions">
                <button class="btn btn-primary" onclick="copyPopupLink()">
                    <i class="fas fa-copy"></i> Copy Link
                </button>
                <button class="btn btn-secondary" onclick="shareViaWhatsApp('${encodeURIComponent(link)}', '${order.customerName}')">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.link-popup-overlay').remove()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
            <p class="link-popup-note">This link works on any device - customer can open it on their phone!</p>
        </div>
    `;
    document.body.appendChild(popup);
}

function copyPopupLink() {
    const input = document.getElementById('popup-link-input');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        showToast('Link copied! Share it with the customer ✓');
    }).catch(() => {
        document.execCommand('copy');
        showToast('Link copied! Share it with the customer ✓');
    });
}

function shareViaWhatsApp(encodedLink, customerName) {
    const message = `Hi ${customerName}, here's your order status update: ${decodeURIComponent(encodedLink)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// === Tasks ===
function refreshTasks() {
    const tasks = DB.getTasks();
    const today = new Date().toISOString().split('T')[0];

    // Populate order select
    const orders = DB.getOrders();
    const orderSelect = document.getElementById('task-order');
    orderSelect.innerHTML = '<option value="">-- None --</option>' +
        orders.map(o => `<option value="${o.id}">${o.title} (${o.customerName})</option>`).join('');

    // Today's tasks
    const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
    document.getElementById('tasks-today').innerHTML = todayTasks.length ?
        todayTasks.map(renderTask).join('') :
        '<div class="empty-state"><p>No tasks for today</p></div>';

    // Upcoming
    const upcoming = tasks.filter(t => t.dueDate > today && !t.completed)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    document.getElementById('tasks-upcoming').innerHTML = upcoming.length ?
        upcoming.map(renderTask).join('') :
        '<div class="empty-state"><p>No upcoming tasks</p></div>';

    // Completed
    const completed = tasks.filter(t => t.completed).slice(0, 10);
    document.getElementById('tasks-completed').innerHTML = completed.length ?
        completed.map(renderTask).join('') :
        '<div class="empty-state"><p>No completed tasks</p></div>';
}

function renderTask(task) {
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    ${task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    ${task.relatedOrder ? ' | ' + getOrderTitle(task.relatedOrder) : ''}
                    | <span style="text-transform:capitalize">${task.priority}</span>
                </div>
            </div>
            <button class="task-delete" onclick="deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `;
}

function showAddTask() {
    document.getElementById('task-form-container').style.display = 'block';
}

function hideAddTask() {
    document.getElementById('task-form-container').style.display = 'none';
    document.getElementById('task-title').value = '';
    document.getElementById('task-due').value = '';
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    if (!title) return showToast('Task title is required');

    const task = {
        id: generateId(),
        title: title,
        relatedOrder: document.getElementById('task-order').value || null,
        dueDate: document.getElementById('task-due').value || new Date().toISOString().split('T')[0],
        priority: document.getElementById('task-priority').value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    const tasks = DB.getTasks();
    tasks.push(task);
    DB.saveTasks(tasks);

    hideAddTask();
    refreshTasks();
    showToast('Task added!');
}

function toggleTask(taskId) {
    const tasks = DB.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        DB.saveTasks(tasks);
        refreshTasks();
    }
}

function deleteTask(taskId) {
    const tasks = DB.getTasks().filter(t => t.id !== taskId);
    DB.saveTasks(tasks);
    refreshTasks();
    showToast('Task deleted');
}

// === Settings ===
function loadSettings() {
    const settings = DB.getSettings();
    document.getElementById('business-name').value = settings.businessName || '';
    document.getElementById('business-phone').value = settings.businessPhone || '';
    document.getElementById('business-message').value = settings.businessMessage || '';
}

function saveSettings() {
    const settings = {
        businessName: document.getElementById('business-name').value,
        businessPhone: document.getElementById('business-phone').value,
        businessMessage: document.getElementById('business-message').value
    };
    DB.saveSettings(settings);
    showToast('Settings saved!');
}

// === Data Export/Import ===
function exportData() {
    const data = {
        orders: DB.getOrders(),
        tasks: DB.getTasks(),
        settings: DB.getSettings(),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-update-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.orders) DB.saveOrders(data.orders);
            if (data.tasks) DB.saveTasks(data.tasks);
            if (data.settings) DB.saveSettings(data.settings);
            showToast('Data imported successfully!');
            refreshDashboard();
        } catch (err) {
            showToast('Error importing data. Invalid file.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// === Utilities ===
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', () => {
    // Set default date
    document.getElementById('order-start').value = new Date().toISOString().split('T')[0];
    refreshDashboard();
});

// === Logout ===
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('cu_session');
        sessionStorage.removeItem('cu_session');
        window.location.href = 'login.html';
    }
}
