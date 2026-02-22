importScripts('config.js');

chrome.runtime.onInstalled.addListener(async () => {
    const tabs = await chrome.tabs.query({ url: "https://www.youtube.com/*" });
    for (const tab of tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["scripts/config.js", "scripts/content.js"]
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_YOUTUBE_KEY") {
        if (typeof YOUTUBE_API_KEY !== 'undefined' && YOUTUBE_API_KEY) {
            sendResponse({ key: YOUTUBE_API_KEY });
        } else {
            console.error("API key not loaded from config.js");
            sendResponse({ key: null });
        }
        return true;
    }
    return true; // Always return true to prevent the port closing error
});