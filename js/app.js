// === Customer Update System - Admin App ===
// Uses cloud storage (jsonblob.com) for data
// Works from any device with same account!

// === Session ===
function getSession() {
    const s = localStorage.getItem('cu_session');
    return s ? JSON.parse(s) : null;
}

// === Local Cache (for fast UI) + Cloud Sync ===
const DB = {
    getOrders: () => JSON.parse(localStorage.getItem('cu_orders') || '[]'),
    saveOrders: (orders) => localStorage.setItem('cu_orders', JSON.stringify(orders)),
    getTasks: () => JSON.parse(localStorage.getItem('cu_tasks') || '[]'),
    saveTasks: (tasks) => localStorage.setItem('cu_tasks', JSON.stringify(tasks)),
    getSettings: () => JSON.parse(localStorage.getItem('cu_settings') || '{}'),
    saveSettings: (settings) => localStorage.setItem('cu_settings', JSON.stringify(settings))
};

// Sync to cloud
async function syncToCloud() {
    const session = getSession();
    if (!session || !session.storageId) return;

    const data = {
        auth: { username: session.username, pinHash: '_preserved_', createdAt: session.loggedInAt },
        orders: DB.getOrders(),
        tasks: DB.getTasks(),
        settings: DB.getSettings()
    };

    // Preserve auth pinHash from cloud
    try {
        const cloudData = await CloudDB.fetchData(session.storageId);
        if (cloudData && cloudData.auth) {
            data.auth = cloudData.auth;
        }
    } catch (e) { /* use local */ }

    await CloudDB.saveData(session.storageId, data);
}

// Sync from cloud (on load)
async function syncFromCloud() {
    const session = getSession();
    if (!session || !session.storageId) return;

    try {
        const data = await CloudDB.fetchData(session.storageId);
        if (!data) return;

        if (data.orders) DB.saveOrders(data.orders);
        if (data.tasks) DB.saveTasks(data.tasks);
        if (data.settings) DB.saveSettings(data.settings);

        // Refresh current page
        refreshDashboard();
    } catch (err) {
        console.log('Cloud sync failed, using local data');
    }
}

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
    const navEl = document.querySelector(`[data-page="${pageName}"]`);
    if (navEl) navEl.classList.add('active');

    if (pageName === 'dashboard') refreshDashboard();
    if (pageName === 'orders') refreshOrders();
    if (pageName === 'tasks') refreshTasks();
    if (pageName === 'settings') loadSettings();
}

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.page) showPage(item.dataset.page);
    });
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

    const total = orders.length;
    const inProgress = orders.filter(o => o.level > 1 && o.level < 5).length;
    const completed = orders.filter(o => o.level >= 5).length;
    const overdue = orders.filter(o => new Date(o.deadline) < new Date() && o.level < 5).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-progress').textContent = inProgress;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-overdue').textContent = overdue;

    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    document.getElementById('recent-orders').innerHTML = recentOrders.length ? recentOrders.map(o => `
        <div class="task-item" onclick="viewOrder('${o.id}')">
            <div class="task-info">
                <div class="task-title">${o.title}</div>
                <div class="task-meta">${o.customerName} - Level ${o.level}</div>
            </div>
            <span class="badge badge-${o.payment}">${o.payment}</span>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-box"></i><p>No orders yet</p></div>';

    const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
    document.getElementById('today-tasks').innerHTML = todayTasks.length ? todayTasks.map(t => `
        <div class="task-item">
            <input type="checkbox" class="task-checkbox" onchange="toggleTask('${t.id}')">
            <div class="task-info">
                <div class="task-title">${t.title}</div>
                <div class="task-meta">${t.relatedOrder ? 'Order: ' + getOrderTitle(t.relatedOrder) : 'Personal task'}</div>
            </div>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No tasks for today</p></div>';
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
    if (search) filtered = filtered.filter(o => o.title.toLowerCase().includes(search) || o.customerName.toLowerCase().includes(search));
    if (statusFilter !== 'all') {
        if (statusFilter === 'pending') filtered = filtered.filter(o => o.level === 1);
        else if (statusFilter === 'in-progress') filtered = filtered.filter(o => o.level > 1 && o.level < 5);
        else if (statusFilter === 'completed') filtered = filtered.filter(o => o.level >= 5);
        else if (statusFilter === 'delivered') filtered = filtered.filter(o => o.level === 6);
    }
    if (paymentFilter !== 'all') filtered = filtered.filter(o => o.payment === paymentFilter);

    document.getElementById('orders-list').innerHTML = filtered.length ? filtered.map(o => {
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
}

function getPaymentLabel(p) {
    return { paid: 'Fully Paid', advance: 'Advance', unpaid: 'Unpaid' }[p] || p;
}

function getTimeLeft(deadline, level) {
    if (level >= 5) return { text: 'Completed', overdue: false };
    const diff = new Date(deadline) - new Date();
    if (diff < 0) return { text: `Overdue by ${Math.abs(Math.floor(diff / 86400000))} day(s)`, overdue: true };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return { text: days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`, overdue: false };
}

document.getElementById('search-orders').addEventListener('input', refreshOrders);
document.getElementById('filter-status').addEventListener('change', refreshOrders);
document.getElementById('filter-payment').addEventListener('change', refreshOrders);

// === Order Form ===
document.getElementById('order-form').addEventListener('submit', async (e) => {
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
        customerBlobId: null,
        createdAt: orderId ? (DB.getOrders().find(o => o.id === orderId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Preserve customerBlobId if editing
    const orders = DB.getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    if (existingIndex >= 0) {
        order.customerBlobId = orders[existingIndex].customerBlobId || null;
        orders[existingIndex] = order;
    } else {
        orders.push(order);
    }

    DB.saveOrders(orders);
    showToast('Order saved! Syncing...');
    resetForm();
    showPage('orders');

    // Sync to cloud in background
    await syncToCloud();

    // Save/update customer blob and show link
    const settings = DB.getSettings();
    const result = await CloudDB.saveOrderForCustomer(order, settings);
    if (result.success) {
        // Update order with blob ID
        order.customerBlobId = result.blobId;
        const updatedOrders = DB.getOrders();
        const idx = updatedOrders.findIndex(o => o.id === order.id);
        if (idx >= 0) {
            updatedOrders[idx].customerBlobId = result.blobId;
            DB.saveOrders(updatedOrders);
            await syncToCloud();
        }
        showCustomerLinkPopup(order, result.blobId);
    }
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

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    const orders = DB.getOrders().filter(o => o.id !== orderId);
    DB.saveOrders(orders);
    closeModal();
    showToast('Order deleted');
    refreshOrders();
    refreshDashboard();
    await syncToCloud();
}

// === Order Modal ===
function viewOrder(orderId) {
    const order = DB.getOrders().find(o => o.id === orderId);
    if (!order) return;

    const timeLeft = getTimeLeft(order.deadline, order.level);
    const progress = Math.round((order.level / 6) * 100);

    document.getElementById('modal-title').textContent = order.title;
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-detail-row"><span class="label">Customer</span><span class="value">${order.customerName}</span></div>
        ${order.customerPhone ? `<div class="modal-detail-row"><span class="label">Phone</span><span class="value">${order.customerPhone}</span></div>` : ''}
        <div class="modal-detail-row"><span class="label">Status</span><span class="value">Level ${order.level} - ${LEVELS[order.level].name}</span></div>
        <div class="modal-progress"><div class="modal-progress-bar"><div class="modal-progress-fill" style="width:${progress}%"></div></div></div>
        <div class="modal-detail-row"><span class="label">Deadline</span><span class="value">${formatDate(order.deadline)}</span></div>
        <div class="modal-detail-row"><span class="label">Time Left</span><span class="value" style="color:${timeLeft.overdue ? 'var(--danger)' : 'var(--success)'}">${timeLeft.text}</span></div>
        <div class="modal-detail-row"><span class="label">Payment</span><span class="value"><span class="badge badge-${order.payment}">${getPaymentLabel(order.payment)}</span></span></div>
        <div class="modal-detail-row"><span class="label">Total / Paid</span><span class="value">Rs. ${order.totalAmount.toLocaleString()} / Rs. ${order.paidAmount.toLocaleString()}</span></div>
        ${order.customerBlobId ? `<div class="modal-detail-row"><span class="label">Customer Link</span><span class="value" style="color:var(--success)"><i class="fas fa-check-circle"></i> Active & Live</span></div>` : ''}
        ${order.notes ? `<div class="modal-detail-row"><span class="label">Notes</span><span class="value">${order.notes}</span></div>` : ''}
    `;

    document.getElementById('modal-share-btn').onclick = () => handleShareLink(order);
    document.getElementById('modal-edit-btn').onclick = () => editOrder(order.id);
    document.getElementById('modal-delete-btn').onclick = () => deleteOrder(order.id);
    document.getElementById('order-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('order-modal').classList.remove('active');
}

document.getElementById('order-modal').addEventListener('click', (e) => {
    if (e.target.id === 'order-modal') closeModal();
});

// === Customer Link ===
async function handleShareLink(order) {
    showToast('Generating link...');

    const settings = DB.getSettings();
    const result = await CloudDB.saveOrderForCustomer(order, settings);

    if (result.success) {
        // Save blob ID
        const orders = DB.getOrders();
        const idx = orders.findIndex(o => o.id === order.id);
        if (idx >= 0) {
            orders[idx].customerBlobId = result.blobId;
            DB.saveOrders(orders);
            syncToCloud();
        }
        order.customerBlobId = result.blobId;
        showCustomerLinkPopup(order, result.blobId);
    } else {
        showToast('Failed to generate link. Check internet.');
    }
}

function showCustomerLinkPopup(order, blobId) {
    const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
    const link = `${baseUrl}customer.html?id=${blobId}`;

    // Remove existing popup
    const existing = document.querySelector('.link-popup-overlay');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'link-popup-overlay';
    popup.dataset.link = link;
    popup.dataset.customerName = order.customerName;
    popup.innerHTML = `
        <div class="link-popup">
            <div class="link-popup-header">
                <h3><i class="fas fa-share-alt"></i> Customer Link Ready!</h3>
                <button class="modal-close" onclick="this.closest('.link-popup-overlay').remove()">&times;</button>
            </div>
            <p>Share this link with <strong>${order.customerName}</strong>:</p>
            <div class="link-box">
                <input type="text" id="popup-link-input" value="${link}" readonly onclick="this.select()">
            </div>
            <div class="link-features">
                <div><i class="fas fa-check" style="color:#16a34a"></i> Short & clean link</div>
                <div><i class="fas fa-check" style="color:#16a34a"></i> Works on any phone/device</div>
                <div><i class="fas fa-check" style="color:#16a34a"></i> Auto-updates when you edit order</div>
            </div>
            <div class="link-popup-actions">
                <button class="btn btn-primary" onclick="copyPopupLink()">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="btn btn-whatsapp" onclick="shareViaWhatsApp()">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.link-popup-overlay').remove()">
                    Close
                </button>
            </div>
            <p class="link-popup-note">Same link always shows latest update!</p>
        </div>
    `;
    document.body.appendChild(popup);
}

function copyPopupLink() {
    const popup = document.querySelector('.link-popup-overlay');
    const link = popup ? popup.dataset.link : '';
    navigator.clipboard.writeText(link).then(() => {
        showToast('Link copied! ✓');
    }).catch(() => {
        const input = document.getElementById('popup-link-input');
        input.select();
        document.execCommand('copy');
        showToast('Link copied! ✓');
    });
}

function shareViaWhatsApp() {
    const popup = document.querySelector('.link-popup-overlay');
    if (!popup) return;
    const link = popup.dataset.link;
    const name = popup.dataset.customerName;
    const msg = `Hi ${name}, check your order status here:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// === Tasks ===
function refreshTasks() {
    const tasks = DB.getTasks();
    const today = new Date().toISOString().split('T')[0];

    const orders = DB.getOrders();
    const orderSelect = document.getElementById('task-order');
    orderSelect.innerHTML = '<option value="">-- None --</option>' +
        orders.map(o => `<option value="${o.id}">${o.title} (${o.customerName})</option>`).join('');

    const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
    document.getElementById('tasks-today').innerHTML = todayTasks.length ?
        todayTasks.map(renderTask).join('') : '<div class="empty-state"><p>No tasks for today</p></div>';

    const upcoming = tasks.filter(t => t.dueDate > today && !t.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    document.getElementById('tasks-upcoming').innerHTML = upcoming.length ?
        upcoming.map(renderTask).join('') : '<div class="empty-state"><p>No upcoming tasks</p></div>';

    const completed = tasks.filter(t => t.completed).slice(0, 10);
    document.getElementById('tasks-completed').innerHTML = completed.length ?
        completed.map(renderTask).join('') : '<div class="empty-state"><p>No completed tasks</p></div>';
}

function renderTask(task) {
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">${task.dueDate ? formatDate(task.dueDate) : ''} ${task.relatedOrder ? '| ' + getOrderTitle(task.relatedOrder) : ''}</div>
            </div>
            <button class="task-delete" onclick="deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `;
}

function showAddTask() { document.getElementById('task-form-container').style.display = 'block'; }
function hideAddTask() {
    document.getElementById('task-form-container').style.display = 'none';
    document.getElementById('task-title').value = '';
}

async function saveTask() {
    const title = document.getElementById('task-title').value;
    if (!title) return showToast('Task title required');

    const task = {
        id: generateId(),
        title,
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
    await syncToCloud();
}

async function toggleTask(taskId) {
    const tasks = DB.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        DB.saveTasks(tasks);
        refreshTasks();
        syncToCloud();
    }
}

async function deleteTask(taskId) {
    DB.saveTasks(DB.getTasks().filter(t => t.id !== taskId));
    refreshTasks();
    showToast('Task deleted');
    await syncToCloud();
}

// === Settings ===
function loadSettings() {
    const settings = DB.getSettings();
    document.getElementById('business-name').value = settings.businessName || '';
    document.getElementById('business-phone').value = settings.businessPhone || '';
    document.getElementById('business-message').value = settings.businessMessage || '';
}

async function saveSettings() {
    const settings = {
        businessName: document.getElementById('business-name').value,
        businessPhone: document.getElementById('business-phone').value,
        businessMessage: document.getElementById('business-message').value
    };
    DB.saveSettings(settings);
    showToast('Settings saved!');
    await syncToCloud();
}

// === Data Export/Import ===
function exportData() {
    const data = { orders: DB.getOrders(), tasks: DB.getTasks(), settings: DB.getSettings(), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Data exported!');
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.orders) DB.saveOrders(data.orders);
            if (data.tasks) DB.saveTasks(data.tasks);
            if (data.settings) DB.saveSettings(data.settings);
            showToast('Data imported!');
            refreshDashboard();
            await syncToCloud();
        } catch (err) { showToast('Invalid file'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// === Utilities ===
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

// === Logout ===
function logout() {
    if (confirm('Logout?')) {
        localStorage.removeItem('cu_session');
        sessionStorage.removeItem('cu_session');
        window.location.href = 'login.html';
    }
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('order-start').value = new Date().toISOString().split('T')[0];
    refreshDashboard();

    // Sync from cloud on load
    await syncFromCloud();
});
