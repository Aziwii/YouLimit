"use strict";

// 1. SELECT ELEMENTS
const pwrBtn = document.getElementById("power-toggle");
const checkbox = document.getElementById("enabled");
const stateDisplay = document.getElementById("state");
const hideHomeBtn = document.getElementById("hide-home");
const hideShortsBtn = document.getElementById("hide-shorts");

function saveButtonState(buttonId, state) {
    chrome.storage.local.set({ [buttonId]: state });
}
// 2. THE CENTRAL UI UPDATER
// This ensures that no matter HOW the state changes, the UI looks the same.
function updatePowerUI(enabled) {
    const statusText = enabled ? "ON" : "OFF";
    
    // Update Button
    pwrBtn.textContent = statusText;
    pwrBtn.classList.toggle("on", enabled);
    pwrBtn.classList.toggle("off", !enabled);
    
    // Update Checkbox (keep them in sync!)
    if (checkbox) checkbox.checked = enabled;
    
    // Update Badge
    void chrome.action.setBadgeText({ text: statusText });

    chrome.action.setBadgeBackgroundColor({ 
    color: enabled ? "#2ecc71" : "#555555" 
});
}

// 3. INITIALIZE (The "Main" Logic)
function init() {
    
    chrome.storage.local.get(["enabled", "item", "state"], (data) => {
        // Sync Power State
        updatePowerUI(!!data.enabled);
        document.getElementById('enabled').checked = !!data.enabled;
        
        // Sync Text Inputs
        if (inputItem) inputItem.value = data.item || "";
        if (stateDisplay) stateDisplay.textContent = data.state || "No state set";
    });
}

document.addEventListener("DOMContentLoaded", init);

// 4. EVENT LISTENERS
pwrBtn.addEventListener("click", () => {
    const isNowOn = !pwrBtn.classList.contains("on");
    chrome.storage.local.set({ "enabled": isNowOn });
    updatePowerUI(isNowOn);
});

// If you still want the checkbox to work separately
checkbox.addEventListener("change", (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ "enabled": isEnabled });
    updatePowerUI(isEnabled);
});

inputItem.addEventListener("change", (e) => {  
    chrome.storage.local.set({ "item": e.target.value });
});

hideHomeBtn.addEventListener('click', function() {
    const isOn = this.classList.contains('on')
    const newState = !isOn
    
    this.classList.toggle('on', newState)
    this.classList.toggle('off', !newState)
    
    saveButtonState('hideHome', newState)
})

hideShortsBtn.addEventListener('click', function() {
    const isOn = this.classList.contains('on')
    const newState = !isOn
    
    this.classList.toggle('on', newState)
    this.classList.toggle('off', !newState)
    
    saveButtonState('hideShorts', newState)
})

// Run init on load
init();