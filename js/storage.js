// === Cloud Storage Module ===
// Uses jsonblob.com as free cloud JSON storage
// No API key needed, works from any device

const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob';

const CloudDB = {
    // === Account Management ===

    // Create a new account with email
    async createAccount(email, password) {
        const passHash = this.hashPassword(password);

        const initialData = {
            auth: { email, passHash, createdAt: new Date().toISOString() },
            orders: [],
            tasks: [],
            settings: { businessName: '', businessPhone: '', businessMessage: '' }
        };

        try {
            const response = await fetch(JSONBLOB_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialData)
            });

            if (!response.ok) throw new Error('Failed to create storage');

            const location = response.headers.get('Location') || '';
            const storageId = location.split('/').pop();

            if (!storageId) throw new Error('No storage ID');

            // Save email → storageId mapping
            await this.saveLookup(email, storageId);

            return { success: true, storageId };
        } catch (err) {
            console.error('Create account error:', err);
            return { success: false, error: 'Failed to create account. Try again.' };
        }
    },

    // Login with email + password
    async login(email, password) {
        try {
            const storageId = await this.findStorageByEmail(email);
            if (!storageId) {
                return { success: false, error: 'No account found with this email. Create one first.' };
            }

            const data = await this.fetchData(storageId);
            if (!data || !data.auth) {
                return { success: false, error: 'Account data error. Create a new account.' };
            }

            const passHash = this.hashPassword(password);
            if (data.auth.passHash !== passHash) {
                return { success: false, error: 'Wrong password. Please try again.' };
            }

            return { success: true, storageId };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Network error. Check internet.' };
        }
    },

    // === Data Operations ===

    async fetchData(storageId) {
        const response = await fetch(`${JSONBLOB_API}/${storageId}`);
        if (!response.ok) return null;
        return await response.json();
    },

    async saveData(storageId, data) {
        const response = await fetch(`${JSONBLOB_API}/${storageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.ok;
    },

    // === Customer Order Storage ===

    // Save/update order data for customer link (creates its own blob)
    async saveOrderForCustomer(order, settings) {
        const payload = {
            order: {
                customerName: order.customerName,
                title: order.title,
                description: order.description || '',
                notes: order.notes || '',
                level: order.level,
                deadline: order.deadline,
                payment: order.payment,
                totalAmount: order.totalAmount,
                paidAmount: order.paidAmount,
                updatedAt: order.updatedAt || new Date().toISOString()
            },
            settings: {
                businessName: settings.businessName || '',
                businessPhone: settings.businessPhone || '',
                businessMessage: settings.businessMessage || ''
            }
        };

        try {
            // If order already has a blob, update it (same link stays valid!)
            if (order.customerBlobId) {
                const response = await fetch(`${JSONBLOB_API}/${order.customerBlobId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    return { success: true, blobId: order.customerBlobId };
                }
            }

            // Create new blob
            const response = await fetch(JSONBLOB_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed');

            const location = response.headers.get('Location') || '';
            const blobId = location.split('/').pop();
            return { success: true, blobId };
        } catch (err) {
            console.error('Save order for customer error:', err);
            return { success: false, error: 'Failed. Check internet.' };
        }
    },

    // Fetch order for customer view
    async fetchOrderForCustomer(blobId) {
        try {
            const response = await fetch(`${JSONBLOB_API}/${blobId}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
    },

    // === Email → StorageId Lookup ===
    // Uses a separate blob as a lookup table

    async saveLookup(email, storageId) {
        let lookupId = localStorage.getItem('cu_lookup_id');
        let lookups = {};

        if (lookupId) {
            try {
                const existing = await this.fetchData(lookupId);
                if (existing) lookups = existing;
            } catch (e) { /* create new */ }
        }

        lookups[email] = storageId;

        if (lookupId) {
            await fetch(`${JSONBLOB_API}/${lookupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lookups)
            });
        } else {
            const response = await fetch(JSONBLOB_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lookups)
            });
            const location = response.headers.get('Location') || '';
            lookupId = location.split('/').pop();
            localStorage.setItem('cu_lookup_id', lookupId);
        }
    },

    async findStorageByEmail(email) {
        // Check current session first
        const session = localStorage.getItem('cu_session');
        if (session) {
            const s = JSON.parse(session);
            if (s.email === email && s.storageId) return s.storageId;
        }

        // Check lookup blob
        const lookupId = localStorage.getItem('cu_lookup_id');
        if (lookupId) {
            try {
                const lookups = await this.fetchData(lookupId);
                if (lookups && lookups[email]) return lookups[email];
            } catch (e) { /* not found */ }
        }

        return null;
    },

    // === Utilities ===
    hashPassword(pass) {
        let hash1 = 0, hash2 = 0;
        const s1 = pass + '_cu_salt_x7k2';
        const s2 = pass + '_cu_pepper_m9q1';
        for (let i = 0; i < s1.length; i++) {
            hash1 = ((hash1 << 5) - hash1) + s1.charCodeAt(i);
            hash1 = hash1 & hash1;
        }
        for (let i = 0; i < s2.length; i++) {
            hash2 = ((hash2 << 7) - hash2) + s2.charCodeAt(i);
            hash2 = hash2 & hash2;
        }
        return hash1.toString(36) + '.' + hash2.toString(36);
    }
};
