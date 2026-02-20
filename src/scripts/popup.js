"use strict";

console.log("Popup loaded");

function setBadgeText(enabled) {
    const text = enabled ? "ON" : "OFF";
    void chrome.action.setBadgeText({ text: text });
}

const checkbox = document.getElementById("enabled");
chrome.storage.local.get("enabled", (data) => {
    checkbox.checked = !!data.enabled;
    void setBadgeText(checkbox.checked);
});

checkbox.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
        void chrome.storage.local.set({ "enabled": event.target.checked });
        void setBadgeText(event.target.checked);
    }
});

const input = document.getElementById("item");
chrome.storage.local.get("item", (data) => {
    input.value = data.item || "";
});

input.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
        void chrome.storage.local.set({ "item": event.target.value });
    }
});

const pwrBtn = document.getElementById("power-toggle");
pwrBtn.addEventListener("click", () => {
    
    pwrBtn.classList.toggle("on");
    pwrBtn.classList.toggle("off");
    
    if (pwrBtn.classList.contains("on")) {
        pwrBtn.textContent = "ON";
    } else {
        pwrBtn.textContent = "OFF";
    }
});