// === Storage Module ===
// LZString loaded from js/lzstring.js via script tag in index.html

const CloudDB = {
    // === Account Management (Local with email verification) ===

    async createAccount(email, password) {
        const passHash = this.hashPassword(password);
        const authData = { email, passHash, createdAt: new Date().toISOString() };
        localStorage.setItem('cu_auth', JSON.stringify(authData));
        localStorage.setItem('cu_orders', '[]');
        localStorage.setItem('cu_tasks', '[]');
        localStorage.setItem('cu_settings', '{}');
        return { success: true, storageId: 'local' };
    },

    async login(email, password) {
        const authStr = localStorage.getItem('cu_auth');
        if (!authStr) return { success: false, error: 'No account on this device. Create one first.' };
        
        const auth = JSON.parse(authStr);
        if (auth.email !== email) return { success: false, error: 'Email does not match.' };
        if (auth.passHash !== this.hashPassword(password)) return { success: false, error: 'Wrong password.' };
        
        return { success: true, storageId: 'local' };
    },

    // === Customer Link Generation (Compressed URL - NO server needed!) ===

    generateCustomerLink(order, settings) {
        // Use short keys to minimize data size
        const data = {
            o: {
                n: order.customerName,
                t: order.title,
                ds: order.description || '',
                nt: order.notes || '',
                l: order.level,
                dl: order.deadline,
                p: order.payment,
                ta: order.totalAmount,
                pa: order.paidAmount,
                u: order.updatedAt || new Date().toISOString()
            },
            s: {
                bn: settings.businessName || '',
                bp: settings.businessPhone || '',
                bm: settings.businessMessage || ''
            }
        };

        // Remove empty values to make it shorter
        if (!data.o.ds) delete data.o.ds;
        if (!data.o.nt) delete data.o.nt;
        if (!data.s.bn) delete data.s.bn;
        if (!data.s.bp) delete data.s.bp;
        if (!data.s.bm) delete data.s.bm;

        const json = JSON.stringify(data);
        const compressed = LZString.compressToEncodedURIComponent(json);
        
        const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
        return `${baseUrl}customer.html?d=${compressed}`;
    },

    // === Utilities ===
    hashPassword(pass) {
        let hash1 = 0, hash2 = 0;
        const s1 = pass + '_cu_salt_x7k2';
        const s2 = pass + '_cu_pepper_m9q1';
        for (let i = 0; i < s1.length; i++) { hash1 = ((hash1 << 5) - hash1) + s1.charCodeAt(i); hash1 = hash1 & hash1; }
        for (let i = 0; i < s2.length; i++) { hash2 = ((hash2 << 7) - hash2) + s2.charCodeAt(i); hash2 = hash2 & hash2; }
        return hash1.toString(36) + '.' + hash2.toString(36);
    }
};
