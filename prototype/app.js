// ========================================
// UCP Portal Prototype - Application Logic
// No API - Extension will scrape DOM directly
// ========================================

// Initialize the application
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    renderCourseList();
    setupSearch();
    updateCartIndicator();
    setupFilters();
});

// Render the course list
function renderCourseList() {
    const courseList = document.getElementById('courseList');
    courseList.innerHTML = '';

    coursesData.forEach((course, index) => {
        const courseElement = createCourseElement(course, index);
        courseList.appendChild(courseElement);
    });

    addCartIndicator();
}

// Create a course element with proper data attributes for scraping
function createCourseElement(course, index) {
    const div = document.createElement('div');
    div.className = 'course-item';
    // Data attributes for extension scraping
    div.setAttribute('data-course-code', course.code);
    div.setAttribute('data-course-name', course.name);
    div.setAttribute('data-course-type', course.type);

    const openCount = course.sections.filter(s => s.status === 'open').length;
    const totalCount = course.sections.length;

    div.innerHTML = `
        <div class="course-header" onclick="toggleCourse(${index})">
            <div class="course-info">
                <span class="course-code">${course.code}</span>
                <span class="course-name">- ${course.name}</span>
            </div>
            <div class="course-badges">
                <span class="badge badge-semester">${course.semester}</span>
                <span class="badge badge-${course.type}">${course.type}</span>
                <span class="badge" style="background: ${openCount > 0 ? '#28a745' : '#dc3545'}; color: white;">
                    ${openCount}/${totalCount} Open
                </span>
                <span class="expand-icon">▼</span>
            </div>
        </div>
        <div class="course-sections">
            ${createSectionsHTML(course)}
        </div>
    `;

    return div;
}

// Create sections HTML with data attributes for DOM scraping
function createSectionsHTML(course) {
    let html = `
        <div class="section-header">
            <span class="section-title">Course Section</span>
            ${course.coReq ? `<span class="co-req-info">Co-req Course: ${course.coReq}</span>` : ''}
        </div>
        <div class="sections-grid">
    `;

    course.sections.forEach(section => {
        const isOpen = section.status === 'open';
        const isEnrolled = enrollmentCart.some(item => item.sectionId === section.id);
        const shortId = section.id.split(' ').pop();

        // Data attributes that extension will scrape
        html += `
            <div class="section-card ${isEnrolled ? 'selected' : ''}" 
                 data-section-id="${section.id}"
                 data-section-short="${shortId}"
                 data-course-code="${course.code}"
                 data-course-name="${course.name}"
                 data-status="${section.status}"
                 data-schedule='${JSON.stringify(section.schedule)}'>
                <div class="section-card-header">
                    <span class="section-id">${section.id}</span>
                    <span class="status-badge status-${section.status}">${isOpen ? 'Open' : 'Close'}</span>
                </div>
                <div class="section-card-body">
                    <div class="schedule-label">Class Schedule</div>
                    <div class="schedule-times">
                        ${section.schedule.map(s => `<div class="schedule-time" data-day="${s.day}" data-time="${s.time}">${s.day} ${s.time}</div>`).join('')}
                    </div>
                </div>
                <div class="section-card-footer">
                    <button class="enroll-btn ${isOpen ? (isEnrolled ? 'enrolled' : 'available') : 'unavailable'}"
                            onclick="handleEnroll('${course.code}', '${course.name}', '${section.id}', '${section.status}')"
                            ${!isOpen ? 'disabled' : ''}>
                        ${isEnrolled ? '✓ ENROLLED' : (isOpen ? 'ENROLL' : 'CLOSED')}
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// Toggle course expansion
function toggleCourse(index) {
    const courseItems = document.querySelectorAll('.course-item');
    courseItems[index].classList.toggle('expanded');
}

// Handle enrollment
function handleEnroll(courseCode, courseName, sectionId, status) {
    if (status !== 'open') return;

    const existingIndex = enrollmentCart.findIndex(item => item.sectionId === sectionId);

    if (existingIndex > -1) {
        enrollmentCart.splice(existingIndex, 1);
        showToast(`Removed ${courseCode} from cart`, 'error');
    } else {
        const sameCourseIndex = enrollmentCart.findIndex(item => item.courseCode === courseCode);
        if (sameCourseIndex > -1) {
            enrollmentCart.splice(sameCourseIndex, 1);
        }

        enrollmentCart.push({
            courseCode,
            courseName,
            sectionId,
            schedule: getSectionSchedule(courseCode, sectionId)
        });
        showToast(`Added ${courseCode} to cart`, 'success');
    }

    renderCourseList();
    updateCartIndicator();
}

// Get section schedule
function getSectionSchedule(courseCode, sectionId) {
    const course = coursesData.find(c => c.code === courseCode);
    if (!course) return [];
    const section = course.sections.find(s => s.id === sectionId);
    return section ? section.schedule : [];
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('courseSearch');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const courseItems = document.querySelectorAll('.course-item');

        courseItems.forEach(item => {
            const code = item.getAttribute('data-course-code').toLowerCase();
            const name = item.getAttribute('data-course-name').toLowerCase();

            if (code.includes(query) || name.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast active ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Add cart indicator
function addCartIndicator() {
    const existing = document.querySelector('.cart-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'cart-indicator';
    indicator.onclick = showCart;
    indicator.innerHTML = `
        <span>🛒 Enrollment Cart</span>
        <span class="cart-count" id="cartCount">${enrollmentCart.length}</span>
    `;
    document.body.appendChild(indicator);
}

// Update cart indicator
function updateCartIndicator() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = enrollmentCart.length;
    }
}

// Show cart modal
function showCart() {
    const modal = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `Enrollment Cart (${enrollmentCart.length} courses)`;

    if (enrollmentCart.length === 0) {
        modalBody.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Your cart is empty. Select courses to enroll.</p>';
    } else {
        let html = '<div class="cart-list">';
        enrollmentCart.forEach(item => {
            html += `
                <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #dee2e6;">
                    <div>
                        <strong>${item.courseCode}</strong> - ${item.courseName}<br>
                        <small style="color: #666;">Section: ${item.sectionId.split(' ').pop()}</small><br>
                        <small style="color: #28a745;">
                            ${item.schedule.map(s => `${s.day} ${s.time}`).join(' | ')}
                        </small>
                    </div>
                    <button onclick="removeFromCart('${item.sectionId}')" 
                            style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Remove
                    </button>
                </div>
            `;
        });
        html += `
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="confirmEnrollment()" 
                        style="background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 4px; font-size: 0.9rem; font-weight: 600; cursor: pointer;">
                    ✓ Confirm Enrollment
                </button>
            </div>
        `;
        html += '</div>';
        modalBody.innerHTML = html;
    }

    modal.classList.add('active');
}

// Remove from cart
function removeFromCart(sectionId) {
    enrollmentCart = enrollmentCart.filter(item => item.sectionId !== sectionId);
    renderCourseList();
    updateCartIndicator();
    showCart();
    showToast('Removed from cart', 'error');
}

// Confirm enrollment
function confirmEnrollment() {
    if (enrollmentCart.length === 0) return;
    showToast(`Successfully enrolled in ${enrollmentCart.length} courses!`, 'success');
    closeModal();
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('active');
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ========================================
// HOW YOUR EXTENSION WILL SCRAPE THIS PAGE
// ========================================
// The extension content script will use DOM queries like:
//
// 1. Get all section cards:
//    document.querySelectorAll('.section-card')
//
// 2. For each card, extract:
//    - courseCode: card.dataset.courseCode
//    - courseName: card.dataset.courseName
//    - sectionId:  card.dataset.sectionId
//    - status:     card.dataset.status
//    - schedule:   JSON.parse(card.dataset.schedule)
//
// 3. Get only open sections:
//    document.querySelectorAll('.section-card[data-status="open"]')
//
// 4. Click enroll button programmatically:
//    card.querySelector('.enroll-btn').click()
//
// ========================================

console.log('📚 UCP Portal Prototype Loaded');
console.log('🔍 Extension can scrape using: document.querySelectorAll(".section-card")');
console.log('📊 Total sections:', document.querySelectorAll('.section-card').length || 'Page loading...');

// ========================================
// NEW FUNCTIONALITY: Filters & Timetables
// ========================================

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') { // VIEW ENROLLMENT CART
                showCart();
            } else if (filter === 'timetable') { // VIEW TIME TABLE
                showEnrolledTimetable();
            } else if (filter === 'available') { // VIEW AVAILABLE COURSES TIMETABLE
                showMasterTimetable();
            } else if (filter === 'closed') { // VIEW CLOSED SECTIONS
                showClosedSections();
            }
        });
    });
}

function showEnrolledTimetable() {
    if (enrollmentCart.length === 0) {
        showModal("My Timetable", "<p style='text-align:center; padding:20px; color:#666;'>You haven't enrolled in any courses yet.</p>");
        return;
    }

    const schedule = [];
    enrollmentCart.forEach(item => {
        schedule.push({
            courseName: item.courseName,
            courseCode: item.courseCode,
            sectionId: item.sectionId,
            schedule: item.schedule
        });
    });

    const html = createTimetableGridHTML(schedule, "My Enrolled Schedule");
    showModal("My Timetable", html);
}

function showMasterTimetable() {
    // Show sections of all COMPULSORY courses
    const compulsoryCourses = coursesData.filter(c => c.type === 'compulsory');
    let allSections = [];

    compulsoryCourses.forEach(c => {
        // Take first 3 sections of each compulsory course for demo
        const sections = c.sections.filter(s => s.status === 'open').slice(0, 3);
        sections.forEach(s => {
            allSections.push({
                courseName: c.name,
                courseCode: c.code,
                sectionId: s.id,
                schedule: s.schedule
            });
        });
    });

    // Limit if too many
    if (allSections.length > 25) allSections = allSections.slice(0, 25);

    const html = createTimetableGridHTML(allSections, "Available Courses (Compulsory Selection)");
    showModal("Available Courses Timetable", html);
}

function showClosedSections() {
    let closedSections = [];
    coursesData.forEach(c => {
        c.sections.filter(s => s.status === 'close').forEach(s => {
            closedSections.push({
                courseName: c.name,
                courseCode: c.code,
                section: s
            });
        });
    });

    if (closedSections.length === 0) {
        showModal("Closed Sections", "<p style='padding:20px; text-align:center;'>No closed sections found.</p>");
        return;
    }

    // limit for demo
    if (closedSections.length > 50) closedSections = closedSections.slice(0, 50);

    let html = '<div style="margin-bottom: 15px; color: #666;">Select a section to be notified via extension/email when it reopens.</div>';
    html += '<div class="sections-grid">';
    closedSections.forEach(item => {
        const s = item.section;
        html += `
            <div class="section-card" style="border-left: 4px solid #dc3545;">
                <div class="section-card-header">
                    <span class="section-id">${s.id}</span>
                    <span class="status-badge status-close">Closed</span>
                </div>
                <div class="section-card-body">
                    <div style="font-weight:600; font-size:0.85rem; margin-bottom:5px;">${item.courseCode}</div>
                    <div style="font-size:0.8rem; color:#666; margin-bottom:10px;">${item.courseName}</div>
                    <div class="schedule-times">
                        ${s.schedule.map(t => `<div>${t.day} ${t.time}</div>`).join('')}
                    </div>
                </div>
                <div class="section-card-footer">
                    <button class="enroll-btn" style="background:#ffc107; color:#333;" onclick="handleNotify('${s.id}', '${item.courseCode}')">
                        🔔 Notify Me When Open
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';

    showModal("Closed Sections Watcher", html);
}

function handleNotify(sectionId, courseCode) {
    window.postMessage({ type: 'EXTENSION_WATCH_SECTION', sectionId, courseCode }, '*');
    showToast(`🔔 ALERT SET: Extension is watching ${sectionId}!`, 'success');
}

function createTimetableGridHTML(schedule, title) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    // Build Map
    const scheduleMap = {};
    schedule.forEach(section => {
        if (!section.schedule) return;
        section.schedule.forEach(t => {
            const hourKey = t.time.split(' - ')[0];
            const key = `${t.day}-${hourKey}`;

            if (!scheduleMap[key]) scheduleMap[key] = [];
            scheduleMap[key].push({
                courseName: section.courseName,
                sectionId: section.sectionId,
                color: getCourseColor(section.courseCode)
            });
        });
    });

    let html = `<div style="margin-bottom: 15px; font-weight: 500; font-size: 1.1rem; color: #333;">${title}</div>`;
    html += '<div class="timetable-grid">';

    html += '<div class="timetable-row">';
    html += '<div class="timetable-cell timetable-header">Time</div>';
    days.forEach(day => html += `<div class="timetable-cell timetable-header">${day}</div>`);
    html += '</div>';

    hours.forEach(hour => {
        html += '<div class="timetable-row">';
        html += `<div class="timetable-cell timetable-time">${hour}</div>`;

        days.forEach(day => {
            const key = `${day}-${hour}`;
            const items = scheduleMap[key];

            html += '<div class="timetable-cell">';
            if (items) {
                items.forEach(item => {
                    // Extract short section ID (e.g. "G20")
                    let shortSec = item.sectionId;
                    if (shortSec.includes(' ')) shortSec = shortSec.split(' ').pop();
                    shortSec = shortSec.replace(/-?NOGAP/i, '');

                    html += `
                        <div class="timetable-class" style="margin-bottom: 2px; border-left-color: ${item.color.border}; background: ${item.color.bg};">
                            <div class="cell-course" style="font-size: 0.7rem; color: ${item.color.text}" title="${item.courseName}">${item.courseName}</div>
                            <div class="cell-section" style="font-size: 0.65rem;">${shortSec}</div>
                        </div>
                    `;
                });
            }
            html += '</div>';
        });

        html += '</div>';
    });

    html += '</div>';
    return html;
}

function getCourseColor(code) {
    const colors = [
        { bg: '#e3f2fd', border: '#2196f3', text: '#0d47a1' },
        { bg: '#e8f5e9', border: '#4caf50', text: '#1b5e20' },
        { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
        { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c' },
        { bg: '#ffebee', border: '#f44336', text: '#b71c1c' },
    ];
    let hash = 0;
    if (code) {
        for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function showModal(title, content) {
    const modal = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    modal.classList.add('active');
}
