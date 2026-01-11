// ========================================
// Smart Registration Extension - Content Script
// Scrapes course data from UCP Portal DOM
// ========================================

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scan') {
        const data = scrapeCourses();
        sendResponse({ success: true, data: data });
    }

    if (request.action === 'enroll') {
        const result = enrollSection(request.sectionId);
        sendResponse({ success: result });
    }

    return true; // Keep channel open for async
});

// Scrape all course sections from the page
function scrapeCourses() {
    const sections = [];

    // Find all section cards
    const sectionCards = document.querySelectorAll('.section-card');

    sectionCards.forEach(card => {
        try {
            const courseCode = card.getAttribute('data-course-code');
            const courseName = card.getAttribute('data-course-name');
            const sectionId = card.getAttribute('data-section-id');
            const status = card.getAttribute('data-status');
            const scheduleData = card.getAttribute('data-schedule');

            let schedule = [];
            if (scheduleData) {
                try {
                    schedule = JSON.parse(scheduleData);
                } catch (e) {
                    // Parse from DOM if JSON fails
                    const timeElements = card.querySelectorAll('.schedule-time');
                    timeElements.forEach(el => {
                        schedule.push({
                            day: el.getAttribute('data-day'),
                            time: el.getAttribute('data-time')
                        });
                    });
                }
            }

            if (courseCode && sectionId) {
                sections.push({
                    courseCode,
                    courseName: courseName || courseCode,
                    sectionId,
                    status: status || 'unknown',
                    schedule
                });
            }
        } catch (error) {
            console.error('Error parsing section:', error);
        }
    });

    console.log(`[Smart Registration] Scraped ${sections.length} sections`);
    return sections;
}

// Click enroll button for a section
function enrollSection(sectionId) {
    try {
        const card = document.querySelector(`.section-card[data-section-id="${sectionId}"]`);
        if (card) {
            const enrollBtn = card.querySelector('.enroll-btn.available');
            if (enrollBtn) {
                enrollBtn.click();
                console.log(`[Smart Registration] Enrolled in ${sectionId}`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('[Smart Registration] Enroll error:', error);
        return false;
    }
}

// Inject indicator that extension is active
function injectIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'smart-reg-indicator';
    indicator.innerHTML = '✓ Smart Registration Active';
    document.body.appendChild(indicator);
}

// Initialize
console.log('[Smart Registration] Content script loaded');
injectIndicator();
