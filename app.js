class RosterManager {
    constructor() {
        this.currentShift = 'morning';
        this.officers = {
            main: [],
            sos: [],
            ot: [],
            ra_ro: []
        };
        this.counters = this.initializeCounters();
        this.shiftSchedules = this.initializeSchedules();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCounterGrid();
        this.updateDisplay();
    }

    initializeCounters() {
        return {
            arrival: {
                zone1: { car: 10, mc: 2, active: [] },
                zone2: { car: 10, mc: 0, active: [] },
                zone3: { car: 10, mc: 0, active: [] },
                zone4: { car: 10, mc: 0, active: [] }
            },
            departure: {
                zone1: { car: 10, mc: 2, active: [] },
                zone2: { car: 8, mc: 0, active: [] },
                zone3: { car: 8, mc: 0, active: [] },
                zone4: { car: 10, mc: 0, active: [] }
            }
        };
    }

    initializeSchedules() {
        return {
            morning: {
                start: '10:00',
                end: '22:00',
                summary_start: '10:00',
                summary_end: '21:45'
            },
            night: {
                start: '22:00',
                end: '10:00',
                summary_start: '22:00',
                summary_end: '09:45'
            },
            breaks: {
                main_morning: [
                    { duration: 45, type: 'break' },
                    { duration: 45, type: 'break' },
                    { duration: 30, type: 'break' }
                ],
                main_night: [
                    { duration: 30, type: 'break' },
                    { duration: 30, type: 'break' },
                    { duration: 150, type: 'long_break' }
                ],
                ot1: [{ start: '12:30', end: '14:45', slots: 3 }],
                ot2: [{ start: '17:30', end: '19:45', slots: 3 }],
                ot3: [{ start: '07:30', end: '09:45', slots: 3 }]
            },
            ot_schedules: {
                ot1: { start: '11:00', end: '15:30', shift: 'morning' },
                ot2: { start: '16:00', end: '20:30', shift: 'morning' },
                ot3: { start: '06:00', end: '10:30', shift: 'night' }
            }
        };
    }

    setupEventListeners() {
        document.getElementById('morning-shift').addEventListener('click', () => {
            this.switchShift('morning');
        });

        document.getElementById('night-shift').addEventListener('click', () => {
            this.switchShift('night');
        });
    }

    switchShift(shift) {
        this.currentShift = shift;
        document.querySelectorAll('.shift-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${shift}-shift`).classList.add('active');
        this.updateDisplay();
    }

    initializeCounterGrid() {
        const zones = ['arrival', 'departure'];
        zones.forEach(area => {
            for (let i = 1; i <= 4; i++) {
                const zoneData = this.counters[area][`zone${i}`];
                const container = document.getElementById(`${area}-zone-${i}`);
                container.innerHTML = '';

                // Add car counters
                for (let j = 1; j <= zoneData.car; j++) {
                    const counter = this.createCounterElement(`${area}-zone${i}-car${j}`, 'car');
                    container.appendChild(counter);
                }

                // Add motorcycle counters
                for (let j = 1; j <= zoneData.mc; j++) {
                    const counter = this.createCounterElement(`${area}-zone${i}-mc${j}`, 'mc');
                    container.appendChild(counter);
                }
            }
        });
    }

    createCounterElement(id, type) {
        const counter = document.createElement('div');
        counter.className = 'counter available';
        counter.id = id;
        counter.textContent = type === 'car' ? 'C' : 'MC';
        counter.title = `${type.toUpperCase()} Counter - Available`;
        
        counter.addEventListener('click', () => {
            this.toggleCounter(id);
        });

        return counter;
    }

    toggleCounter(counterId) {
        const counter = document.getElementById(counterId);
        const currentState = counter.classList.contains('occupied') ? 'occupied' : 'available';
        
        if (currentState === 'available') {
            counter.classList.remove('available');
            counter.classList.add('occupied');
            counter.title = counter.title.replace('Available', 'Occupied');
        } else {
            counter.classList.remove('occupied');
            counter.classList.add('available');
            counter.title = counter.title.replace('Occupied', 'Available');
        }
        
        this.updateStatus();
    }

    generateOfficerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    addOfficer(type) {
        let officer = {
            id: this.generateOfficerId(),
            type: type,
            shift: this.currentShift,
            addedAt: new Date().toISOString()
        };

        switch(type) {
            case 'main-roster':
                officer.breaks = this.shiftSchedules.breaks[`main_${this.currentShift}`];
                this.officers.main.push(officer);
                break;
            case 'sos':
                this.officers.sos.push(officer);
                break;
            case 'ot':
                const otType = document.getElementById('ot-type').value;
                officer.otType = otType;
                officer.schedule = this.shiftSchedules.ot_schedules[otType];
                officer.breaks = this.shiftSchedules.breaks[otType];
                this.officers.ot.push(officer);
                break;
            case 'ra-ro':
                const time = document.getElementById('ra-ro-time').value;
                const raRoType = document.getElementById('ra-ro-type').value;
                if (!time) {
                    alert('Please specify time for RA/RO');
                    return;
                }
                officer.time = time;
                officer.raRoType = raRoType;
                if (raRoType === 'ro') {
                    // Calculate release time (30 minutes before)
                    officer.releaseTime = this.subtractMinutes(time, 30);
                }
                this.officers.ra_ro.push(officer);
                break;
        }

        this.updateDisplay();
        this.showNotification(`${type.toUpperCase()} officer added successfully`);
    }

    removeOfficer(type) {
        let removed = false;
        
        switch(type) {
            case 'main-roster':
                if (this.officers.main.length > 0) {
                    this.officers.main.pop();
                    removed = true;
                }
                break;
            case 'sos':
                if (this.officers.sos.length > 0) {
                    this.officers.sos.pop();
                    removed = true;
                }
                break;
            case 'ot':
                if (this.officers.ot.length > 0) {
                    this.officers.ot.pop();
                    removed = true;
                }
                break;
            case 'ra-ro':
                if (this.officers.ra_ro.length > 0) {
                    this.officers.ra_ro.pop();
                    removed = true;
                }
                break;
        }

        if (removed) {
            this.updateDisplay();
            this.showNotification(`${type.toUpperCase()} officer removed successfully`);
        } else {
            this.showNotification(`No ${type.toUpperCase()} officers to remove`);
        }
    }

    subtractMinutes(timeStr, minutes) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins, 0, 0);
        date.setMinutes(date.getMinutes() - minutes);
        return date.toTimeString().substr(0, 5);
    }

    updateDisplay() {
        this.updateStatus();
        this.updateManningSummary();
    }

    updateStatus() {
        const totalOfficers = this.getTotalOfficers();
        const activeCounters = this.getActiveCounters();
        const totalCounters = this.getTotalCounters();
        const manningLevel = Math.round((activeCounters.total / totalCounters.total) * 100);

        document.getElementById('total-officers').textContent = totalOfficers;
        document.getElementById('manning-level').textContent = `${manningLevel}%`;
        document.getElementById('car-counters').textContent = activeCounters.car;
        document.getElementById('mc-counters').textContent = activeCounters.mc;

        // Update manning level color based on minimum requirement
        const manningElement = document.getElementById('manning-level');
        if (manningLevel < 50) {
            manningElement.style.color = '#dc3545'; // Red for below minimum
        } else {
            manningElement.style.color = '#28a745'; // Green for adequate
        }
    }

    getTotalOfficers() {
        return this.officers.main.length + 
               this.officers.sos.length + 
               this.officers.ot.length + 
               this.officers.ra_ro.length;
    }

    getActiveCounters() {
        let carCount = 0;
        let mcCount = 0;
        
        document.querySelectorAll('.counter.occupied').forEach(counter => {
            if (counter.textContent === 'C') carCount++;
            if (counter.textContent === 'MC') mcCount++;
        });

        return { car: carCount, mc: mcCount, total: carCount + mcCount };
    }

    getTotalCounters() {
        // Arrival: 40 car + 2 MC = 42
        // Departure: 36 car + 2 MC = 38
        return { car: 76, mc: 4, total: 80 };
    }

    generateManningSummary() {
        const schedule = this.shiftSchedules[this.currentShift];
        const startTime = this.parseTime(schedule.summary_start);
        const endTime = this.parseTime(schedule.summary_end);
        
        let summary = `Manning Summary - ${this.currentShift.toUpperCase()} SHIFT\n`;
        summary += `Period: ${schedule.summary_start} - ${schedule.summary_end}\n\n`;

        const currentTime = new Date(startTime);
        const end = new Date(endTime);

        // Handle overnight shift
        if (this.currentShift === 'night' && end < currentTime) {
            end.setDate(end.getDate() + 1);
        }

        while (currentTime <= end) {
            const timeStr = this.formatTime(currentTime);
            const counters = this.getCountersAtTime(timeStr);
            
            summary += `${timeStr}: ${counters.car}/${String(counters.mc).padStart(2, '0')}\n`;
            summary += `${counters.zone1}/${counters.zone2}/${counters.zone3}/${counters.zone4}\n\n`;

            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }

        document.getElementById('manning-display').textContent = summary;
    }

    getCountersAtTime(timeStr) {
        // This would calculate actual manning based on officer schedules and breaks
        // For now, returning current active counters
        const active = this.getActiveCounters();
        return {
            car: active.car,
            mc: active.mc,
            zone1: Math.floor(active.total / 4),
            zone2: Math.floor(active.total / 4),
            zone3: Math.floor(active.total / 4),
            zone4: Math.floor(active.total / 4)
        };
    }

    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    formatTime(date) {
        return date.toTimeString().substr(0, 5);
    }

    exportSummary() {
        const summary = document.getElementById('manning-display').textContent;
        if (!summary) {
            this.showNotification('Please generate summary first');
            return;
        }

        const blob = new Blob([summary], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manning-summary-${this.currentShift}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showNotification(message) {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Global functions for button handlers
let rosterManager;

function addOfficer(type) {
    rosterManager.addOfficer(type);
}

function removeOfficer(type) {
    rosterManager.removeOfficer(type);
}

function generateM*
