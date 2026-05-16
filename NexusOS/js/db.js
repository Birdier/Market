// js/db.js
const DB_KEY = 'NEXUS_MARKETPLACE_OS_V1';
const fmtUsd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});

function getDatabase() {
    let raw = localStorage.getItem(DB_KEY);
    let db = {};
    if(raw) { try { db = JSON.parse(raw); } catch(e) {} }

    // MARKETPLACE LOGIC: Track total money passed through (GMV) and the cut you take (Revenue).
    if(!db.platformFinances) db.platformFinances = { grossMerchandiseValue: 0, platformCommission: 0, commissionRate: 0.08 }; // You take an 8% cut
    if(!db.orders || !Array.isArray(db.orders)) db.orders = [];
    
    // Vendor Products
    if(!db.listings || !Array.isArray(db.listings)) {
        db.listings = [
            { id: 'LST_001', vendor: 'Hyperion Electronics', name: 'Tensor Data Core A100', desc: 'Enterprise-grade GPU processor designed specifically for managing massive AI models.', price: 9200.00, icon: 'fa-microchip' },
            { id: 'LST_002', vendor: 'Starlight Networks', name: 'High-Bandwidth Network Switch', desc: 'SFP+ networking node featuring un-bottlenecked 10Gbps connectivity between arrays.', price: 1850.00, icon: 'fa-server' },
            { id: 'LST_003', vendor: 'Aegis Cyber Security', name: 'Encrypted Biometric Auth Key', desc: 'FIDO2 Level 3 hardware security key to protect restricted developer web environments.', price: 125.00, icon: 'fa-fingerprint' }
        ];
    }
    
    if(!db.vendors || !Array.isArray(db.vendors)) db.vendors = [];
    if(!db.emails || !Array.isArray(db.emails)) {
        db.emails = [{ id: 'MSG_INIT_1', date: new Date().toLocaleDateString(), sender: 'Stripe Integration System', subj: 'Stripe Connect Matrix Online', body: 'The marketplace infrastructure has initialized. Funds will now be split using Stripe Connect API between your merchant partners and the platform escrow.', unread: false }];
    }
    return db;
}

function saveDatabase(obj) { localStorage.setItem(DB_KEY, JSON.stringify(obj)); }

function globalMarketplaceStripeSimCheckout(cartItemsArr, totalOrderCost) {
    let db = getDatabase();
    
    let generatedBuyerEmail = 'buyer' + Math.floor(Math.random() * 800) + '@stripe-secure.com';
    let combinedProductList = cartItemsArr.map(i => `${i.name} (Sold by: ${i.vendor})`).join(', ');
    
    // Marketplace Math! 
    let platformCut = totalOrderCost * db.platformFinances.commissionRate;

    db.platformFinances.grossMerchandiseValue += totalOrderCost;
    db.platformFinances.platformCommission += platformCut;

    db.orders.unshift({ id: 'STRIPE_TX_' + Math.floor(Math.random() * 88888), val: totalOrderCost, platformCut: platformCut, item: combinedProductList, user: generatedBuyerEmail, date: new Date().toLocaleDateString() });

    // Ensure Vendors are tracked in CRM based on sales
    cartItemsArr.forEach(cartItem => {
        let existingVendor = db.vendors.find(v => v.storeName === cartItem.vendor);
        if(!existingVendor) {
             db.vendors.push({ storeName: cartItem.vendor, owner: `admin@${cartItem.vendor.toLowerCase().replace(' ', '')}.com`, lifetimeSales: cartItem.price, status: 'Stripe Connect Verified' });
        } else {
             existingVendor.lifetimeSales += cartItem.price;
        }
    });

    // Notify the platform owner
    db.emails.unshift({
        id: 'WH_STRIPE_' + Math.floor(Math.random() * 99999),
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        sender: 'Stripe Webhooks',
        subj: `Payment Intent Succeeded: ${fmtUsd.format(totalOrderCost)}`,
        body: `Stripe has confirmed capture of payment for buyer ${generatedBuyerEmail}.\n\nItems included: \n${combinedProductList}\n\nStripe Connect logic initiated: Funds are being disbursed to your vendors minus the ${db.platformFinances.commissionRate * 100}% Nexus platform fee (${fmtUsd.format(platformCut)} kept).`,
        unread: true
    });

    saveDatabase(db);
}
