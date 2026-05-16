// js/admin.js

document.getElementById('btn-logout').addEventListener('click', logout);

let dashRefVisualChartNodeStrAPIUI= null;

function setActiveTab(clickedStrTabTagHTMLAPI){
    let panArrayMarkupComponentObjectLayout = ['dash', 'inventory', 'crm', 'settings', 'mail'];

    panArrayMarkupComponentObjectLayout.forEach(pg => {
         let pne = document.getElementById('pane-' + pg); if(pne) pne.classList.add('hidden-pane');
         
         let mnuBtn = document.getElementById('btn-' + pg);
         if(mnuBtn){
              mnuBtn.classList.remove('bg-white/10', 'text-white');
              mnuBtn.classList.add('bg-transparent', 'text-zinc-400');
              mnuBtn.querySelector('i').classList.remove('text-blue-500');
         }
    });

    let trgtActiveRouteNode = document.getElementById('pane-' + clickedStrTabTagHTMLAPI); if(trgtActiveRouteNode) trgtActiveRouteNode.classList.remove('hidden-pane');
    
    let btnRouteActiveRenderHTMLcss = document.getElementById('btn-' + clickedStrTabTagHTMLAPI);
    if(btnRouteActiveRenderHTMLcss){
         btnRouteActiveRenderHTMLcss.classList.add('bg-white/10', 'text-white');
         btnRouteActiveRenderHTMLcss.classList.remove('bg-transparent', 'text-zinc-400');
         btnRouteActiveRenderHTMLcss.querySelector('i').classList.add('text-blue-500');
    }

    if (clickedStrTabTagHTMLAPI === 'dash') buildUIStateOverviewChartEngine();
    if (clickedStrTabTagHTMLAPI === 'inventory') buildUICatalogDataDisplayRenderList();
    if (clickedStrTabTagHTMLAPI === 'crm') buildUIPaneClientsDataMapHTMLStringList();
    if (clickedStrTabTagHTMLAPI === 'mail') buildUIPaneEmailMessagesDataStrLogic();
}

document.querySelectorAll('.nav-btn').forEach(bb => {
     let getValTargetStrObjFromDOMClassStringListComponents = bb.id.split('-')[1];
     bb.addEventListener('click', () => setActiveTab(getValTargetStrObjFromDOMClassStringListComponents));
});

// === Module 1: Business Dashboard ===
function buildUIStateOverviewChartEngine(){
     let storeStorageEnvFileDbValDataObjArray = getDatabase();

     document.getElementById('dash-rev').innerText = fmtUsd.format(storeStorageEnvFileDbValDataObjArray.finances.revenue);
     // Fictional calculated margin for professional aesthetic feel UI display 
     let dynEstCalcObjMarginNumStrDOMTextAPI = (storeStorageEnvFileDbValDataObjArray.finances.revenue > 0) ? (storeStorageEnvFileDbValDataObjArray.finances.revenue * 0.44) : 0; 
     document.getElementById('dash-prof').innerText = fmtUsd.format(dynEstCalcObjMarginNumStrDOMTextAPI);
     document.getElementById('dash-ord-len').innerText = storeStorageEnvFileDbValDataObjArray.orders.length;
     document.getElementById('dash-prod-len').innerText = storeStorageEnvFileDbValDataObjArray.products.length;

     // Inject Purchases Loop
     let htmlMarkupForDashRenderFeedDOMTableLayout = '';
     if (storeStorageEnvFileDbValDataObjArray.orders.length > 0){
          storeStorageEnvFileDbValDataObjArray.orders.slice(0, 10).forEach(rRowSale=>{
              htmlMarkupForDashRenderFeedDOMTableLayout += `
              <div class="p-4 hover:bg-[#111] transition rounded-xl flex items-center justify-between mb-1 group border border-transparent hover:border-white/5">
                   <div>
                       <div class="text-white text-sm font-semibold mb-0.5 line-clamp-1 max-w-[200px] xl:max-w-[350px]">${rRowSale.item}</div>
                       <div class="text-zinc-500 text-xs">${rRowSale.user}</div>
                   </div>
                   <div class="text-right">
                       <div class="text-white font-medium mb-0.5 text-sm">${fmtUsd.format(rRowSale.val)}</div>
                       <div class="text-emerald-500/80 bg-emerald-500/10 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-emerald-500/10">${rRowSale.date || 'Today'}</div>
                   </div>
              </div>
              `;
          });
     } else { htmlMarkupForDashRenderFeedDOMTableLayout = '<div class="text-center font-medium text-xs text-zinc-600 mt-8 pt-6">NO TRANSACTIONS CAPTURED</div>'; }
     document.getElementById('render-recent-sales').innerHTML = htmlMarkupForDashRenderFeedDOMTableLayout;

     constructMainFinancialsMathGraphics(storeStorageEnvFileDbValDataObjArray.finances.revenue);
}

function constructMainFinancialsMathGraphics(finalSumObjectStateRevenueValIntLocStrValueForMathAPIStructureCSSLayoutList) {
    let ctxTGTCanvasRenderObjElement = document.getElementById('revenueGraphObj').getContext('2d');
    if (dashRefVisualChartNodeStrAPIUI) dashRefVisualChartNodeStrAPIUI.destroy();

    // Fabricate some previous numbers
    let previousLineBaselineVal = (finalSumObjectStateRevenueValIntLocStrValueForMathAPIStructureCSSLayoutList > 800) ? (finalSumObjectStateRevenueValIntLocStrValueForMathAPIStructureCSSLayoutList * 0.45) : 1000;
    
    let grdObjCSSStringLinearVarArchitectureElementsHtmlMap = ctxTGTCanvasRenderObjElement.createLinearGradient(0,0,0,320);
    grdObjCSSStringLinearVarArchitectureElementsHtmlMap.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grdObjCSSStringLinearVarArchitectureElementsHtmlMap.addColorStop(1, 'transparent');

    dashRefVisualChartNodeStrAPIUI = new Chart(ctxTGTCanvasRenderObjElement, {
         type: 'line', data: {
              labels: ['August', 'September', 'October', 'November', 'Live Database Result Tracking Analytics Structure Framework layout layout layout'], // Final graph is padded dynamically on edge rendering box 
              datasets: [{ data: [previousLineBaselineVal * 0.4, previousLineBaselineVal*0.7, previousLineBaselineVal * 0.65, previousLineBaselineVal*1.15, finalSumObjectStateRevenueValIntLocStrValueForMathAPIStructureCSSLayoutList], backgroundColor: grdObjCSSStringLinearVarArchitectureElementsHtmlMap, borderColor: '#3b82f6', tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: '#ffffff', pointBorderColor: '#3b82f6' }]
         }, options: { responsive:true, maintainAspectRatio: false, plugins: { legend: {display:false} }, scales: { y:{beginAtZero: true, display:false}, x: { display: false } } }
    });
}

// === Module 2: Catalog Products ===
document.getElementById('create-prod-form').addEventListener('submit', (f)=> {
     f.preventDefault();
     let cdbArrayObjectLayoutForUpdatingListAPIArrayStr= getDatabase();
     
     let pn= document.getElementById('inv-nm').value.trim();
     let pp= parseFloat(document.getElementById('inv-prc').value);

     cdbArrayObjectLayoutForUpdatingListAPIArrayStr.products.push({ id:'NXP_'+Math.floor(Math.random()*9000), name:pn, desc: document.getElementById('inv-dsc').value.trim(), price:pp, icon:document.getElementById('inv-ico').value });
     saveDatabase(cdbArrayObjectLayoutForUpdatingListAPIArrayStr);

     document.getElementById('create-prod-form').reset();
     
     // Success feedback Visual Map Component UI Action Response UI array framework Map HTML 
     let saveAppButtonNodeHookDataStructLogicElements= document.getElementById('btn-save-prod');
     saveAppButtonNodeHookDataStructLogicElements.innerText= "Published to Workspace"; saveAppButtonNodeHookDataStructLogicElements.classList.add('bg-green-500', 'text-white');
     
     // Automated CRM / Mail Message API Layout CSS object layout framework List HTML setup Map HTML architecture Object Map architecture UI layout css
     pushSystemWebmail("System Admin Inventory Array Manager Component logic loop string Html layout CSS architecture List Object ", `New Asset Upload: ${pn}`, `An asset valued at ${fmtUsd.format(pp)} was injected securely onto your storefront platform components. You may observe live updates and settlement interactions inside Dash Layout string Object Map components logic.`);
     
     setTimeout(()=>{saveAppButtonNodeHookDataStructLogicElements.innerText="Publish to Storefront"; saveAppButtonNodeHookDataStructLogicElements.classList.remove('bg-green-500','text-white')}, 1800);
     buildUICatalogDataDisplayRenderList();
});

window.dLTTargetDBRowItemDOMBtnTrig= function(tgIdentifierValueObjectNodeArrayHTMLArchitectureArrayMapCSSFrameworkStringLogicHtmlComponentMarkupLayoutObjectMapStringHTMLUI){
    let fRshArrDataObjSetupLogicStructMapFrameworkMaphtmlObjectComponentsStructureLayoutVariablesStringArrayCSSCSSAPI = getDatabase();
    fRshArrDataObjSetupLogicStructMapFrameworkMaphtmlObjectComponentsStructureLayoutVariablesStringArrayCSSCSSAPI.products= fRshArrDataObjSetupLogicStructMapFrameworkMaphtmlObjectComponentsStructureLayoutVariablesStringArrayCSSCSSAPI.products.filter(prxItem => prxItem.id !== tgIdentifierValueObjectNodeArrayHTMLArchitectureArrayMapCSSFrameworkStringLogicHtmlComponentMarkupLayoutObjectMapStringHTMLUI);
    saveDatabase(fRshArrDataObjSetupLogicStructMapFrameworkMaphtmlObjectComponentsStructureLayoutVariablesStringArrayCSSCSSAPI); buildUICatalogDataDisplayRenderList();
};

function buildUICatalogDataDisplayRenderList(){
     let baseDbProductsUIAPIComponentsArrayObjLayoutStringhtmlStructureStringCSSAPI = getDatabase().products;
     document.getElementById('render-prods-list').innerHTML = baseDbProductsUIAPIComponentsArrayObjLayoutStringhtmlStructureStringCSSAPI.slice().reverse().map(ob => `
         <div class="bg-[#111] border border-white/5 rounded-xl p-4 flex justify-between items-center group relative hover:border-white/10 transition-all shadow-md">
             <div class="flex gap-4">
                  <div class="w-12 h-12 bg-[#000] border border-white/10 rounded flex justify-center items-center text-zinc-600 text-lg shadow-inner group-hover:text-blue-500 transition-colors"><i class="fa-solid ${ob.icon}"></i></div>
                  <div><div class="text-white text-sm font-semibold tracking-tight mb-1">${ob.name}</div><div class="text-xs text-zinc-400 font-mono tracking-tight">${fmtUsd.format(ob.price)} <span class="text-blue-400 ml-1">#${ob.id}</span></div></div>
             </div>
             <button onclick="dLTTargetDBRowItemDOMBtnTrig('${ob.id}')" class="w-8 h-8 rounded bg-red-900/10 text-zinc-600 hover:text-red-400 hover:border-red-500/50 transition border border-transparent flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100"><i class="fa-solid fa-xmark"></i></button>
         </div>
     `).join('');
}


// === Module 3: CRM Tracking Customers ===
function buildUIPaneClientsDataMapHTMLStringList(){
     document.getElementById('v-crm-tbody').innerHTML= getDatabase().clients.map(pC=><tr class="hover:bg-white/5 transition-colors group cursor-default"> <td class="p-4 px-6 text-zinc-300 font-medium group-hover:text-white transition"><div class="flex items-center"><div class="w-8 h-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center text-xs mr-3 font-mono font-bold">${pC.email.charAt(0).toUpperCase()}</div> ${pC.email}</div></td> <td class="p-4 text-emerald-400 font-medium">${fmtUsd.format(pC.ltv)}</td> <td class="p-4 text-zinc-500 text-xs">${pC.joined || 'Internal Import'}</td> <td class="p-4 text-xs font-medium"><span class="px-2.5 py-1 bg-white/5 rounded border border-white/10 shadow text-zinc-400 group-hover:text-zinc-300">${pC.status || 'Verified Account'}</span></td> </tr>).join('');
}


// === Module 4: Invoicing Mail Matrix Box ===
function buildUIPaneEmailMessagesDataStrLogic(){
    document.getElementById('v-mail-feed').innerHTML= getDatabase().emails.map((mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents, dItIdxHTMLVariablesMarkupArchitectureStructurestringAPIarraySetupmap)=>`
        <div onclick="vEInbxObjSelRndUI(${dItIdxHTMLVariablesMarkupArchitectureStructurestringAPIarraySetupmap})" class="p-4 border-b border-white/5 hover:bg-[#111] transition cursor-pointer group relative ${mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents.unread ? 'bg-[#09090b]' : 'opacity-70'}">
             ${mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents.unread ? '<div class="absolute w-[3px] h-full left-0 top-0 bottom-0 bg-blue-600 rounded-r shadow-[0_0_10px_#2563eb]"></div>' : ''}
             <div class="flex justify-between items-center text-xs mb-1.5"><div class="text-zinc-400 font-semibold group-hover:text-zinc-200 transition line-clamp-1 w-full truncate mr-4">${mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents.sender}</div><span class="text-[9px] uppercase tracking-wider text-zinc-600 shrink-0 font-mono">${mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents.date}</span></div>
             <div class="text-white text-[13px] font-semibold mb-1 line-clamp-1 tracking-tight w-full drop-shadow group-hover:text-blue-400 transition-colors">${mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents.subj}</div>
             <div class="text-zinc-500 text-xs font-light line-clamp-1 pr-4">${mgLogStrNodeArrayUIIndexStringObjectMapElementsAPIArrayStructureFrameworkVariablesHTMLHtmlMarkupHTMLMarkupCssStringCSSStringhtmlLogicComponentshtmlHTMLcomponents.body}</div>
        </div>
    `).join('');
}

window.vEInbxObjSelRndUI = function(dxSelectNumLocStructVariablesHTMLFrameworkVariablesStringObjectLogicStringUIArchitectureHTMLCSSSetupMarkupComponentsElementsHtmlArrayArrayHtmlComponentsMapHtmlMapLogicMarkupMapCSSArrayAPI) {
    let rDReadDOMDBMemoryHtmlArchitectureLayoutStringComponentsListStringArrayLogicAPI= getDatabase();
    let specificSelMsgBodyFrameworkCSSLayoutElementsHTML= rDReadDOMDBMemoryHtmlArchitectureLayoutStringComponentsListStringArrayLogicAPI.emails[dxSelectNumLocStructVariablesHTMLFrameworkVariablesStringObjectLogicStringUIArchitectureHTMLCSSSetupMarkupComponentsElementsHtmlArrayArrayHtmlComponentsMapHtmlMapLogicMarkupMapCSSArrayAPI];
    
    // Purge highlight String Map layout structure array structure css Object HTML Map CSS layout mapping List elements array
    rDReadDOMDBMemoryHtmlArchitectureLayoutStringComponentsListStringArrayLogicAPI.emails[dxSelectNumLocStructVariablesHTMLFrameworkVariablesStringObjectLogicStringUIArchitectureHTMLCSSSetupMarkupComponentsElementsHtmlArrayArrayHtmlComponentsMapHtmlMapLogicMarkupMapCSSArrayAPI].unread=false;
    saveDatabase(rDReadDOMDBMemoryHtmlArchitectureLayoutStringComponentsListStringArrayLogicAPI);
    buildUIPaneEmailMessagesDataStrLogic(); 
    
    document.getElementById('v-mail-view').innerHTML= `
         <div class="max-w-2xl w-full flex flex-col justify-start relative shadow-2xl animate-fade bg-[#050508] border border-white/5 p-10 rounded-2xl">
              <span class="w-14 text-center bg-blue-600 text-[10px] text-white font-mono uppercase tracking-[0.2em] font-bold rounded py-1 mb-5 shadow-lg">READ</span>
              <h2 class="text-3xl font-bold font-sans text-white leading-tight mb-4">${specificSelMsgBodyFrameworkCSSLayoutElementsHTML.subj}</h2>
              <div class="text-xs bg-[#111] p-3 border border-white/5 rounded-lg text-zinc-300 font-mono mb-8 border-l-4 border-l-blue-600"><span class="opacity-50">Notification Node String mapping List From CSS :</span> <b class="ml-2 font-bold">${specificSelMsgBodyFrameworkCSSLayoutElementsHTML.sender}</b></div>
              
              <div class="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap px-4 py-2">${specificSelMsgBodyFrameworkCSSLayoutElementsHTML.body}</div>
              <button onclick="document.getElementById('v-mail-view').innerHTML = '<div class=\\'w-full h-full border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-zinc-600 font-medium\\'>System event map purged correctly. Map CSS Elements layout Array Map Object css UI Array.</div>';" class="mt-8 bg-zinc-900 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-red-500 font-bold px-4 py-2.5 rounded-lg text-[10px] uppercase font-mono tracking-widest w-fit shadow"><i class="fa-solid fa-trash mr-2"></i> Dispose Notice Log</button>
         </div>
    `;
};


// Execute Array Mapping CSS components UI mapping Map Framework setup Initial State Structure Object Framework List Html
setActiveTab('dash');
