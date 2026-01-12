// ========================================
// Smart Registration Extension - Popup Logic
// With Day/Time Filters and Course Exclusion Warnings
// ========================================

let scannedData = null;
let selectedCourses = new Set();
let selectedDays = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
let excludedCourses = [];
let filteredScheduleData = null;
let savedResults = null;
let isCartView = false;

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
    document.getElementById('nextToFiltersBtn').addEventListener('click', () => {
        if (selectedCourses.size === 0) {
            updateStatus('Please select at least one course!', 'error');
            return;
        }
        showStep('filters');
    });
    document.getElementById('backToCoursesBtn').addEventListener('click', () => showStep('courses'));
    document.getElementById('generateBtn').addEventListener('click', generateTimetables);
    document.getElementById('backToFiltersBtn').addEventListener('click', () => showStep('filters'));
    document.getElementById('continueAnywayBtn').addEventListener('click', continueWithExclusions);
    document.getElementById('backBtn').addEventListener('click', () => showStep('filters'));
    document.getElementById('backToResultsBtn').addEventListener('click', () => showStep('results'));
    document.getElementById('applyBtn').addEventListener('click', applySchedule);
    document.getElementById('compareBtn').addEventListener('click', () => showComparisonView());
    document.getElementById('backFromCompareBtn').addEventListener('click', () => showStep('results'));

    // Day chips
    document.querySelectorAll('#dayChips .chip').forEach(chip => {
        chip.addEventListener('click', () => toggleDay(chip));
    });

    document.getElementById('viewCartBtn').addEventListener('click', () => {
        isCartView = !isCartView;
        displayCourseSelection();
    });

    document.getElementById('viewClosedBtn').addEventListener('click', displayClosedSections);
    document.getElementById('backFromClosedBtn').addEventListener('click', () => showStep('courses'));
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
        'comparison': 'stepComparison',
        'closed': 'stepClosedSections',
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
    // Basic Toggle Logic
    const btn = document.getElementById('viewCartBtn');
    let displayData = scannedData;

    if (isCartView) {
        // Filter for enrolled items
        displayData = scannedData.filter(s => s.status && s.status.toLowerCase() === 'enrolled');
        btn.textContent = "Back to All Courses";
        btn.style.background = "#e0f2fe";
        btn.style.color = "#0369a1";
        btn.style.borderColor = "#7dd3fc";
    } else {
        btn.textContent = "View Enrollment Cart";
        btn.style.background = "#fef3c7";
        btn.style.color = "#92400e";
        btn.style.borderColor = "#fcd34d";
    }

    const courseMap = {};
    displayData.forEach(s => {
        if (!courseMap[s.courseCode]) {
            courseMap[s.courseCode] = s.courseName || s.courseCode;
        }
    });

    const courses = Object.keys(courseMap);
    const openSections = displayData.filter(s => s.status === 'open');

    document.getElementById('courseCount').textContent = courses.length;
    document.getElementById('sectionCount').textContent = displayData.length;
    document.getElementById('openCount').textContent = openSections.length; // Or 'Enrolled' count if in cart view? Keep it consistent.

    const chipsContainer = document.getElementById('courseChips');
    chipsContainer.innerHTML = '';

    if (courses.length === 0) {
        chipsContainer.innerHTML = '<div style="padding:10px; color:#666; font-style:italic;">No courses found in this view.</div>';
    }

    courses.forEach(code => {
        const name = courseMap[code];
        const chip = document.createElement('div');
        chip.className = 'chip';
        // Pre-select if already in selectedCourses, OR if viewing cart (maybe auto-select?)
        // Let's keep selection manual so user can choose which enrolled courses to include in schedule generation?
        // Or just display.
        if (selectedCourses.has(code)) {
            chip.classList.add('selected');
        }

        chip.setAttribute('data-course', code);
        chip.setAttribute('title', code);
        chip.innerHTML = `<span class="chip-check">✓</span><span>${name}</span>`;
        chip.addEventListener('click', () => toggleCourse(code, chip));
        chipsContainer.appendChild(chip);
    });

    if (isCartView) {
        updateStatus(`Showing ${courses.length} enrolled courses/sections`, 'info');
    } else {
        updateStatus(`Found ${courses.length} courses with ${openSections.length} open sections`, 'success');
    }

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

// Show detailed conflict information
function showConflictDetails(conflicts) {
    // Get unique conflicts
    const uniqueConflicts = [];
    const seen = new Set();

    for (const c of conflicts) {
        const key = `${c.course1}-${c.section1}-${c.course2}-${c.section2}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueConflicts.push(c);
            if (uniqueConflicts.length >= 5) break;
        }
    }

    // Build conflict HTML
    let conflictHTML = '<div class="conflict-box">';
    conflictHTML += '<div class="conflict-icon">⚠️</div>';
    conflictHTML += '<h3>Schedule Conflicts Found</h3>';
    conflictHTML += '<p>The following sections clash with each other:</p>';
    conflictHTML += '<div class="conflict-list">';

    uniqueConflicts.forEach(c => {
        const sec1Short = c.section1 ? c.section1.split(' ').pop() : 'N/A';
        const sec2Short = c.section2 ? c.section2.split(' ').pop() : 'N/A';
        conflictHTML += `
            <div class="conflict-item">
                <div class="conflict-courses">
                    <span class="conflict-course">${c.course1} (${sec1Short})</span>
                    <span class="conflict-vs">⚡</span>
                    <span class="conflict-course">${c.course2} (${sec2Short})</span>
                </div>
                <div class="conflict-time">
                    ${c.day}: ${c.time1} ↔ ${c.time2}
                </div>
            </div>
        `;
    });

    conflictHTML += '</div>';
    conflictHTML += '<p class="conflict-hint">Try selecting different courses or changing filters.</p>';
    conflictHTML += '</div>';
    conflictHTML += '<button class="btn btn-small" id="backFromConflictsBtn">← Back to Filters</button>';

    // Display in results container
    const container = document.getElementById('resultsList');
    container.innerHTML = conflictHTML;

    // Add back button handler
    document.getElementById('backFromConflictsBtn').addEventListener('click', () => showStep('filters'));

    updateStatus('Conflicts detected - see details below', 'error');
    showStep('results');
}

// Process generation
function processGeneration(courseGroups, filters) {
    const groupsArray = Object.values(courseGroups);

    if (groupsArray.length === 0) {
        updateStatus('No courses available with these filters', 'error');
        return;
    }

    // Optimization: Backtracking Search (Finds valid schedules deep in the tree without generating everything)
    updateStatus('Searching for optimal schedules...', 'info');
    const validSchedules = findValidSchedulesBacktracking(groupsArray, 100, filters);

    const allConflicts = [];

    // If Backtracking failed to find ANY valid schedule, run diagnostics to explain why (conflicts)
    if (validSchedules.length === 0) {
        // Run limited generation just to find conflicts for reporting/partial scheduling

        // Calculate combinations
        let totalCombinations = 1;
        groupsArray.forEach(group => totalCombinations *= group.length);

        // Limit for diagnostics to avoid crash
        let limitedGroups = groupsArray;
        if (totalCombinations > 10000) {
            let maxPerCourse = MAX_SECTIONS_PER_COURSE;
            while (maxPerCourse > 2) {
                limitedGroups = groupsArray.map(g => g.slice(0, maxPerCourse));
                let t = 1; limitedGroups.forEach(g => t *= g.length);
                if (t <= 10000) break;
                maxPerCourse--;
            }
        }

        const combinations = generateCombinationsLimited(limitedGroups, 2000); // Small sample for conflicts

        for (const combo of combinations) {
            const conflicts = getConflictDetails(combo);
            if (conflicts.length > 0) {
                if (allConflicts.length < 50) allConflicts.push(...conflicts);
            }
        }
    }

    if (validSchedules.length === 0) {
        // Attempt to find a partial schedule
        if (allConflicts.length > 0) {
            const partialResult = attemptPartialScheduling(courseGroups, filters, allConflicts);
            if (partialResult) {
                displayPartialResults(partialResult);
                return;
            }

            // If that fails too, fall back to showing conflicts
            showConflictDetails(allConflicts);
        } else if (filters.maxGap === -1) {
            updateStatus('No gap-free schedules found. Try allowing gaps.', 'error');
        } else {
            updateStatus('No conflict-free schedules. Try different courses.', 'error');
        }
        return;
    }

    // Score and rank
    const rankedSchedules = validSchedules.map(schedule => ({
        schedule,
        days: countDays(schedule),
        gaps: calculateTotalGap(schedule),
        score: calculateScore(schedule, filters.maxDays, filters.maxGap)
    })).sort((a, b) => {
        // Primary: Gaps (Ascending) - User requested "min gap to max"
        if (a.gaps !== b.gaps) return a.gaps - b.gaps;
        // Secondary: Score (Descending)
        if (b.score !== a.score) return b.score - a.score;
        // Tertiary: Days (Ascending)
        return a.days - b.days;
    }).slice(0, 10);

    savedResults = rankedSchedules; // Save for comparison view
    displayResults(rankedSchedules);
    updateStatus(`Found ${rankedSchedules.length} optimal schedules`, 'success');
    showStep('results');
}

// Backtracking Search Algorithm to find valid schedules efficiently
function findValidSchedulesBacktracking(groups, maxResults, filters) {
    const results = [];
    let steps = 0;
    const MAX_STEPS = 500000; // Limits computation time

    function backtrack(index, currentSchedule) {
        if (results.length >= maxResults || steps > MAX_STEPS) return;

        if (index === groups.length) {
            // Full schedule built
            if (filters.maxGap === -1) {
                if (calculateTotalGap(currentSchedule) === 0) {
                    results.push([...currentSchedule]);
                }
            } else {
                results.push([...currentSchedule]);
            }
            return;
        }

        const currentCourseSections = groups[index];

        for (const section of currentCourseSections) {
            steps++;
            if (steps > MAX_STEPS) return;

            if (hasConflictWithExisting(section, currentSchedule)) {
                continue;
            }

            currentSchedule.push(section);
            backtrack(index + 1, currentSchedule);
            currentSchedule.pop();

            if (results.length >= maxResults) return;
        }
    }

    function hasConflictWithExisting(newSection, currentSchedule) {
        for (const existing of currentSchedule) {
            if (sectionsOverlap(newSection, existing)) return true;
        }
        return false;
    }

    backtrack(0, []);
    return results;
}

// Attempt to finding a partial schedule by removing conflicting courses
function attemptPartialScheduling(courseGroups, filters, conflicts) {
    // 1. Identify which course causes the most conflicts
    const conflictCounts = {};

    conflicts.forEach(c => {
        conflictCounts[c.course1] = (conflictCounts[c.course1] || 0) + 1;
        conflictCounts[c.course2] = (conflictCounts[c.course2] || 0) + 1;
    });

    // Sort courses by conflict count
    const sortedCourses = Object.keys(conflictCounts).sort((a, b) => conflictCounts[b] - conflictCounts[a]);

    if (sortedCourses.length === 0) return null;

    // 2. Try removing the identified problematic course(s)
    // We try removing the top 1, then top 2... (limit to removing max 2 courses for now)

    for (let i = 0; i < Math.min(sortedCourses.length, 2); i++) {
        const courseToRemove = sortedCourses[i];

        // Create new groups without this course
        const newGroups = { ...courseGroups };
        delete newGroups[courseToRemove];

        // Check if we have enough courses left
        if (Object.keys(newGroups).length === 0) continue;

        // Try to generate
        const groupsArray = Object.values(newGroups);

        // Combinations (simplified logic for partial check)
        let totalCombos = 1;
        groupsArray.forEach(g => totalCombos *= g.length);

        let limited = groupsArray;
        // Apply limits if needed... (simplified here)
        if (totalCombos > 10000) {
            limited = groupsArray.map(g => g.slice(0, 5));
        }

        const combos = generateCombinationsLimited(limited, 5000);

        // Check for valid schedules
        for (const combo of combos) {
            if (!hasConflict(combo)) {
                // Check no gap if needed
                if (filters.maxGap === -1) {
                    if (calculateTotalGap(combo) !== 0) continue;
                }

                // Found valid partial!
                // Generate full set of results for this subset
                const valid = combos.filter(c => !hasConflict(c) && (filters.maxGap !== -1 || calculateTotalGap(c) === 0));

                // Rank
                const ranked = valid.map(schedule => ({
                    schedule,
                    days: countDays(schedule),
                    gaps: calculateTotalGap(schedule),
                    score: calculateScore(schedule, filters.maxDays, filters.maxGap)
                })).sort((a, b) => b.score - a.score).slice(0, 10);

                // Find what it conflicted with in the original set to show a helpful message
                // Just use the first conflict involving this course from the original list
                const relatedConflict = conflicts.find(c => c.course1 === courseToRemove || c.course2 === courseToRemove);

                return {
                    schedules: ranked,
                    removed: courseToRemove,
                    conflict: relatedConflict
                };
            }
        }
    }

    return null;
}

function displayPartialResults(result) {
    const { schedules, removed, conflict } = result;

    displayResults(schedules);

    const container = document.getElementById('resultsList');

    // Prepend warning
    const warning = document.createElement('div');
    warning.className = 'conflict-box';
    warning.style.marginBottom = '20px';
    warning.style.background = '#fff7ed'; // Orange tint
    warning.style.borderColor = '#fdba74';

    const otherCourse = conflict ? (conflict.course1 === removed ? conflict.course2 : conflict.course1) : 'another course';

    warning.innerHTML = `
        <div style="color: #c2410c; font-weight: bold; margin-bottom: 8px;">
            ⚠️ Conflict Resolved Automatically
        </div>
        <div style="font-size: 12px; color: #9a3412;">
            <span style="font-weight: 700;">${removed}</span> was removed because it clashed with 
            <span style="font-weight: 700;">${otherCourse}</span>.
        </div>
        <div style="font-size: 11px; margin-top: 6px; color: #7c2d12;">
            Showing timetable for the remaining ${schedules[0].schedule.length} subjects.
        </div>
    `;

    container.insertBefore(warning, container.firstChild);

    updateStatus(`Generated partial schedule (1 course removed)`, 'info');
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

// Get detailed conflict information
function getConflictDetails(schedule) {
    const conflicts = [];
    for (let i = 0; i < schedule.length; i++) {
        for (let j = i + 1; j < schedule.length; j++) {
            const clashInfo = getClashInfo(schedule[i], schedule[j]);
            if (clashInfo) {
                conflicts.push(clashInfo);
            }
        }
    }
    return conflicts;
}

// Get specific clash info between two sections
function getClashInfo(s1, s2) {
    for (const t1 of s1.schedule) {
        for (const t2 of s2.schedule) {
            if (t1.day === t2.day && timesOverlap(t1.time, t2.time)) {
                return {
                    course1: s1.courseName || s1.courseCode,
                    section1: s1.sectionId || s1.id,
                    course2: s2.courseName || s2.courseCode,
                    section2: s2.sectionId || s2.id,
                    day: t1.day,
                    time1: t1.time,
                    time2: t2.time
                };
            }
        }
    }
    return null;
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
    const dayClasses = {};

    schedule.forEach(section => {
        section.schedule.forEach(slot => {
            if (!dayClasses[slot.day]) dayClasses[slot.day] = [];
            const [start, end] = slot.time.split(' - ').map(t => parseInt(t.replace(':', '')));
            dayClasses[slot.day].push({ start, end });
        });
    });

    let totalGap = 0;
    Object.values(dayClasses).forEach(classes => {
        classes.sort((a, b) => a.start - b.start);
        for (let i = 1; i < classes.length; i++) {
            // Calculate gap in hours (times are in HHMM format)
            const gapMinutes = (classes[i].start - classes[i - 1].end);
            // Convert from HHMM difference to hours (rough approximation)
            const gapHours = Math.floor(gapMinutes / 100);
            totalGap += Math.max(0, gapHours);
        }
    });

    return totalGap;
}

function calculateScore(schedule, maxDays, maxGap) {
    const days = countDays(schedule);
    const gaps = calculateTotalGap(schedule);

    let score = (6 - days) * 100;
    if (days <= maxDays) score += 200;

    // Penalize gaps - fewer gaps = higher score
    score -= gaps * 50;

    // Bonus for no gaps when maxGap is -1 (No Gap option)
    if (maxGap === -1 && gaps === 0) score += 300;

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
        const rank = index + 1;
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-card-header">
                <span class="result-rank">#${rank} Best Option</span>
                <span class="result-score">Score: ${result.score}</span>
            </div>
            <div class="result-meta">
                <span>📅 ${result.days} days</span>
                <span>⏱️ ${result.gaps}h gaps</span>
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
function createTimetableHTML(schedule, showSectionList = true, isMini = false) {
    const days = [...selectedDays];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    const scheduleMap = {};
    schedule.forEach(section => {
        section.schedule.forEach(t => {
            const hourKey = t.time.split(' - ')[0];
            const key = `${t.day}-${hourKey}`;
            // Store both course name and section ID
            scheduleMap[key] = {
                courseName: section.courseName || section.courseCode,
                sectionId: section.sectionId || section.id || 'N/A'
            };
        });
    });

    let html = `<div class="timetable-grid${isMini ? ' mini' : ''}">`;
    html += '<div class="timetable-row">';
    html += '<div class="timetable-cell timetable-header">Time</div>';
    days.forEach(day => html += `<div class="timetable-cell timetable-header">${day}</div>`);
    html += '</div>';

    hours.forEach(hour => {
        html += '<div class="timetable-row">';
        html += `<div class="timetable-cell timetable-time">${hour}</div>`;
        days.forEach(day => {
            const key = `${day}-${hour}`;
            const data = scheduleMap[key];
            if (data) {
                // Smart Section ID Extraction
                let sectionShort = data.sectionId;
                if (sectionShort.includes(' ')) {
                    sectionShort = sectionShort.split(' ').pop();
                } else if (sectionShort.includes('-') && sectionShort.length > 8) {
                    sectionShort = sectionShort.split('-').pop();
                }
                sectionShort = sectionShort.replace(/-?NOGAP/i, '').replace(/\(Lab\)/i, 'L');
                html += `<div class="timetable-cell timetable-class" title="${data.sectionId}">
                    <div class="cell-course">${data.courseName}</div>
                    <div class="cell-section">${sectionShort}</div>
                </div>`;
            } else {
                html += '<div class="timetable-cell"></div>';
            }
        });
        html += '</div>';
        html += '</div>';
    });
    html += '</div>'; // Close grid

    // Add sections list below timetable (only if not mini)
    if (showSectionList && !isMini) {
        html += '<div class="sections-list">';
        html += '<div class="sections-title">📋 Sections in this schedule:</div>';
        schedule.forEach(section => {
            const sectionId = section.sectionId || section.id || 'N/A';
            const courseName = section.courseName || section.courseCode;
            const times = section.schedule.map(t => `${t.day} ${t.time}`).join(', ');
            html += `<div class="section-item">
                <span class="section-course">${courseName}</span>
                <span class="section-id">${sectionId}</span>
                <span class="section-times">${times}</span>
            </div>`;
        });
        html += '</div>';
    }

    return html;
}

// Show Comparison View
function showComparisonView() {
    if (!savedResults || savedResults.length === 0) {
        updateStatus('No results to compare', 'error');
        return;
    }

    const container = document.getElementById('comparisonContainer');
    container.innerHTML = '';

    savedResults.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'comparison-item';

        // Header
        item.innerHTML = `
            <div class="comparison-meta">
                <span>#${index + 1} Score: ${result.score}</span>
                <span>${result.days} Days / ${result.gaps}h Gaps</span>
            </div>
        `;

        // Mini Grid
        const gridHTML = createTimetableHTML(result.schedule, false, true);
        const gridDiv = document.createElement('div');
        gridDiv.innerHTML = gridHTML;
        item.appendChild(gridDiv);

        // Select Button
        const btn = document.createElement('button');
        btn.className = 'btn btn-success btn-small';
        btn.style.marginTop = '10px';
        btn.textContent = 'Select This';
        btn.onclick = () => viewTimetable(result, index);
        item.appendChild(btn);

        container.appendChild(item);
    });

    showStep('comparison');
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

// Display Closed Sections
function displayClosedSections() {
    // Filter for sections that are NOT open (e.g. full, closed)
    const closedSections = scannedData.filter(s => s.status && s.status.toLowerCase() !== 'open');
    const container = document.getElementById('closedSectionsList');
    container.innerHTML = '';

    if (closedSections.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">No closed sections found.</div>';
    } else {
        closedSections.forEach(s => {
            const card = document.createElement('div');
            card.className = 'section-item';
            card.style.background = 'white';
            card.style.border = '1px solid #ddd';
            card.style.borderRadius = '8px';
            card.style.padding = '12px';
            card.style.marginBottom = '10px';

            const times = s.schedule.map(t => `${t.day} ${t.time}`).join(' | ');
            const sectionsText = `${s.courseName} | ${s.sectionId}`;

            card.innerHTML = `
                <div style="font-weight:bold; color:#333; margin-bottom:4px;">${s.courseName || s.courseCode}</div>
                <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                    <span style="color:#d97706; font-weight:600;">Section ${s.sectionId}</span>
                    <span style="color:#dc2626;">${s.status || 'Closed'}</span>
                </div>
                <div style="font-size:0.8rem; color:#666; margin:6px 0;">${times}</div>
                <button class="btn btn-small" style="width:100%; margin-top:5px; background:#fef3c7; color:#92400e; border:1px solid #fcd34d;">
                    🔔 Notify Me When Open
                </button>
            `;

            const btn = card.querySelector('button');
            btn.addEventListener('click', () => watchSection(s.sectionId, s.courseCode, btn));

            container.appendChild(card);
        });
    }
    showStep('closed');
}

function watchSection(sectionId, courseCode, btn) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'watch',
            sectionId: sectionId,
            courseCode: courseCode
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                updateStatus('Error connecting to page', 'error');
                return;
            }
            if (btn) {
                btn.textContent = '✅ Watching';
                btn.disabled = true;
                btn.style.background = '#dcfce7';
                btn.style.color = '#15803d';
                btn.style.borderColor = '#86efac';
            }
            updateStatus(`Extension is watching Section ${sectionId}`, 'success');
        });
    });
}
