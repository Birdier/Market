// js/db.js
const DB_KEY = 'NEXUS_ECOMMERCE_DB_V3';
const fmtUsd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});

function getDatabase() {
    let raw = localStorage.getItem(DB_KEY);
    let db = {};
    if(raw) { try { db = JSON.parse(raw); } catch(e) {} }

    // Enterprise seeded structures
    if(!db.finances) db.finances = { revenue: 0, netProfit: 0 };
    if(!db.orders || !Array.isArray(db.orders)) db.orders = [];
    
    // Add real product default seeds
    if(!db.products || !Array.isArray(db.products)) {
        db.products = [
            { id: 'SKU_01A', name: 'Tensor Data Core A100', desc: 'Enterprise-grade GPU processor designed specifically for managing massive AI models.', price: 9200.00, icon: 'fa-microchip' },
            { id: 'SKU_02B', name: 'High-Bandwidth Network Switch', desc: 'SFP+ networking node featuring un-bottlenecked 10Gbps connectivity between arrays.', price: 1850.00, icon: 'fa-server' },
            { id: 'SKU_03C', name: 'Encrypted Biometric Auth Key', desc: 'FIDO2 Level 3 hardware security key to protect restricted developer web environments.', price: 125.00, icon: 'fa-fingerprint' }
        ];
    }
    
    if(!db.clients || !Array.isArray(db.clients)) db.clients = [];
    
    // Proper System business notifications
    if(!db.emails || !Array.isArray(db.emails)) {
        db.emails = [
            { id: 'MAIL_WK_1', date: new Date().toLocaleDateString(), sender: 'Nexus Architecture Team', subj: 'Workspace Configuration Complete', body: 'Your Nexus administrative workspace has been fully initialized. E-Commerce hooks, Analytics reporting, and hardware asset database arrays are officially running. The integration with your storefront is functional.', unread: false }
        ];
    }
    return db;
}

function saveDatabase(obj) { localStorage.setItem(DB_KEY, JSON.stringify(obj)); }

function logout() { localStorage.removeItem('auth_session'); window.location.replace('login.html'); }

// E-commerce Functional API / Triggers

function pushSystemWebmail(senderStr, subjStr, bodyStr) {
    let db = getDatabase();
    db.emails.unshift({
        id: 'NOTIF_' + Math.floor(Math.random() * 99999),
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        sender: senderStr,
        subj: subjStr,
        body: bodyStr,
        unread: true
    });
    saveDatabase(db);
}

function globalProcessCheckoutEvent(cartItemsArr, totalCostAmount) {
    let db = getDatabase();
    
    let generatedEmail = 'customer' + Math.floor(Math.random() * 800) + '@enterprise.com';
    let combinedProductList = cartItemsArr.map(i => i.name).join(', ');
    
    // Manage Finance state
    db.finances.revenue += totalCostAmount;
    db.orders.unshift({ id: 'ORD_' + Math.floor(Math.random() * 8888), val: totalCostAmount, item: combinedProductList, user: generatedEmail, date: new Date().toLocaleDateString() });
    
    // Add Client tracking directly into the workspace CRM!
    db.clients.unshift({ email: generatedEmail, ltv: totalCostAmount, status: 'Active Account', joined: new Date().toLocaleDateString() });

    saveDatabase(db);

    // Ping the Admin automatically
    let receiptBodyText = `A transaction was verified over the storefront gateway.\n\nAccount: ${generatedEmail}\nRevenue Settled: ${fmtUsd.format(totalCostAmount)}\n\nCart Items Purchased:\n- ${combinedProductList}\n\nClient has been actively ported into the customer tracking table inside your CRM overview.`;
    pushSystemWebmail('Storefront Purchases', `Order Confirmation: ${fmtUsd.format(totalCostAmount)} settled`, receiptBodyText);
}
