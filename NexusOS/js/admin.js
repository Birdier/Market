// js/admin.js

// 1. HARDENED APP BOOT PROTOCOL
if (localStorage.getItem('auth_session') !== 'admin_access') { window.location.replace('login.html'); }
document.getElementById('btn-logout').addEventListener('click', logout);

let dashChartRef = null;
let apiLoggerInterval = null; 
window.activePane = 'dash';

// 2. SAFE TAB ROUTING
function setActiveTab(paneID) {
    const panels = ['dash', 'inventory', 'crm', 'api', 'settings', 'mail'];
    window.activePane = paneID;
    
    // Shut off API auto-logs if user navigates away to save RAM
    clearInterval(apiLoggerInterval);
    
    panels.forEach(id => {
         let p = document.getElementById('pane-' + id);
         if(p) p.classList.add('hidden-pane');
         
         let b = document.getElementById('btn-' + id);
         if(b){
              b.classList.remove('bg-white/10', 'text-white', 'border-white/5'); 
              b.classList.add('bg-transparent', 'text-zinc-500', 'border-transparent');
              b.querySelector('i').classList.remove('text-indigo-400', 'text-blue-500', 'text-emerald-500');
         }
    });

    let targetPane = document.getElementById('pane-' + paneID); 
    if(targetPane) targetPane.classList.remove('hidden-pane');
    
    let targetBtn = document.getElementById('btn-' + paneID);
    if(targetBtn){
         targetBtn.classList.remove('bg-transparent', 'text-zinc-500', 'border-transparent'); 
         targetBtn.classList.add('bg-white/10', 'text-white', 'border-white/5');
         let ic = targetBtn.querySelector('i');
         if(ic) ic.classList.add(paneID === 'api' ? 'text-emerald-500' : 'text-indigo-400');
    }

    if (paneID === 'dash') renderCoreDash();
    if (paneID === 'inventory') renderHardwareTable();
    if (paneID === 'crm') renderClientsTable();
    if (paneID === 'api') startApiTerminal();
    if (paneID === 'mail') loadSystemMailbox();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
     let getRoute = btn.id.split('-')[1];
     btn.addEventListener('click', () => setActiveTab(getRoute));
});


// 3. CORE LEDGER (DASHBOARD)
function renderCoreDash() {
     if(window.activePane !== 'dash') return; 
     let mem = getDatabase();

     document.getElementById('dash-gmv').innerText = fmtUsd.format(mem.platformFinances.grossMerchandiseValue);
     document.getElementById('dash-rev').innerText = fmtUsd.format(mem.platformFinances.platformCommission);
     document.getElementById('dash-ord-len').innerText = mem.orders.length;
     document.getElementById('dash-prod-len').innerText = mem.listings.length;

     const feedDOM = document.getElementById('render-recent-sales');
     if (mem.orders.length > 0){
          feedDOM.innerHTML = mem.orders.slice(0, 10).map(tx => `
              <div class="p-4 hover:bg-[#111] transition rounded-xl flex items-center justify-between mb-1 group border border-transparent hover:border-white/5">
                   <div>
                       <div class="text-white text-sm font-semibold mb-0.5 line-clamp-1 max-w-[200px] xl:max-w-[350px]">${tx.item}</div>
                       <div class="text-zinc-500 text-xs">Node Auth: ${tx.user}</div>
                   </div>
                   <div class="text-right">
                       <div class="text-white font-medium mb-0.5 text-sm">${fmtUsd.format(tx.val)}</div>
                       <div class="text-indigo-400 bg-indigo-500/10 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-indigo-500/20">${tx.date}</div>
                   </div>
              </div>
          `).join('');
     } else { feedDOM.innerHTML = '<div class="text-center font-medium text-[10px] text-zinc-600 mt-12 uppercase tracking-widest font-mono">No network transactions resolved</div>'; }

     renderGraphSafe(mem.platformFinances.grossMerchandiseValue);
}

function renderGraphSafe(gmvValue) {
    const ctx = document.getElementById('revenueGraphObj').getContext('2d');
    if (dashChartRef) dashChartRef.destroy();
    
    let base = (gmvValue > 2000) ? (gmvValue * 0.45) : 3250;
    
    let grad = ctx.createLinearGradient(0,0,0,320);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    grad.addColorStop(1, 'transparent');

    dashChartRef = new Chart(ctx, { 
        type: 'line', data: { labels: ['Q1', 'Q2', 'Q3', 'Current Term Vector'], datasets: [{ data: [base*0.4, base*0.7, base*1.3, gmvValue], backgroundColor: grad, fill: true, borderColor: '#635BFF', tension: 0.35, pointRadius: 3, pointBackgroundColor: 'white' }] }, 
        options: { responsive:true, maintainAspectRatio: false, plugins: { legend: {display:false} }, scales: { x:{grid:{display:false}, ticks:{font:{family:'monospace'}, color:'rgba(255,255,255,0.4)'}}, y:{display:false} } }
    });
}


// 4. HARDWARE DATABASE BUILDER
document.getElementById('create-prod-form')?.addEventListener('submit', (fA)=> {
     fA.preventDefault(); let dBObj = getDatabase();
     let txtName = document.getElementById('inv-nm').value.trim();
     let moneyTarget = parseFloat(document.getElementById('inv-prc').value);
     let vendString = document.getElementById('inv-ven').value.trim();

     dBObj.listings.unshift({ id:'NXP_'+Math.floor(Math.random()*85000), vendor:vendString, name:txtName, desc:document.getElementById('inv-dsc').value.trim(), price:moneyTarget, icon:'fa-microchip' });
     saveDatabase(dBObj); 
     document.getElementById('create-prod-form').reset();
     
     let btnStatus= document.getElementById('btn-save-prod'); btnStatus.innerText= "Listing Live Online!"; btnStatus.classList.add('bg-emerald-500', 'text-white', 'shadow-emerald-500/20');
     pushSystemWebmail("System Storage Module", `Network Catalog Entry: ${txtName}`, `Asset added for marketplace dispersal priced at ${fmtUsd.format(moneyTarget)} from supplier ${vendString}. Active parsing authorized via Public Front-End Storeform.`);
     setTimeout(()=>{btnStatus.innerText="Launch To Active Market"; btnStatus.classList.remove('bg-emerald-500','text-white', 'shadow-emerald-500/20')},1800);
     
     renderHardwareTable();
});

window.dLTInventoryItemUI = function(tgtID){
    let cState = getDatabase(); 
    cState.listings = cState.listings.filter(zx => zx.id !== tgtID);
    saveDatabase(cState); 
    renderHardwareTable();
}

function renderHardwareTable(){
    let catDb = getDatabase().listings;
    document.getElementById('render-prods-list').innerHTML = catDb.map(hX=> `
        <div class="bg-[#111] p-4 rounded-xl flex justify-between items-center group shadow-md border border-white/5 transition hover:border-white/20">
             <div class="flex gap-4 items-center">
                  <div class="w-12 h-12 bg-black border border-white/5 rounded-lg flex items-center justify-center group-hover:text-indigo-400 text-zinc-500 transition-colors shadow-inner"><i class="fa-solid fa-server"></i></div>
                  <div>
                      <div class="text-white text-xs font-semibold uppercase mb-1">${hX.name}</div>
                      <div class="text-[9px] text-zinc-500 font-mono tracking-widest"><span class="text-zinc-200 font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 shadow mr-1">${fmtUsd.format(hX.price)}</span> SRC: ${hX.vendor} | REF: ${hX.id}</div>
                  </div>
             </div>
             <button onclick="dLTInventoryItemUI('${hX.id}')" class="px-3 py-2 border border-white/5 bg-red-900/10 hover:border-red-500/50 hover:bg-red-500 text-red-500/80 hover:text-white transition rounded-lg text-[9px] uppercase tracking-widest font-mono font-bold opacity-0 group-hover:opacity-100 flex items-center"><i class="fa-solid fa-trash mr-2 text-[11px]"></i> Expunge</button>
        </div>
    `).join('');
}


// 5. CRM DATA EXPORT
function renderClientsTable() {
    let clientsNode = getDatabase().vendors;
    let hookBox = document.getElementById('v-crm-tbody');
    
    if(clientsNode.length === 0){ hookBox.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-xs text-zinc-600 font-mono font-medium">Wait State: Empty Data Set.</td></tr>'; return; }
    
    hookBox.innerHTML= clientsNode.map(cp=><tr class="hover:bg-white/5 transition-colors group"> <td class="p-6 text-zinc-300 font-medium font-sans flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-400 font-bold font-mono shadow">${cp.storeName.charAt(0).toUpperCase()}</div> <span class="tracking-wide">${cp.storeName} <br><span class="text-zinc-500 text-[9px] tracking-widest font-mono font-bold uppercase">${cp.owner}</span></span></td> <td class="p-6 text-indigo-400 font-medium text-center font-sans tracking-wide border-l border-white/5">${fmtUsd.format(cp.lifetimeSales)}</td> <td class="p-6 text-center text-[10px] font-mono tracking-widest font-bold text-zinc-400"><div class="inline-block bg-[#111] px-2 py-1 rounded shadow uppercase border border-white/5"><i class="fa-solid fa-circle-check text-blue-500/60 mr-2"></i>${cp.status}</div></td> </tr>).join('');
}

// SECURE EXPORTER 
document.getElementById('crm-csv-btn')?.addEventListener('click', (tDomE) => {
     let vendorsExport = getDatabase().vendors;
     if(vendorsExport.length === 0) return;

     let csvConstructStr = "Registered Market Merchant Node, Accumulate Payment Gateway GMV Yield, Network Route Clearance Level\n" + vendorsExport.map(p=> `"${p.storeName}","${p.lifetimeSales}","${p.status}"`).join('\n');
     
     let buildLinkElem = document.createElement('a');
     let stringBlobRaw = new Blob([csvConstructStr], {type: 'text/csv;charset=utf-8;'});
     buildLinkElem.href = URL.createObjectURL(stringBlobRaw);
     buildLinkElem.download = `Market_Ops_Terminal_Extraction_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
     
     document.body.appendChild(buildLinkElem); buildLinkElem.click(); document.body.removeChild(buildLinkElem);

     let dTxBtn = tDomE.currentTarget; dTxBtn.innerHTML = "<i class='fa-solid fa-check'></i> Extraction Complete"; 
     setTimeout(()=>{ dTxBtn.innerHTML = '<i class="fa-solid fa-file-excel mr-2 text-[13px]"></i> Save Local Dump Table'; }, 2000);
});


// 6. TERMINAL DEV LAYER
window.copyToMemVaultClipUI = function(sCopyKeyRefTxt) {
     navigator.clipboard.writeText(sCopyKeyRefTxt);
     let tMStrDomObj = document.getElementById('terminal-screen');
     tMStrDomObj.innerHTML += `<div><span class="text-emerald-700/60 font-medium">[${new Date().toLocaleTimeString()}]</span> API_HTTP_ACT >> Security Signature Encrypted Tag Intercept. Safe UI Copy Success.</div>`;
     tMStrDomObj.scrollTop = tMStrDomObj.scrollHeight;
}

document.getElementById('generate-token-btn')?.addEventListener('click', ()=>{
     let bPPKeyValGenerateCodeObj= 'net_tck_' + Math.random().toString(36).substring(2,12) + '_x';
     
     let trgtDOMContainer = document.getElementById('api-keys-list');
     let vDivGenBuilderNewRowHtmlDataUI = document.createElement('div'); vDivGenBuilderNewRowHtmlDataUI.className = "bg-black/60 p-3 rounded-xl border border-emerald-500/30 shadow-inner group mt-4";
     vDivGenBuilderNewRowHtmlDataUI.innerHTML = `
           <div class="flex justify-between font-mono font-bold tracking-[0.2em] text-[8px] text-zinc-500 uppercase mb-2">Automated Minted System Link Route <span class="text-zinc-600 bg-black px-1.5 rounded tracking-tighter">Bearer Env</span></div>
           <div class="flex bg-[#111] border border-white/5 rounded-md focus-within:border-emerald-500 transition overflow-hidden">
               <input type="password" value="${bPPKeyValGenerateCodeObj}" class="px-3 py-1.5 w-full text-white font-mono text-[10px] outline-none bg-transparent pointer-events-none" readonly>
               <button onclick="copyToMemVaultClipUI('${bPPKeyValGenerateCodeObj}')" class="px-4 border-l border-white/10 hover:bg-white text-zinc-500 hover:text-black transition-colors"><i class="fa-solid fa-copy"></i></button>
           </div>
     `;
     trgtDOMContainer.prepend(vDivGenBuilderNewRowHtmlDataUI);
     document.getElementById('terminal-screen').innerHTML += `<div class="font-bold text-white">[${new Date().toLocaleTimeString()}] HOST/DB_LINK >> Successfully generated bearer auth hash format logic loop key. Array safe. </div>`;
});

function startApiTerminal() {
     let vDOMTrmMap= document.getElementById('terminal-screen');
     let phraseListStArr= ['[SYSPING 41ms] Checking Server Array Mappings.', '[HTTP POST] Checkouts Routing Array -> Cleared Database Array', '[CRON] Fetch GMV Matrix Calculations: Success!', '[OK 200] Terminal Render Component Node Data UI Stream attached.'];
     
     clearInterval(apiLoggerInterval);
     apiLoggerInterval = setInterval(() => {
          vDOMTrmMap.innerHTML += `<div><span class="text-emerald-700/60 font-medium">[${new Date().toLocaleTimeString()}]</span> ${phraseListStArr[Math.floor(Math.random() * phraseListStArr.length)]}</div>`;
          if (vDOMTrmMap.children.length > 25) vDOMTrmMap.removeChild(vDOMTrmMap.firstChild);
          vDOMTrmMap.scrollTop = vDOMTrmMap.scrollHeight;
     }, 3200);
}


// 7. SAFE WEBMAIL PARSER 
function loadSystemMailbox() {
    let emailDCoreObjListRefArrayDataMemVaultMap= getDatabase().emails;
    document.getElementById('v-email-list').innerHTML = emailDCoreObjListRefArrayDataMemVaultMap.map((emailElementDataObjectAPI, objArrIdNumFormatPositionUIElementsMarkupVal) => `
        <div onclick="safeReadMailBoxCommandUIMessageValDataStructMapFunctionRefLogicUIElementsArchitecture(${objArrIdNumFormatPositionUIElementsMarkupVal})" class="p-4 border-b border-app-border cursor-pointer transition relative hover:bg-[#0a0a0f] group bg-[#020202]">
             ${emailElementDataObjectAPI.unread ? '<div class="absolute w-[4px] h-[35%] top-[30%] bg-indigo-500 rounded right-0"></div>' : ''}
             <div class="flex justify-between items-center text-[10px] mb-2 font-mono uppercase tracking-[0.2em] font-bold text-zinc-500"><div class="${emailElementDataObjectAPI.unread ? 'text-indigo-400' : 'text-zinc-600'} transition"><i class="fa-solid fa-fingerprint text-zinc-700 mr-2"></i>${emailElementDataObjectAPI.sender}</div><span class="bg-[#111] px-1 rounded">${emailElementDataObjectAPI.date.split(',')[0]}</span></div>
             <div class="text-white text-[13px] font-sans font-semibold mb-1 w-[90%] truncate group-hover:text-blue-400 transition">${emailElementDataObjectAPI.subj}</div>
             <div class="text-zinc-500 text-xs font-light line-clamp-1 opacity-70">${emailElementDataObjectAPI.body}</div>
        </div>
    `).join('');
}

window.safeClearMsgWindowAppLogicCommandStateUI= function(){
     document.getElementById('v-email-reader').innerHTML = '<div class="w-full h-full border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-zinc-600 uppercase font-mono tracking-widest text-[9px] font-bold shadow-inner">Decryption Block Memory Buffer Scrubbed.</div>';
}

window.safeReadMailBoxCommandUIMessageValDataStructMapFunctionRefLogicUIElementsArchitecture = function(sDNumObjAPIValUIListHTMLCSSStrHtmlListLocPositionArrId) {
    let internalSecureAccessStoreVariableReadFrameworkComponentArrayDOM= getDatabase();
    let currentObjectTargMessageReadArchitectureLayoutVariablesObjUI = internalSecureAccessStoreVariableReadFrameworkComponentArrayDOM.emails[sDNumObjAPIValUIListHTMLCSSStrHtmlListLocPositionArrId];
    
    // Process "Unread" Toggle natively
    internalSecureAccessStoreVariableReadFrameworkComponentArrayDOM.emails[sDNumObjAPIValUIListHTMLCSSStrHtmlListLocPositionArrId].unread = false;
    saveDatabase(internalSecureAccessStoreVariableReadFrameworkComponentArrayDOM);
    loadSystemMailbox(); // visual re-render right away!
    
    document.getElementById('v-email-reader').innerHTML = `
         <div class="max-w-2xl w-full flex flex-col relative bg-[#020202] border border-white/5 shadow-2xl p-10 rounded-2xl animate-fade overflow-hidden">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent"></div>
              
              <div class="bg-indigo-600 w-fit text-[9px] px-2 py-0.5 rounded shadow mb-6 text-white font-mono uppercase font-bold tracking-[0.2em] shadow-indigo-500/20">Authorized Terminal Hook Data Routing Frame ${currentObjectTargMessageReadArchitectureLayoutVariablesObjUI.date}</div>
              
              <h2 class="text-2xl font-bold font-sans text-white mb-6 border-b border-white/10 pb-6 w-full leading-snug drop-shadow">${currentObjectTargMessageReadArchitectureLayoutVariablesObjUI.subj}</h2>
              <div class="bg-[#111] p-3 text-[10px] font-mono tracking-[0.2em] font-bold text-zinc-400 mb-8 border border-white/5 uppercase rounded">
                   Signal Broadcast Node Output Routing: <b class="ml-3 font-black text-indigo-400 px-2 bg-indigo-500/10 rounded drop-shadow">${currentObjectTargMessageReadArchitectureLayoutVariablesObjUI.sender}</b>
              </div>
              
              <div class="text-sm font-sans font-medium text-zinc-300 whitespace-pre-wrap px-6 border-l-4 border-indigo-600 bg-[#0a0a0f] py-4 leading-relaxed">${currentObjectTargMessageReadArchitectureLayoutVariablesObjUI.body}</div>
              
              <div class="mt-10 flex w-full border-t border-white/5 pt-8">
                  <button onclick="safeClearMsgWindowAppLogicCommandStateUI()" class="px-5 py-2.5 bg-black hover:bg-[#111] border border-white/5 text-[9px] font-mono text-zinc-500 hover:text-white tracking-[0.2em] uppercase font-bold rounded shadow transition active:scale-95"><i class="fa-solid fa-check text-green-500 mr-2 text-[12px]"></i> Dispose Reading Render Frame Data Context Sequence Log UI</button>
              </div>
         </div>
    `;
};


// Execute initial run mapping functionality layout Object arrays component String mapping
setActiveTab('dash');
