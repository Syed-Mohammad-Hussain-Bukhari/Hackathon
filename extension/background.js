// Background Service Worker
// Handles notifications and background tasks

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'NOTIFY_USER') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', // Use larger icon for notification
            title: request.title || 'Smart Course Registration',
            message: request.message,
            priority: 2
        });
    }
});

console.log('Smart Course Registration: Background Service Worker Active');
