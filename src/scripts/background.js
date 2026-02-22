importScripts("config.js");

let timer = null;
let timeleft = 0;

// sends API key to content.js
chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: "https://www.youtube.com/*" });
  for (const tab of tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["scripts/config.js", "scripts/content.js"],
    });
  }
});

// Listener handles the starting the timer functionality, stores value in
// local storage so it persistent and so it can be accessed in popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startTimer") {
    chrome.storage.local.set({
      timeleft: request.timeleft,
      timerRunning: true,
    });
    chrome.alarms.clear("timer"); // clear any existing alarm first
    chrome.alarms.create("timer", { periodInMinutes: 1 / 60 });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "pauseTimer") {
    chrome.alarms.clear("timer");
    chrome.storage.local.set({ timerRunning: false });
    sendResponse({ success: true });
    return true;
  }
  return true;
});

// Alarm listener that updates the current time left in the local storage,
// subtracting 1 every second
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "timer") return;

  // read from storage instead of memory
  chrome.storage.local.get(["timeleft"], (data) => {
    const current = data.timeleft ?? 0;

    if (current <= 0) {
      chrome.alarms.clear("timer");
      chrome.storage.local.set({
        timeleft: 0,
        timerRunning: false,
        lockIn: false,
      });
      return;
    }

    chrome.storage.local.set({ timeleft: current - 1, timerRunning: true });
  });
});
