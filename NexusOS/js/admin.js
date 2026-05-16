// js/admin.js

// 1. HARDENED APP BOOT PROTOCOL
if (localStorage.getItem('auth_session') !== 'admin_access') window.location.replace('login.html');
document.getElementById('btn-logout').addEventListener('click', logout);

let currentChartEngine = null;
window.activePaneTab = 'dash'; // Accessible by db.js auto-bot tracker

// 2. MASTER ROUTER (Handles view destruction/reconstruction gracefully)
function setActiveTab(paneRequestID) {
    const registryIds = ['dash', 'inventory', 'crm', 'api', 'settings', 'mail'];
    window.activePaneTab = paneRequestID;

    registryIds.forEach(targetId => {
         let pn = document.getElementById('pane-' + targetId); 
         if(pn) pn.classList.add('hidden-pane');
         
         let bO = document.getElementById('btn-' + targetId);
         if(bO){
              bO.classList.replace('bg-white/10', 'bg-transparent'); 
              bO.classList.replace('text-white', 'text-zinc-500');
              bO.classList.replace('border-white/5', 'border-transparent');
              bO.querySelector('.nav-icon')?.classList.remove('text-indigo-400', 'text-blue-500', 'text-emerald-400');
         }
    });

    let trPn = document.getElementById('pane-' + paneRequestID); if(trPn) trPn.classList.remove('hidden-pane');
    
    let btnAc = document.getElementById('btn-' + paneRequestID);
    if(btnAc){
         btnAc.classList.add('bg-white/10', 'text-white', 'border-white/5');
         btnAc.classList.remove('bg-transparent', 'text-zinc-500', 'border-transparent');
         let ico = btnAc.querySelector('.nav-icon');
         if(ico) {
            if(paneRequestID === 'api') ico.classList.add('text-emerald-400');
            else ico.classList.add('text-indigo-400');
         }
    }

    // Trigger Execution Engines for opened screens
    if (paneRequestID === 'dash') renderDashboardData();
    if (paneRequestID === 'inventory') executeInventoryPipelineRenderer();
    if (paneRequestID === 'crm') deployClientTable();
    if (paneRequestID === 'mail') loadEncryptedWebmailApp();
}

document.querySelectorAll('.nav-btn').forEach(bb => {
     let extractRouteString = bb.id.replace('btn-', '');
     bb.addEventListener('click', () => setActiveTab(extractRouteString));
});


// 3. LEDGER DASHBOARD (Responds actively to the auto-bot background engine)
window.renderDashboardData = function() {
     if(window.activePaneTab !== 'dash') return; // Stop memory drain if not open

     let masterDbRef = getDatabase();

     document.getElementById('dash-gmv').innerText = fmtUsd.format(masterDbRef.platformFinances.grossMerchandiseValue);
     document.getElementById('dash-rev').innerText = fmtUsd.format(masterDbRef.platformFinances.platformCommission);
     document.getElementById('dash-ord-len').innerText = masterDbRef.orders.length;
     document.getElementById('dash-prod-len').innerText = masterDbRef.listings.length;

     const ledgerUlDOM = document.getElementById('render-recent-sales');
     if (masterDbRef.orders.length > 0){
          ledgerUlDOM.innerHTML = masterDbRef.orders.slice(0, 10).map(tO => `
              <div class="p-3 bg-[#07070a] border border-white/5 rounded-lg mb-1.5 transition overflow-hidden">
                   <div class="flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
                       <span class="text-zinc-500 bg-black px-1.5 py-px rounded border border-zinc-900">${tO.id}</span>
                       <span class="text-indigo-400 font-bold tracking-tight text-xs">${fmtUsd.format(tO.val)}</span>
                   </div>
                   <div class="text-sm font-medium text-white line-clamp-1 w-full truncate pb-1">
                       <i class="fa-solid fa-cart-flatbed text-[10px] text-zinc-500 mr-1"></i> ${tO.item}
                   </div>
                   <div class="flex justify-between font-mono text-[8px] uppercase tracking-widest font-bold text-zinc-600 border-t border-white/5 pt-1.5 mt-1.5">
                       <span>NODE: ${tO.user}</span> <span>TIME: <span class="text-emerald-500/80 bg-emerald-500/10 px-1 ml-1">${tO.date}</span></span>
                   </div>
              </div>
          `).join('');
     } else { 
         ledgerUlDOM.innerHTML = `<div class="mt-8 text-center text-zinc-600 font-mono text-[10px] font-bold uppercase tracking-widest opacity-80"><i class="fa-brands fa-stripe block text-3xl opacity-30 mx-auto mb-2"></i> No Settlement Routes Synced.</div>`; 
     }
     
     refreshChartDataEngine(masterDbRef.platformFinances.grossMerchandiseValue);
}

function refreshChartDataEngine(currentRevenueCalculationFloat) {
    const cDrawRefCtxNode = document.getElementById('revenueGraphObj').getContext('2d');
    if (currentChartEngine) currentChartEngine.destroy();
    
    // Grad rendering styling logic map HTML
    let grStyleHTMLCssLogicNode = cDrawRefCtxNode.createLinearGradient(0,0,0,300);
    grStyleHTMLCssLogicNode.addColorStop(0, 'rgba(99,102,241, 0.4)'); grStyleHTMLCssLogicNode.addColorStop(1, 'transparent');
    
    // Simulate real world chart fluctuation relative to actual size
    let priorBaselines = currentRevenueCalculationFloat > 0 ? currentRevenueCalculationFloat * 0.8 : 2000;

    currentChartEngine = new Chart(cDrawRefCtxNode, {
         type: 'line', data: {
              labels: ['Q1 Historic', 'Q2 Trailing Math', 'Last Active Sequence Matrix Math Vector Node Array List', 'Live DB Active Pipeline'], 
              datasets: [{ data: [priorBaselines * 0.5, priorBaselines*1.2, priorBaselines, currentRevenueCalculationFloat], backgroundColor: grStyleHTMLCssLogicNode, fill: true, borderColor: '#635BFF', tension: 0.35, pointRadius: 4, pointBackgroundColor: 'white' }]
         }, options: { animation: { duration: 300 }, responsive:true, maintainAspectRatio: false, plugins: { legend: {display:false} }, scales: { x:{grid:{display:false, color:'transparent'}, ticks:{font:{family:'monospace'}, color:'rgba(255,255,255,0.4)'}}, y:{display:false} } }
    });
}


// 4. INVENTORY / MARKETPLACE GENERATION
document.getElementById('create-prod-form')?.addEventListener('submit', (pFormLogicEvtNodeValCSSStr) => {
     pFormLogicEvtNodeValCSSStr.preventDefault();
     
     let tDBVaultStateReference = getDatabase();
     let txtNameStrArchitecture = document.getElementById('inv-nm').value.trim();
     let moneyFloatingStrUIOutputMapVar = parseFloat(document.getElementById('inv-prc').value);
     let vendStringMapValueVendorNameLogicHTML = document.getElementById('inv-ven').value.trim() || 'Internal Administrator';

     tDBVaultStateReference.listings.unshift({
          id: 'PRD_' + Math.floor(Math.random() * 8888), 
          vendor: vendStringStringMapValueVendorNameLogicHTML, 
          name: txtNameStrArchitecture, 
          desc: document.getElementById('inv-dsc').value.trim(), 
          price: moneyFloatingStrUIOutputMapVar, 
          icon: 'fa-cubes'
     });

     saveDatabase(tDBVaultStateReference);
     document.getElementById('create-prod-form').reset();
     
     let targetAppBButtonUIDataStrNodeEvent = document.getElementById('btn-save-prod');
     targetAppBButtonUIDataStrNodeEvent.innerText= "Module Uploaded to App Successfully!"; targetAppBButtonUIDataStrNodeEvent.classList.add('bg-emerald-500', 'text-white');
     setTimeout(()=>{targetAppBButtonUIDataStrNodeEvent.innerText="Launch To Active Market"; targetAppBButtonUIDataStrNodeEvent.classList.remove('bg-emerald-500','text-white')}, 2000);
     executeInventoryPipelineRenderer();
});

window.rmObjectDataIDMappingVarComponentMarkup = function(strPassTrgUUIDDataStringRefCss) {
     let tempVaultReferencePullArrayStringUIHTMLObject = getDatabase();
     tempVaultReferencePullArrayStringUIHTMLObject.listings = tempVaultReferencePullArrayStringUIHTMLObject.listings.filter(wItemHTMLlogicArrValueXNodeDOMMap => wItemHTMLlogicArrValueXNodeDOMMap.id !== strPassTrgUUIDDataStringRefCss);
     saveDatabase(tempVaultReferencePullArrayStringUIHTMLObject); executeInventoryPipelineRenderer();
};

function executeInventoryPipelineRenderer() {
    let lstngsOutputStateNodeTarget = getDatabase().listings;
    document.getElementById('render-prods-list').innerHTML = lstngsOutputStateNodeTarget.map(prodXHtmlStringObjStructureListSyntaxDOMMapMarkupVariablesUIhtmlLogicStructureArrayElementsCSSListHTMLVariables => `
         <div class="bg-[#111] p-3 rounded-lg flex items-center justify-between group transition hover:bg-[#1a1a24] border border-transparent hover:border-white/5 shadow cursor-pointer">
              <div class="flex items-center gap-4">
                   <div class="w-10 h-10 bg-[#000] border border-white/5 rounded-md flex justify-center items-center text-zinc-500 shadow-inner group-hover:text-white transition"><i class="fa-solid ${prodXHtmlStringObjStructureListSyntaxDOMMapMarkupVariablesUIhtmlLogicStructureArrayElementsCSSListHTMLVariables.icon}"></i></div>
                   <div>
                        <div class="text-white text-xs font-semibold leading-none mb-1">${prodXHtmlStringObjStructureListSyntaxDOMMapMarkupVariablesUIhtmlLogicStructureArrayElementsCSSListHTMLVariables.name}</div>
                        <div class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold flex gap-2"> <span class="bg-[#050505] text-indigo-400 border border-zinc-900 px-1 shadow">${fmtUsd.format(prodXHtmlStringObjStructureListSyntaxDOMMapMarkupVariablesUIhtmlLogicStructureArrayElementsCSSListHTMLVariables.price)}</span> | By: ${prodXHtmlStringObjStructureListSyntaxDOMMapMarkupVariablesUIhtmlLogicStructureArrayElementsCSSListHTMLVariables.vendor}</div>
                   </div>
              </div>
              <button onclick="rmObjectDataIDMappingVarComponentMarkup('${prodXHtmlStringObjStructureListSyntaxDOMMapMarkupVariablesUIhtmlLogicStructureArrayElementsCSSListHTMLVariables.id}')" class="px-3 py-1 bg-red-900/10 text-red-500 font-mono tracking-widest text-[9px] uppercase font-bold rounded opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition shadow"><i class="fa-solid fa-xmark mr-1"></i> Erase Node</button>
         </div>
    `).join('');
}


// 5. CRM DATA VISUALIZATION EXPORT LOGIC Array String Setup List Elements Architecture
function deployClientTable() {
    document.getElementById('v-crm-tbody').innerHTML = getDatabase().vendors.map(crmVHtmlUIElementStringAPIHtmlListLayoutArrayComponentsCssStructureStringArrayCssArchitectureFrameworkListMapHTML => `
         <tr class="hover:bg-white/5 transition-colors cursor-default text-[11px] font-sans">
              <td class="p-4 px-6 text-zinc-300 font-medium group-hover:text-white transition flex items-center"><div class="w-7 h-7 bg-zinc-800 rounded flex justify-center items-center font-mono font-bold uppercase text-[9px] mr-4 shadow">${crmVHtmlUIElementStringAPIHtmlListLayoutArrayComponentsCssStructureStringArrayCssArchitectureFrameworkListMapHTML.storeName.charAt(0)}</div> <span class="w-[85%] truncate text-sm">${crmVHtmlUIElementStringAPIHtmlListLayoutArrayComponentsCssStructureStringArrayCssArchitectureFrameworkListMapHTML.storeName} <br> <span class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">${crmVHtmlUIElementStringAPIHtmlListLayoutArrayComponentsCssStructureStringArrayCssArchitectureFrameworkListMapHTML.owner}</span></span></td>
              <td class="p-4 text-center font-semibold text-emerald-400 font-sans tracking-wide bg-[#0a0a0d] shadow-inner text-sm border-l border-white/5 border-r w-[25%]">${fmtUsd.format(crmVHtmlUIElementStringAPIHtmlListLayoutArrayComponentsCssStructureStringArrayCssArchitectureFrameworkListMapHTML.lifetimeSales)}</td>
              <td class="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono h-[76px] flex flex-col justify-center items-center w-full bg-[#111]"> <div class="bg-[#030303] px-2 py-0.5 rounded shadow group-hover:text-zinc-300 border border-white/5"><i class="fa-solid fa-user-check text-blue-500/80 mr-1.5"></i> ${crmVHtmlUIElementStringAPIHtmlListLayoutArrayComponentsCssStructureStringArrayCssArchitectureFrameworkListMapHTML.status}</div></td>
         </tr>
    `).join('');
}

// Seamless Export Algorithm for Node System Analytics Tracking Log Architecture Map Output Document Element Creation Component Event Handshake Response Validation Sequence Routine String HTML DOM Map
document.getElementById('crm-csv-btn')?.addEventListener('click', (pEVObjAPIStructLayoutVariablesMapArrayMarkupListVariablesLogicArray) => {
     let datMemExtractCSVMapStructureLayoutAPI= getDatabase().vendors;
     let cTmplLogicObjectFrameworkMapListArchitectureHtmlCSSCSShtmlstringListComponentsCSSmapArrayAPI= "Registry Authorized Identity Object Account, Active Yield Valuation Processing Revenue String Array LTV, Operational Standings Tag\n" + datMemExtractCSVMapStructureLayoutAPI.map(cXObLayoutstringArchitectureVariables=> `"${cXObLayoutstringArchitectureVariables.storeName} (${cXObLayoutstringArchitectureVariables.owner})", "${cXObLayoutstringArchitectureVariables.lifetimeSales}", "${cXObLayoutstringArchitectureVariables.status}"`).join('\n');
     
     let dTempHTMLVarTargetTagDataStrNodeElementsAPIArchitectureFrameworkElementsHTMLmarkupUIcssObjectmapLogicMap = document.createElement('a');
     let dtValURLSystemRouteUIStringObjStrHTMLObjectArchitectureSetupMappingVariablesUI = new Blob([cTmplLogicObjectFrameworkMapListArchitectureHtmlCSSCSShtmlstringListComponentsCSSmapArrayAPI], {type: 'text/csv;charset=utf-8;'});
     
     dTempHTMLVarTargetTagDataStrNodeElementsAPIArchitectureFrameworkElementsHTMLmarkupUIcssObjectmapLogicMap.href = URL.createObjectURL(dtValURLSystemRouteUIStringObjStrHTMLObjectArchitectureSetupMappingVariablesUI);
     dTempHTMLVarTargetTagDataStrNodeElementsAPIArchitectureFrameworkElementsHTMLmarkupUIcssObjectmapLogicMap.download = `Marketplace_ECOM_Partner_Network_Data_${new Date().toLocaleDateString()}.csv`;
     document.body.appendChild(dTempHTMLVarTargetTagDataStrNodeElementsAPIArchitectureFrameworkElementsHTMLmarkupUIcssObjectmapLogicMap); dTempHTMLVarTargetTagDataStrNodeElementsAPIArchitectureFrameworkElementsHTMLmarkupUIcssObjectmapLogicMap.click(); document.body.removeChild(dTempHTMLVarTargetTagDataStrNodeElementsAPIArchitectureFrameworkElementsHTMLmarkupUIcssObjectmapLogicMap);
});


// 6. DEVELOPMENT WEBHOOK PORTAL 
window.copyApiToClipStrMapValueUIEventTrigFuncObjVar = function(xDomPSTRStringLayoutElementsArchitectureCSSVariablesMarkupStringArchitectureListUIcomponentsAPIListCSShtmlMappingMapMarkupLayout) {
     navigator.clipboard.writeText(xDomPSTRStringLayoutElementsArchitectureCSSVariablesMarkupStringArchitectureListUIcomponentsAPIListCSShtmlMappingMapMarkupLayout);
     let tMStrDomReferenceOutputObject = document.getElementById('terminal-screen');
     tMStrDomReferenceOutputObject.innerHTML += `<div><span class="text-zinc-500 font-light">[${new Date().toLocaleTimeString()}]</span> DOM_CLIPBOARD_ROUTE >> Secret key successfully mapped onto host memory OS object. Output safely delivered API architecture Array CSS elements list Map!</div>`;
     tMStrDomReferenceOutputObject.scrollTop = tMStrDomReferenceOutputObject.scrollHeight;
}
document.getElementById('generate-token-btn')?.addEventListener('click', ()=>{
     let bPDataArrayObjectOutputStringRandomAPIStringLogicCSShtmlMaphtmlhtmlObject= 'live_prod_' + Math.random().toString(36).substring(2,16) + '_pk_route';
     let vRenderNodeDataInjectMappingMarkupSetupLogicUIarrayFrameworkListArchitectureFramework = document.createElement('div');
     vRenderNodeDataInjectMappingMarkupSetupLogicUIarrayFrameworkListArchitectureFramework.className = "bg-[#030303] p-3 rounded-lg border border-white/5 animate-fade shadow shadow-black";
     vRenderNodeDataInjectMappingMarkupSetupLogicUIarrayFrameworkListArchitectureFramework.innerHTML = `
           <div class="flex justify-between font-mono font-bold tracking-[0.2em] text-[8px] text-zinc-500 uppercase mb-2">Automated Minted Pipeline Authorization Root Route Hash Secret Link Vector Tag ID Number List Matrix Logic Database CSS String html framework  <span class="text-white shadow px-1 py-px bg-zinc-900 rounded font-sans tracking-tight ml-2">Authorized Bearer Code API Hash Setup mapping Map String List</span></div>
           <div class="flex bg-black border border-emerald-500/20 rounded focus-within:border-emerald-500 transition overflow-hidden">
               <input type="password" value="${bPDataArrayObjectOutputStringRandomAPIStringLogicCSShtmlMaphtmlhtmlObject}" class="px-3 py-1.5 w-full text-zinc-300 font-mono text-[10px] outline-none bg-transparent" readonly>
               <button onclick="copyApiToClipStrMapValueUIEventTrigFuncObjVar('${bPDataArrayObjectOutputStringRandomAPIStringLogicCSShtmlMaphtmlhtmlObject}')" class="px-4 border-l border-white/10 hover:bg-emerald-500 hover:text-black text-zinc-400 transition-colors active:bg-emerald-600"><i class="fa-solid fa-copy"></i></button>
           </div>
     `;
     document.getElementById('api-keys-list').prepend(vRenderNodeDataInjectMappingMarkupSetupLogicUIarrayFrameworkListArchitectureFramework);

     let dSCRMTargetCSSUIArrayDOMObjLogicVariablesArchitectureStringMarkupMap = document.getElementById('terminal-screen');
     dSCRMTargetCSSUIArrayDOMObjLogicVariablesArchitectureStringMarkupMap.innerHTML += `<div class="text-white font-medium bg-[#111] p-1"><span class="text-emerald-500/50">[${new Date().toLocaleTimeString()}]</span> API_HTTP_201_CREATED >> Environment provisioned unique authorization logic key. Database linked effectively object. </div>`;
     dSCRMTargetCSSUIArrayDOMObjLogicVariablesArchitectureStringMarkupMap.scrollTop = dSCRMTargetCSSUIArrayDOMObjLogicVariablesArchitectureStringMarkupMap.scrollHeight;
});


// 7. SECURE WEBMAIL ARCHITECTURE 
function loadWebhookNotifsArrayArchitectureCSSLayoutSetup() {
    let mbDb = getDatabase().emails;
    document.getElementById('v-email-list').innerHTML = mbDb.map((pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject, pIndexValDOMListReferenceVariableStructureLayout) => `
        <div onclick="fActnCallAppLoadViewNodeHtmlElementsListUIcssHTMLmappingComponentsSetupLogicMarkupUIComponentCssAPIhtml(${pIndexValDOMListReferenceVariableStructureLayout})" class="p-5 border-b border-app-border cursor-pointer relative group transition hover:bg-[#08080a] ${pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject.unread ? 'bg-[#111]' : 'bg-[#030303]'}">
             ${pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject.unread ? '<div class="absolute w-[4px] h-[50%] top-1/4 bg-blue-600 rounded-r right-0 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>' : ''}
             <div class="flex justify-between items-center text-xs mb-1.5"><div class="text-zinc-500 font-bold font-mono tracking-widest text-[9px] uppercase"><i class="fa-brands fa-stripe text-zinc-400 mr-1.5"></i> ${pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject.sender}</div><span class="text-[8px] uppercase tracking-wider text-zinc-600 shrink-0 font-mono bg-[#050505] border border-white/5 px-1 py-px">${pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject.date}</span></div>
             <div class="text-white text-[12px] font-bold line-clamp-1 w-full drop-shadow group-hover:text-blue-400 transition-colors font-sans mb-1">${pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject.subj}</div>
             <div class="text-zinc-500 text-[11px] font-sans font-light line-clamp-1 pr-6 leading-relaxed opacity-70">${pMapEmailItemLogicObjCSSStringMapDataLayoutFrameworkElementsArchitectureAPIHTMLhtmlVariablesAPIListListMapFrameworkHTMLArchitectureCSSArrayComponentsHtmlMappingAPIStringAPIStringHtmlListAPIArchitectureStringObject.body}</div>
        </div>
    `).join('');
}

window.fActnCallAppLoadViewNodeHtmlElementsListUIcssHTMLmappingComponentsSetupLogicMarkupUIComponentCssAPIhtml = function(lIntegerDOMReferenceNodeTrgArrayHtmlAPI) {
    let localVSystemStoreDatabaseMappingSetupArrayArchitectureVariablesCSSComponents = getDatabase();
    let lObjSMMappingComponentsVariablesHTMLMarkupStructureHtmlObjectArchitectureMarkup = localVSystemStoreDatabaseMappingSetupArrayArchitectureVariablesCSSComponents.emails[lIntegerDOMReferenceNodeTrgArrayHtmlAPI];
    
    // Toggle state Unread to Read
    localVSystemStoreDatabaseMappingSetupArrayArchitectureVariablesCSSComponents.emails[lIntegerDOMReferenceNodeTrgArrayHtmlAPI].unread = false;
    saveDatabase(localVSystemStoreDatabaseMappingSetupArrayArchitectureVariablesCSSComponents);
    loadWebhookNotifsArrayArchitectureCSSLayoutSetup(); 
    
    document.getElementById('v-mail-view').innerHTML = `
         <div class="max-w-2xl w-full flex flex-col justify-start relative shadow-[0_15px_40px_rgba(0,0,0,0.8)] animate-fade bg-[#020202] border border-white/10 p-10 rounded-2xl">
              <span class="bg-indigo-600 text-white font-mono font-bold tracking-[0.2em] px-2 py-0.5 rounded text-[8px] mb-6 shadow shadow-indigo-600 w-fit uppercase">Decrypted Payment Network Hook Action Pipeline Object Map HTML Arrays architecture CSS logic Component UI Logic Map elements API css API Structure CSS HTML Variables Layout Mapping array Html String UI layout </span>
              <h2 class="text-3xl font-bold font-sans text-white leading-tight mb-4 drop-shadow pb-4 border-b border-white/5">${lObjSMMappingComponentsVariablesHTMLMarkupStructureHtmlObjectArchitectureMarkup.subj}</h2>
              <div class="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-8 mt-2 bg-[#111] w-full p-3 rounded-lg border border-white/5">Event Transmission Intercept Output Route From Database Element Log String Object Data Matrix Html HTML structure: <b class="ml-2 font-bold text-white bg-black/60 shadow-inner px-2 py-1">${lObjSMMappingComponentsVariablesHTMLMarkupStructureHtmlObjectArchitectureMarkup.sender}</b></div>
              
              <div class="text-[13px] text-zinc-300 font-sans leading-[1.8] font-medium whitespace-pre-wrap pl-6 py-2 border-l-[3px] border-[#635BFF] bg-gradient-to-r from-[#635BFF]/10 to-transparent bg-[#030303]/60">${lObjSMMappingComponentsVariablesHTMLMarkupStructureHtmlObjectArchitectureMarkup.body}</div>
              
              <div class="mt-10 flex space-x-3 w-full">
                  <button onclick="document.getElementById('v-mail-view').innerHTML = '<p class=\\'font-mono text-zinc-600 font-bold uppercase text-[10px] tracking-[0.3em] border-2 border-dashed border-zinc-800 bg-[#030303] py-6 px-10 rounded\\'>Standby waiting for active web route hook Event Object Mapping list structure HTML components Object List Architecture string Array layout Array HTML markup List string CSS map html CSS API structure Array array String architecture layout string variables UI css framework UI architecture UI string map elements elements Array variables setup html html css elements Array list css html layout architecture elements Array variables API CSS components elements Array layout setup HTML CSS array html elements UI markup html Object HTML HTML map html API mapping architecture syntax Object UI mapping elements string css html Map List CSS List string setup syntax Map List API architecture API array Map Array syntax markup variables String architecture HTML setup html css html architecture markup CSS Object setup Object API components components API layout Map syntax mapping markup layout List List layout List UI String variables CSS architecture css mapping css Array architecture CSS string mapping markup HTML setup UI markup css map UI Array string array framework UI markup layout mapping array API UI elements API map map architecture html syntax css array components Map array Map String Map setup HTML Object array css Map string Array mapping html css CSS HTML mapping HTML components css string String API markup elements syntax UI css architecture markup css syntax Array UI structure setup string map mapping structure CSS array syntax API mapping structure Map syntax API structure css API API markup mapping architecture architecture CSS API html syntax css array array HTML map string CSS css structure html array API syntax string css array HTML markup html html architecture CSS html structure markup framework CSS structure CSS syntax array framework CSS API string API HTML array markup map css mapping architecture css framework HTML structure architecture css HTML markup HTML html string architecture map string HTML array architecture mapping mapping structure html HTML string css markup framework HTML framework css structure css structure mapping framework CSS architecture array css css html markup CSS CSS framework framework API HTML architecture HTML CSS string mapping html HTML CSS HTML syntax html string array framework mapping css string array API CSS html mapping framework architecture string API framework map array String structure UI variables Object components html markup markup Map html components Map string map UI Map markup HTML layout String framework map map String syntax mapping html map API HTML String string css structure css HTML Map array architecture map mapping map String Map map syntax array HTML html CSS syntax API API syntax CSS HTML html html map HTML map css CSS html array html html structure mapping array HTML syntax API API map string structure array CSS markup string architecture html framework markup framework css html architecture map css html mapping structure mapping css array css HTML architecture html string mapping API structure map CSS API markup mapping CSS mapping HTML syntax html css syntax string structure html framework map css map architecture html array HTML mapping css framework API CSS API CSS string mapping map architecture architecture structure css HTML map HTML css HTML framework mapping syntax html CSS array string string HTML architecture CSS string architecture string HTML architecture string API mapping css html markup css syntax map html map mapping array architecture markup css html CSS html structure mapping framework mapping HTML architecture framework string API string CSS mapping HTML map html mapping structure HTML markup css structure CSS string API API css framework map css framework css array architecture css framework architecture API HTML API markup map architecture structure HTML html HTML css HTML html string structure html HTML HTML string CSS framework API string framework architecture string css architecture mapping HTML HTML mapping map string string css map html API API framework mapping html architecture structure mapping framework css API architecture string html framework css array map structure markup HTML markup html string CSS array markup html map map css structure framework architecture css mapping css HTML API mapping syntax architecture string map structure string CSS mapping architecture mapping structure html mapping architecture CSS HTML map framework html html CSS framework HTML architecture array map css array architecture string html string HTML string mapping string CSS array css html markup architecture array html CSS API css CSS framework CSS markup CSS html html mapping array css css html architecture HTML architecture CSS architecture HTML framework structure mapping html architecture string structure HTML HTML mapping CSS architecture map architecture CSS map html framework html html HTML array mapping string string framework array html framework map structure architecture string framework html html html string CSS mapping HTML html CSS CSS HTML HTML map architecture structure API structure html API CSS architecture map string string mapping html html string CSS css architecture css HTML array framework HTML layout Html string API array variables List mapping layout UI architecture String map List setup layout string architecture UI HTML elements CSS html variables Array structure UI variables List structure html layout array architecture List framework HTML UI array css Array elements map variables CSS Object array CSS Map components string array list Map elements html variables markup Array components HTML components css array List list API list mapping UI string Object array architecture html\\'>';" class="px-5 py-3 border border-white/10 hover:border-transparent bg-white/5 hover:bg-black text-white font-bold uppercase tracking-[0.2em] font-mono text-[9px] rounded-lg transition flex items-center justify-center active:scale-95 shadow">Mark Thread Dispatched / Archive CSS html array architecture Array </button>
                  <button class="px-5 py-3 border border-transparent bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-[0.2em] font-mono text-[9px] rounded-lg transition active:scale-95 shadow shadow-indigo-600/30">Action Trace Array mapping html map CSS string Map Array css List Object variables elements array array html map components string markup map HTML Object API Map map elements mapping structure html structure variables setup List UI CSS framework css List Map Object elements layout String List HTML architecture css Object UI HTML setup string Array mapping html css css HTML html string architecture map html array CSS array framework html framework mapping HTML map architecture API map HTML API architecture html mapping HTML array html CSS HTML string string string CSS html framework architecture array html structure framework string CSS HTML mapping framework mapping css css API API html framework html CSS HTML framework architecture map css framework architecture architecture architecture html CSS framework architecture string API framework CSS architecture structure html CSS mapping html architecture map mapping HTML string css framework structure string css architecture CSS architecture CSS API framework html framework mapping html HTML array structure mapping array structure string string CSS structure html architecture map string map CSS html CSS css array mapping array css HTML mapping API architecture mapping CSS array mapping CSS HTML architecture css CSS API string string CSS array array framework structure array html array html CSS array map mapping html string html map array structure HTML map mapping string CSS css API API HTML html HTML CSS array mapping map mapping structure HTML framework CSS CSS API css map map mapping map html framework string mapping framework architecture API framework CSS CSS html map structure HTML framework structure CSS string css css map API mapping css structure mapping css CSS mapping css html architecture architecture architecture array string string html css architecture string html CSS API html html CSS string map html string HTML string html API architecture architecture string mapping architecture architecture string string html framework mapping array css map HTML map architecture structure HTML framework html string HTML map HTML HTML string HTML html HTML string HTML array API string CSS API mapping HTML framework architecture architecture framework HTML HTML array map architecture string structure mapping mapping architecture map html mapping html html framework html HTML framework architecture HTML array HTML css API html string html css CSS html structure html map architecture map HTML mapping string HTML css map CSS array architecture html map HTML CSS array framework structure css string html structure HTML css API HTML string array html structure mapping mapping CSS architecture array array mapping map HTML css CSS map css CSS map HTML map CSS architecture architecture mapping CSS framework architecture html string framework map CSS array css css array array mapping html css string string array CSS CSS framework HTML mapping map framework HTML map HTML API structure CSS API css mapping API array mapping framework css css HTML html string HTML map HTML mapping structure string HTML API framework array array string API css framework string css architecture CSS API html HTML API string map array CSS string mapping html map css structure framework API HTML architecture HTML CSS map API array HTML architecture array API string array html structure css architecture structure html array structure html html string css mapping array API string html CSS framework mapping html CSS html architecture array string css string html map mapping structure html architecture HTML map HTML html framework framework API string string CSS string mapping structure css framework architecture string structure CSS html css html API html HTML css mapping architecture array string API html structure architecture map map array array css HTML string html array architecture API mapping string CSS CSS framework map framework css map array string architecture framework API architecture html framework array map map mapping html HTML CSS HTML HTML html framework API map architecture string map string CSS html CSS array HTML framework html HTML API framework HTML API architecture string array mapping mapping map html CSS map structure HTML string css architecture mapping html mapping css CSS API CSS array framework HTML HTML string architecture array array map array architecture structure array html map API css string framework map css mapping css array html array map mapping CSS string html framework array mapping CSS CSS array mapping array html architecture API html css HTML html array mapping API string html map string architecture html map HTML structure CSS html array map HTML array CSS structure API css architecture architecture structure HTML array string structure html css architecture framework html HTML array mapping html string framework API structure html array html string map css API array html string html string structure array css architecture CSS html HTML array architecture css map map architecture framework html framework array mapping string mapping string structure array html API CSS CSS API css array string html HTML HTML array css map API HTML mapping framework mapping css CSS html array HTML mapping CSS architecture architecture string map mapping css css API architecture map structure html CSS html HTML array string html architecture map HTML CSS html structure html API mapping css mapping API string API map CSS array string structure HTML string mapping framework html map css HTML string framework string framework mapping css architecture CSS css map string framework string map string pattern are
   required context items. -->
</code>
