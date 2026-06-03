# Customer Update System

A web-based order management system that lets you share real-time order status updates with your customers.

## Features

### For You (Admin)
- **Dashboard** - Overview of all orders, stats, and today's tasks
- **Order Management** - Create, edit, delete orders with full details
- **Progress Levels** - 6-level tracking system (Received → Delivered)
- **Payment Tracking** - Track paid, advance, and unpaid orders
- **Task Planner** - Personal task management linked to orders
- **Data Backup** - Export/Import your data as JSON

### For Customers (Shared Link)
- **Visual Progress** - Beautiful progress bar and level steps
- **Time Display** - Days and hours remaining until deadline
- **Payment Info** - See payment status and balance
- **Mobile Friendly** - Works perfectly on phones

## How to Use

1. Go to the admin dashboard (index.html)
2. Add your business info in Settings
3. Create an order with customer details
4. Click on any order → "Copy Customer Link"
5. Share the link with your customer via WhatsApp/SMS/Email!

## Hosting on GitHub Pages

1. Go to your repo Settings → Pages
2. Set Source: Deploy from branch → `main` → `/ (root)`
3. Your site will be live at: `https://designask.github.io/Customer_Update/`

## Tech Stack
- Pure HTML, CSS, JavaScript
- No dependencies or build tools needed
- Data stored in browser localStorage
- Works offline

## Links
- Admin: `https://designask.github.io/Customer_Update/`
- Customer View: `https://designask.github.io/Customer_Update/customer.html?id=ORDER_ID`
