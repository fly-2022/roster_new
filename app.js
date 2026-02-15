// ------------------------
// DATA STRUCTURES
// ------------------------
let officers = [];
let assignments = {}; // time => zone => array of officer names

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
// UTILITY FUNCTIONS
// ------------------------
function pad(num) { return String(num).padStart(2, '0'); }

function generateTimeSlots(shift) {
    let slots = [], start, end;
    if (shift === "morning") { start = 1000; end = 2200; }
    else { start = 2200; end = 1000; }

    let hour = Math.floor(start / 100);
    let min = start % 100;
    while (true) {
        let time = pad(hour) + pad(min);
        slots.push(time);
        min += 15;
        if (min >= 60) { hour += 1; min -= 60; }
        if (hour >= 24) hour -= 24;
        if (time == pad(Math.floor(end / 100)) + pad(end % 100)) break;
        if (slots.length > 200) break; // safety
    }
    return slots;
}

// ------------------------
// BASE GENERATION
// ------------------------
function generateBase() {
    officers = [];
    let count = parseInt(document.getElementById("baseOfficers").value);
    let operation = document.getElementById("operation").value;
    let max = zonesConfig[operation].reduce((sum, z) => sum + z.counters, 0);
    if (count > max) {
        alert("Exceed max counters by " + (count - max));
        return;
    }
    for (let i = 1; i <= count; i++) {
        officers.push({ name: "Officer" + i, start: null, end: null, type: "base" });
    }
    generateAssignments();
}

// ------------------------
// RA / RO
// ------------------------
function addRA() {
    let name = document.getElementById("raName").value;
    let time = document.getElementById("raTime").value.replace(":", "");
    let o = officers.find(o => o.name === name);
    if (o) o.start = time;
    generateAssignments();
}
function addRO() {
    let name = document.getElementById("roName").value;
    let time = document.getElementById("roTime").value.replace(":", "");
    let o = officers.find(o => o.name === name);
    if (o) o.end = time;
    generateAssignments();
}

// ------------------------
// OT / SOS
// ------------------------
function addOT() {
    let count = parseInt(document.getElementById("otCount").value);
    let block = document.getElementById("otBlock").value.split("-");
    for (let i = 0; i < count; i++) {
        officers.push({ name: "OT" + (i + 1), start: block[0], end: block[1], type: "ot" });
    }
    generateAssignments();
}
function addSOS() {
    let count = parseInt(document.getElementById("sosCount").value);
    let start = document.getElementById("sosStart").value.replace(":", "");
    let end = document.getElementById("sosEnd").value.replace(":", "");
    for (let i = 0; i < count; i++) {
        officers.push({ name: "SOS" + (i + 1), start: start, end: end, type: "sos" });
    }
    generateAssignments();
}

// ------------------------
// ASSIGNMENT LOGIC
// ------------------------
function generateAssignments() {
    let operation = document.getElementById("operation").value;
    let shift = document.getElementById("shift").value;
    let zones = zonesConfig[operation];
    let timeslots = generateTimeSlots(shift);
    assignments = {};

    // Initialize assignments
    timeslots.forEach(t => {
        assignments[t] = {};
        zones.forEach(z => assignments[t][z.name] = []);
    });

    // Assign officers
    timeslots.forEach(t => {
        zones.forEach(z => {
            let maxCounters = z.counters;
            let assigned = assignments[t][z.name];
            officers.forEach(o => {
                if (assigned.length >= maxCounters) return;
                if (o.start && t < o.start) return;
                if (o.end && t >= o.end) return;
                if (!assigned.includes(o.name)) assigned.push(o.name);
            });
        });
    });

    renderGrid();
    renderSummary();
    renderOfficerRoster();
}

// ------------------------
// RENDERING
// ------------------------
function renderGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    let operation = document.getElementById("operation").value;
    let shift = document.getElementById("shift").value;
    let zones = zonesConfig[operation];
    let timeslots = generateTimeSlots(shift);

    timeslots.forEach(t => {
        let row = document.createElement("div");
        row.className = "row";
        let label = document.createElement("span");
        label.textContent = t + ": ";
        row.appendChild(label);

        zones.forEach((z, zi) => {
            for (let i = 0; i < z.counters; i++) {
                let div = document.createElement("div");
                div.className = "counter closed";
                if (assignments[t][z.name][i]) div.className = "counter zone" + (zi + 1);
                div.dataset.time = t;
                div.dataset.zone = z.name;
                div.dataset.index = i;
                div.onclick = () => toggleHighlight(div);
                div.textContent = i + 1;
                row.appendChild(div);
            }
        });
        grid.appendChild(row);
    });
}

function toggleHighlight(div) {
    let classes = ["highlight1", "highlight2", "highlight3", "highlight4"];
    let current = classes.find(c => div.classList.contains(c));
    if (!current) div.classList.add(classes[0]);
    else {
        let idx = classes.indexOf(current);
        div.classList.remove(current);
        let next = (idx + 1) % classes.length;
        div.classList.add(classes[next]);
    }
}

function renderSummary() {
    let summary = "";
    let operation = document.getElementById("operation").value;
    let zones = zonesConfig[operation];
    Object.keys(assignments).forEach(t => {
        let total = 0;
        let breakdown = [];
        zones.forEach(z => {
            let count = assignments[t][z.name].length;
            total += count;
            breakdown.push(count);
        });
        summary += t + ": " + total + "/01\n";
        summary += breakdown.join("/") + "\n\n";
    });
    document.getElementById("summary").textContent = summary;
}

function renderOfficerRoster() {
    let text = "";
    officers.forEach(o => {
        text += o.name + " (" + o.type + ")";
        if (o.start) text += " RA:" + o.start;
        if (o.end) text += " RO:" + o.end;
        text += "\n";
    });
    document.getElementById("officerRoster").textContent = text;
}

function searchOfficer() {
    let q = document.getElementById("searchBox").value.toLowerCase();
    let text = "";
    officers.filter(o => o.name.toLowerCase().includes(q))
        .forEach(o => text += o.name + "\n");
    document.getElementById("officerRoster").textContent = text;
}
