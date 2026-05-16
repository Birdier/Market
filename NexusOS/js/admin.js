// js/admin.js

// 1. App Authentication Check
if (localStorage.getItem('auth_session') !== 'admin_access') { window.location.replace('login.html'); }
document.getElementById('btn-logout').addEventListener('click', logout);

let dashChartObj = null;

// 2. High Performance Router
function setActiveTab(tabName) {
    const panes = ['dash', 'inventory', 'crm', 'api', 'settings', 'mail'];
    
    panes.forEach(t => {
        let b = document.getElementById('tab-' + t);
        if (b) {
            b.classList.remove('bg-white/5', 'border-white/5', 'text-white');
            b.classList.add('bg-transparent', 'border-transparent', 'text-zinc-500');
            b.querySelector('.icon-link').classList.remove('text-blue-500', 'text-emerald-500');
        }
        document.getElementById('pane-' + t).classList.add('hidden-pane');
    });

    let actBtn = document.getElementById('tab-' + tabName);
    actBtn.classList.add('bg-white/5', 'border-white/5', 'text-white');
    actBtn.classList.remove('bg-transparent', 'border-transparent', 'text-zinc-500');
    
    if(tabName === 'api') actBtn.querySelector('.icon-link').classList.add('text-emerald-500');
    else actBtn.querySelector('.icon-link').classList.add('text-blue-500');

    document.getElementById('pane-' + tabName).classList.remove('hidden-pane');

    // Launch UI Functions!
    if (tabName === 'dash') renderDashboardData();
    if (tabName === 'inventory') renderHardwareData();
    if (tabName === 'mail') renderSysWebmailInbox();
    if (tabName === 'crm') renderAppCrmClientBase();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => setActiveTab(e.currentTarget.id.replace('tab-', '')));
});


// 3. LEDGER MODULE 
function renderDashboardData() {
    let db = getDatabase();
    
    document.getElementById('v-kpi-rev').innerText = fmtUsd.format(db.financials.revenue);
    document.getElementById('v-kpi-ords').innerText = db.orders.length;
    document.getElementById('v-kpi-prods').innerText = db.products.length;

    const oList = document.getElementById('v-ord-feed');
    if (db.orders.length > 0) {
        oList.innerHTML = db.orders.slice(0, 10).map(o => `
            <div class="bg-[#050505] p-4 mb-2 rounded-lg border border-white/5 hover-glow group transition cursor-pointer relative">
                <div class="absolute left-0 w-1 h-0 bg-blue-500 group-hover:h-full top-0 bottom-0 transition-all"></div>
                <div class="flex justify-between font-mono mb-2"><span class="bg-blue-600/20 px-2 rounded text-[10px] uppercase font-bold text-blue-400 border border-blue-500/30">${o.id}</span> <span class="text-white font-bold tracking-widest">${fmtUsd.format(o.val)}</span></div>
                <div class="text-[12px] text-zinc-300 font-sans font-medium line-clamp-1 truncate w-full">${o.item}</div>
                <div class="text-[9px] text-zinc-600 font-mono tracking-widest font-bold mt-2 uppercase">CLI. : ${o.user}</div>
            </div>
        `).join('');
    } else {
        oList.innerHTML = `<div class="p-8 text-zinc-600 uppercase font-mono text-[9px] text-center tracking-[0.3em]">No telemetry nodes discovered.</div>`;
    }
    renderAreaChart(db.financials.revenue);
}

function renderAreaChart(moneyVal) {
    const canvasContext = document.getElementById('revLineGraph').getContext('2d');
    if (dashChartObj) dashChartObj.destroy();
    
    let simulatedTrailing = moneyVal > 500 ? moneyVal * 0.3 : 1500;
    
    let grd = canvasContext.createLinearGradient(0, 0, 0, 300);
    grd.addColorStop(0, 'rgba(59,130,246, 0.4)'); grd.addColorStop(1, 'transparent');

    dashChartObj = new Chart(canvasContext, {
         type: 'line', data: {
             labels: ['WK 1', 'WK 2', 'WK 3', 'Live Memory Synced Axis'],
             datasets: [{ data: [simulatedTrailing*0.5, simulatedTrailing*1.1, simulatedTrailing*1.6, moneyVal], fill:true, backgroundColor: grd, borderColor: '#3b82f6', tension:0.4, pointBackgroundColor: '#ffffff'}]
         }, options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false, color:'transparent'}, ticks:{font:{family:'monospace'}, color:'rgba(255,255,255,0.4)'}}, y:{display:false} } }
    });
}

// 4. INVENTORY / ECOM DB MODULE
document.getElementById('add-prod-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let db = getDatabase();
    
    let titleStr = document.getElementById('input-prod-nm').value.trim();
    let prcStr = parseFloat(document.getElementById('input-prod-prc').value);

    db.products.push({
        id: 'SYS_N_'+ Math.floor(Math.random() * 5000), name: titleStr,
        desc: document.getElementById('input-prod-dsc').value.trim(), price: prcStr, icon: 'fa-cube'
    });
    saveDatabase(db);
    
    pushSystemWebmail('Store Architect System', `Database Mutated: +${titleStr}`, `You have pushed ${titleStr} valued at ${fmtUsd.format(prcStr)} live onto the Front-End e-commerce router via the Inventory panel. Users may now secure this resource.`);
    
    document.getElementById('add-prod-form').reset();
    renderHardwareData();
});

window.rmItemNodeDbMapLogicStrUI = function(pId) {
    let dMem = getDatabase();
    dMem.products = dMem.products.filter(d => d.id !== pId);
    saveDatabase(dMem); renderHardwareData();
};

function renderHardwareData() {
     let cdb = getDatabase();
     document.getElementById('render-prods-list').innerHTML = cdb.products.slice().reverse().map(prd=>`
           <div class="p-3 bg-black border border-white/5 rounded-xl hover-glow flex justify-between items-center group mb-2 relative animate-fade">
                <div class="flex items-center gap-4">
                     <div class="w-10 h-10 rounded-lg border border-white/10 bg-[#111] flex justify-center items-center group-hover:bg-blue-600 transition shadow"> <i class="fa-solid fa-memory text-white/50 group-hover:text-white transition"></i> </div>
                     <div><h4 class="text-white text-xs font-bold leading-tight mb-0 tracking-tight uppercase">${prd.name}</h4><span class="text-zinc-500 text-[9px] font-mono tracking-widest"><b class="text-blue-400 font-bold font-sans">${fmtUsd.format(prd.price)}</b> &bull; SKU: ${prd.id}</span></div>
                </div>
                <button onclick="rmItemNodeDbMapLogicStrUI('${prd.id}')" class="px-3 py-1.5 border border-transparent group-hover:border-red-500 text-zinc-600 group-hover:text-red-500 group-hover:bg-red-500/10 rounded-md font-mono text-[9px] font-bold tracking-widest uppercase transition opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash mr-2"></i>Delete Route</button>
           </div>`).join('');
}


// 5. GLOBAL CRM / CLIENT MANAGER (Adding functionality!)
function renderAppCrmClientBase() {
    let clDb = getDatabase().clients;
    
    document.getElementById('v-crm-table').innerHTML = clDb.map(usr => `
        <tr class="hover:bg-black/80 transition group border-b border-white/5">
             <td class="p-5 font-semibold text-white tracking-wide font-sans text-sm">${usr.email} <br> <span class="text-[9px] font-mono text-zinc-600 uppercase font-bold tracking-widest">Added: ${usr.joined || 'Legacy Block'}</span></td>
             <td class="p-5 text-zinc-400 font-bold text-[10px]">AUTH_UID_${usr.email.split('@')[0]}</td>
             <td class="p-5 text-emerald-500 font-bold">${fmtUsd.format(usr.ltv || 0)}</td>
             <td class="p-5"><span class="px-2 py-1 bg-white/5 border border-white/10 text-zinc-400 text-[8px] font-bold rounded shadow-inner uppercase">${usr.status || 'Verified Node'}</span></td>
             <td class="p-5 space-x-2"><button onclick="banMockTriggerStringFuncUI(this)" class="px-3 py-1.5 rounded bg-[#111] hover:bg-red-600 text-zinc-500 hover:text-white font-bold transition text-[10px] shadow uppercase border border-white/5">Lockdown</button> <button class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition text-[10px] shadow uppercase">Msg Png.</button></td>
        </tr>
    `).join('');
}

window.banMockTriggerStringFuncUI = function(btnElementDataUIHookObject) {
    btnElementDataUIHookObject.innerText = "Target Purged"; btnElementDataUIHookObject.classList.add('bg-red-500', 'text-white');
    pushSystemWebmail("Automated Guard Sequence", "Client Removed via CRM", "Administrator manually engaged target-purge algorithms on client map string data inside the CRM portal view layout framework.");
}


// 6. FUNCTIONAL SYSTEM WEBMAIL ARCHITECTURE 
function renderSysWebmailInbox() {
    let emailDb = getDatabase().emails;

    document.getElementById('v-email-list').innerHTML = emailDb.map((mailObj, arrMapDOMStrUIObjIntLocStr) => `
        <div onclick="openWebmailAppContentBodyLogicStringMapObjectHTML(${arrMapDOMStrUIObjIntLocStr})" class="p-4 border-b border-app-border cursor-pointer transition relative group hover:bg-[#111] bg-[#020202] ${mailObj.unread ? 'border-l-2 border-l-blue-500' : ''}">
             <div class="flex justify-between items-start mb-2"><span class="text-zinc-600 font-mono text-[9px] tracking-[0.2em] uppercase font-bold ${mailObj.unread ? 'text-blue-500' : ''}"><i class="fa-solid fa-key mr-2"></i> ${mailObj.date}</span></div>
             <h4 class="font-sans text-xs font-bold text-white mb-1 group-hover:text-blue-400 transition-colors drop-shadow ${mailObj.unread ? 'text-zinc-100' : 'text-zinc-400'}">${mailObj.subj}</h4>
             <p class="font-sans text-[11px] text-zinc-500 line-clamp-1">${mailObj.body}</p>
        </div>
    `).join('');
}

window.openWebmailAppContentBodyLogicStringMapObjectHTML = function(idValArrUIIntLogStructureMapListString) {
    let localMatrixWebStoreVariablesAppUIHTMLStringComponentsSetupCSSArrayArchitectureObjectHTML = getDatabase();
    let msgStrObjectAppStructureLayoutComponentSyntaxMarkupHtmlCSSHTMLArrayCSSAPIUIhtmlLayoutMapObjectArray = localMatrixWebStoreVariablesAppUIHTMLStringComponentsSetupCSSArrayArchitectureObjectHTML.emails[idValArrUIIntLogStructureMapListString];
    
    // Clear Unread
    localMatrixWebStoreVariablesAppUIHTMLStringComponentsSetupCSSArrayArchitectureObjectHTML.emails[idValArrUIIntLogStructureMapListString].unread = false;
    saveDatabase(localMatrixWebStoreVariablesAppUIHTMLStringComponentsSetupCSSArrayArchitectureObjectHTML);

    document.getElementById('v-email-reader').innerHTML = `
        <div class="max-w-2xl w-full flex flex-col items-start bg-black border border-white/5 p-8 rounded-xl shadow-2xl relative overflow-hidden animate-fade">
             <div class="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-600 to-indigo-800 opacity-60"></div>
             
             <span class="bg-blue-600 text-white font-mono font-bold uppercase tracking-[0.3em] px-2 py-0.5 rounded text-[8px] mb-4">DECRYPTED ROUTING PAYLOAD LOGIC ARRAY </span>
             
             <h2 class="text-2xl font-bold font-sans tracking-tight text-white mb-6 border-b border-white/10 w-full pb-4 drop-shadow">${msgStrObjectAppStructureLayoutComponentSyntaxMarkupHtmlCSSHTMLArrayCSSAPIUIhtmlLayoutMapObjectArray.subj}</h2>
             
             <div class="text-[10px] font-mono tracking-widest text-zinc-400 font-bold flex justify-between w-full uppercase mb-8 border border-white/5 bg-[#111] px-4 py-2 rounded">
                  <span>FR_Node: <b class="text-blue-400 ml-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">${msgStrObjectAppStructureLayoutComponentSyntaxMarkupHtmlCSSHTMLArrayCSSAPIUIhtmlLayoutMapObjectArray.sender}</b></span> <span><i class="fa-solid fa-network-wired text-zinc-600 mr-2"></i> ${msgStrObjectAppStructureLayoutComponentSyntaxMarkupHtmlCSSHTMLArrayCSSAPIUIhtmlLayoutMapObjectArray.date}</span>
             </div>
             
             <div class="text-[13px] font-sans font-light text-zinc-300 leading-relaxed tracking-normal whitespace-pre-wrap break-words drop-shadow h-48 w-full overflow-y-auto custom-scrollbar border-l-[3px] border-zinc-800 pl-4">
                  ${msgStrObjectAppStructureLayoutComponentSyntaxMarkupHtmlCSSHTMLArrayCSSAPIUIhtmlLayoutMapObjectArray.body}
             </div>

             <div class="flex space-x-3 w-full border-t border-app-border pt-6 mt-8">
                 <button onclick="renderSysWebmailInbox(); this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Filtered Data'; this.classList.add('bg-zinc-700')" class="px-4 py-2 border border-white/5 rounded text-[9px] uppercase tracking-[0.2em] font-mono text-white bg-black hover:bg-[#111] transition-all font-bold shadow-lg">MARK AS COMPLETED ROUTE HTML STRUCTURE MAP Object framework </button>
                 <button class="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded text-[9px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold transition-all"><i class="fa-solid fa-ban text-red-500 mr-2"></i> Quarantine Logic Components Map List Object Layout String Arrays String Framework map List string Variables </button>
             </div>
        </div>
    `;

    // Visual Refresh of Left-list read badge
    renderSysWebmailInbox();
}

// Initial Kick-off
setActiveTab('dash');
