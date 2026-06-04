// === Storage Module ===

// LZ-String compression for short URLs
var LZString=function(){var r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",o={};function e(r,n,o){var e,t,i={},a={},s="",l="",u="",c=2,p=3,f=2,h=[],d=0,g=0;for(t=0;t<r.length;t+=1)if(s=r.charAt(t),Object.prototype.hasOwnProperty.call(i,s)||(i[s]=p++,a[s]=!0),l=u+s,Object.prototype.hasOwnProperty.call(i,l))u=l;else{if(Object.prototype.hasOwnProperty.call(a,u)){if(u.charCodeAt(0)<256){for(e=0;e<f;e++)d<<=1,15==g?(g=0,h.push(n(d)),d=0):g++;for(e=u.charCodeAt(0),d=d<<8|e,g+=8;g>=6;)h.push(n(63&(d>>(g-=6))))}else{for(e=1,d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));for(e=u.charCodeAt(0),d=d<<16|e,g+=16;g>=6;)h.push(n(63&(d>>(g-=6))))}0==--c&&(c=Math.pow(2,f),f++),delete a[u]}else for(e=i[u],d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));0==--c&&(c=Math.pow(2,f),f++),i[l]=p++,u=String(s)}if(""!==u){if(Object.prototype.hasOwnProperty.call(a,u)){if(u.charCodeAt(0)<256){for(e=0;e<f;e++)d<<=1,15==g?(g=0,h.push(n(d)),d=0):g++;for(e=u.charCodeAt(0),d=d<<8|e,g+=8;g>=6;)h.push(n(63&(d>>(g-=6))))}else{for(e=1,d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));for(e=u.charCodeAt(0),d=d<<16|e,g+=16;g>=6;)h.push(n(63&(d>>(g-=6))))}0==--c&&(c=Math.pow(2,f),f++),delete a[u]}else for(e=i[u],d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))))}for(e=2,d=d<<f|e,g+=f;g>=6;)h.push(n(63&(d>>(g-=6))));for(;;){if(d<<=1,6==++g){h.push(n(63&d));break}}return h.join("")}function t(r,n){var o,e,t,i=[],a=4,s=4,l=3,u="",c=[],p={val:n(0),position:6,index:1};for(o=0;o<3;o+=1)i[o]=o;for(t=0,e=Math.pow(2,2),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;switch(t){case 0:for(t=0,e=Math.pow(2,8),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;c.push(String.fromCharCode(t));break;case 1:for(t=0,e=Math.pow(2,16),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;c.push(String.fromCharCode(t));break;case 2:return""}for(i[3]=u=c[c.length-1];;){if(p.index>r)return"";for(t=0,e=Math.pow(2,l),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;switch(t){case 0:for(t=0,e=Math.pow(2,8),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;i[s++]=String.fromCharCode(t),t=s-1,a--;break;case 1:for(t=0,e=Math.pow(2,16),o=1;o!=e;)a=p.val&p.position,p.position>>=1,0==p.position&&(p.position=32,p.val=n(p.index++)),t|=(a>0?1:0)*o,o<<=1;i[s++]=String.fromCharCode(t),t=s-1,a--;break;case 2:return c.join("")}if(0==a&&(a=Math.pow(2,l),l++),i[t])u=i[t];else{if(t!==s)return null;u=c[c.length-1]+c[c.length-1].charAt(0)}c.push(u),i[s++]=c[c.length-2]+u.charAt(0),u=c[c.length-1],0==--a&&(a=Math.pow(2,l),l++)}}return{compressToEncodedURIComponent:function(r){return null==r?"":e(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){if(null==r)return"";if(""==r)return null;r=r.replace(/ /g,"+");var e,i={},a=(e=n,function(r){if(!i[e]){i[e]={};for(var n=0;n<e.length;n++)i[e][e.charAt(n)]=n}return i[e][r]});return t(r.length,function(n){return a(r.charAt(n))})}}}();

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
