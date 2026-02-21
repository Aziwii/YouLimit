"use strict";

// 1. SELECT ELEMENTS
const pwrBtn = document.getElementById("power-toggle");
const stateDisplay = document.getElementById("state");
const hideHomeCheckBox = document.getElementById("hide-home");
const hideShortsCheckBox = document.getElementById("hide-shorts");
const hideCategoriesCheckBox = document.getElementById("hide-categories");

// 2. HELPER FUNCTIONS
function saveButtonState(buttonId, state) {
    chrome.storage.local.set({ [buttonId]: state });
}

function saveDropdownState(dropDownId, state) {
    chrome.storage.local.set({[dropDownId]: state});
}

function updateButtonUI(btn, state) {
    btn.classList.toggle("on", state);
    btn.classList.toggle("off", !state);
}

function saveCheckBoxStates() {
    chrome.storage.local.set({
            hideHomeSaved: hideHomeCheckBox.checked,
            hideShortsSaved: hideShortsCheckBox.checked, 
            hideCategoriesSaved: hideCategoriesCheckBox.checked
        });
}

function restoreCheckBoxStates() {
    chrome.storage.local.get(["hideHomeSaved", "hideShortsSaved", "hideCategoriesSaved"], (data) => {
            hideHomeCheckBox.checked = data.hideHomeSaved || false;
            hideShortsCheckBox.checked = data.hideShortsSaved || false;
            hideCategoriesCheckBox.checked = data.hideCategoriesSaved || false;
            chrome.storage.local.set({
                hideHome: data.hideHomeSaved,
                hideShorts: data.hideShortsSaved,
                hideCategories: data.hideCategoriesSaved
            })
        });
}

function switchView(state) {
    document.getElementById("default-view").classList.toggle("hidden", state !== "default");
    document.getElementById("locked-view").classList.toggle("hidden", state !== "locked");
    document.getElementById("leisure-view").classList.toggle("hidden", state !== "leisure");
}

function applyState(state) {
    switchView(state);
    //apply the change in state in logic
    if (state === "locked") {
        saveCheckBoxStates();
        lockSliders(true);
        hideHomeCheckBox.checked = true;
        hideShortsCheckBox.checked = true;
        hideCategoriesCheckBox.checked = true;
        chrome.storage.local.set({ hideHome: true, hideShorts: true, hideCategories: true});

    } else if (state === "leisure") {
        saveCheckBoxStates();
        lockSliders(true);
        hideHomeCheckBox.checked = false;
        hideShortsCheckBox.checked = false;
        hideCategoriesCheckBox.checked = false;
        chrome.storage.local.set({ hideHome: false, hideShorts: false });
    } else {
        lockSliders(false);
        restoreCheckBoxStates();
    }
}


function stateChange(newState) {
    //apply the change in state to storage
    chrome.storage.local.set({state: newState});
    applyState(newState);
}

function lockSliders(locked) {
    hideHomeCheckBox.disabled = locked;
    hideShortsCheckBox.disabled = locked;
    hideCategoriesCheckBox.disabled = locked;
}

function disableAll(enabled) {
    const mainContainer = document.getElementById("main-container");
    const offSpan = document.getElementById("off-span");

    //when turning the power off
    if (!enabled) {
        saveCheckBoxStates();
        hideHomeCheckBox.checked = false;
        hideShortsCheckBox.checked = false;
        hideCategoriesCheckBox.checked = false;
        chrome.storage.local.set({ hideHome: false, hideShorts: false, hideCategories: false });
    } else { //when turning power on
        restoreCheckBoxStates();
    }
    //toggle the UI 
    mainContainer.classList.toggle("hidden", !enabled);
    offSpan.classList.toggle("hidden", enabled);

    //lock and unlock the sliders and dropdown
    lockSliders(!enabled);
    stateDisplay.disabled = !enabled;
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
    chrome.storage.local.get(["enabled", "hideHome", "hideShorts", "hideCategories", "state"], (data) => {

        // Define defaults
        const enabled = data.enabled ?? false;
        const hideHome = data.hideHome ?? false;
        const hideShorts = data.hideShorts ?? false;
        const hideCategories = data.hideCategories ?? false;
        const state = data.state ?? "default";
        stateDisplay.value = state;

        // Write defaults to storage if first load
        chrome.storage.local.set({ enabled, hideHome, hideShorts, hideCategories, state });

        // Paint UI with actual values
        updatePowerUI(enabled);
        if (enabled) applyState(state);
        hideHomeCheckBox.checked = hideHome;
        hideShortsCheckBox.checked = hideShorts;
        hideCategoriesCheckBox.checked = hideCategories;
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

stateDisplay.addEventListener("change", (event) => {
    const newState = event.target.value;
    stateChange(newState);
    saveDropdownState("state", newState);
});

hideHomeCheckBox.addEventListener("change", function () {
    const newState = this.checked;
    updateButtonUI(this, newState);
    saveButtonState("hideHome", newState);
});

hideCategoriesCheckBox.addEventListener("change", function () {
    const newState = this.checked;
    updateButtonUI(this, newState);
    saveButtonState("hideCategories", newState);
});

hideShortsCheckBox.addEventListener("change", function () {
    const newState = this.checked;
    updateButtonUI(this, newState);
    saveButtonState("hideShorts", newState);
});

// 6. START
document.addEventListener("DOMContentLoaded", init);