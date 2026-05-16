// js/admin.js

// 1. App Authentication Check
if (localStorage.getItem('auth_session') !== 'admin_access') { window.location.replace('login.html'); }
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('auth_session'); window.location.replace('login.html');
});

// 2. High Performance Router
let currentTerminalLoop = null;
let dashChartObj = null;

function setActiveTab(tabName) {
    const panes = ['dash', 'inventory', 'crm', 'api', 'settings', 'mail'];
    
    // Shut off terminal loop if user navigates away to save RAM
    clearInterval(currentTerminalLoop);
    
    panes.forEach(t => {
        let b = document.getElementById('btn-' + t);
        if (b) {
            b.classList.remove('bg-white/10', 'text-white', 'border-white/5');
            b.classList.add('bg-transparent', 'border-transparent', 'text-zinc-500');
            b.querySelector('.nav-icon')?.classList.remove('text-blue-500', 'text-emerald-500');
        }
        document.getElementById('pane-' + t)?.classList.add('hidden-pane');
    });

    let actBtn = document.getElementById('btn-' + tabName);
    if(actBtn) {
        actBtn.classList.add('bg-white/10', 'border-white/5', 'text-white');
        actBtn.classList.remove('bg-transparent', 'border-transparent', 'text-zinc-500');
        let actIcon = actBtn.querySelector('.nav-icon');
        if(actIcon) {
            actIcon.classList.add(tabName === 'api' ? 'text-emerald-500' : 'text-blue-500');
        }
    }
    document.getElementById('pane-' + tabName)?.classList.remove('hidden-pane');

    // Launch Functional Controllers!
    if (tabName === 'dash') renderDashboardData();
    if (tabName === 'inventory') renderHardwareData();
    if (tabName === 'crm') renderAppCrmClientBase();
    if (tabName === 'api') engageTerminalInterface();
    if (tabName === 'mail') renderSysWebmailInbox();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => setActiveTab(e.currentTarget.id.replace('btn-', '')));
});


// 3. LEDGER DASHBOARD MODULE
const fxUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function renderDashboardData() {
    let db = getDatabase();
    
    document.getElementById('dash-rev').innerText = fxUsd.format(db.finances.revenue);
    document.getElementById('dash-prof').innerText = (db.finances.revenue > 0) ? fxUsd.format(db.finances.revenue * 0.35) : '$0.00';
    document.getElementById('dash-ord-len').innerText = db.orders.length;
    document.getElementById('dash-prod-len').innerText = db.products.length;

    const oList = document.getElementById('render-recent-sales');
    if (db.orders.length > 0) {
        oList.innerHTML = db.orders.slice(0, 10).map(o => `
            <div class="bg-[#111] hover:bg-[#16161c] p-4 mb-2 rounded-xl border border-white/5 group transition cursor-pointer relative overflow-hidden">
                <div class="absolute left-0 w-1 h-0 bg-blue-500 group-hover:h-full top-0 bottom-0 transition-all"></div>
                <div class="flex justify-between font-mono mb-2 items-center group-hover:pl-2 transition-all">
                    <span class="bg-blue-600/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-blue-400 border border-blue-500/20">${o.id}</span> 
                    <span class="text-white font-bold tracking-widest text-sm">${fxUsd.format(o.val)}</span>
                </div>
                <div class="text-xs text-zinc-300 font-sans font-medium line-clamp-1 truncate w-full group-hover:pl-2 transition-all mb-1">${o.item}</div>
                <div class="text-[9px] text-zinc-600 font-mono tracking-widest font-bold uppercase group-hover:pl-2 transition-all">USR: ${o.user}</div>
            </div>
        `).join('');
    } else {
        oList.innerHTML = `<div class="p-8 text-zinc-600 uppercase font-mono text-[9px] text-center tracking-[0.3em] font-bold">No Transaction Hashes Synced</div>`;
    }
    renderAreaChart(db.finances.revenue);
}

function renderAreaChart(moneyVal) {
    const canvasContext = document.getElementById('revenueGraphObj').getContext('2d');
    if (dashChartObj) dashChartObj.destroy();
    
    let simulatedTrailing = moneyVal > 500 ? moneyVal * 0.35 : 1200;
    let grd = canvasContext.createLinearGradient(0, 0, 0, 300);
    grd.addColorStop(0, 'rgba(59,130,246, 0.4)'); grd.addColorStop(1, 'transparent');

    dashChartObj = new Chart(canvasContext, {
         type: 'line', data: {
             labels: ['Aug', 'Sep', 'Oct', 'Ytd', 'Current Node Result'],
             datasets: [{ data: [simulatedTrailing*0.4, simulatedTrailing*0.9, simulatedTrailing*0.7, simulatedTrailing*1.3, moneyVal], fill:true, backgroundColor: grd, borderColor: '#3b82f6', tension:0.3, pointBackgroundColor: '#ffffff'}]
         }, options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false, color:'transparent'}, ticks:{font:{family:'monospace',size:9}, color:'rgba(255,255,255,0.3)'}}, y:{display:false} } }
    });
}


// 4. INVENTORY E-COM DB MODULE
document.getElementById('create-prod-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    let db = getDatabase();
    let titleStr = document.getElementById('inv-nm').value.trim();
    let prcStr = parseFloat(document.getElementById('inv-prc').value);

    db.products.push({ id: 'SYS_N_'+ Math.floor(Math.random() * 5000), name: titleStr, desc: document.getElementById('inv-dsc').value.trim(), price: prcStr, icon: document.getElementById('inv-ico').value });
    saveDatabase(db);
    pushSystemWebmail('Store Architect System', `Database Component Created: +${titleStr}`, `Your user credentials mapped ${titleStr} into the core framework at the target value of ${fxUsd.format(prcStr)}. This element was simultaneously successfully launched to the Front End shopping domain route.`);
    
    let formBtn = document.getElementById('btn-save-prod');
    formBtn.innerText = "Target Linked to Public Environment!"; formBtn.classList.replace('bg-white', 'bg-blue-600'); formBtn.classList.replace('text-black','text-white');
    
    setTimeout(() => { formBtn.innerText = "Publish to Storefront"; formBtn.classList.replace('bg-blue-600', 'bg-white'); formBtn.classList.replace('text-white','text-black'); document.getElementById('create-prod-form').reset(); }, 1800);
    renderHardwareData();
});

window.rmItemNodeStrUI = function(pId) {
    let dMem = getDatabase(); dMem.products = dMem.products.filter(d => d.id !== pId);
    saveDatabase(dMem); renderHardwareData();
};

function renderHardwareData() {
     let cdb = getDatabase();
     document.getElementById('render-prods-list').innerHTML = cdb.products.slice().reverse().map(prd=>`
           <div class="p-3 bg-[#111] border border-white/5 rounded-xl flex justify-between items-center group mb-2 transition hover:border-white/20 hover:shadow-lg">
                <div class="flex items-center gap-4">
                     <div class="w-10 h-10 rounded border border-white/10 bg-[#000] flex justify-center items-center group-hover:bg-white group-hover:text-black transition shadow"> <i class="fa-solid ${prd.icon}"></i> </div>
                     <div><h4 class="text-white text-xs font-bold leading-tight mb-1">${prd.name}</h4><span class="text-zinc-400 text-[10px] font-mono tracking-widest font-medium"><b class="text-zinc-200 bg-zinc-900 border border-zinc-700 px-1 rounded shadow-inner mr-2 font-bold">${prd.id}</b> ${fxUsd.format(prd.price)}</span></div>
                </div>
                <button onclick="rmItemNodeStrUI('${prd.id}')" class="w-8 h-8 rounded border border-transparent bg-transparent hover:bg-red-500/10 group-hover:border-red-500/50 text-zinc-600 group-hover:text-red-400 transition font-mono active:scale-95 shadow-sm opacity-0 group-hover:opacity-100 flex items-center justify-center"><i class="fa-solid fa-trash-can text-sm"></i></button>
           </div>`).join('');
}


// 5. GLOBAL CRM / CLIENT MANAGER 
function renderAppCrmClientBase() {
    let clDb = getDatabase().clients;
    document.getElementById('v-crm-tbody').innerHTML = clDb.map(usr => `
        <tr class="hover:bg-[#111] transition-colors group cursor-default">
             <td class="p-5 font-medium text-white tracking-wide text-sm font-sans flex items-center"><div class="w-8 h-8 rounded bg-blue-900/30 border border-blue-500/30 text-blue-500 flex justify-center items-center text-xs font-bold font-mono mr-3">${usr.email.charAt(0).toUpperCase()}</div> ${usr.email}</td>
             <td class="p-5 text-emerald-500 font-bold">${fmtUsd.format(usr.ltv || 0)}</td>
             <td class="p-5 text-xs text-zinc-400 font-medium">${usr.joined || 'Offline Matrix Load'}</td>
             <td class="p-5 space-x-2">
                 <button onclick="this.innerHTML='De-Authorized'; this.classList.replace('text-zinc-400', 'text-white'); this.classList.add('bg-red-600', 'border-red-500')" class="px-4 py-1.5 rounded bg-black hover:bg-red-900/30 text-zinc-400 font-bold font-mono transition text-[10px] uppercase border border-white/5">Purge Access</button>
                 <button onclick="alert('Admin privileges insufficient. Upgrade instance wrapper tier.')" class="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-bold font-mono transition text-[10px] uppercase">Message</button>
             </td>
        </tr>
    `).join('');
}

// REAL CSV Exporter 
document.getElementById('crm-csv-btn')?.addEventListener('click', (mbtn) => {
     let dbCrmMemory = getDatabase().clients;
     if(dbCrmMemory.length === 0){ alert("Null user dataset. Generate Storefront telemetry first."); return; }

     let csvConstructLayoutData = "Node Account String Email, Financial Return LTV Value, Activation Stamp Date\n" + dbCrmMemory.map(vRow=> `"${vRow.email}","${vRow.ltv}","${vRow.joined || 'Offline'}"`).join('\n');
     
     let buildLinkHook = document.createElement('a');
     let generatedCSVDocObj = new Blob([csvConstructLayoutData], {type: 'text/csv;charset=utf-8;'});
     
     buildLinkHook.href = URL.createObjectURL(generatedCSVDocObj);
     buildLinkHook.download = `Nexus_OS_Workspace_Analytics_${new Date().getTime()}.csv`;
     document.body.appendChild(buildLinkHook); buildLinkHook.click(); document.body.removeChild(buildLinkHook);

     mbtn.target.innerHTML = "<i class='fa-solid fa-check mr-2 text-[12px]'></i> Dump Array Processed"; 
     setTimeout(()=>{mbtn.target.innerHTML = '<i class="fa-solid fa-file-csv mr-2 text-[12px]"></i> Dump Ledger Sheet';}, 2000);
});


// 6. DEVELOPER API PORTAL LOGIC
window.copyTriggerVal = function(passedIdRefCodeObjTargetStrStringValue){
     navigator.clipboard.writeText(passedIdRefCodeObjTargetStrStringValue);
     // Little matrix effect pushing response immediately to live virtual terminal
     let terminalLogStrDataDom = document.getElementById('terminal-screen');
     terminalLogStrDataDom.innerHTML += `<div><span class="text-zinc-500">[${new Date().toLocaleTimeString()}]</span> API_CTRL_ROOT >> Security Secret Code Signature Intercepted + COPIED To OS Clipboard Native Object!</div>`;
     terminalLogStrDataDom.scrollTop = terminalLogStrDataDom.scrollHeight;
}

document.getElementById('generate-token-btn')?.addEventListener('click', () => {
    let randApiValueKeyGenerateStringObjectValueLogic = 'nx_live_' + Math.random().toString(36).substring(2,12) + 'AzP';
    
    // Add dynamically mapped password hash visualizer
    let buildElementNodeForUIPutMapTarget = document.createElement('div');
    buildElementNodeForUIPutMapTarget.className = "bg-black p-3 rounded-lg border border-white/5 animate-fade mb-2";
    buildElementNodeForUIPutMapTarget.innerHTML = `
          <div class="flex justify-between font-mono font-bold tracking-widest text-[9px] text-zinc-500 uppercase mb-2">Automated Server Minted Auth Path <span class="text-emerald-500 px-1 border border-emerald-500/20 bg-emerald-500/10 rounded font-sans tracking-tight">Active API Routing Link</span></div>
          <div class="flex bg-[#111] border border-white/5 rounded overflow-hidden">
              <input type="password" value="${randApiValueKeyGenerateStringObjectValueLogic}" class="px-3 py-2 w-full text-zinc-200 font-mono text-[11px] outline-none bg-transparent" readonly>
              <button onclick="copyTriggerVal('${randApiValueKeyGenerateStringObjectValueLogic}')" class="px-4 border-l border-white/5 hover:bg-white text-zinc-400 hover:text-black transition-colors"><i class="fa-solid fa-copy"></i></button>
          </div>
    `;
    
    document.getElementById('api-keys-list').prepend(buildElementNodeForUIPutMapTarget);

    // Auto logging map
    let screen = document.getElementById('terminal-screen');
    screen.innerHTML += `<div class="font-bold text-white"><span class="text-zinc-500 font-light">[${new Date().toLocaleTimeString()}]</span> API_HTTP_REQ >> Authorized root user requested local Node string generated algorithm output hash link pipeline mapped! Output string live mapped to visual frame box arrays!</div>`;
    screen.scrollTop = screen.scrollHeight;
});

// Create random matrix loop string text for terminal visual styling immersion output effects arrays structure Map logic component CSS wrapper 
function engageTerminalInterface() {
     let domScreenNode = document.getElementById('terminal-screen');
     let randT = ['SYS PING_> Environment Checks Local DB mapping Map.', '[WARN:429 FORBIDDEN_ROUTE_EXTERNAL]', 'AUTHORIZATION BEARER SYNCHED... Pass check structure.', '[HTTP POST] -> Fetch Component Hardware Mapping Graph Map API layout. > Response: Success!', 'Checking Live Checkout API Component Elements Nodes Data. Map variables clear string CSS arrays layouts..', 'Scanning Client CRM Base Table arrays Data CSS string syntax arrays API structures UI. OK.'];
     
     // clear to avoid double speeds
     clearInterval(currentTerminalLoop);
     
     currentTerminalLoop = setInterval(() => {
          let selectionArrHtmlDataStructureDOMMapOutput = randT[Math.floor(Math.random() * randT.length)];
          domScreenNode.innerHTML += `<div><span class="text-zinc-500">[${new Date().toLocaleTimeString()}]</span> ${selectionArrHtmlDataStructureDOMMapOutput}</div>`;
          if (domScreenNode.children.length > 30) domScreenNode.removeChild(domScreenNode.firstChild); // limit scrolling length mapping css mapping memory usage limits logic
          domScreenNode.scrollTop = domScreenNode.scrollHeight;
     }, 3000);
}


// 7. WEBMAIL MATRIX FUNCTIONALITIES
function renderSysWebmailInbox() {
    let emailDb = getDatabase().emails;
    document.getElementById('v-mail-feed').innerHTML = emailDb.map((mailObj, indexMappingLogic) => `
        <div onclick="executeInboxBodyMsgUIMapOutputComponentStringAPI(${indexMappingLogic})" class="p-4 border-b border-white/5 hover:bg-[#111] transition cursor-pointer relative group bg-[#000] ${mailObj.unread ? 'opacity-100' : 'opacity-60'}">
             ${mailObj.unread ? '<div class="absolute w-1 h-full left-0 top-0 bottom-0 bg-blue-500 rounded-r"></div>' : ''}
             <div class="flex justify-between items-center text-xs mb-1.5"><div class="text-zinc-400 font-bold group-hover:text-white transition tracking-widest font-mono uppercase">${mailObj.sender}</div></div>
             <div class="text-white text-sm font-semibold mb-1 line-clamp-1 w-full">${mailObj.subj}</div>
             <div class="text-zinc-500 text-xs font-light line-clamp-1">${mailObj.body}</div>
        </div>
    `).join('');
}

window.executeInboxBodyMsgUIMapOutputComponentStringAPI = function(arrayDataIntegerLayoutVarIDHtmlNodeMapAPI) {
    let locWebstoreVaultDbMemoryObjMappingNodeState = getDatabase();
    let tgtMSGTargetedHtmlMappingObjectUI = locWebstoreVaultDbMemoryObjMappingNodeState.emails[arrayDataIntegerLayoutVarIDHtmlNodeMapAPI];
    
    locWebstoreVaultDbMemoryObjMappingNodeState.emails[arrayDataIntegerLayoutVarIDHtmlNodeMapAPI].unread = false;
    saveDatabase(locWebstoreVaultDbMemoryObjMappingNodeState);
    renderSysWebmailInbox(); 
    
    document.getElementById('v-mail-view').innerHTML = `
         <div class="max-w-3xl w-full flex flex-col justify-start relative shadow-2xl animate-fade bg-black border border-white/5 p-12 rounded-2xl text-left">
              <div class="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-600 to-transparent opacity-80"></div>
              
              <div class="text-[9px] bg-[#111] border border-white/10 w-fit text-zinc-500 uppercase tracking-widest font-mono font-bold rounded-lg px-3 py-1 mb-8 shadow">Secure Server Notice Route _${tgtMSGTargetedHtmlMappingObjectUI.date}</div>
              <h2 class="text-3xl font-bold font-sans text-white leading-tight mb-8">${tgtMSGTargetedHtmlMappingObjectUI.subj}</h2>
              <div class="text-xs bg-[#111] p-4 border border-white/5 rounded-xl text-zinc-300 font-mono mb-8 font-medium">Trace Entity Path Output -> <b class="ml-2 font-bold text-blue-500 bg-blue-900/10 px-2 py-0.5 rounded shadow">${tgtMSGTargetedHtmlMappingObjectUI.sender}</b></div>
              
              <div class="text-zinc-300 text-sm font-light leading-relaxed whitespace-pre-wrap">${tgtMSGTargetedHtmlMappingObjectUI.body}</div>
              
              <div class="mt-12 flex space-x-3 w-full">
                  <button onclick="document.getElementById('v-mail-view').innerHTML = '<div class=\\'w-full h-full border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 text-sm font-mono tracking-widest uppercase font-bold\\'><i class=\\'fa-solid fa-satellite-dish mr-3\\'></i> Awaiting Encrypted Message Matrix Display.</div>';" class="px-5 py-3 border border-white/5 bg-[#111] hover:bg-zinc-800 text-zinc-400 font-bold uppercase tracking-[0.2em] font-mono text-[10px] rounded transition flex items-center justify-center active:scale-95 shadow">Mark Read Notice Sequence & Close Display</button>
                  <button class="px-5 py-3 border border-transparent bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-[0.2em] font-mono text-[10px] rounded transition active:scale-95 shadow shadow-blue-500/20">Archive String Layout Obj</button>
              </div>
         </div>
    `;
};


// Execute initial run load framework
setActiveTab('dash');
