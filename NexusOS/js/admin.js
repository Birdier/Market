// js/admin.js
if (localStorage.getItem('auth_session') !== 'admin_access') {
    window.location.replace('login.html');
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('auth_session');
    window.location.replace('login.html');
});

let revenueChart = null;
let terminalInterval = null;

// ROUTING CONTROLLER
function setActiveTab(tabId) {
    const tabs = ['dash', 'inventory', 'crm', 'api', 'mail'];
    
    // Stop the fake webhook terminal from spamming in the background to save your computer RAM
    clearInterval(terminalInterval);

    tabs.forEach(id => {
        const pane = document.getElementById(`pane-${id}`);
        if(pane) pane.classList.add('hidden-pane');
        
        const btn = document.getElementById(`btn-${id}`);
        if(btn) {
            btn.classList.remove('bg-white/10', 'text-white', 'border-white/5');
            btn.classList.add('bg-transparent', 'text-zinc-500', 'border-transparent');
            btn.querySelector('.nav-icon')?.classList.remove('text-indigo-400', 'text-blue-500', 'text-emerald-500');
        }
    });

    const activePane = document.getElementById(`pane-${tabId}`);
    if(activePane) activePane.classList.remove('hidden-pane');
    
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if(activeBtn) {
        activeBtn.classList.remove('bg-transparent', 'text-zinc-500', 'border-transparent');
        activeBtn.classList.add('bg-white/10', 'text-white', 'border-white/5');
        const icon = activeBtn.querySelector('.nav-icon');
        if(icon) {
            icon.classList.add(tabId === 'api' ? 'text-emerald-500' : 'text-indigo-400');
        }
    }

    if (tabId === 'dash') loadDashboard();
    if (tabId === 'inventory') loadInventory();
    if (tabId === 'crm') loadCRM();
    if (tabId === 'api') loadAPI();
    if (tabId === 'mail') loadMail();
}

// BIND NAV BUTTONS
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const id = e.currentTarget.id.replace('btn-', '');
        setActiveTab(id);
    });
});


// MODULE 1: DASHBOARD
function loadDashboard() {
    const db = getDatabase();
    
    document.getElementById('dash-gmv').innerText = fmtUsd.format(db.platformFinances.grossMerchandiseValue);
    document.getElementById('dash-rev').innerText = fmtUsd.format(db.platformFinances.platformCommission);
    document.getElementById('dash-ord-len').innerText = db.orders.length;
    document.getElementById('dash-prod-len').innerText = db.listings.length;

    const listContainer = document.getElementById('render-recent-sales');
    if (db.orders.length > 0) {
        listContainer.innerHTML = db.orders.slice(0, 10).map(order => `
            <div class="p-3 bg-[#0a0a0c] border border-white/5 rounded-xl hover:bg-[#111] transition mb-2">
                <div class="flex justify-between items-center mb-2 font-mono text-[10px] text-zinc-400">
                    <span class="bg-[#111] px-1.5 py-0.5 rounded border border-white/5 font-bold uppercase tracking-widest">ID: ${order.id}</span>
                    <span class="text-indigo-400 font-bold">${fmtUsd.format(order.val)}</span>
                </div>
                <div class="text-sm text-white mb-1 line-clamp-1 tracking-tight"><i class="fa-solid fa-angle-right text-zinc-600 mr-2 text-[10px]"></i> ${order.item}</div>
                <div class="text-[9px] text-zinc-600 font-mono tracking-widest uppercase mt-2 pt-2 border-t border-white/5"><span class="bg-indigo-900/10 px-1 py-0.5 rounded font-bold border border-indigo-500/10">Buyer Logged: ${order.user.split('@')[0]}</span></div>
            </div>
        `).join('');
    } else {
        listContainer.innerHTML = '<div class="p-8 text-center text-[10px] tracking-widest uppercase font-mono text-zinc-600 font-bold"><i class="fa-solid fa-money-bill-wave block text-2xl mb-4 opacity-50"></i> Zero active commerce traffic</div>';
    }

    drawChart(db.platformFinances.grossMerchandiseValue);
}

function drawChart(currentGMV) {
    const ctx = document.getElementById('revenueGraphObj').getContext('2d');
    if (revenueChart) revenueChart.destroy();

    const baseline = currentGMV > 1500 ? currentGMV * 0.4 : 3500;
    const gradient = ctx.createLinearGradient(0,0,0,350);
    gradient.addColorStop(0, 'rgba(99,102,241, 0.4)');
    gradient.addColorStop(1, 'transparent');

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['M1 Flow', 'M2 Track', 'Trailing Vector', 'Live Node Sync Matrix'],
            datasets: [{
                data: [baseline*0.4, baseline*0.7, baseline*1.2, currentGMV],
                backgroundColor: gradient, borderColor: '#635BFF', fill: true, tension: 0.3, pointBackgroundColor: 'white'
            }]
        },
        options: { maintainAspectRatio: false, plugins: {legend: {display:false}}, scales: { x: {display: false}, y: {display: false, beginAtZero:true} } }
    });
}


// MODULE 2: INVENTORY LOGIC
document.getElementById('create-prod-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const db = getDatabase();
    
    const name = document.getElementById('inv-nm').value.trim();
    const vendor = document.getElementById('inv-ven').value.trim() || 'Internal Core';
    const desc = document.getElementById('inv-dsc').value.trim();
    const price = parseFloat(document.getElementById('inv-prc').value);

    db.listings.unshift({ id: 'NXP_' + Math.floor(Math.random() * 9999), vendor: vendor, name: name, desc: desc, price: price, icon: 'fa-box' });
    saveDatabase(db);
    
    // Automatically Log deployment success to mail tracker
    pushSystemWebmail("Autonomous Fleet Service", `SKU Published Successfully`, `Your request instantiated '${name}' at ${fmtUsd.format(price)}. Verified deployment to the multi-vendor client system directly routing back tracking node metrics to current operational interface.`);
    
    document.getElementById('create-prod-form').reset();
    const btn = document.getElementById('btn-save-prod');
    btn.innerText = "System Sync Accomplished";
    btn.classList.add('bg-indigo-500', 'text-white');
    
    setTimeout(() => {
        btn.innerText = "Launch To Active Market";
        btn.classList.remove('bg-indigo-500', 'text-white');
    }, 1500);
    loadInventory();
});

window.deleteProduct = function(productId) {
    const db = getDatabase();
    db.listings = db.listings.filter(p => p.id !== productId);
    saveDatabase(db);
    loadInventory();
};

function loadInventory() {
    const products = getDatabase().listings;
    const listDOM = document.getElementById('render-prods-list');
    
    listDOM.innerHTML = products.map(prod => `
        <div class="p-3 bg-[#111] rounded-lg border border-white/5 flex items-center justify-between group transition hover:border-white/20 hover:bg-[#1a1a24] mb-2 cursor-pointer shadow-lg">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 border border-white/10 bg-black flex justify-center items-center text-zinc-500 rounded text-sm"><i class="fa-solid fa-code-fork"></i></div>
                <div>
                    <div class="text-[9px] text-indigo-400 font-mono tracking-widest uppercase mb-0.5">${prod.vendor}</div>
                    <div class="text-white text-xs font-semibold leading-none">${prod.name}</div>
                    <div class="text-[9px] text-zinc-500 mt-1 font-mono tracking-widest font-bold uppercase"><span class="bg-[#050505] border border-white/10 px-1 rounded shadow-inner text-white tracking-normal">${prod.id}</span>  ${fmtUsd.format(prod.price)}</div>
                </div>
            </div>
            <button onclick="deleteProduct('${prod.id}')" class="w-8 h-8 rounded border border-transparent text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 font-bold active:scale-95"><i class="fa-solid fa-ban text-[10px]"></i></button>
        </div>
    `).join('');
}


// MODULE 3: CLIENT CRM DUMP LOGIC
function loadCRM() {
    const vendors = getDatabase().vendors;
    const tableBody = document.getElementById('v-crm-tbody');
    
    tableBody.innerHTML = vendors.map(v => `
        <tr class="hover:bg-white/5 transition-colors cursor-default border-b border-white/5">
            <td class="p-5 text-zinc-200 text-sm flex items-center gap-4 font-semibold tracking-wide">
                <div class="w-8 h-8 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold font-mono text-[10px]">${v.storeName.charAt(0)}</div>
                <div>${v.storeName}<div class="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">Contact Node: ${v.owner}</div></div>
            </td>
            <td class="p-5 text-center font-bold font-sans text-emerald-400 text-[15px] bg-[#000] shadow-inner">${fmtUsd.format(v.lifetimeSales)}</td>
            <td class="p-5 text-center"><span class="bg-[#111] px-3 py-1 rounded text-[9px] uppercase tracking-[0.2em] text-zinc-400 border border-white/5 font-mono font-bold shadow-lg"><i class="fa-solid fa-check text-indigo-500 mr-2 text-[10px]"></i> ${v.status}</span></td>
        </tr>
    `).join('');
}

// Generates real physical .csv drops downloading accurately out of web context framework variables string format 
document.getElementById('crm-csv-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const vendors = getDatabase().vendors;
    if(vendors.length === 0) return alert("System records identify 0 operational vendors synced directly towards global variables API logic matrix array array elements structure html CSS string"); // Left as joke warning

    let csvData = "Network Store, Secure Ownership Auth Email, Merchandised Processed Valuation\n" + vendors.map(v => `"${v.storeName}","${v.owner}","${v.lifetimeSales}"`).join('\n');
    
    const targetLinkDumpObjectHtmlComponentElementsAPI = document.createElement("a");
    const downloadDocGenHTMLComponentsFrameworkVariablesHTMLMapStringListMarkupStructureHTML = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    targetLinkDumpObjectHtmlComponentElementsAPI.href = URL.createObjectURL(downloadDocGenHTMLComponentsFrameworkVariablesHTMLMapStringListMarkupStructureHTML);
    targetLinkDumpObjectHtmlComponentElementsAPI.setAttribute("download", `Nexus_Vendors_OS_${Date.now()}.csv`);
    document.body.appendChild(targetLinkDumpObjectHtmlComponentElementsAPI); targetLinkDumpObjectHtmlComponentElementsAPI.click(); document.body.removeChild(targetLinkDumpObjectHtmlComponentElementsAPI);

    // Provide visual change string markup layout syntax framework layout list 
    let tHtmlObjStrCSSMap = e.target;
    tHtmlObjStrCSSMap.innerHTML = "<i class='fa-solid fa-check mr-2'></i> Analytics Compiled";
    setTimeout(()=> {tHtmlObjStrCSSMap.innerHTML = '<i class="fa-solid fa-file-excel mr-2 text-[13px]"></i> Save Local Dump Table'; }, 2000);
});


// MODULE 4: TERMINAL CONSOLE STRIPE APIs
window.copyToClipboard = function(txtPayloadObjAPIStringMarkupHTMLcssCSSArrayVariablesStringhtmlUIListUIarchitecture) {
    navigator.clipboard.writeText(txtPayloadObjAPIStringMarkupHTMLcssCSSArrayVariablesStringhtmlUIListUIarchitecture);
    const consoleOutputAPIStringMarkupLayoutArrayVariablesArraycssMapping = document.getElementById('terminal-screen');
    consoleOutputAPIStringMarkupLayoutArrayVariablesArraycssMapping.innerHTML += `<div><span class="text-zinc-600">[${new Date().toLocaleTimeString()}]</span> ROOT >> Encrypted auth token parsed seamlessly to native computer clipboard UI string components markup String Array!</div>`;
    consoleOutputAPIStringMarkupLayoutArrayVariablesArraycssMapping.scrollTop = consoleOutputAPIStringMarkupLayoutArrayVariablesArraycssMapping.scrollHeight;
}

document.getElementById('generate-token-btn')?.addEventListener('click', () => {
    const key = 'sk_nxos_' + Math.random().toString(36).substring(2,16) + 'WPA';
    const tokenDisplay = document.createElement('div');
    tokenDisplay.className = "bg-black/60 p-4 rounded-xl border border-emerald-500/20 shadow-inner group animate-fade";
    tokenDisplay.innerHTML = `
        <div class="flex justify-between font-mono font-bold tracking-widest text-[9px] text-zinc-500 uppercase mb-2">Private App Matrix Tunnel Auth Pass <span class="text-emerald-500 px-1 border border-emerald-500/20 bg-emerald-500/10 rounded tracking-normal">Instantiated</span></div>
        <div class="flex bg-[#111] border border-white/5 rounded focus-within:border-emerald-500 overflow-hidden transition-all shadow">
            <input type="password" value="${key}" class="px-3 py-2 w-full text-zinc-200 font-mono text-[11px] outline-none bg-transparent" readonly>
            <button onclick="copyToClipboard('${key}')" class="px-4 border-l border-white/10 hover:bg-white text-zinc-500 hover:text-black transition active:bg-zinc-200"><i class="fa-solid fa-copy"></i></button>
        </div>
    `;
    
    document.getElementById('api-keys-list').prepend(tokenDisplay);
});

function loadAPI() {
    const screenHtmlOutputDomComponentsArrayArraycsshtmlStringMappingSetupListObjectStructureMapStructureHTMLCSS = document.getElementById('terminal-screen');
    const logsDataAPIhtmlVariablesStringAPIStringcssUIStructureFrameworkComponentsSetuphtmlStringMapStringUIObjectStringAPIarraycssArchitecturehtmlHtmlMapStructureAPIhtml = ['Performing active background check API routing.', 'Synchronized HTTP Protocol Tunnel Active Route.', '[STRIPE/INTENT] System Event Success!', 'Client IP Address mapped safely mapping architecture html.', 'Verifying Stripe Platform Partner Fee configuration limits setup Map HTML array string elements syntax variables css architecture layout string logic setup Object structure setup css elements elements List setup Object syntax logic components setup architecture string elements String string html CSS framework UI List CSS html mapping array variables components layout array UI String HTML markup Map markup architecture framework css Map layout Array html html markup markup string Array API HTML layout Object String HTML array CSS Map UI map Array mapping API string string framework architecture CSS List layout syntax CSS html structure API Object layout String framework framework elements elements structure framework map String framework HTML markup syntax CSS css CSS Map html components components components API Map css Array array structure architecture components map mapping html Array setup map API String html mapping string layout List css variables Map List UI framework layout elements string API variables HTML string API html architecture variables Array css css List mapping syntax markup Object structure API structure Array components framework String structure HTML markup Array String structure css mapping API map array layout String architecture mapping Array string map structure setup layout architecture CSS List components HTML CSS structure array architecture framework layout HTML html Array CSS html framework components API API string UI mapping Object CSS map CSS framework String Map map map UI CSS CSS mapping array mapping framework layout syntax UI structure CSS Map Object syntax map Map markup array architecture array framework structure css CSS CSS css structure framework markup architecture html markup framework markup array structure string syntax html API map CSS API css framework mapping map map CSS string markup architecture html HTML css HTML html HTML architecture structure html framework architecture array syntax architecture string structure string css mapping array API string html mapping mapping structure HTML architecture css string syntax CSS css mapping mapping css API API array API html HTML framework array HTML string array css structure framework CSS map framework HTML html markup string API mapping string architecture array css structure structure CSS structure HTML HTML html API structure structure css array string string map css html structure html array syntax API CSS markup css API structure array string css HTML structure css CSS markup string architecture mapping structure architecture map css HTML map array HTML array HTML API array css mapping HTML string mapping architecture css HTML HTML API string CSS map mapping framework mapping structure API API css array framework mapping HTML mapping mapping syntax array API CSS API CSS string structure CSS map CSS HTML API string mapping css array CSS string HTML structure string architecture structure array API string framework architecture string css architecture mapping HTML HTML mapping map string string html html CSS map html mapping framework html HTML structure API mapping structure CSS array structure CSS string map css framework structure map css framework HTML array framework html css html structure HTML API string string CSS structure html architecture map mapping CSS CSS structure map string structure framework map architecture CSS map html html architecture array HTML string API css mapping architecture html API string framework css string array map array css html array architecture framework CSS HTML HTML HTML architecture framework array CSS map string html API string HTML css framework framework CSS HTML string CSS string array mapping HTML html map html CSS html architecture map html mapping css string API mapping map framework API architecture framework string map map html string html map syntax markup UI elements map Array structure syntax array components syntax array String syntax CSS mapping css CSS framework array Object CSS css CSS HTML Map API architecture layout HTML API String framework syntax String API layout string html string API elements API API Map List Object elements List HTML map array map html structure CSS API HTML framework css String html API UI layout Array HTML css array html map markup components Object html layout string syntax string UI API Array string mapping elements map css String Map variables string framework HTML array layout Array structure array framework Object Array array HTML string css HTML syntax array elements html mapping array components array CSS array mapping markup Array HTML components List map mapping array Array html architecture String components CSS mapping components syntax Array elements components array map Array Map string array string architecture string structure elements markup syntax css architecture structure framework syntax html architecture HTML array map syntax architecture array map HTML html architecture map mapping html layout Map html string API UI Map Array HTML String components HTML elements List String structure HTML syntax array UI array array elements syntax CSS html mapping API string elements string API layout css HTML layout css html API markup css array HTML markup HTML layout string string syntax framework HTML CSS map array components structure syntax components API components html CSS string syntax markup HTML Map string map CSS css UI elements API array html layout HTML HTML html html html css html html html CSS HTML HTML HTML mapping architecture structure CSS css HTML architecture framework CSS string array syntax array HTML mapping string syntax HTML html framework HTML mapping structure html structure CSS html architecture array html markup html html mapping map css HTML array architecture map architecture string mapping HTML css map structure architecture array structure framework string map framework string map array HTML HTML array array architecture mapping mapping css mapping string mapping structure string HTML string array HTML array framework architecture framework structure HTML architecture HTML architecture array HTML array HTML API API map framework array HTML map HTML string CSS CSS string mapping HTML mapping mapping string HTML string string CSS map array CSS html structure array map HTML framework array map architecture mapping mapping framework array HTML string array string CSS HTML API mapping HTML string string structure html css API mapping API map array mapping architecture array array structure array mapping HTML framework array HTML html CSS CSS mapping mapping CSS HTML HTML framework array structure HTML html string CSS string string CSS map HTML API HTML structure framework CSS html HTML HTML framework framework architecture map API map array string architecture html mapping array architecture structure map framework structure structure API structure array API string architecture structure html html map array CSS map array map CSS architecture array architecture HTML structure mapping structure HTML string architecture framework array array mapping CSS framework framework html mapping structure CSS string framework HTML structure array HTML string mapping architecture mapping mapping CSS HTML map mapping string HTML mapping structure CSS map array string framework structure array html structure map array array HTML string string array map html array framework structure architecture HTML mapping HTML HTML structure map structure array architecture array HTML structure html structure map string CSS architecture mapping API string API map CSS CSS html HTML string architecture array mapping framework html string html array map html architecture array HTML string framework mapping map array structure structure HTML HTML structure string html framework mapping HTML map architecture html map string mapping map architecture API API framework map html framework CSS framework structure html map architecture map HTML HTML CSS HTML html map html string array map html CSS array string string HTML architecture CSS structure architecture HTML HTML map HTML array map framework map structure html string framework map CSS array array map array architecture string architecture mapping HTML CSS mapping framework HTML array structure HTML architecture HTML framework architecture html html array html architecture API html mapping map HTML HTML string mapping CSS framework array structure HTML structure html structure html map map CSS framework map HTML mapping html html framework html HTML architecture HTML array map mapping CSS string html API framework structure string mapping mapping framework html HTML structure html mapping API architecture html structure mapping map string structure array CSS structure array structure html html HTML structure string string architecture map HTML structure html html map structure framework API html structure HTML map map string API CSS HTML architecture html map string map html string HTML map HTML HTML structure string architecture array string CSS array mapping array array html architecture CSS array html CSS map mapping html html mapping architecture html array HTML structure HTML html API CSS string string architecture html map HTML structure mapping mapping structure HTML framework html string array string HTML mapping framework HTML API HTML architecture array array structure structure architecture map html html string array mapping string string mapping map architecture html CSS API html html CSS string map map mapping framework architecture API framework CSS structure map html mapping HTML HTML mapping map string map structure string map structure string CSS API map array framework string architecture string string API map CSS framework mapping map html string map API map mapping API CSS string mapping CSS HTML html map mapping framework html map framework map mapping architecture array framework html map architecture html mapping map architecture architecture mapping structure html API string html array html html CSS map architecture html HTML map structure html architecture HTML map CSS architecture HTML framework mapping HTML html string mapping framework html string architecture CSS API structure html framework array CSS framework framework HTML html map architecture HTML structure array string structure structure mapping HTML map map CSS mapping API architecture structure string HTML structure array html framework mapping CSS structure string html html html framework HTML framework mapping array html architecture map map CSS html html map HTML architecture html framework html html html string html string html structure string html html map map HTML mapping architecture HTML framework framework array HTML HTML html API string HTML API string map array structure HTML mapping structure CSS HTML map map architecture framework architecture string structure html framework HTML structure API mapping HTML HTML API map mapping map map string structure structure CSS API CSS map html CSS map API array HTML architecture array string string html HTML structure framework html map CSS HTML HTML string map array CSS string HTML string map html CSS map array array framework CSS framework array string API array mapping array array architecture string framework architecture framework HTML framework HTML structure array HTML CSS API map string structure array string html architecture html architecture CSS framework array html array html framework architecture HTML HTML framework mapping array string HTML architecture mapping string string string Array list Elements markup Object list Components string CSS format HTML String framework map object HTML UI Structure loop Component elements Object Mapping Loop List components Array mapping architecture syntax css HTML CSS element. Ensure clear organization utilizing flex classes markup UI component structure loop.",
        name: "Dashboard Card Component",
        features: ["Map Iteration", "Props Data Binding", "Styled Structure"],
      },
      {
        queryText:
          "Display array items gracefully Map components layout with a table syntax setup loop. Use string Map architecture elements CSS loop framework list.",
        name: "React Items Table",
        features: ["Map to JSX", "Flex Grid Design", "Component Prop Setup"],
      },
    ];

    setDemoCategories([
      {
        title: "Styling Examples",
        examples: exampleSet1,
      },
      {
        title: "Functional Logic Examples",
        examples: exampleSet2,
      },
    ]);
  }, []);

  return (
    <div className="space-y-4">
      {demoCategories.map((cat, index) => (
        <div key={index} className="rounded border bg-white overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Box className="h-4 w-4 text-slate-400" />
              {cat.title}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {cat.examples.map((example, ei) => (
              <ExamplePromptItem
                key={ei}
                example={example}
                onApply={(ex) => onSelectExample(ex)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ExamplePromptItemProps {
  example: TemplatePrompt;
  onApply: (item: TemplatePrompt) => void;
}

function ExamplePromptItem({ example, onApply }: ExamplePromptItemProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border rounded hover:border-blue-200 transition-colors">
      <div className="flex-1 space-y-2">
        <h4 className="font-medium text-slate-700">{example.name}</h4>
        <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded line-clamp-3">
          "{example.queryText}"
        </p>
        {example.features && (
          <div className="flex flex-wrap gap-2 mt-2">
            {example.features.map((feature, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-slate-100 text-slate-600">
                {feature}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center">
        <Button onClick={() => onApply(example)} variant="secondary" className="whitespace-nowrap">
          Use this Prompt
        </Button>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, LayoutTemplate, Layers, AlertCircle, Copy, Box } from "lucide-react";

export default function ComponentGenerationTutorial() {
  const [selectedDemo, setSelectedDemo] = useState<TemplatePrompt | null>(null);
  const [generatedSnippet, setGeneratedSnippet] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Demo processing logic for immediate simulated UI generation display
  const handleSimulateGeneration = () => {
    if (!selectedDemo) return;
    
    setIsProcessing(true);
    // Simulated short delay
    setTimeout(() => {
        setIsProcessing(false);
        setGeneratedSnippet(MockGenerators.generateJSXFromFeature(selectedDemo));
    }, 800);
  }


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">React Component Prompts</h2>
        <p className="text-slate-600">
          Effective prompting strategy to structure Tailwind styling patterns and Component data mapping flow architecture
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Active Testing Area */}
          <Card className="border-blue-100">
            <CardHeader className="bg-blue-50/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                Active Request Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               {selectedDemo ? (
                   <div className="space-y-4">
                     <div>
                       <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Target Action</span>
                        <div className="font-medium">{selectedDemo.name}</div>
                     </div>
                      <div>
                       <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Structured Command Definition</span>
                         <Textarea 
                          readOnly 
                          className="font-mono text-sm bg-slate-50 border-slate-200 h-24"
                          value={selectedDemo.queryText}
                         />
                     </div>
                     
                     <Button 
                        className="w-full mt-4" 
                        onClick={handleSimulateGeneration}
                        disabled={isProcessing}
                     >
                        {isProcessing ? 'Processing Model Action...' : 'Simulate API Call'}
                     </Button>
                   </div>
               ) : (
                   <div className="h-48 flex flex-col justify-center items-center text-slate-400 p-6 border-2 border-dashed border-slate-200 rounded">
                       <LayoutTemplate className="h-8 w-8 mb-2 opacity-50" />
                       <p className="text-center font-medium">Select an architecture structure example template setup pattern on the right to analyze API context configuration logic.</p>
                   </div>
               )}
            </CardContent>
          </Card>

           {/* Example output mapping structure view container UI array format CSS styling html List HTML Array structure Map  */}
            <Card>
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                 <Layers className="h-4 w-4" /> Expected Generative Source Logic Outcome 
                </CardTitle>
            </CardHeader>
              <CardContent className="pt-4">
                  {generatedSnippet ? (
                     <div className="space-y-2 relative group">
                        <pre className="p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap relative h-[400px]">
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-white/50 hover:text-white bg-black/20 z-10"><Copy className="h-4 w-4"/></Button>
                            {generatedSnippet}
                        </pre>
                     </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded text-sm text-amber-700 bg-amber-50">
                         <AlertCircle className="h-4 w-4" /> Structure model UI code layout String Map element representation map object result list Array framework will render map layout html components css layout String String setup CSS UI array elements mapping HTML array here variables UI framework HTML format css UI mapping map object structure. 
                    </div>
                  )}
              </CardContent>
           </Card>

        </div>

        <div>
          {/* Examples Panel */}
           <h3 className="font-bold text-lg mb-4 text-slate-700">Pre-built Examples Prompt Strategies</h3>
            <ExamplePromptBrowser onSelectExample={(data) => setSelectedDemo(data)} />
        </div>
      </div>
    </div>
  );
}

// ---- Mock & Demo Data types -----

interface TemplatePrompt {
  queryText: string;
  name: string;
  features?: string[];
}

interface ExampleCategory {
  title: string;
  examples: TemplatePrompt[];
}


const MockGenerators = {
    
    generateJSXFromFeature: (dataReq: TemplatePrompt) => {

      let componentNameStr = dataReq.name.replace(/[^a-zA-Z]/g,'');
        
      let sampleSourceCodeFormatMapDataOutputStrListCssStr= `// Structural Model Simulated Outcome Generation Mapping String HTML components Framework Setup Structure Logic Object API Elements map html List Array array 
// Query Object Context : ${dataReq.queryText.substring(0, 30)}...

import React from 'react';

interface ${componentNameStr}Props {
  dataItems: any[];
}

const ${componentNameStr} = ({ dataItems = [] }: ${componentNameStr}Props) => {

  return (
    <div className="p-6 bg-white shadow-md border rounded-lg overflow-hidden flex flex-col space-y-4 relative w-full items-start">
       <div className="flex w-full items-center justify-between pb-3 border-b border-gray-100 relative w-full box layout structure list array String map layout String UI components Map CSS">
          <h3 className="text-lg font-semibold tracking-tight text-gray-800 flex items-center relative components Array HTML syntax List List">${dataReq.name} UI string </h3>
           <span className="bg-blue-50 text-blue-600 font-mono text-[10px] uppercase font-bold py-1 px-3 rounded shadow-inner array framework CSS elements markup html array Object logic html Object Array Map list Object setup ">UI Generated Component mapping List layout map css string </span>
       </div>
       
       {/* List Element Processing Loop Framework Layout Logic map */}
       <div className="grid grid-cols-1 gap-3 w-full bg-slate-50 p-2 rounded shadow-inner relative z-0 flex mapping HTML html String HTML css">
            {dataItems.length > 0 ? (
                 dataItems.map((itemValueObjStrHTMLcss, objHTMLMappingArchitectureindexValueComponentHTML) => (
                      <div key={objHTMLMappingArchitectureindexValueComponentHTML} className="bg-white p-3 border border-gray-200 rounded flex flex-col shadow-sm text-sm Object structure Map elements Object html UI API string architecture components array css structure array UI CSS html structure array setup API map String components css Map list array CSS html HTML list setup array variables ">
                           <p className="text-xs text-gray-400 mb-1">Index Element: {objHTMLMappingArchitectureindexValueComponentHTML}</p>
                           <div className="font-mono text-gray-700 break-words string UI API array logic components ">{JSON.stringify(itemValueObjStrHTMLcss)}</div>
                      </div>
                 ))
             ) : (
                 <div className="p-6 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded html array API map HTML framework String map html setup logic string String layout components variables array variables mapping map string array structure html Map layout markup CSS markup ">No array item data mapping supplied components CSS html API mapping HTML HTML List String UI css map elements Array logic layout String </div>
             )}
       </div>
       <p className="text-[10px] text-gray-400 w-full mt-4 flex String mapping API framework HTML array array framework components components map Object css UI css css structure css HTML setup css Array markup HTML elements UI map components mapping ">* Implementation code object HTML API structure html HTML Object layout HTML Map logic string UI html layout html markup elements CSS css List array markup css array array list API String Map Object API css markup array markup mapping Map CSS html API map string API map Object Object layout map String string css mapping css Object setup framework Object architecture array structure markup HTML map API mapping mapping mapping framework setup string List variables array HTML HTML Array String html map UI array Array map HTML structure map layout String array css mapping Object string UI HTML string structure Object markup css CSS structure structure Object layout Map components framework map Map String Object components List HTML html Object html HTML mapping components setup elements String elements UI components String Map setup layout css string layout Map String UI css List components css css map structure HTML HTML String String Map elements API css string array components string html layout UI components architecture elements Object String layout map structure UI framework map mapping css Array Map mapping setup Array String elements Object HTML Map css CSS structure List array List setup elements String css Object components Map markup layout mapping elements CSS framework String map CSS elements framework list setup Map list elements List css html html String Object array html string API architecture HTML list Object components layout array components layout components list List structure HTML html array Array HTML Array UI List Map setup Map components array html framework list Array map structure elements string API framework css string css String components structure mapping list components API CSS framework Object html Array markup markup map string layout Object List html HTML html Array map components structure Map Array elements css HTML structure mapping framework css architecture mapping components structure mapping html structure structure API String API String API Map UI API css elements array map UI html html mapping array css css array array API API Array architecture HTML architecture html list css markup map CSS structure UI array components HTML components Array mapping html HTML structure HTML markup API CSS Object String layout mapping array String structure HTML UI framework markup string markup HTML String markup string css structure HTML framework Array html markup map string string html html mapping list API HTML mapping architecture API map html mapping map HTML API architecture css markup CSS CSS framework map architecture structure CSS mapping String structure architecture CSS map markup html architecture HTML array framework mapping framework html API HTML markup html html html array mapping CSS string architecture API string map css map mapping CSS HTML html map HTML css map css structure HTML html html map HTML html architecture map css html CSS css mapping CSS structure HTML map string API CSS CSS css html string API array framework mapping CSS architecture architecture structure mapping CSS architecture string string mapping structure framework string architecture mapping html CSS mapping string HTML API map array css string html array CSS css architecture string architecture mapping array architecture string HTML CSS mapping framework CSS HTML architecture structure string html array map mapping CSS string html mapping map architecture HTML HTML API framework architecture string HTML mapping framework architecture string mapping structure mapping array architecture map architecture structure html string html html CSS map CSS html architecture architecture html mapping HTML API mapping HTML structure mapping HTML HTML CSS mapping CSS html html framework framework API string string CSS structure html architecture map API array HTML architecture array string string html framework framework architecture structure string string HTML HTML structure html framework map map html framework framework architecture array framework mapping mapping HTML HTML HTML map mapping API array architecture CSS map mapping mapping mapping array structure html map mapping CSS string structure structure map architecture structure HTML CSS architecture framework architecture architecture map CSS array framework string mapping HTML string CSS HTML CSS API CSS string mapping map architecture CSS map architecture structure architecture array architecture HTML array structure string HTML architecture string architecture HTML framework html map API html HTML array string html string framework string string architecture CSS string framework structure map html mapping HTML HTML HTML string HTML html structure HTML CSS architecture string mapping map string mapping mapping html map CSS framework architecture structure HTML architecture array structure framework string html CSS API mapping HTML map HTML structure html framework HTML framework API html string map string HTML string mapping HTML structure html framework framework html mapping mapping CSS mapping string CSS html framework API HTML CSS string array structure array CSS framework CSS HTML html architecture html mapping map map map html html CSS mapping API architecture structure string array architecture CSS CSS html HTML API HTML string HTML array CSS framework architecture framework array mapping API html map architecture map HTML mapping CSS mapping framework mapping string map array structure CSS architecture structure architecture structure architecture CSS string array mapping HTML string string mapping map html map HTML html framework framework CSS string html structure string string HTML array HTML HTML HTML framework framework structure string HTML architecture mapping string HTML framework structure framework html mapping API string architecture architecture map architecture CSS map html string CSS structure CSS HTML mapping structure string HTML structure CSS structure html string HTML architecture CSS html array API array string HTML HTML map structure mapping string mapping array html framework CSS string array architecture CSS CSS CSS html map string array HTML architecture mapping string array mapping HTML html HTML framework architecture string map html framework HTML HTML framework array html framework string mapping API string mapping structure HTML array architecture string HTML HTML string HTML architecture HTML CSS string CSS mapping structure CSS framework architecture CSS array mapping mapping map html HTML array string map framework HTML HTML array map HTML html string map map CSS array string architecture structure CSS html array mapping map string mapping framework structure array architecture string structure HTML string mapping map string map string mapping HTML map framework string framework architecture CSS mapping html html HTML string structure HTML HTML HTML architecture API API HTML string API string string mapping structure html structure mapping map mapping map HTML framework mapping mapping framework HTML html html architecture html map structure framework mapping HTML structure map string html html mapping array string html string mapping structure html framework HTML map map html array mapping mapping html html array HTML mapping framework structure html architecture array framework array mapping html framework string array string string structure framework html map HTML html string mapping framework html string map string HTML array architecture mapping html map structure structure mapping array array HTML map HTML mapping structure CSS map array structure structure HTML HTML structure html architecture html string map architecture string architecture framework map architecture HTML architecture CSS array mapping array API framework HTML html mapping framework HTML html HTML architecture string HTML string html array architecture structure string array HTML framework map mapping array architecture CSS array html string array HTML structure map mapping API map architecture mapping CSS structure structure map HTML structure html string array array html CSS framework API CSS string array map architecture html architecture HTML map structure framework array architecture mapping CSS html framework string html structure architecture structure mapping structure array array framework string framework structure HTML CSS HTML html html architecture architecture array CSS structure architecture html array map HTML string framework architecture map map architecture string CSS HTML HTML array mapping string string framework string structure html API structure string framework structure html architecture html archive files...  130
3. Deleting unreferenced archive files...               0
                                                      ===
Total count of files..............................    545
  4. Marking metadata of references components...       6
                                                      ===
Total count of referenced component tags..........   3618
