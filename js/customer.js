// === Customer View - Order Status Page ===
// Data is compressed in the URL - works on ANY device, no server needed!

// LZ-String compression (minimal implementation for decompression)
var LZString=function(){var r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",o={};function e(r,n,o){var e,t,i={},a={},s="",l="",u="",c=2,p=3,f=2,h=[],d=0,g=0;for(t=0;t<r.length;t+=1)if(s=r.charAt(t),Object.prototype.hasOwnProperty.call(i,s)||(i[s]=p++,a[s]=!0),l=u+s,Object.prototype.hasOwnProperty.call(i,l))u=l;else{if(Object.prototype.hasOwnProperty.call(a,u)){if(u.charCodeAt(0)<256){for(e=0;e<f;e++)d<<=1,15==g?(g=0,h.push(n(d)),d=0):g++;for(e=u.charCodeAt(0),d=d<<8|e,g+=8;g>=6;)h.push(n(63&(d>>(g-=6))))}else{for(e=1,d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));for(e=u.charCodeAt(0),d=d<<16|e,g+=16;g>=6;)h.push(n(63&(d>>(g-=6))))}0==--c&&(c=Math.pow(2,f),f++),delete a[u]}else for(e=i[u],d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));0==--c&&(c=Math.pow(2,f),f++),i[l]=p++,u=String(s)}if(""!==u){if(Object.prototype.hasOwnProperty.call(a,u)){if(u.charCodeAt(0)<256){for(e=0;e<f;e++)d<<=1,15==g?(g=0,h.push(n(d)),d=0):g++;for(e=u.charCodeAt(0),d=d<<8|e,g+=8;g>=6;)h.push(n(63&(d>>(g-=6))))}else{for(e=1,d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));for(e=u.charCodeAt(0),d=d<<16|e,g+=16;g>=6;)h.push(n(63&(d>>(g-=6))))}0==--c&&(c=Math.pow(2,f),f++),delete a[u]}else for(e=i[u],d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))))}for(e=2,d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));for(;;){if(d<<=1,6==++g){h.push(n(63&d));break}}return h.join("")}function t(r,n){var o,e,t,i=[],a=4,s=4,l=3,u="",c=[],p={val:n(0),position:6,index:1};for(o=0;o<3;o+=1)i[o]=o;for(t=0,e=Math.pow(2,2),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;switch(t){case 0:for(t=0,e=Math.pow(2,8),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;c.push(String.fromCharCode(t));break;case 1:for(t=0,e=Math.pow(2,16),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;c.push(String.fromCharCode(t));break;case 2:return""}for(i[3]=u=c[c.length-1];;){if(p.index>r)return"";for(t=0,e=Math.pow(2,l),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;switch(t){case 0:for(t=0,e=Math.pow(2,8),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;i[s++]=String.fromCharCode(t),t=s-1,a--;break;case 1:for(t=0,e=Math.pow(2,16),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;i[s++]=String.fromCharCode(t),t=s-1,a--;break;case 2:return c.join("")}if(0==a&&(a=Math.pow(2,l),l++),i[t])u=i[t];else{if(t!==s)return null;u=c[c.length-1]+c[c.length-1].charAt(0)}c.push(u),i[s++]=c[c.length-2]+u.charAt(0),u=c[c.length-1],0==--a&&(a=Math.pow(2,l),l++)}}return{compressToEncodedURIComponent:function(r){return null==r?"":e(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){if(null==r)return"";if(""==r)return null;r=r.replace(/ /g,"+");var e,i={},a=(e=n,function(r){if(!i[e]){i[e]={};for(var n=0;n<e.length;n++)i[e][e.charAt(n)]=n}return i[e][r]});return t(r.length,function(n){return a(r.charAt(n))})}}}();

// Level definitions
const LEVELS = {
    1: { name: 'Order Received', icon: 'fas fa-inbox' },
    2: { name: 'Design/Planning', icon: 'fas fa-pencil-ruler' },
    3: { name: 'In Progress', icon: 'fas fa-cog' },
    4: { name: 'Review/QC', icon: 'fas fa-search' },
    5: { name: 'Completed', icon: 'fas fa-check-circle' },
    6: { name: 'Delivered', icon: 'fas fa-truck' }
};

// Get order data from URL
function getOrderFromURL() {
    // Method 1: Compressed data in ?d= parameter (short!)
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('d');
    if (compressed) {
        try {
            const json = LZString.decompressFromEncodedURIComponent(compressed);
            if (json) return JSON.parse(json);
        } catch (e) { console.error('Decompress error:', e); }
    }

    // Method 2: Hash fragment (fallback)
    const hash = window.location.hash.substring(1);
    if (hash) {
        try {
            return JSON.parse(decodeURIComponent(hash));
        } catch (e) { console.error('Hash decode error:', e); }
    }

    return null;
}

// Initialize
function init() {
    const data = getOrderFromURL();

    if (!data || !data.o) {
        showError();
        return;
    }

    // Expand short keys back to full
    const order = {
        customerName: data.o.n || '',
        title: data.o.t || '',
        description: data.o.ds || '',
        notes: data.o.nt || '',
        level: data.o.l || 1,
        deadline: data.o.dl || '',
        payment: data.o.p || 'unpaid',
        totalAmount: data.o.ta || 0,
        paidAmount: data.o.pa || 0,
        updatedAt: data.o.u || ''
    };

    const settings = {
        businessName: data.s?.bn || '',
        businessPhone: data.s?.bp || '',
        businessMessage: data.s?.bm || ''
    };

    renderOrderStatus(order, settings);
}

function showError() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
}

function renderOrderStatus(order, settings) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('order-status').style.display = 'block';

    document.getElementById('c-business-name').textContent = settings.businessName || 'Order Status';
    document.getElementById('c-business-message').textContent = settings.businessMessage || '';
    document.getElementById('c-customer-name').textContent = order.customerName || 'Customer';
    document.getElementById('c-order-title').textContent = order.title || 'Your Order';
    document.getElementById('c-order-desc').textContent = order.description || '';

    if (order.notes) {
        document.getElementById('c-order-notes').style.display = 'block';
        document.getElementById('c-order-notes').innerHTML = `<strong>Message:</strong> ${escapeHtml(order.notes)}`;
    }

    const level = parseInt(order.level) || 1;
    const progress = Math.round((level / 6) * 100);
    document.getElementById('c-progress-bar').style.width = `${progress}%`;
    document.getElementById('c-progress-text').textContent = `${progress}% Complete - Level ${level}`;

    let stepsHtml = '';
    for (let i = 1; i <= 6; i++) {
        let stepClass = i < level ? 'completed' : (i === level ? 'current' : 'pending');
        let iconHtml = i < level ? '<i class="fas fa-check"></i>' : (i === level ? `<i class="${LEVELS[i].icon}"></i>` : `<span>${i}</span>`);
        stepsHtml += `<div class="level-step ${stepClass}"><div class="step-icon">${iconHtml}</div><span>${LEVELS[i].name}</span></div>`;
    }
    document.getElementById('c-level-steps').innerHTML = stepsHtml;

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
            document.getElementById('c-days-remaining').textContent = `-${Math.abs(Math.floor(diff / 86400000))}`;
            document.getElementById('c-hours-remaining').textContent = '0';
            document.getElementById('c-time-message').textContent = 'We apologize for the delay.';
            document.getElementById('c-time-message').className = 'time-message overdue';
        } else {
            document.getElementById('c-days-remaining').textContent = Math.floor(diff / 86400000);
            document.getElementById('c-hours-remaining').textContent = Math.floor((diff % 86400000) / 3600000);
            const msgEl = document.getElementById('c-time-message');
            msgEl.textContent = Math.floor(diff / 86400000) <= 1 ? 'Almost there!' : 'On track.';
            msgEl.className = 'time-message ' + (Math.floor(diff / 86400000) <= 1 ? 'warning' : 'on-time');
        }
    }

    const pInfo = { paid: { text: 'Fully Paid', class: 'paid' }, advance: { text: 'Advance Paid', class: 'advance' }, unpaid: { text: 'Payment Pending', class: 'unpaid' } }[order.payment] || { text: 'Pending', class: 'unpaid' };
    document.getElementById('c-payment-badge').innerHTML = `<span class="payment-badge ${pInfo.class}">${pInfo.text}</span>`;
    document.getElementById('c-total-amount').textContent = `Rs. ${(order.totalAmount || 0).toLocaleString()}`;
    document.getElementById('c-paid-amount').textContent = `Rs. ${(order.paidAmount || 0).toLocaleString()}`;
    const balance = (order.totalAmount || 0) - (order.paidAmount || 0);
    document.getElementById('c-balance').textContent = `Rs. ${balance.toLocaleString()}`;
    document.getElementById('c-balance').style.color = balance > 0 ? '#dc2626' : '#16a34a';

    const contactParts = [];
    if (settings.businessPhone) contactParts.push(`Phone: ${settings.businessPhone}`);
    document.getElementById('c-contact-info').textContent = contactParts.join(' | ') || '';
    document.getElementById('c-last-updated').textContent = formatDateTime(order.updatedAt || new Date().toISOString());
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '-'; }
function formatDateTime(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-'; }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

document.addEventListener('DOMContentLoaded', init);
