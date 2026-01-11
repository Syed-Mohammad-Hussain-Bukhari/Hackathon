// ========================================
// Smart Registration Extension - Popup Logic
// With Day/Time Filters and Course Exclusion Warnings
// ========================================

let scannedData = null;
let selectedCourses = new Set();
let selectedDays = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
let excludedCourses = [];
let filteredScheduleData = null;

// Max limits
const MAX_COMBINATIONS = 50000;
const MAX_SECTIONS_PER_COURSE = 8;

// DOM Elements
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Navigation buttons
    document.getElementById('scanBtn').addEventListener('click', scanCourses);
    document.getElementById('nextToFiltersBtn').addEventListener('click', () => showStep('filters'));
    document.getElementById('backToCoursesBtn').addEventListener('click', () => showStep('courses'));
    document.getElementById('generateBtn').addEventListener('click', generateTimetables);
    document.getElementById('backToFiltersBtn').addEventListener('click', () => showStep('filters'));
    document.getElementById('continueAnywayBtn').addEventListener('click', continueWithExclusions);
    document.getElementById('backBtn').addEventListener('click', () => showStep('filters'));
    document.getElementById('backToResultsBtn').addEventListener('click', () => showStep('results'));
    document.getElementById('applyBtn').addEventListener('click', applySchedule);

    // Day chips
    document.querySelectorAll('#dayChips .chip').forEach(chip => {
        chip.addEventListener('click', () => toggleDay(chip));
    });
});

// Update status
function updateStatus(message, type = 'info') {
    statusText.textContent = message;
    statusBar.className = 'status-bar';
    if (type === 'success') statusBar.classList.add('success');
    if (type === 'error') statusBar.classList.add('error');
}

// Show step
function showStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));

    const stepMap = {
        'scan': 'stepScan',
        'courses': 'stepCourses',
        'filters': 'stepFilters',
        'warnings': 'stepWarnings',
        'results': 'stepResults',
        'timetable': 'stepTimetable'
    };

    if (stepMap[step]) {
        document.getElementById(stepMap[step]).classList.remove('hidden');
    }
}

// Toggle day selection
function toggleDay(chip) {
    const day = chip.dataset.day;
    if (selectedDays.has(day)) {
        if (selectedDays.size > 1) { // Keep at least one day
            selectedDays.delete(day);
            chip.classList.remove('selected');
        }
    } else {
        selectedDays.add(day);
        chip.classList.add('selected');
    }
}

// Scan courses
async function scanCourses() {
    updateStatus('Scanning portal...', 'info');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });

        if (response && response.success) {
            scannedData = response.data;
            displayCourseSelection();
        } else {
            updateStatus('Failed to scan. Make sure you are on the portal.', 'error');
        }
    } catch (error) {
        updateStatus('Error: Open the UCP portal first!', 'error');
        console.error(error);
    }
}

// Display course selection
function displayCourseSelection() {
    const courseMap = {};
    scannedData.forEach(s => {
        if (!courseMap[s.courseCode]) {
            courseMap[s.courseCode] = s.courseName || s.courseCode;
        }
    });

    const courses = Object.keys(courseMap);
    const openSections = scannedData.filter(s => s.status === 'open');

    document.getElementById('courseCount').textContent = courses.length;
    document.getElementById('sectionCount').textContent = scannedData.length;
    document.getElementById('openCount').textContent = openSections.length;

    const chipsContainer = document.getElementById('courseChips');
    chipsContainer.innerHTML = '';

    courses.forEach(code => {
        const name = courseMap[code];
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.setAttribute('data-course', code);
        chip.setAttribute('title', code);
        chip.innerHTML = `<span class="chip-check">✓</span><span>${name}</span>`;
        chip.addEventListener('click', () => toggleCourse(code, chip));
        chipsContainer.appendChild(chip);
    });

    updateStatus(`Found ${courses.length} courses with ${openSections.length} open sections`, 'success');
    showStep('courses');
}

// Toggle course selection
function toggleCourse(code, chip) {
    if (selectedCourses.has(code)) {
        selectedCourses.delete(code);
        chip.classList.remove('selected');
    } else {
        selectedCourses.add(code);
        chip.classList.add('selected');
    }
}

// Get filter preferences
function getFilters() {
    return {
        days: [...selectedDays],
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        maxDays: parseInt(document.getElementById('maxDays').value),
        maxGap: parseInt(document.getElementById('maxGap').value)
    };
}

// Check if section fits time filter
function sectionFitsTimeFilter(section, filters) {
    const startLimit = parseInt(filters.startTime.replace(':', ''));
    const endLimit = parseInt(filters.endTime.replace(':', ''));

    for (const slot of section.schedule) {
        // Check day filter
        if (!filters.days.includes(slot.day)) {
            return false;
        }

        // Check time filter
        const [start, end] = slot.time.split(' - ').map(t => parseInt(t.replace(':', '')));
        if (start < startLimit || end > endLimit) {
            return false;
        }
    }
    return true;
}

// Generate timetables
function generateTimetables() {
    if (selectedCourses.size === 0) {
        updateStatus('Please select at least one course', 'error');
        return;
    }

    updateStatus('Applying filters...', 'info');

    const filters = getFilters();
    excludedCourses = [];

    try {
        // Filter sections by status, course selection, and time/day preferences
        const filteredSections = scannedData.filter(s =>
            selectedCourses.has(s.courseCode) &&
            s.status === 'open' &&
            sectionFitsTimeFilter(s, filters)
        );

        // Group by course
        const courseGroups = {};
        filteredSections.forEach(section => {
            if (!courseGroups[section.courseCode]) {
                courseGroups[section.courseCode] = [];
            }
            courseGroups[section.courseCode].push(section);
        });

        // Find courses with no valid sections (excluded)
        [...selectedCourses].forEach(code => {
            if (!courseGroups[code] || courseGroups[code].length === 0) {
                const courseName = scannedData.find(s => s.courseCode === code)?.courseName || code;
                excludedCourses.push({ code, name: courseName });
            }
        });

        // If some courses excluded, show warning
        if (excludedCourses.length > 0) {
            showExclusionWarning(excludedCourses);
            filteredScheduleData = { courseGroups, filters };
            return;
        }

        // Continue with generation
        processGeneration(courseGroups, filters);

    } catch (error) {
        console.error('Generation error:', error);
        updateStatus('Error generating schedules. Try fewer courses.', 'error');
    }
}

// Show exclusion warning
function showExclusionWarning(excluded) {
    const container = document.getElementById('excludedCourses');
    container.innerHTML = excluded.map(c =>
        `<span class="excluded-course">${c.name}</span>`
    ).join('');

    updateStatus(`${excluded.length} course(s) don't fit your preferences`, 'error');
    showStep('warnings');
}

// Continue with exclusions
function continueWithExclusions() {
    if (filteredScheduleData) {
        processGeneration(filteredScheduleData.courseGroups, filteredScheduleData.filters);
    }
}

// Process generation
function processGeneration(courseGroups, filters) {
    const groupsArray = Object.values(courseGroups);

    if (groupsArray.length === 0) {
        updateStatus('No courses available with these filters', 'error');
        return;
    }

    // Calculate combinations
    let totalCombinations = 1;
    groupsArray.forEach(group => totalCombinations *= group.length);

    console.log(`Total combinations: ${totalCombinations}`);

    // Limit if needed
    let limitedGroups = groupsArray;
    if (totalCombinations > MAX_COMBINATIONS) {
        updateStatus('Processing... limiting options', 'info');
        let maxPerCourse = MAX_SECTIONS_PER_COURSE;
        while (maxPerCourse > 2) {
            let newTotal = 1;
            limitedGroups = groupsArray.map(g => g.slice(0, maxPerCourse));
            limitedGroups.forEach(g => newTotal *= g.length);
            if (newTotal <= MAX_COMBINATIONS) break;
            maxPerCourse--;
        }
    }

    // Generate combinations
    const combinations = generateCombinationsLimited(limitedGroups, MAX_COMBINATIONS);

    if (combinations.length === 0) {
        updateStatus('No combinations possible. Try different courses.', 'error');
        return;
    }

    // Filter conflicts
    const validSchedules = [];
    for (const combo of combinations) {
        if (!hasConflict(combo)) {
            validSchedules.push(combo);
            if (validSchedules.length >= 100) break;
        }
    }

    if (validSchedules.length === 0) {
        updateStatus('No conflict-free schedules. Try different courses.', 'error');
        return;
    }

    // Score and rank
    const rankedSchedules = validSchedules.map(schedule => ({
        schedule,
        days: countDays(schedule),
        gaps: calculateTotalGap(schedule),
        score: calculateScore(schedule, filters.maxDays, filters.maxGap)
    })).sort((a, b) => b.score - a.score).slice(0, 10);

    displayResults(rankedSchedules);
    updateStatus(`Found ${rankedSchedules.length} optimal schedules`, 'success');
    showStep('results');
}

// Generate combinations with limit
function generateCombinationsLimited(groups, limit) {
    if (groups.length === 0) return [[]];

    const result = [];

    function generate(index, current) {
        if (result.length >= limit) return;
        if (index === groups.length) {
            result.push([...current]);
            return;
        }
        for (const item of groups[index]) {
            if (result.length >= limit) return;
            current.push(item);
            generate(index + 1, current);
            current.pop();
        }
    }

    generate(0, []);
    return result;
}

// Check conflicts
function hasConflict(schedule) {
    for (let i = 0; i < schedule.length; i++) {
        for (let j = i + 1; j < schedule.length; j++) {
            if (sectionsOverlap(schedule[i], schedule[j])) return true;
        }
    }
    return false;
}

function sectionsOverlap(s1, s2) {
    for (const t1 of s1.schedule) {
        for (const t2 of s2.schedule) {
            if (t1.day === t2.day && timesOverlap(t1.time, t2.time)) return true;
        }
    }
    return false;
}

function timesOverlap(time1, time2) {
    const [start1, end1] = time1.split(' - ').map(t => parseInt(t.replace(':', '')));
    const [start2, end2] = time2.split(' - ').map(t => parseInt(t.replace(':', '')));
    return start1 < end2 && start2 < end1;
}

function countDays(schedule) {
    const days = new Set();
    schedule.forEach(s => s.schedule.forEach(t => days.add(t.day)));
    return days.size;
}

function calculateTotalGap(schedule) {
    return 0; // Simplified
}

function calculateScore(schedule, maxDays, maxGap) {
    const days = countDays(schedule);
    let score = (6 - days) * 100;
    if (days <= maxDays) score += 200;
    return score;
}

// Display results
function displayResults(rankedSchedules) {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    // Show warning if some courses excluded
    if (excludedCourses.length > 0) {
        container.innerHTML = `
            <div style="background: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 10px; font-size: 12px; color: #92400e;">
                ⚠️ Excluded: ${excludedCourses.map(c => c.name).join(', ')}
            </div>
        `;
    }

    rankedSchedules.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-card-header">
                <span class="result-rank">Option #${index + 1}</span>
                <span class="result-score">Score: ${result.score}</span>
            </div>
            <div class="result-meta">
                <span>📅 ${result.days} days</span>
                <span>📚 ${result.schedule.length} courses</span>
            </div>
        `;
        card.addEventListener('click', () => viewTimetable(result, index));
        container.appendChild(card);
    });

    window.rankedSchedules = rankedSchedules;
}

// View timetable
function viewTimetable(result, index) {
    document.getElementById('timetableTitle').textContent = `Timetable #${index + 1}`;
    document.getElementById('timetableGrid').innerHTML = createTimetableHTML(result.schedule);
    window.currentSchedule = result;
    showStep('timetable');
}

// Create timetable HTML
function createTimetableHTML(schedule) {
    const days = [...selectedDays];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    const scheduleMap = {};
    schedule.forEach(section => {
        section.schedule.forEach(t => {
            const hourKey = t.time.split(' - ')[0];
            const key = `${t.day}-${hourKey}`;
            scheduleMap[key] = section.courseName || section.courseCode;
        });
    });

    let html = '<div class="timetable-row">';
    html += '<div class="timetable-cell timetable-header">Time</div>';
    days.forEach(day => html += `<div class="timetable-cell timetable-header">${day}</div>`);
    html += '</div>';

    hours.forEach(hour => {
        html += '<div class="timetable-row">';
        html += `<div class="timetable-cell timetable-time">${hour}</div>`;
        days.forEach(day => {
            const key = `${day}-${hour}`;
            const course = scheduleMap[key];
            html += course
                ? `<div class="timetable-cell timetable-class">${course}</div>`
                : '<div class="timetable-cell"></div>';
        });
        html += '</div>';
    });

    return html;
}

// Apply schedule
async function applySchedule() {
    if (!window.currentSchedule) return;
    updateStatus('Applying schedule...', 'info');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        for (const section of window.currentSchedule.schedule) {
            await chrome.tabs.sendMessage(tab.id, { action: 'enroll', sectionId: section.sectionId });
            await new Promise(r => setTimeout(r, 500));
        }
        updateStatus('Schedule applied successfully!', 'success');
    } catch (error) {
        updateStatus('Error applying schedule', 'error');
    }
}
