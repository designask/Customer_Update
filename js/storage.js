// === Cloud Storage Module ===
// Uses jsonblob.com as free cloud JSON storage
// No API key needed, works from any device

const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob';

const CloudDB = {
    // === Account Management ===

    // Create a new account - stores credentials + empty data on cloud
    async createAccount(username, pin) {
        const pinHash = this.hashPin(pin);

        // Create the cloud storage with initial data
        const initialData = {
            auth: { username, pinHash, createdAt: new Date().toISOString() },
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

            // Get the blob ID from Location header or URL
            const location = response.headers.get('Location') || '';
            const storageId = location.split('/').pop() || this.extractIdFromResponse(response);

            if (!storageId) throw new Error('No storage ID returned');

            // Also save a lookup entry so user can find their storage by username
            await this.saveLookup(username, storageId);

            return { success: true, storageId };
        } catch (err) {
            console.error('Create account error:', err);
            return { success: false, error: 'Failed to create account. Try again.' };
        }
    },

    // Login - find storage by username, verify PIN
    async login(username, pin) {
        try {
            const storageId = await this.findStorageByUsername(username);
            if (!storageId) {
                return { success: false, error: 'Account not found. Please create one first.' };
            }

            // Fetch data and verify PIN
            const data = await this.fetchData(storageId);
            if (!data || !data.auth) {
                return { success: false, error: 'Account data corrupted. Create a new account.' };
            }

            const pinHash = this.hashPin(pin);
            if (data.auth.pinHash !== pinHash) {
                return { success: false, error: 'Invalid PIN. Please try again.' };
            }

            return { success: true, storageId };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Network error. Check your internet.' };
        }
    },

    // === Data Operations ===

    // Fetch all data from cloud
    async fetchData(storageId) {
        const response = await fetch(`${JSONBLOB_API}/${storageId}`);
        if (!response.ok) return null;
        return await response.json();
    },

    // Save all data to cloud
    async saveData(storageId, data) {
        const response = await fetch(`${JSONBLOB_API}/${storageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.ok;
    },

    // === Order-specific storage for customer links ===

    // Save a single order to its own blob (for customer link)
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
            // Check if order already has a blob ID
            if (order.customerBlobId) {
                // Update existing blob
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

            if (!response.ok) throw new Error('Failed to save order');

            const location = response.headers.get('Location') || '';
            const blobId = location.split('/').pop();

            return { success: true, blobId };
        } catch (err) {
            console.error('Save order for customer error:', err);
            return { success: false, error: 'Failed to save. Check internet.' };
        }
    },

    // Fetch order data for customer view
    async fetchOrderForCustomer(blobId) {
        try {
            const response = await fetch(`${JSONBLOB_API}/${blobId}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            console.error('Fetch order error:', err);
            return null;
        }
    },

    // === Username Lookup ===
    // We use a known blob to store username -> storageId mappings

    async saveLookup(username, storageId) {
        // Get or create the lookup blob
        let lookupId = localStorage.getItem('cu_lookup_id');
        let lookups = {};

        if (lookupId) {
            try {
                const existing = await this.fetchData(lookupId);
                if (existing) lookups = existing;
            } catch (e) { /* ignore */ }
        }

        lookups[username] = storageId;

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

    async findStorageByUsername(username) {
        // First check local session
        const session = localStorage.getItem('cu_session');
        if (session) {
            const s = JSON.parse(session);
            if (s.username === username && s.storageId) return s.storageId;
        }

        // Check local lookup
        const lookupId = localStorage.getItem('cu_lookup_id');
        if (lookupId) {
            try {
                const lookups = await this.fetchData(lookupId);
                if (lookups && lookups[username]) return lookups[username];
            } catch (e) { /* ignore */ }
        }

        return null;
    },

    // === Utilities ===
    hashPin(pin) {
        let hash = 0;
        const str = pin + '_cu_salt_2024';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        // Make it longer/more unique
        let hash2 = 0;
        const str2 = pin + '_cu_pepper';
        for (let i = 0; i < str2.length; i++) {
            const char = str2.charCodeAt(i);
            hash2 = ((hash2 << 7) - hash2) + char;
            hash2 = hash2 & hash2;
        }
        return hash.toString(36) + '-' + hash2.toString(36);
    },

    extractIdFromResponse(response) {
        const url = response.url || '';
        const parts = url.split('/');
        return parts[parts.length - 1] || null;
    }
};
