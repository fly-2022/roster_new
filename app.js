// --- Officer Data ---
let officers = [];

// --- Counter Setup ---
const arrivalZones = [
    { name: "Arrival 1", counters: 10 },
    { name: "Arrival 2", counters: 10 },
    { name: "Arrival 3", counters: 10 },
    { name: "Arrival 4", counters: 10 },
    { name: "Arrival Motorcycles", counters: 2 }
];

const departureZones = [
    { name: "Departure 1", counters: 10 },
    { name: "Departure 2", counters: 8 },
    { name: "Departure 3", counters: 8 },
    { name: "Departure 4", counters: 10 },
    { name: "Departure Motorcycles", counters: 2 }
];

const shiftTimes = {
    morning: { start: "1000", end: "2200" },
    night: { start: "2200", end: "1000" }
};

// --- Utility Functions ---
function timeToMinutes(time) {
    let h = parseInt(time.substring(0,2));
    let m = parseInt(time.substring(2,4));
    return h*60 + m;
}

function minutesToTime(mins) {
    let h = Math.floor(mins/60);
    let m = mins%60;
    return `${h.toString().padStart(2,'0')}${m.toString().padStart(2,'0')}`;
}

// --- Generate Counter Grid ---
function generateCounterGrid(shift) {
    const container = document.getElementById("counterGrid");
    container.innerHTML = "";
    const zones = shift === "morning" ? arrivalZones : departureZones;

    zones.forEach(zone => {
        for(let i=1; i<=zone.counters; i++) {
            const div = document.createElement("div");
            div.classList.add("counterBox");
            div.id = `${zone.name}-counter${i}`;
            div.innerHTML = `<strong>${zone.name} #${i}</strong><br>Empty`;
            container.appendChild(div);
        }
    });
}

// --- Auto-Fill Back Counters ---
function assignOfficersToCounters(shift) {
    const zones = shift === "morning" ? arrivalZones : departureZones;
    const counters = [];

    zones.forEach(zone => {
        for(let i=zone.counters; i>=1; i--) { // back-first
            counters.push({zone: zone.name, counter: i, officer: null});
        }
    });

    const activeOfficers = officers.filter(o => o.shift === shift);
    activeOfficers.forEach(off => {
        // find first empty counter
        const emptyCounter = counters.find(c => c.officer === null);
        if(emptyCounter){
            emptyCounter.officer = off.name;
        }
    });

    // Update Grid
    counters.forEach(c => {
        const div = document.getElementById(`${c.zone}-counter${c.counter}`);
        if(div) div.innerHTML = `<strong>${c.zone} #${c.counter}</strong><br>${c.officer ? c.officer : "Empty"}`;
    });
}

// --- Generate Manning Summary ---
function generateManningSummary(shift) {
    const container = document.getElementById("manningSummary");
    container.innerHTML = "";
    const times = [];
    const start = timeToMinutes(shiftTimes[shift].start);
    const end = shift === "morning" ? timeToMinutes(shiftTimes[shift].end) : timeToMinutes("0945");

    for(let t = start; t <= end; t+=15) times.push(t);

    const zones = shift === "morning" ? arrivalZones : departureZones;

    times.forEach(t => {
        let zoneCounts = zones.map(zone=>{
            let count = 0;
            for(let i=1;i<=zone.counters;i++){
                const active = officers.some(o=>{
                    const ra = timeToMinutes(o.ra);
                    const ro = timeToMinutes(o.ro)-30; // 30-min early RO
                    return ra <= t && t < ro;
                });
                if(active) count++;
            }
            return count;
        });

        const activeCars = zoneCounts.slice(0,-1).reduce((a,b)=>a+b,0);
        const activeMotor = zoneCounts.slice(-1)[0];
        const div = document.createElement("div");
        div.innerHTML = `${minutesToTime(t)}: ${activeCars}/${activeMotor}<br>${zoneCounts.join("/")}`;
        container.appendChild(div);
    });
}

// --- Add Officer ---
function addOfficer(officer){
    officers.push(officer);
    updateRoster();
}

// --- Remove Officer ---
function removeOfficer(name){
    officers = officers.filter(o=>o.name !== name);
    updateRoster();
}

// --- Form Handlers ---
document.getElementById("addOfficerForm").addEventListener("submit", e=>{
    e.preventDefault();
    const name = document.getElementById("officerName").value;
    const type = document.getElementById("officerType").value;
    const shift = document.getElementById("officerShift").value;
    const ra = document.getElementById("raTime").value;
    const ro = document.getElementById("roTime").value;

    addOfficer({name,type,shift,ra,ro});
});

document.getElementById("removeOfficerForm").addEventListener("submit", e=>{
    e.preventDefault();
    const name = document.getElementById("removeName").value;
    removeOfficer(name);
});

// --- Shift Change ---
document.getElementById("shiftSelect").addEventListener("change", updateRoster);

// --- Update Roster ---
function updateRoster(){
    const shift = document.getElementById("shiftSelect").value;
    generateCounterGrid(shift);
    assignOfficersToCounters(shift);
    generateManningSummary(shift);
}

// --- Initial Load ---
updateRoster();
