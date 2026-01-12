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

    if (request.action === 'watch') {
        addSectionToWatchlist(request.sectionId, request.courseCode);
        sendResponse({ success: true });
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

// ========================================
// WATCHER & NOTIFICATION LOGIC
// ========================================

// Listen for messages from the web page (Prototype)
window.addEventListener('message', function (event) {
    if (event.source !== window) return;

    if (event.data.type && event.data.type === 'EXTENSION_WATCH_SECTION') {
        const { sectionId, courseCode } = event.data;
        addSectionToWatchlist(sectionId, courseCode);
    }
});

// Add to storage
function addSectionToWatchlist(sectionId, courseCode) {
    chrome.storage.local.get(['watchlist'], (result) => {
        const watchlist = result.watchlist || [];
        // Check if already watching
        if (!watchlist.find(s => s.sectionId === sectionId)) {
            watchlist.push({ sectionId, courseCode });
            chrome.storage.local.set({ watchlist: watchlist }, () => {
                console.log(`[Smart Registration] Added ${sectionId} to watchlist`);
            });
        }
    });
}

// Check if any watched sections are now OPEN
function checkWatchedSections() {
    chrome.storage.local.get(['watchlist'], (result) => {
        const watchlist = result.watchlist || [];
        if (watchlist.length === 0) return;

        const sectionCards = document.querySelectorAll('.section-card');
        sectionCards.forEach(card => {
            const id = card.getAttribute('data-section-id');
            const status = card.getAttribute('data-status');

            const watched = watchlist.find(w => w.sectionId === id);

            if (watched && status === 'open') {
                // IT'S OPEN! Notify!
                chrome.runtime.sendMessage({
                    type: 'NOTIFY_USER',
                    title: 'Section Re-Opened!',
                    message: `${watched.courseCode ? watched.courseCode + ' ' : ''}Section ${id} is now OPEN! Enroll immediately!`
                });
            }
        });
    });
}

// Run check periodically or on load
checkWatchedSections();

// Monitor for dynamic content changes (re-rendering)
const observer = new MutationObserver((mutations) => {
    checkWatchedSections();
});
observer.observe(document.body, { childList: true, subtree: true });
