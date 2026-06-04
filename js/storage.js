// === Storage Module ===
// Local storage for auth & data
// jsonblob.com for customer-facing order links (public read)

const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob';

const CloudDB = {
    // === Account Management (Local) ===

    // Create account - save locally (email already verified via EmailJS)
    async createAccount(email, password) {
        const passHash = this.hashPassword(password);

        const authData = {
            email,
            passHash,
            createdAt: new Date().toISOString()
        };

        // Save auth locally
        localStorage.setItem('cu_auth', JSON.stringify(authData));
        
        // Initialize empty data
        localStorage.setItem('cu_orders', '[]');
        localStorage.setItem('cu_tasks', '[]');
        localStorage.setItem('cu_settings', '{}');

        // Generate a unique storage ID for this account
        const storageId = 'local_' + Date.now().toString(36);

        return { success: true, storageId };
    },

    // Login - verify against locally saved auth
    async login(email, password) {
        const authStr = localStorage.getItem('cu_auth');
        
        if (!authStr) {
            return { success: false, error: 'No account found on this device. Create one first, or import your data.' };
        }

        const auth = JSON.parse(authStr);
        
        if (auth.email !== email) {
            return { success: false, error: 'Email does not match the account on this device.' };
        }

        const passHash = this.hashPassword(password);
        if (auth.passHash !== passHash) {
            return { success: false, error: 'Wrong password. Please try again.' };
        }

        return { success: true, storageId: 'local_' + Date.now().toString(36) };
    },

    // === Customer Order Storage (Cloud - jsonblob.com) ===
    // These are PUBLIC links customers can access

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
            // If order already has a blob, update it
            if (order.customerBlobId) {
                const response = await fetch(`${JSONBLOB_API}/${order.customerBlobId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    return { success: true, blobId: order.customerBlobId };
                }
            }

            // Create new blob
            const response = await fetch(JSONBLOB_API, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const location = response.headers.get('Location') || response.headers.get('location') || '';
            let blobId = location.split('/').pop();
            
            // If no Location header, try to get from response URL
            if (!blobId) {
                const respUrl = response.url || '';
                blobId = respUrl.split('/').pop();
            }

            // If still no ID, try response body
            if (!blobId) {
                try {
                    const body = await response.json();
                    blobId = body.id || body._id || null;
                } catch(e) {}
            }

            if (!blobId) throw new Error('No blob ID returned');

            return { success: true, blobId };
        } catch (err) {
            console.error('Save order for customer error:', err);
            return { success: false, error: err.message || 'Failed. Check internet.' };
        }
    },

    // Fetch order for customer view
    async fetchOrderForCustomer(blobId) {
        try {
            const response = await fetch(`${JSONBLOB_API}/${blobId}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
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
