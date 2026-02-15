const cols = 24;
let mode = "arrival";
let shift = "morning";
const zoneSizes = { arrival: [10,10,10,10], departure: [8,10,10,8] };
const dataStore = { arrival: null, departure: null };
let officersList = [];
const container = document.getElementById("table-container");
const summaryText = document.getElementById("summary-text");
const clearButton = document.getElementById("clear-button");
let dragging=false,startRow=null,startCol=null,dragDirection=null,paintedCells=new Set();

// --- Initialize Data ---
function initializeData(modeName){
  const zones=zoneSizes[modeName]; const rows=zones.reduce((sum,s)=>sum+s,0);
  const df=Array.from({length:rows+1},()=>Array(cols).fill(0)); return df;
}
function getCurrentData(){if(!dataStore[mode])dataStore[mode]=initializeData(mode); return dataStore[mode];}

// --- Officer Management ---
function addOfficer(off){ officersList.push(off); updateRoster(); saveToLocalStorage(); }
function removeOfficer(name){ officersList=officersList.filter(o=>o.name!==name); updateRoster(); saveToLocalStorage(); }
document.getElementById("addOfficer").addEventListener("click",()=>{
  addOfficer({
    name:document.getElementById("officerName").value,
    type:document.getElementById("officerType").value,
    shift:document.getElementById("officerShift").value,
    ra:document.getElementById("raTime").value,
    ro:document.getElementById("roTime").value
  });
});
document.getElementById("removeOfficer").addEventListener("click",()=>{
  removeOfficer(document.getElementById("officerName").value);
});

// --- Auto-fill counters ---
function autoFillCounters(df){
  const zones=zoneSizes[mode]; const rows=df.length-1; const motorRow=rows;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)df[r][c]=0;
  for(let c=0;c<cols;c++)df[motorRow][c]=0;

  const active=officersList.filter(o=>o.shift===shift);
  let counterMap=[]; let counterIndex=0;
  for(let z=0;z<zones.length;z++){for(let r=0;r<zones[z];r++)counterMap.push(r+counterIndex); counterIndex+=zones[z];}
  active.forEach(off=>{
    for(let c=0;c<cols;c++){
      const row=counterMap.find(r=>df[r][c]===0);
      if(row!==undefined)df[row][c]=1;
    }
  });
  return df;
}

// --- Render Table ---
let colHeaders=generateColHeaders();
function renderTable(){
  const df=getCurrentData(); autoFillCounters(df);
  const zones=zoneSizes[mode]; const rows=df.length-1; const motorRowIndex=rows;
  let html="<table><tr><th></th>";
  colHeaders.forEach((h,i)=>{let style=(i+1)%2===0?"border-right:5px solid;":"border-right:1px solid;"; html+=`<th style="${style}">${h}</th>`;});
  html+="</tr>";
  let currentRow=0,zoneIndex=0;
  for(let zSize of zones){
    const zoneStart=currentRow,zoneEnd=currentRow+zSize-1;
    for(let i=0;i<zSize;i++){
      const rowIndex=currentRow,isLast=i===zSize-1,rowStyle=isLast?"border-bottom:5px solid;":"";
      html+=`<tr style="${rowStyle}"><th style="${rowStyle}">${rowIndex+1}</th>`;
      df[rowIndex].forEach((v,colIndex)=>{
        let style=(colIndex+1)%2===0?"border-right:5px solid;":"border-right:1px dashed;";
        if(isLast)style+="border-bottom:5px solid;";
        if(v===1)style+="background-color:blue;"; else style+="background-color:transparent;";
        html+=`<td data-row="${rowIndex}" data-col="${colIndex}" style="${style}">${v}</td>`;
      });
      html+="</tr>"; currentRow++;
    }
    html+=`<tr class="subtotal-row"><th style="border-top:5px solid; border-bottom:5px solid;">Zone ${zoneIndex+1}</th>`;
    for(let col=0;col<cols;col++){ let style="border-top:5px solid; border-bottom:5px solid;"; style+=(col+1)%2===0?"border-right:5px solid;":"border-right:1px dashed;"; html+=`<td class="subtotal" data-sub-start="${zoneStart}" data-sub-end="${zoneEnd}" data-col="${col}" style="${style}">0</td>`;}
    html+="</tr>"; zoneIndex++;
  }
  // Grand total
  html+=`<tr class="grandtotal-row"><th style="border-top:5px solid; border-bottom:5px solid;">Total(Car)</th>`;
  for(let col=0;col<cols;col++){ let style="border-top:5px solid; border-bottom:5px solid;"; style+=(col+1)%2===0?"border-right:5px solid;":"border-right:1px dashed;"; html+=`<td class="grandtotal" data-col="${col}" style="${style}">0</td>`;}
  html+="</tr>";
  // Motor row
  html+=`<tr class="motor-row"><th style="border-top:5px solid; border-bottom:5px solid;">${motorRowIndex+1}</th>`;
  for(let col=0;col<cols;col++){ let style="border-top:5px solid; border-bottom:5px solid;"; style+=(col+1)%2===0?"border-right:5px solid;":"border-right:1px dashed;"; style+=df[motorRowIndex][col]===1?"background-color:blue;":""; html+=`<td data-row="${motorRowIndex}" data-col="${col}" style="${style}">${df[motorRowIndex][col]}</td>`;}
  html+="</tr></table>"; container.innerHTML=html;
  attachCellEvents(); updateAllTotals();
}

// --- Column Headers ---
function generateColHeaders(){ const start=shift==="morning"?10:22; let headers=[],h=start,m=0; for(let i=0;i<cols;i++){headers.push(`${String(h).padStart(2,"0")}${String(m).padStart(2,"0")}`); m+=30; if(m>=60){m=0;h++; if(h>=24)h=0;}} return headers;}

// --- Cell click/drag
function attachCellEvents(){
  const allCells = container.querySelectorAll("td[data-row]");
  allCells.forEach(td=>{
    td.addEventListener("mousedown",(e)=>{dragging=true;startRow=Number(td.dataset.row);startCol=Number(td.dataset.col);dragDirection=null;paintedCells.clear();toggleCell(td);});
    td.addEventListener("mouseover",(e)=>{if(!dragging)return; handleDrag(Number(td.dataset.row),Number(td.dataset.col));});
    td.addEventListener("mouseup",()=>{dragging=false;paintedCells.clear();});
  });
}
function handleDrag(r,c){if(dragDirection===null){if(c===startCol&&r!==startRow)dragDirection='vertical'; else if(r===startRow&&c!==startCol)dragDirection='horizontal'; else return;}
  let tr=r,tc=c;if(dragDirection==='vertical')tc=startCol; else tr=startRow; const key=`${tr}-${tc}`; if(!paintedCells.has(key)){paintedCells.add(key); toggleCell(container.querySelector(`td[data-row="${tr}"][data-col="${tc}"]`));}}
function toggleCell(td){const df=getCurrentData(); const r=Number(td.dataset.row),c=Number(td.dataset.col); df[r][c]=df[r][c]===0?1:0; td.style.backgroundColor=df[r][c]===1?"blue":"transparent"; updateAllTotals(); saveToLocalStorage();}

// --- Summary ---
function updateAllTotals(){
  const df=getCurrentData(); const rows=df.length; let subtotalValues=[];
  document.querySelectorAll(".subtotal").forEach(cell=>{const start=Number(cell.dataset.subStart),end=Number(cell.dataset.subEnd),col=Number(cell.dataset.col); let sum=0; for(let
