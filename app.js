// Global variables
let officers = {
    main: [],
    sos: [],
    ot: [],
    ra_ro: []
};

let currentShift = 'morning';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    initializeCounterGrid();
    setupEventListeners();
    updateDisplay();
});

// Setup event listeners
function setupEventListeners() {
    const morningBtn = document.getElementById('morning-shift');
    const nightBtn = document.getElementById('night-shift');
    
    if (morningBtn) {
        morningBtn.addEventListener('click', () => switchShift('morning'));
    }
    if (nightBtn) {
        nightBtn.addEventListener('click', () => switchShift('night'));
    }
}

// Switch shift function
function switchShift(shift) {
    currentShift = shift;
    document.querySelectorAll('.shift-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`${shift}-shift`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    updateDisplay();
    showNotification(`Switched to ${shift} shift`);
}

// Initialize counter grid
function initializeCounterGrid() {
    console.log('Initializing counter grid...');
    
    // Arrival zones configuration
    const arrivalConfig = {
        'arrival-zone-1': { car: 10, mc: 2 },
        'arrival-zone-2': { car: 10, mc: 0 },
        'arrival-zone-3': { car: 10, mc: 0 },
        'arrival-zone-4': { car: 10, mc: 0 }
    };
    
    // Departure zones configuration
    const departureConfig = {
        'departure-zone-1': { car: 10, mc: 2 },
        'departure-zone-2': { car: 8, mc: 0 },
        'departure-zone-3': { car: 8, mc: 0 },
        'departure-zone-4': { car: 10, mc: 0 }
    };
    
    // Create counters for arrival zones
    Object.keys(arrivalConfig).forEach(zoneId => {
        createCountersForZone(zoneId, arrivalConfig[zoneId]);
    });
    
    // Create counters for departure zones
    Object.keys(departureConfig).forEach(zoneId => {
        createCountersForZone(zoneId, departureConfig[zoneId]);
    });
}

// Create counters for a specific zone
function createCountersForZone(zoneId, config) {
    const container = document.getElementById(zoneId);
    if (!container) {
        console.error(`Container not found: ${zoneId}`);
        return;
    }
    
    container.innerHTML = '';
    
    // Add car counters
    for (let i = 1; i <= config.car; i++) {
        const counter = createCounterElement(`${zoneId}-car${i}`, 'car');
        container.appendChild(counter);
    }
    
    // Add motorcycle counters
    for (let i = 1; i <= config.mc; i++) {
        const counter = createCounterElement(`${zoneId}-mc${i}`, 'mc');
        container.appendChild(counter);
    }
}

// Create individual counter element
function createCounterElement(id, type) {
    const counter = document.createElement('div');
    counter.className = 'counter available';
    counter.id = id;
    counter.textContent = type === 'car' ? 'C' : 'MC';
    counter.title = `${type.toUpperCase()} Counter - Available (Click to toggle)`;
    
    counter.addEventListener('click', () => {
        toggleCounter(id);
    });
    
    return counter;
}

// Toggle counter status
function toggleCounter(counterId) {
    const counter = document.getElementById(counterId);
    if (!counter) return;
    
    const isOccupied = counter.classList.contains('occupied');
    
    if (isOccupied) {
        counter.classList.remove('occupied');
        counter.classList.add('available');
        counter.title = counter.title.replace('Occupied', 'Available');
    } else {
        counter.classList.remove('available');
        counter.classList.add('occupied');
        counter.title = counter.title.replace('Available', 'Occupied');
    }
    
    updateDisplay();
    showNotification(`Counter ${counterId} ${isOccupied ? 'released' : 'assigned'}`);
}

// Add officer function - GLOBAL
function addOfficer(type) {
    console.log(`Adding officer of type: ${type}`);
    
    const officerId = generateOfficerId();
    const officer = {
        id: officerId,
        type: type,
        shift: currentShift,
        addedAt: new Date().toISOString()
    };
    
    switch(type) {
        case 'main-roster':
            officers.main.push(officer);
            break;
        case 'sos':
            officers.sos.push(officer);
            break;
        case 'ot':
            const otType = document.getElementById('ot-type')?.value || 'ot1';
            officer.otType = otType;
            officers.ot.push(officer);
            break;
        case 'ra-ro':
            const timeInput = document.getElementById('ra-ro-time');
            const typeInput = document.getElementById('ra-ro-type');
            const time = timeInput?.value;
            const raRoType = typeInput?.value || 'ra';
            
            if (!time) {
                showNotification('Please specify time for RA/RO', 'error');
                return;
            }
            officer.time = time;
            officer.raRoType = raRoType;
            officers.ra_ro.push(officer);
            break;
    }
    
    updateDisplay();
    showNotification(`${type.replace('-', ' ').toUpperCase()} officer added (ID: ${officerId})`);
}

// Remove officer function - GLOBAL
function removeOfficer(type) {
    console.log(`Removing officer of type: ${type}`);
    
    let removed = false;
    let removedOfficer = null;
    
    switch(type) {
        case 'main-roster':
            if (officers.main.length > 0) {
                removedOfficer = officers.main.pop();
                removed = true;
            }
            break;
        case 'sos':
            if (officers.sos.length > 0) {
                removedOfficer = officers.sos.pop();
                removed = true;
            }
            break;
        case 'ot':
            if (officers.ot.length > 0) {
                removedOfficer = officers.ot.pop();
                removed = true;
            }
            break;
        case 'ra-ro':
            if (officers.ra_ro.length > 0) {
                removedOfficer = officers.ra_ro.pop();
                removed = true;
            }
            break;
    }
    
    if (removed) {
        updateDisplay();
        showNotification(`${type.replace('-', ' ').toUpperCase()} officer removed (ID: ${removedOfficer.id})`);
    } else {
        showNotification(`No ${type.replace('-', ' ').toUpperCase()} officers to remove`, 'error');
    }
}

// Generate manning summary - GLOBAL
function generateManningSummary() {
    console.log('Generating manning summary...');
    
    const isNightShift = currentShift === 'night';
    const startTime = isNightShift ? '22:00' : '10:00';
    const endTime = isNightShift ? '09:45' : '21:45';
    
    let summary = `Manning Summary - ${currentShift.toUpperCase()} SHIFT\n`;
    summary += `Period: ${startTime} - ${endTime}\n`;
    summary += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Get current counter status
    const activeCounters = getActiveCounters();
    const totalCounters = getTotalCounters();
    
    // Generate time intervals (every 15 minutes)
    const times = generateTimeIntervals(startTime, endTime);
    
    times.forEach(time => {
        const counters = calculateCountersAtTime(time);
        summary += `${time}: ${counters.car}/${String(counters.mc).padStart(2, '0')}\n`;
        summary += `${counters.zone1}/${counters.zone2}/${counters.zone3}/${counters.zone4}\n\n`;
    });
    
    // Add summary statistics
    summary += `--- SUMMARY ---\n`;
    summary += `Total Officers: ${getTotalOfficers()}\n`;
    summary += `Active Counters: ${activeCounters.total}/${totalCounters.total}\n`;
    summary += `Manning Level: ${Math.round((activeCounters.total / totalCounters.total) * 100)}%\n`;
    
    const displayEl = document.getElementById('manning-display');
    if (displayEl) {
        displayEl.textContent = summary;
    }
    
    showNotification('Manning summary generated successfully');
}

// Export summary - GLOBAL
function exportSummary() {
    const summaryEl = document.getElementById('manning-display');
    const summary = summaryEl?.textContent;
    
    if (!summary || summary.trim() === '') {
        showNotification('Please generate summary first', 'error');
        return;
    }
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manning-summary-${currentShift}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Summary exported successfully');
}

// Helper functions
function generateOfficerId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function getTotalOfficers() {
    return officers.main.length + officers.sos.length + officers.ot.length + officers.ra_ro.length;
}

function getActiveCounters() {
    let carCount = 0;
    let mcCount = 0;
    
    document.querySelectorAll('.counter.occupied').forEach(counter => {
        if (counter.textContent === 'C') carCount++;
        if (counter.textContent === 'MC') mcCount++;
    });
    
    return { car: carCount, mc: mcCount, total: carCount + mcCount };
}

function getTotalCounters() {
    return { car: 76, mc: 4, total: 80 };
}

function generateTimeIntervals(startTime, endTime) {
    const times = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // Handle overnight shift
    if (currentShift === 'night' && end < start) {
        end.setDate(end.getDate() + 1);
    }
    
    const current = new Date(start);
    while (current <= end) {
        times.push(formatTime(current));
        current.setMinutes(current.getMinutes() + 15);
    }
    
    return times;
}

function calculateCountersAtTime(time) {
    const active = getActiveCounters();
    const perZone = Math.floor(active.total / 4);
    const remainder = active.total % 4;
    
    return {
        car: active.car,
        mc: active.mc,
        zone1: perZone + (remainder > 0 ? 1 : 0),
        zone2: perZone + (remainder > 1 ? 1 : 0),
        zone3: perZone + (remainder > 2 ? 1 : 0),
        zone4: perZone
    };
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function formatTime(date) {
    return date.toTimeString().substr(0, 5);
}

function updateDisplay() {
    const totalOfficers = getTotalOfficers();
    const activeCounters = getActiveCounters();
    const totalCounters = getTotalCounters();
    const manningLevel = totalCounters.total > 0 ? Math.round((activeCounters.total / totalCounters.total) * 100) : 0;
    
    // Update status elements
    const elements = {
        'total-officers': totalOfficers,
        'car-counters': activeCounters.car,
        'mc-counters': activeCounters.mc,
        'manning-level': `${manningLevel}%`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
    
    // Color code manning level
    const manningElement = document.getElementById('manning-level');
    if (manningElement) {
        manningElement.style.color = manningLevel < 50 ? '#dc3545' : '#28a745';
    }
}

function showNotification(message, type = 'success') {
    console.log(`Notification: ${message}`);
    
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Add animation styles if not exists
    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Debug function to check if everything is working
function debugSystem() {
    console.log('=== ROSTER SYSTEM DEBUG ===');
    console.log('Current shift:', currentShift);
    console.log('Officers:', officers);
    console.log('Active counters:', getActiveCounters());
    console.log('Total officers:', getTotalOfficers());
    console.log('Functions available:', {
        addOfficer: typeof addOfficer,
        removeOfficer: typeof removeOfficer,
        generateManningSummary: typeof generateManningSummary,
        exportSummary: typeof exportSummary
    });
}

// Make debug function available globally
window.debugSystem = debugSystem;

console.log('Roster script loaded successfully');
