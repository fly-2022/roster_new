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
        const morningBtn = document.getElementById('morning-shift');
        const nightBtn = document.getElementById('night-shift');
        
        if (morningBtn) {
            morningBtn.addEventListener('click', () => {
                this.switchShift('morning');
            });
        }

        if (nightBtn) {
            nightBtn.addEventListener('click', () => {
                this.switchShift('night');
            });
        }
    }

    switchShift(shift) {
        this.currentShift = shift;
        document.querySelectorAll('.shift-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`${shift}-shift`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        this.updateDisplay();
    }

    initializeCounterGrid() {
        const zones = ['arrival', 'departure'];
        zones.forEach(area => {
            for (let i = 1; i <= 4; i++) {
                const zoneData = this.counters[area][`zone${i}`];
                const container = document.getElementById(`${area}-zone-${i}`);
                if (container) {
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
                const otType = document.getElementById('ot-type')?.value || 'ot1';
                officer.otType = otType;
                officer.schedule = this.shiftSchedules.ot_schedules[otType];
                officer.breaks = this.shiftSchedules.breaks[otType];
                this.officers.ot.push(officer);
                break;
            case 'ra-ro':
                const timeInput = document.getElementById('ra-ro-time');
                const typeInput = document.getElementById('ra-ro-type');
                const time = timeInput?.value;
                const raRoType = typeInput?.value || 'ra';
                
                if (!time) {
                    this.showNotification('Please specify time for RA/RO', 'error');
                    return;
                }
                officer.time = time;
                officer.raRoType = raRoType;
                if (raRoType === 'ro') {
                    officer.releaseTime = this.subtractMinutes(time, 30);
                }
                this.officers.ra_ro.push(officer);
                break;
        }

        this.updateDisplay();
        this.showNotification(`${type.replace('-', ' ').toUpperCase()} officer added successfully`);
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
            this.showNotification(`${type.replace('-', ' ').toUpperCase()} officer removed successfully`);
        } else {
            this.showNotification(`No ${type.replace('-', ' ').toUpperCase()} officers to remove`, 'error');
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
    }

    updateStatus() {
        const totalOfficers = this.getTotalOfficers();
        const activeCounters = this.getActiveCounters();
        const totalCounters = this.getTotalCounters();
        const manningLevel = totalCounters.total > 0 ? Math.round((activeCounters.total / totalCounters.total) * 100) : 0;

        const totalOfficersEl = document.getElementById('total-officers');
        const manningLevelEl = document.getElementById('manning-level');
        const carCountersEl = document.getElementById('car-counters');
        const mcCountersEl = document.getElementById('mc-counters');

        if (totalOfficersEl) totalOfficersEl.textContent = totalOfficers;
        if (manningLevelEl) {
            manningLevelEl.textContent = `${manningLevel}%`;
            if (manningLevel < 50) {
                manningLevelEl.style.color = '#dc3545';
            } else {
                manningLevelEl.style.color = '#28a745';
            }
        }
        if (carCountersEl) carCountersEl.textContent = activeCounters.car;
        if (mcCountersEl) mcCountersEl.textContent = activeCounters.mc;
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

        const displayEl = document.getElementById('manning-display');
        if (displayEl) {
            displayEl.textContent = summary;
        }
    }

    getCountersAtTime(timeStr) {
        const active = this.getActiveCounters();
        const perZone = Math.floor(active.total / 4);
        return {
            car: active.car,
            mc: active.mc,
            zone1: perZone,
            zone2: perZone,
            zone3: perZone,
            zone4: active.total - (perZone * 3)
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
        const summaryEl = document.getElementById('manning-display');
        const summary = summaryEl?.textContent;
        
        if (!summary || summary.trim() === '') {
            this.showNotification('Please generate summary first', 'error');
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
        
        this.showNotification('Summary exported successfully');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
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
        `;

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
                document.body.removeChild(notification);
            }
        }, 3000);
    }
}

// Global variables and functions
let rosterManager;

function addOfficer(type) {
    if (rosterManager) {
        rosterManager.addOfficer(type);
    }
}

function removeOfficer(type) {
    if (rosterManager) {
        rosterManager.removeOfficer(type);
    }
}

function generateManningSummary() {
    if (rosterManager) {
        rosterManager.generateManningSummary();
    }
}

function exportSummary() {
    if (rosterManager) {
        rosterManager.exportSummary();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        rosterManager = new RosterManager();
        console.log('Roster Manager initialized successfully');
    } catch (error) {
        console.error('Error initializing Roster Manager:', error);
    }
});
