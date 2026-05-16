// js/db.js
const DB_KEY = 'NEXUS_ECOMMERCE_DB_V2';

function initializeDatabase() {
    let raw = localStorage.getItem(DB_KEY);
    let db = raw ? JSON.parse(raw) : null;

    if (!db) {
        db = {
            settings: { currency: 'USD', theme: 'dark' },
            financials: { revenue: 15400, netMargin: 32.5 },
            products: [
                { id: 'SKU_1', name: 'Nvidia A100 Compute Unit', desc: 'AI Render Hardware.', price: 8500.00 },
                { id: 'SKU_2', name: 'Network Fiber Array', desc: '10GB/s throughput.', price: 1200.00 }
            ],
            orders: [
                { id: 'ORD_001', val: 8500.00, item: 'Nvidia A100 Compute Unit', user: 'anon@matrix.net', status: 'SETTLED' },
                { id: 'ORD_002', val: 1200.00, item: 'Network Fiber Array', user: 'ops@server.co', status: 'SETTLED' }
            ]
        };
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
    return db;
}

function getDatabase() {
    return JSON.parse(localStorage.getItem(DB_KEY)) || initializeDatabase();
}

function saveDatabase(dbObject) {
    localStorage.setItem(DB_KEY, JSON.stringify(dbObject));
}

// Global Auth / Money Helpers
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function logout() {
    localStorage.removeItem('auth_session');
    window.location.replace('login.html');
}

// Automatically prepare DB on script load
initializeDatabase();
