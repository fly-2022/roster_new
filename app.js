// ------------------------
// DATA STRUCTURES
// ------------------------
let officers = [];
let assignments = {}; // time -> zone -> counterIndex -> officerName

const zonesConfig = {
  arrival: [
    { name: "Zone1", counters: 10 },
    { name: "Zone2", counters: 10 },
    { name: "Zone3", counters: 10 },
    { name: "Zone4", counters: 10 }
  ],
  departure: [
    { name: "Zone1", counters: 8 },
    { name: "Zone2", counters: 10 },
    { name: "Zone3", counters: 10 },
    { name: "Zone4", counters: 8 }
  ]
};

// ------------------------
// UTILITIES
// ------------------------
function pad(num){ return String(num).padStart(2,'0'); }

function generateTimeSlots(shift){
  let slots=[], start, end;
  if(shift==="morning"){ start=1000; end=2200; }
  else { start=2200; end=1000; }
  let hour = Math.floor(start/100);
  let min = start%100;
  while(true){
    let time = pad(hour)+pad(min);
    slots.push(time);
    min += 15;
    if(min>=60){ hour+=1; min-=60; }
    if(hour>=24) hour-=24;
    if(time==pad(Math.floor(end/100))+pad(end%100)) break;
    if(slots.length>200) break; // safety
  }
  return slots;
}

// ------------------------
// BASE OFFICERS
// ------------------------
function generateBase(){
  officers=[];
  let count = parseInt(document.getElementById("baseOfficers").value);
  let operation=document.getElementById("operation").value;
  let max = zonesConfig[operation].reduce((sum,z)=>sum+z.counters,0);
  if(count>max){
    alert("Exceed max counters by "+(count-max));
    return;
  }
  for(let i=1;i<=count;i++){
    officers.push({name:"Officer"+i,start:null,end:null,type:"base"});
  }
  generateAssignments();
}

// ------------------------
// RA / RO
// ------------------------
function addRA(){
  let name=document.getElementById("raName").value;
  let time=document.getElementById("raTime").value.replace(":","");
  let o = officers.find(o=>o.name===name);
  if(o) o.start=time;
  generateAssignments();
}
function addRO(){
  let name=document.getElementById("roName").value;
  let time=document.getElementById("roTime").value.replace(":","");
  let o = officers.find(o=>o.name===name);
  if(o) o.end=time;
  generateAssignments();
}

// ------------------------
// OT / SOS
// ------------------------
function addOT(){
  let count=parseInt(document.getElementById("otCount").value);
  let block=document.getElementById("otBlock").value.split("-");
  for(let i=0;i<count;i++){
    officers.push({name:"OT"+(i+1),start:block[0],end:block[1],type:"ot"});
  }
  generateAssignments();
}
function addSOS(){
  let count=parseInt(document.getElementById("sosCount").value);
  let start=document.getElementById("sosStart").value.replace(":","");
  let end=document.getElementById("sosEnd").value.replace(":","");
  for(let i=0;i<count;i++){
    officers.push({name:"SOS"+(i+1),start:start,end:end,type:"sos"});
  }
  generateAssignments();
}

// ------------------------
// ASSIGNMENT LOGIC
// ------------------------
function generateAssignments(){
  let operation=document.getElementById("operation").value;
  let shift=document.getElementById("shift").value;
  let zones = zonesConfig[operation];
  let timeslots = generateTimeSlots(shift);

  // Initialize assignments
  assignments={};
  timeslots.forEach(t=>{
    assignments[t]={};
    zones.forEach(z=>{
      assignments[t][z.name]=Array(z.counters).fill(null);
    });
  });

  // Assign officers back-counter-first
  timeslots.forEach(t=>{
    zones.forEach(z=>{
      let maxCounters = z.counters;
      let assigned = assignments[t][z.name];
      let counterIndices = Array.from({length:maxCounters},(_,i)=>maxCounters-1-i); // back first
      counterIndices.forEach(idx=>{
        for(let o of officers){
          if(o.start && t<o.start) continue;
          if(o.end && t>=o.end) continue;
          if(!assigned.includes(o.name)){
            assigned[idx]=o.name;
            break;
          }
        }
      });
    });
  });

  renderGrid();
  renderSummary();
  renderOfficerRoster();
}

// ------------------------
// RENDER GRID
// ------------------------
function renderGrid(){
  const grid=document.getElementById("grid");
  grid.innerHTML="";
  let operation=document.getElementById("operation").value;
  let shift=document.getElementById("shift").value;
  let zones = zonesConfig[operation];
  let timeslots = generateTimeSlots(shift);

  // Header
  let header = document.createElement("tr");
  header.appendChild(document.createElement("th")); // corner cell
  timeslots.forEach(t=>{
    let th=document.createElement("th");
    th.textContent=t;
    header.appendChild(th);
  });
  grid.appendChild(header);

  // Rows
  zones.forEach((z,zi)=>{
    for(let c=0;c<z.counters;c++){
      let tr=document.createElement("tr");
      let th=document.createElement("th");
      th.textContent=`${z.name} C${c+1}`;
      tr.appendChild(th);
      timeslots.forEach(t=>{
        let td=document.createElement("td");
        td.className="counterCell closed";
        if(assignments[t][z.name][c]) td.className="counterCell zone"+(zi+1);
        td.dataset.time=t;
        td.dataset.zone=z.name;
        td.dataset.counter=c;
        td.onclick=()=>toggleHighlight(td);
        td.textContent=c+1;
        tr.appendChild(td);
      });
      grid.appendChild(tr);
    }
  });
}

// ------------------------
// HIGHLIGHT
// ------------------------
function toggleHighlight(td){
  let classes=["highlight1","highlight2","highlight3","highlight4"];
  let current = classes.find(c=>td.classList.contains(c));
  if(!current) td.classList.add(classes[0]);
  else{
    let idx = classes.indexOf(current);
    td.classList.remove(current);
    let next = (idx+1)%classes.length;
    td.classList.add(classes[next]);
  }
}

// ------------------------
// SUMMARY
// ------------------------
function renderSummary(){
  let summary="";
  let operation=document.getElementById("operation").value;
  let zones = zonesConfig[operation];
  Object.keys(assignments).forEach(t=>{
    let total=0;
    let breakdown=[];
    zones.forEach(z=>{
      let count = assignments[t][z.name].filter(x=>x!=null).length;
      total+=count;
      breakdown.push(count);
    });
    summary+=t+": "+total+"/01\n";
    summary+=breakdown.join("/")+"\n\n";
  });
  document.getElementById("summary").textContent=summary;
}

// ------------------------
// OFFICER ROSTER
// ------------------------
function renderOfficerRoster(){
  let text="";
  officers.forEach(o=>{
    text+=o.name+" ("+o.type+")";
    if(o.start) text+=" RA:"+o.start;
    if(o.end) text+=" RO:"+o.end;
    text+="\n";
  });
  document.getElementById("officerRoster").textContent=text;
}

// ------------------------
// SEARCH
// ------------------------
function searchOfficer(){
  let q=document.getElementById("searchBox").value.toLowerCase();
  let text="";
  officers.filter(o=>o.name.toLowerCase().includes(q))
          .forEach(o=>text+=o.name+"\n");
  document.getElementById("officerRoster").textContent=text;
}
