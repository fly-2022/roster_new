// ------------------------
// DATA STRUCTURES
// ------------------------
let officers = [];
let assignments = {}; // time -> zone -> counterIndex -> {name,type}

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

const manualMotor = {
  arrival: ["AM41","AM42"],
  departure: ["DM37A","DM37B"]
};

// ------------------------
// TIME UTIL
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
    min+=15;
    if(min>=60){ hour+=1; min-=60; }
    if(hour>=24) hour-=24;
    if(time==pad(Math.floor(end/100))+pad(end%100)) break;
    if(slots.length>200) break;
  }
  return slots;
}

// ------------------------
// GENERATE BASE OFFICERS
// ------------------------
function generateBase(){
  officers=[];
  let count = parseInt(document.getElementById("baseOfficers").value);
  let operation=document.getElementById("operation").value;
  let max = zonesConfig[operation].reduce((sum,z)=>sum+z.counters,0) + 2; // include 2 manual motorcycles
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
    // Manual motorcycles
    assignments[t]["Motorcycles"]=manualMotor[operation].map(m=>null);
  });

  // Assign officers back-counter-first
  timeslots.forEach(t=>{
    zones.forEach((z,zi)=>{
      let maxCounters = z.counters;
      let assigned = assignments[t][z.name];
      let counterIndices = Array.from({length:maxCounters},(_,i)=>maxCounters-1-i); // back first
      counterIndices.forEach(idx=>{
        for(let o of officers){
          if(o.start && t<o.start) continue;
          if(o.end && t>=o.end) continue;
          if(!assigned.includes(o.name)){
            assigned[idx]={name:o.name,type:o.type};
            break;
          }
        }
      });
    });
    // Assign motorcycles if officers left
    let mAssigned = assignments[t]["Motorcycles"];
    mAssigned.forEach((m,mi)=>{
      for(let o of officers){
        if(o.start && t<o.start) continue;
        if(o.end && t>=o.end) continue;
        if(!mAssigned.find(x=>x && x.name===o.name)){
          mAssigned[mi]={name:o.name,type:o.type};
          break;
        }
      }
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
  header.appendChild(document.createElement("th")); // corner
  header.appendChild(document.createElement("th")); // zone column
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
      let thC=document.createElement("th");
      thC.textContent=(operation==="arrival"?"AC":"DC") + (Object.values(zones).slice(0,zi).reduce((s,z2)=>s+z2.counters,0)+c+1);
      tr.appendChild(thC);

      let thZ=document.createElement("th");
      thZ.textContent=z.name;
      tr.appendChild(thZ);

      timeslots.forEach(t=>{
        let td=document.createElement("td");
        td.className="counterCell closed";
        let assign = assignments[t][z.name][c];
        if(assign){
          td.textContent=assign.name;
          if(assign.type==="base") td.className="counterCell zone"+(zi+1);
          else if(assign.type==="ot") td.className="counterCell highlight3";
          else if(assign.type==="sos") td.className="counterCell highlight2";
        }else{
          td.textContent="";
          td.className="counterCell closed";
        }
        tr.appendChild(td);
      });
      grid.appendChild(tr);
    }
  });

  // Manual motorcycles
  let mRow = assignments[timeslots[0]]["Motorcycles"].map((_,mi)=>{
    let tr=document.createElement("tr");
    let thC=document.createElement("th");
    thC.textContent=manualMotor[operation][mi];
    tr.appendChild(thC);
    let thZ=document.createElement("th");
    thZ.textContent="Motorcycles";
    tr.appendChild(thZ);
    timeslots.forEach(t=>{
      let td=document.createElement("td");
      let assign = assignments[t]["Motorcycles"][mi];
      if(assign){
        td.textContent=assign.name;
        td.className=assign.type==="base"?"counterCell highlight1":
                     assign.type==="ot"?"counterCell highlight3":
                     assign.type==="sos"?"counterCell highlight2":"counterCell closed";
      }else{
        td.className="counterCell closed";
        td.textContent="";
      }
      tr.appendChild(td);
    });
    grid.appendChild(tr);
  });
}

// ------------------------
// SUMMARY
// ------------------------
function renderSummary(){
  let summary="";
  let operation=document.getElementById("operation").value;
  let zones = zonesConfig[operation];
  let timeslots = Object.keys(assignments);
  timeslots.forEach(t=>{
    let total=0;
    let breakdown=[];
    zones.forEach(z=>{
      let count = assignments[t][z.name].filter(x=>x!=null).length;
      total+=count;
      breakdown.push(count);
    });
    summary+=t+": "+total+"/"+manualMotor[operation].length+"\n";
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
