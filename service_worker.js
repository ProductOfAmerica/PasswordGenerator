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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'trackEvent') {
        if (message.category && message.action) {
            sendResponse({status: 'success'});
        } else {
            sendResponse({status: 'error', message: 'Invalid event parameters'});
        }
    }
    return true;
});