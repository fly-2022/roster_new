const cols = 24;
let mode = "arrival";
let shift = "morning";

const zoneSizes = {
  arrival: [10,10,10,10],
  departure: [10,8,8,10]
};

const dataStore = { arrival: null, departure: null };
const officerList = { arrival: [], departure: [] }; // Store added officers

const container = document.getElementById("table-container");
const summaryText = document.getElementById("summary-text");
const clearButton = document.getElementById("clear-button");

// Time headers
function generateColHeaders() {
  const headers = [];
  const startHour = shift === "morning" ? 10 : 22;
  let hour = startHour, minute = 0;
  for (let i=0;i<cols;i++){
    headers.push(`${hour.toString().padStart(2,"0")}${minute.toString().padStart(2,"0")}`);
    minute+=30;
    if (minute>=60){ minute=0; hour++; if(hour>=24) hour=0; }
  }
  return headers;
}

let colHeaders = generateColHeaders();

// Initialize data
function initializeData(modeName){
  const zones = zoneSizes[modeName];
  const rows = zones.reduce((a,b)=>a+b,0);
  const df = Array.from({length: rows+1},()=>Array(cols).fill(0)); // last row = motor
  return df;
}

// Get current data
function getCurrentData(){
  if(!dataStore[mode]) dataStore[mode]=initializeData(mode);
  return dataStore[mode];
}

// Render Table
function renderTable(){
  const df = getCurrentData();
  const zones = zoneSizes[mode];
  let html="<table>";
  html+="<tr><th></th>";
  colHeaders.forEach(h=>html+=`<th>${h}</th>`);
  html+="</tr>";

  let rowIndex=0;
  zones.forEach((size, zIdx)=>{
    for(let i=0;i<size;i++){
      html+=`<tr><th>${rowIndex+1}</th>`;
      for(let c=0;c<cols;c++){
        html+=`<td data-row="${rowIndex}" data-col="${c}" style="background:${df[rowIndex][c]? 'blue':'transparent'}">${df[rowIndex][c]}</td>`;
      }
      html+="</tr>";
      rowIndex++;
    }
  });

  // Motor row
  const motorRow = df.length-1;
  html+=`<tr class="motor-row"><th>${motorRow+1}</th>`;
  for(let c=0;c<cols;c++){
    html+=`<td data-row="${motorRow}" data-col="${c}" style="background:${df[motorRow][c]? 'blue':'transparent'}">${df[motorRow][c]}</td>`;
  }
  html+="</tr>";

  html+="</table>";
  container.innerHTML=html;

  addCellListeners();
  assignOfficersToGrid();
  renderSummary();
}

// Add officer click/drag listeners
function addCellListeners(){
  container.querySelectorAll("td[data-row]").forEach(td=>{
    td.onclick=()=>toggleCell(td);
  });
}

// Toggle cell manually
function toggleCell(td){
  const df=getCurrentData();
  const r=Number(td.dataset.row),c=Number(td.dataset.col);
  df[r][c]=df[r][c]===0?1:0;
  td.style.background=df[r][c]? 'blue':'transparent';
  renderSummary();
}

// Officer assignment logic
function assignOfficersToGrid(){
  const df=getCurrentData();
  const totalRows=df.length-1;
  const motorRow=df.length-1;

  // Reset table
  for(let r=0;r<totalRows;r++){
    for(let c=0;c<cols;c++) df[r][c]=0;
  }

  const zoneStartIndex = [0];
  zoneSizes[mode].reduce((acc,val)=>{zoneStartIndex.push(acc+val); return acc+val;},0);

  // Assign officers: Main -> OT -> SOS -> RA
  officerList[mode].forEach(off=>{
    let startIdx=0,endIdx=totalRows-1;
    if(off.type.startsWith('ot')){
      // fixed timing for OT
      let startCol = colHeaders.indexOf(off.start.replace(':',''));
      let endCol = colHeaders.indexOf(off.end.replace(':',''));
      for(let r=0;r<totalRows;r++){
        for(let c=startCol;c<=endCol;c++){
          if(df[r][c]===0){ df[r][c]=1; break; }
        }
      }
    }else if(off.type==='sos' || off.type==='ra'){
      let startCol = colHeaders.indexOf(off.start.replace(':',''));
      let endCol = colHeaders.indexOf(off.end.replace(':',''));
      for(let r=totalRows-1;r>=0;r--){ // fill back first
        for(let c=startCol;c<=endCol;c++){
          if(df[r][c]===0){ df[r][c]=1; break; }
        }
      }
    }else{
      // main roster, assign all empty
      for(let r=totalRows-1;r>=0;r--){
        for(let c=0;c<cols;c++){
          if(df[r][c]===0){ df[r][c]=1; break; }
        }
      }
    }
  });

  renderTableColors();
}

// Update colors after assignment
function renderTableColors(){
  const df=getCurrentData();
  container.querySelectorAll("td[data-row]").forEach(td=>{
    const r=Number(td.dataset.row),c=Number(td.dataset.col);
    td.style.background=df[r][c]? 'blue':'transparent';
  });
}

// Render summary
function renderSummary(){
  const df=getCurrentData();
  let motorRow=df.length-1;
  let text="";
  for(let c=0;c<cols;c++){
    let total=0;
    for(let r=0;r<motorRow;r++) total+=df[r][c];
    let motor=df[motorRow][c];
    text+=`${colHeaders[c]}: ${total.toString().padStart(2,'0')}/${motor.toString().padStart(2,'0')}\n`;
  }
  summaryText.textContent=text;
}

// Add Officer
document.getElementById("add-officer").onclick=function(){
  const type=document.getElementById("officer-type").value;
  const name=document.getElementById("officer-name").value;
  const start=document.getElementById("officer-start").value;
  const end=document.getElementById("officer-end").value;
  const ra=document.getElementById("officer-ra").value;
  const ro=document.getElementById("officer-ro").value;

  if(!name){ alert("Enter name"); return; }

  let officer={name,type,start,end,ra,ro};

  // Set OT fixed times if type is OT
  if(type==='ot1'){ officer.start='11:00'; officer.end='16:00'; }
  if(type==='ot2'){ officer.start='16:00'; officer.end='21:00'; }
  if(type==='ot3'){ officer.start='06:00'; officer.end='11:00'; }

  officerList[mode].push(officer);
  assignOfficersToGrid();
  renderSummary();
}

// Shift select
document.getElementById("shift-select").onchange=function(e){
  shift=e.target.value;
  colHeaders=generateColHeaders();
  renderTable();
}

// Tab switching
document.querySelectorAll(".tab").forEach(tab=>{
  tab.onclick=()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    mode=tab.dataset.mode;
    renderTable();
  }
});

// Clear button
clearButton.onclick=()=>{
  if(confirm("Clear all data for "+mode+"?")){
    dataStore[mode]=initializeData(mode);
    officerList[mode]=[];
    renderTable();
  }
}

// Initial render
renderTable();
