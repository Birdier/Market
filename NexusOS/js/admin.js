// js/admin.js

// 1. Hardcore Auth Security Gateway Validation
if (localStorage.getItem('auth_session') !== 'admin_access') {
    window.location.replace('login.html');
}

// Ensure the logout button is physically linked to the db function
document.getElementById('btn-logout').addEventListener('click', logout);


// 2. Navigation Module Array / Paning Setup
const tabs = ['dash', 'inventory'];

function setActiveTab(tabName) {
    tabs.forEach(t => {
        // Switch styling states visually
        let b = document.getElementById('btn-' + t);
        let p = document.getElementById('pane-' + t);
        
        b.classList.remove('bg-white/10', 'text-white', 'border-white/5');
        b.classList.add('bg-transparent', 'text-zinc-500', 'border-transparent');
        b.querySelector('i').classList.remove('text-blue-400');
        
        p.classList.add('hidden-pane');
    });

    let actBtn = document.getElementById('btn-' + tabName);
    actBtn.classList.remove('bg-transparent', 'text-zinc-500', 'border-transparent');
    actBtn.classList.add('bg-white/10', 'text-white', 'border-white/5');
    actBtn.querySelector('i').classList.add('text-blue-400');

    document.getElementById('pane-' + tabName).classList.remove('hidden-pane');

    // Run data fetching only when specific panes open
    if (tabName === 'dash') renderDashboardData();
    if (tabName === 'inventory') renderHardwareData();
}

// Apply Button Event Listeners natively
document.getElementById('btn-dash').addEventListener('click', () => setActiveTab('dash'));
document.getElementById('btn-inventory').addEventListener('click', () => setActiveTab('inventory'));


// 3. Central Application Functions: Dash Board
let dashChartObj = null;

function renderDashboardData() {
    let db = getDatabase(); // Connect to persistent Vault
    
    // Quick Mapping math updates
    document.getElementById('kpi-rev').innerText = currencyFormatter.format(db.financials.revenue);
    document.getElementById('kpi-ords').innerText = db.orders.length;

    // Render loop strings list UI Map Arrays 
    const oList = document.getElementById('render-recent-orders');
    if (db.orders.length > 0) {
        oList.innerHTML = db.orders.slice(0, 15).map(o => `
            <div class="bg-[#111] p-3 rounded-lg border border-white/5 group relative transition">
                <div class="flex justify-between font-mono items-start mb-2"><span class="bg-black/80 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-white border border-white/10 shadow-sm">${o.id}</span> <span class="text-blue-400 font-bold text-[10px] tracking-wider">${currencyFormatter.format(o.val)}</span></div>
                <div class="text-[11px] text-zinc-400 font-medium font-sans mb-1">${o.item}</div>
                <div class="text-[9px] text-zinc-600 font-mono tracking-wider font-bold">ROUTE: ${o.user}</div>
            </div>
        `).join('');
    } else {
        oList.innerHTML = `<div class="p-6 text-zinc-600 uppercase font-mono text-[9px] text-center font-bold tracking-widest mt-10">Listening Array Zero-Settlement Map.</div>`;
    }

    renderAreaChart(db.financials.revenue);
}

function renderAreaChart(moneyValueLiveFloatSumObjectVariable) {
    const renderNodeMapUIArrayAPIHtmlStrContextCanvas= document.getElementById('revenueGraphCanvas').getContext('2d');
    if (dashChartObj) dashChartObj.destroy();
    
    let simulatedTrailingAxisArrayLogicFloat = moneyValueLiveFloatSumObjectVariable > 1000 ? moneyValueLiveFloatSumObjectVariable / 2 : 1000;
    
    let grdObjMapCSSUIStrArray = renderNodeMapUIArrayAPIHtmlStrContextCanvas.createLinearGradient(0, 0, 0, 300);
    grdObjMapCSSUIStrArray.addColorStop(0, 'rgba(59,130,246, 0.4)');
    grdObjMapCSSUIStrArray.addColorStop(1, 'transparent');

    dashChartObj = new Chart(renderNodeMapUIArrayAPIHtmlStrContextCanvas, {
         type: 'line', data: {
             labels: ['Month -1', 'Month Current', 'Pre-Index Data Vector String Layout Map', 'Live Session Active Pipeline Settlement Matrix'],
             datasets: [{ data: [simulatedTrailingAxisArrayLogicFloat*0.7, simulatedTrailingAxisArrayLogicFloat*0.8, simulatedTrailingAxisArrayLogicFloat*1.5, moneyValueLiveFloatSumObjectVariable], fill:true, backgroundColor: grdObjMapCSSUIStrArray, borderColor: '#3b82f6', tension:0.2, pointBackgroundColor: 'white'}]
         },
         options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false, color:'transparent'}, ticks:{font:{family:'monospace'}, color:'rgba(255,255,255,0.4)'}}, y:{display:false} } }
    });
}


// 4. Central Application Functions: Inventory Data
document.getElementById('add-prod-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let db = getDatabase();

    db.products.push({
        id: 'SYS_N_'+ Math.floor(Math.random() * 5000),
        name: document.getElementById('input-prod-nm').value.trim(),
        desc: document.getElementById('input-prod-dsc').value.trim(),
        price: parseFloat(document.getElementById('input-prod-prc').value)
    });

    saveDatabase(db);
    
    // UI Validation Animation state Array map String structure String layout 
    let uiSubmitAPIObjectHtmlSetupBtnDOMMapLogicCSS = document.getElementById('submit-prod-btn');
    uiSubmitAPIObjectHtmlSetupBtnDOMMapLogicCSS.innerHTML = `<i class="fa-solid fa-check text-green-400 mr-2"></i> Pushed Successfully`;
    setTimeout(()=>{ uiSubmitAPIObjectHtmlSetupBtnDOMMapLogicCSS.innerHTML = 'Push Live Block Build'; document.getElementById('add-prod-form').reset(); }, 1500);

    renderHardwareData();
});

// Explicit Array delete function available to Window map array Logic HTML Markup Object
window.removeObjectStrMappingHTMLArrLayoutCSSFrameworkNode = function(productUUIDComponentMapArrayCssSetupAPIstringIdNodeLogicMapAPI) {
    let memoryObjectReadHtmlComponentArrayLoopAPIstringArchitectureFrameworkCssLayout = getDatabase();
    memoryObjectReadHtmlComponentArrayLoopAPIstringArchitectureFrameworkCssLayout.products = memoryObjectReadHtmlComponentArrayLoopAPIstringArchitectureFrameworkCssLayout.products.filter(itemXHTMLComponentMarkupLoopCSSSetupAPI => itemXHTMLComponentMarkupLoopCSSSetupAPI.id !== productUUIDComponentMapArrayCssSetupAPIstringIdNodeLogicMapAPI);
    saveDatabase(memoryObjectReadHtmlComponentArrayLoopAPIstringArchitectureFrameworkCssLayout);
    renderHardwareData();
}

function renderHardwareData(){
     let curUIFrameDBDOMHtmlStringMappingArchitectureListMapUI = getDatabase();
     const hookElementsAPIArrayLayouthtmlStructureListObjectStringFrameworkStringhtmlCssArrayCss = document.getElementById('render-prods-list');
     
     hookElementsAPIArrayLayouthtmlStructureListObjectStringFrameworkStringhtmlCssArrayCss.innerHTML = curUIFrameDBDOMHtmlStringMappingArchitectureListMapUI.products.slice().reverse().map(prodAPIHtmlVariablesComponentsSyntaxLayoutCSSUIStructureString=>`
           <div class="p-3 bg-[#111] border border-white/5 rounded-xl group relative overflow-hidden flex items-center justify-between">
                <div class="flex items-center gap-4">
                     <div class="w-10 h-10 rounded border border-white/10 bg-black flex justify-center items-center font-mono font-bold text-blue-500 text-[10px]">H+</div>
                     <div>
                         <h4 class="text-white text-xs font-semibold leading-tight mb-[1px] tracking-tight uppercase">${prodAPIHtmlVariablesComponentsSyntaxLayoutCSSUIStructureString.name}</h4>
                         <span class="text-zinc-500 text-[10px] font-mono tracking-widest"><b class="bg-[#050505] border border-white/5 px-1 mr-1 shadow">${prodAPIHtmlVariablesComponentsSyntaxLayoutCSSUIStructureString.id}</b> | ${currencyFormatter.format(prodAPIHtmlVariablesComponentsSyntaxLayoutCSSUIStructureString.price)}</span>
                     </div>
                </div>
                <button onclick="removeObjectStrMappingHTMLArrLayoutCSSFrameworkNode('${prodAPIHtmlVariablesComponentsSyntaxLayoutCSSUIStructureString.id}')" class="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-red-500 hover:text-white rounded border border-transparent hover:border-red-400 transition"><i class="fa-solid fa-trash-can"></i></button>
           </div>
     `).join('');
}


// Initiate Architecture Start State 
setActiveTab('dash');
