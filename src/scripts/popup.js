"use strict";

// 1. SELECT ELEMENTS
const pwrBtn = document.getElementById("power-toggle");
const stateDisplay = document.getElementById("state");
const hideHomeCheckBox = document.getElementById("hide-home");
const hideShortsCheckBox = document.getElementById("hide-shorts");
const hideCategoriesCheckBox = document.getElementById("hide-categories");
const lockInCheckBox = document.getElementById("toggle-lockIn");
// 2. HELPER FUNCTIONS
function saveButtonState(buttonId, state) {
    chrome.storage.local.set({ [buttonId]: state });
}

function saveDropdownState(dropDownId, state) {
    chrome.storage.local.set({ [dropDownId]: state });
}

function updateButtonUI(btn, state) {
    btn.classList.toggle("on", state);
    btn.classList.toggle("off", !state);
}

function restoreCheckBoxStates() {
    chrome.storage.local.get(["hideHome", "hideShorts", "hideCategories", "lockIn"], (data) => {
        hideHomeCheckBox.checked = data.hideHome || false;
        hideShortsCheckBox.checked = data.hideShorts || false;
        hideCategoriesCheckBox.checked = data.hideCategories || false;
        lockInCheckBox.checked = data.lockIn || false;

        // add this to sync the UI classes too
        updateButtonUI(hideHomeCheckBox, data.hideHome || false);
        updateButtonUI(hideShortsCheckBox, data.hideShorts || false);
        updateButtonUI(hideCategoriesCheckBox, data.hideCategories || false);
        updateButtonUI(lockInCheckBox, data.lockIn || false);
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
        lockSliders(true);

    } else if (state === "leisure") {
        lockSliders(true);

    } else {
        lockSliders(false);
    }
}

function stateChange(newState) {
    //apply the change in state to storage
    chrome.storage.local.set({ state: newState });
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
        hideHomeCheckBox.checked = false;
        hideShortsCheckBox.checked = false;
        hideCategoriesCheckBox.checked = false;
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

function mathCheck(onSuccess) {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)

    document.getElementById("unlock-prompt").classList.remove("hidden")
    document.getElementById("unlock-question").textContent = `What is ${num1} + ${num2}?`

    document.getElementById("unlock-confirm").onclick = () => {
        const input = parseInt(document.getElementById("unlock-input").value)
        if (input === num1 + num2) {
            document.getElementById("unlock-prompt").classList.add("hidden")
            document.getElementById("unlock-input").value = ""
            onSuccess()  // run whatever needs to happen after correct answer
        } else {
            alert("Wrong answer!")
        }
    }

    document.getElementById("unlock-cancel").onclick = () => {
        document.getElementById("unlock-prompt").classList.add("hidden")
        document.getElementById("unlock-input").value = ""
    }
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
        restoreCheckBoxStates();
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
    //check if the lockin is active prompt for input
    if (!isNowOn && lockInCheckBox.checked) {
        mathCheck(() => {
            chrome.storage.local.set({ enabled: false });
            updatePowerUI(false);
            lockInCheckBox.checked = false
            updateButtonUI(lockInCheckBox, false)
            saveButtonState("lockIn", false)
        })

        return  // stop here until math check passes
    }
    chrome.storage.local.set({ enabled: isNowOn });
    updatePowerUI(isNowOn);
});

stateDisplay.addEventListener("change", (event) => {
    const newState = event.target.value;
    if (lockInCheckBox.checked) {
        stateDisplay.value = "locked"
        mathCheck(() => {
            lockInCheckBox.checked = false
            updateButtonUI(lockInCheckBox, false)
            saveButtonState("lockIn", false)
            stateDisplay.value = newState;
            stateChange(newState);
            saveDropdownState("state", newState);
        })
        return  // stop here until math check passes
    }
    
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

lockInCheckBox.addEventListener("change", function () {
    if (this.checked === false) {
        this.checked = true;
        mathCheck(() => {
            lockInCheckBox.checked = false
            updateButtonUI(lockInCheckBox, false)
            saveButtonState("lockIn", false)
        })
        return;
    } else {
        const confirmed = confirm("Are you sure you want to lock in?");
        if (!confirmed) {
            this.checked = false;
            return;
        }
    }
    const newState = this.checked;
    updateButtonUI(this, newState);
    saveButtonState("lockIn", newState);
});

// 6. START
document.addEventListener("DOMContentLoaded", init);