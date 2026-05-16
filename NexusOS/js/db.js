// js/db.js
const DB_KEY = 'NEXUS_OS_CORE';
const fmtUsd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});

function getDatabase() {
    let raw = localStorage.getItem(DB_KEY);
    let db = {};
    if(raw) { try { db = JSON.parse(raw); } catch(e) {} }

    // Seed missing arrays
    if(!db.financials) db.financials = { revenue: 0 };
    if(!db.orders || !Array.isArray(db.orders)) db.orders = [];
    if(!db.products || !Array.isArray(db.products)) db.products = [];
    if(!db.clients || !Array.isArray(db.clients)) db.clients = [];
    
    // Webmail Core Array
    if(!db.emails || !Array.isArray(db.emails)) {
        db.emails = [
            { id: 'E_INT_1', date: new Date().toLocaleDateString(), sender: 'Network Admin', subj: 'System Diagnostics & UI Patch Applied', body: 'The recent E-OS deployment brings visual upgrades and a functioning mail client. Operations are running perfectly. Expect high load metrics today.', unread: false },
            { id: 'E_INT_2', date: new Date().toLocaleDateString(), sender: 'Auth Guard', subj: 'Successful Master Route Handshake', body: 'Detected administrator login via login.html terminal. Authorization granted to read / write across the Local Storage Matrix.', unread: false }
        ];
    }
    return db;
}

function saveDatabase(obj) { localStorage.setItem(DB_KEY, JSON.stringify(obj)); }

function logout() { localStorage.removeItem('auth_session'); window.location.replace('login.html'); }

// ----------------------------------------------------
// GLOBAL EVENT ACTIONS (Accessible by both Store and Admin)
// ----------------------------------------------------

// 1. Sends an email to the Admin OS Inbox
function pushSystemWebmail(senderString, subjectString, bodyString) {
    let db = getDatabase();
    db.emails.unshift({
        id: 'EVT_' + Math.floor(Math.random() * 99999),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        sender: senderString,
        subj: subjectString,
        body: bodyString,
        unread: true // Badges will highlight unread!
    });
    saveDatabase(db);
}

// 2. Used by index.html when a user completes Checkout
function globalProcessCheckoutEvent(cartArray, orderTotalNum) {
    let db = getDatabase();
    
    // Make fake client
    let userEmail = 'usr_anon' + Math.floor(Math.random() * 900) + '@nexus-customer.net';
    let productNames = cartArray.map(item => item.name).join(', ');
    
    // Add Money
    db.financials.revenue += orderTotalNum;
    db.orders.unshift({ id: 'REC_' + Math.floor(Math.random() * 8888), val: orderTotalNum, item: productNames, user: userEmail });
    
    // Update CRM! (Adding the stuff that makes e-commerce useful)
    db.clients.unshift({ email: userEmail, ltv: orderTotalNum, status: 'Active Customer', joined: new Date().toLocaleDateString() });

    saveDatabase(db);

    // IMMEDIATELY generate a Webmail Receipt to the Admin Inbox!
    let emailReportBody = `NEW SETTLEMENT TRIGGERED!\n\nUser: ${userEmail}\nTransaction Total: ${fmtUsd.format(orderTotalNum)}\n\nItems Acquired:\n- ${productNames}\n\nThe funds have been allocated to the dashboard graphs and the user was securely pushed into the CRM Database logic. Dispatch protocols enabled.`;
    pushSystemWebmail('Storefront Node Tracker', `New Order Value: ${fmtUsd.format(orderTotalNum)}`, emailReportBody);
}
