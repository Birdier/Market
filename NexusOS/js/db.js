// js/db.js
const DB_KEY = 'NEXUS_OS_MARKETPLACE_V4';
const fmtUsd = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'});

function getDatabase() {
    let raw = localStorage.getItem(DB_KEY);
    let db = {};
    if(raw) { try { db = JSON.parse(raw); } catch(e) {} }

    // Seed robust platform architecture
    if(!db.platformFinances) db.platformFinances = { grossMerchandiseValue: 24500.00, platformCommission: 1960.00, commissionRate: 0.08 };
    if(!db.orders || !Array.isArray(db.orders)) db.orders = [];
    if(!db.listings || !Array.isArray(db.listings)) {
        db.listings = [
            { id: 'LST_001', vendor: 'Hyperion Electronics', name: 'Tensor Data Core A100', desc: 'Enterprise-grade GPU processor designed specifically for managing massive AI models.', price: 9200.00, icon: 'fa-microchip' },
            { id: 'LST_002', vendor: 'Starlight Networks', name: 'High-Bandwidth Network Switch', desc: 'SFP+ networking node featuring un-bottlenecked 10Gbps connectivity between arrays.', price: 1850.00, icon: 'fa-server' },
            { id: 'LST_003', vendor: 'Aegis Cyber Security', name: 'Encrypted Biometric Auth Key', desc: 'FIDO2 Level 3 hardware security key to protect restricted developer web environments.', price: 125.00, icon: 'fa-fingerprint' }
        ];
    }
    
    if(!db.vendors || !Array.isArray(db.vendors)) {
        db.vendors = [
            { storeName: 'Hyperion Electronics', owner: 'admin@hyperion.com', lifetimeSales: 45000, status: 'Verified' },
            { storeName: 'Starlight Networks', owner: 'ops@starlight.io', lifetimeSales: 18500, status: 'Verified' }
        ];
    }

    if(!db.emails || !Array.isArray(db.emails)) db.emails = [];

    // Trigger Autonomous Simulator Once per Session 
    if(!window.simulationRunning) startAutonomousMarketSimulator(db);

    return db;
}

function saveDatabase(obj) { localStorage.setItem(DB_KEY, JSON.stringify(obj)); }

function logout() { localStorage.removeItem('auth_session'); window.location.replace('login.html'); }


// ==========================================
// CORE PLATFORM TRANSACTOR
// ==========================================
function globalMarketplaceStripeSimCheckout(cartItemsArr, totalOrderCost, isSimulation = false) {
    let db = getDatabase();
    
    let generatedBuyerEmail = 'usr_x' + Math.floor(Math.random() * 9000) + (isSimulation ? '@automated.net' : '@verified.com');
    let combinedProductList = cartItemsArr.map(i => `${i.name}`).join(', ');
    
    // Apply Commission Math
    let platformCut = totalOrderCost * db.platformFinances.commissionRate;
    db.platformFinances.grossMerchandiseValue += totalOrderCost;
    db.platformFinances.platformCommission += platformCut;

    let orderId = 'TXN_' + Math.random().toString(36).substring(2,10).toUpperCase();
    
    db.orders.unshift({ id: orderId, val: totalOrderCost, platformCut: platformCut, item: combinedProductList, user: generatedBuyerEmail, date: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}) });
    
    // Add Buyer to CRM implicitly 
    db.vendors.unshift({ storeName: generatedBuyerEmail.split('@')[0].toUpperCase() + ' (Buyer Node)', owner: generatedBuyerEmail, lifetimeSales: totalOrderCost, status: 'Buyer Acc.' });

    // Store in internal inbox
    db.emails.unshift({
        id: 'WH_' + Math.floor(Math.random() * 99999),
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        sender: 'Stripe Webhook API',
        subj: `Settlement Executed: ${fmtUsd.format(totalOrderCost)}`,
        body: `Payment intent ${orderId} was processed natively via Stripe integration.\n\nEscrow has distributed funds to merchant. Your ${db.platformFinances.commissionRate * 100}% cut (${fmtUsd.format(platformCut)}) was added to your ledger balance.`,
        unread: true
    });

    saveDatabase(db);

    // If viewing dashboard natively, tell it to force-refresh visually without clicking
    if(window.location.pathname.includes('admin') && window.renderDashboardData) {
        window.renderDashboardData();
    }
}


// ==========================================
// AUTONOMOUS MARKETPLACE SIMULATOR (Background AI Engine)
// ==========================================
function startAutonomousMarketSimulator() {
    window.simulationRunning = true;

    setInterval(() => {
        let currentDB = getDatabase();
        // Do not simulate if no products exist
        if(currentDB.listings.length === 0) return;

        // Pick a random product from the store catalog
        let randomListing = currentDB.listings[Math.floor(Math.random() * currentDB.listings.length)];
        
        // Execute the sale seamlessly in the background!
        globalMarketplaceStripeSimCheckout([randomListing], randomListing.price, true);
        
        // Push the ping log visually if dev portal is open
        if(window.document.getElementById('terminal-screen') && window.activePaneTab === 'api') {
            let trm = window.document.getElementById('terminal-screen');
            trm.innerHTML += `<div><span class="text-zinc-500">[${new Date().toLocaleTimeString()}]</span> API_HTTP_200 >> Automated Stripe Settlement Captured: <span class="text-emerald-300">${fmtUsd.format(randomListing.price)}</span> | Item: ${randomListing.name}</div>`;
            trm.scrollTop = trm.scrollHeight;
        }

    }, Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000); // Happens every 8 to 12 seconds autonomously
}
