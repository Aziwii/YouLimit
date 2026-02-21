"use strict";

// 1. SELECT ELEMENTS
const pwrBtn = document.getElementById("power-toggle");
const stateDisplay = document.getElementById("state");
const hideHomeCheckBox = document.getElementById("hide-home");
const hideShortsCheckBox = document.getElementById("hide-shorts");

// 2. HELPER FUNCTIONS
function saveButtonState(buttonId, state) {
    chrome.storage.local.set({ [buttonId]: state });
}

function updateButtonUI(btn, state) {
    btn.classList.toggle("on", state);
    btn.classList.toggle("off", !state);
}

function saveCheckBoxStates() {
    chrome.storage.local.set({
            hideHomeSaved: hideHomeCheckBox.checked,
            hideShortsSaved: hideShortsCheckBox.checked
        });
}

function restoreCheckBoxStates() {
    chrome.storage.local.get(["hideHomeSaved", "hideShortsSaved"], (data) => {
            hideHomeCheckBox.checked = data.hideHomeSaved || false;
            hideShortsCheckBox.checked = data.hideShortsSaved || false;
            chrome.storage.local.set({
                hideHome: data.hideHomeSaved,
                hideShorts: data.hideShortsSaved
            })
        });
}

function disableAll(enabled) {
    const mainContainer = document.getElementById("main-container");
    const offSpan = document.getElementById("off-span");

    //when turning the power off
    if (!enabled) {
        saveCheckBoxStates();
        hideHomeCheckBox.checked = false;
        hideShortsCheckBox.checked = false;
        chrome.storage.local.set({ hideHome: false, hideShorts: false });
    } else { //when turning power on
        restoreCheckBoxStates();
    }
    mainContainer.classList.toggle("hidden", !enabled);
    offSpan.classList.toggle("hidden", enabled);

    hideHomeCheckBox.disabled = !enabled;
    hideShortsCheckBox.disabled = !enabled;
}

// 3. UI UPDATER
function updatePowerUI(enabled) {
    const statusText = enabled ? "ON" : "OFF";
    pwrBtn.textContent = statusText;
    pwrBtn.classList.toggle("on", enabled);
    pwrBtn.classList.toggle("off", !enabled);

    void chrome.action.setBadgeText({ text: statusText });
    chrome.action.setBadgeBackgroundColor({
        color: enabled ? "#2ecc71" : "#555555"
    });

    //handle all the disabling when UI changes
    disableAll(enabled);
}

// 4. INIT
function init() {
    chrome.storage.local.get(["enabled", "hideHome", "hideShorts"], (data) => {

        // Define defaults
        const enabled = data.enabled ?? false;
        const hideHome = data.hideHome ?? false;
        const hideShorts = data.hideShorts ?? false;

        // Write defaults to storage if first load
        chrome.storage.local.set({ enabled, hideHome, hideShorts });

        // Paint UI with actual values
        updatePowerUI(enabled);
        hideHomeCheckBox.checked = hideHome;
        hideShortsCheckBox.checked = hideShorts;
    });
}
// 5. EVENT LISTENERS
pwrBtn.addEventListener("click", () => {
    // button is ON → contains("on") = true → !true = false → turns OFF ✅
    // button is OFF → contains("on") = false → !false = true → turns ON ✅
    const isNowOn = !pwrBtn.classList.contains("on");
    chrome.storage.local.set({ enabled: isNowOn });
    updatePowerUI(isNowOn);
});

hideHomeCheckBox.addEventListener("change", function () {
    const newState = this.checked;
    updateButtonUI(this, newState);
    saveButtonState("hideHome", newState);
});

hideShortsCheckBox.addEventListener("change", function () {
    const newState = this.checked;
    updateButtonUI(this, newState);
    saveButtonState("hideShorts", newState);
});

// 6. START
document.addEventListener("DOMContentLoaded", init);