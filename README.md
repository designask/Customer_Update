# Customer Update System

A web-based order management system that lets you share real-time order status updates with your customers via a short link.

## Features

- **Email-verified Login** - Only your email (designfoxask@gmail.com) can create an account
- **Multi-device** - Login from phone, laptop, or tablet with same credentials
- **Short Customer Links** - Clean URLs that work in WhatsApp/SMS
- **Live Updates** - Customer always sees latest status (same link, no need to resend)
- **Payment Tracking** - Paid / Advance / Unpaid with amounts
- **6-Level Progress** - Order Received → Delivered
- **Task Planner** - Personal work management linked to orders
- **WhatsApp Share** - One-click share to customers
- **Data Backup** - Export/Import as JSON

## Setup Instructions

### 1. Enable GitHub Pages
1. Go to repo **Settings → Pages**
2. Source: **Deploy from branch** → `main` → `/ (root)` → Save
3. Wait 1-2 minutes → Site live at: `https://designask.github.io/Customer_Update/`

### 2. Set Up EmailJS (for email verification)

1. Go to **https://emailjs.com** → Create free account
2. **Add Email Service:**
   - Click "Email Services" → "Add New Service"
   - Choose "Gmail" → Connect your Gmail (designfoxask@gmail.com)
   - Note the **Service ID** (e.g., `service_abc123`)
3. **Create Email Template:**
   - Click "Email Templates" → "Create New Template"
   - Subject: `Your Verification Code: {{passcode}}`
   - Body: `Your Customer Update verification code is: {{passcode}}`
   - To Email: `{{to_email}}`
   - Save → Note the **Template ID** (e.g., `template_xyz789`)
4. **Get Public Key:**
   - Go to "Account" → "API Keys" tab
   - Copy your **Public Key**

### 3. Update Your Config

Edit `login.html` and replace these 3 values (around line 165):

```javascript
const EMAILJS_PUBLIC_KEY = 'your_actual_public_key';
const EMAILJS_SERVICE_ID = 'your_actual_service_id';
const EMAILJS_TEMPLATE_ID = 'your_actual_template_id';
```

Commit and push → Done!

## How It Works

1. Open `login.html` → "Create Account"
2. Enter your email → Get verification code → Set password
3. Login from any device with email + password
4. Create/update orders → Auto-generates customer link
5. Share link via WhatsApp → Customer sees live status!

## URLs
- **Login:** `https://designask.github.io/Customer_Update/login.html`
- **Dashboard:** `https://designask.github.io/Customer_Update/index.html`
- **Customer:** `https://designask.github.io/Customer_Update/customer.html?id=BLOB_ID`

## Security
- Only `designfoxask@gmail.com` can register
- Email verification required
- Password hashed before storage
- Customer links only show order info (not admin data)
