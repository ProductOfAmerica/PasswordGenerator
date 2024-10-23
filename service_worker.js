chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['strongPassGenerator'], function (items) {
        if (!items.strongPassGenerator) {
            chrome.storage.sync.set({
                strongPassGenerator: {
                    numbersOfChars: "12",
                    minNumericChars: "2",
                    useUppercase: true,
                    useLowercase: true,
                    useNumbers: true,
                    useSpecial: true
                }
            }, () => {
                console.log('Settings saved successfully');
            });
        }
    });
});

// Listener to handle storage save from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveSettings") {
        chrome.storage.sync.set({
            strongPassGenerator: request.settings
        }, () => {
            console.log("Settings saved.");
            sendResponse({status: "success"});
        });
        return true;  // Keep the message channel open for async response
    }
});

// Google Analytics tracking
const _AnalyticsCode = 'UA-92568364-1';

function sendAnalyticsEvent(category, action, label = '', value = '') {
    const trackingId = _AnalyticsCode;
    const clientId = '555'; // You can generate a unique client ID or use an existing one.

    // Construct the payload for Google Analytics Measurement Protocol
    const data = new URLSearchParams({
        v: '1', // API Version.
        tid: trackingId, // Tracking ID / Property ID.
        cid: clientId, // Anonymous Client ID.
        t: 'event', // Event hit type.
        ec: category, // Event category.
        ea: action, // Event action.
        el: label, // Event label (optional).
        ev: value, // Event value (optional).
    });

    // Send the event to Google Analytics
    fetch('https://www.google-analytics.com/collect', {
        method: 'POST',
        body: data,
    })
        .then(response => {
            if (response.ok) {
                console.log('Analytics event sent successfully');
            } else {
                console.error('Failed to send analytics event');
            }
        })
        .catch(error => {
            console.error('Error sending analytics event:', error);
        });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'trackEvent') {
        if (message.category && message.action) {
            sendAnalyticsEvent(message.category, message.action);
            sendResponse({status: 'success'});
        } else {
            sendResponse({status: 'error', message: 'Invalid event parameters'});
        }
    }
    return true;
});