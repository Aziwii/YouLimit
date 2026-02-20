"use strict";

console.log("Popup loaded");

function setBadgeText(enabled) {
    const text = enabled ? "ON" : "OFF";
    void chrome.action.setBadgeText({ text: text });
}

const checkbox = document.getElementById("enabled");
chrome.storage.sync.get("enabled", (data) => {
    checkbox.checked = !!data.enabled;
    void setBadgeText(checkbox.checked);
});

checkbox.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
        void chrome.storage.sync.set({ "enabled": event.target.checked });
        void setBadgeText(event.target.checked);
    }
});

const input = document.getElementById("item");
chrome.storage.sync.get("item", (data) => {
    input.value = data.item || "";
});

input.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
        void chrome.storage.sync.set({ "item": event.target.value });
    }
});