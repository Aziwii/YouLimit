// SELECT ELEMENTS
const pwrBtn = document.getElementById("power-toggle");
const stateDisplay = document.getElementById("state");
const hideHomeCheckBox = document.getElementById("hide-home");
const hideShortsCheckBox = document.getElementById("hide-shorts");
const hideCategoriesCheckBox = document.getElementById("hide-categories");
const toggleContainer = document.getElementById("lockin-button-container");
const toggleLockIn = document.getElementById("toggle-lockIn");

// TIMER ELEMENTS
const timeContainer = document.querySelector(".timer-container");
const minuteInput = document.getElementById("minutes");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const countdownDisplay = document.getElementById("countdown-display");
let countDownInterval = null;
let timeleft = 0;
let timer = null;
let isPaused = false;

// HELPER FUNCTIONS
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

// Re-load states from local storage if the popup was
// closed before
function restoreCheckBoxStates() {
  chrome.storage.local.get(
    ["hideHome", "hideShorts", "hideCategories", "lockIn"],
    (data) => {
      hideHomeCheckBox.checked = data.hideHome || false;
      hideShortsCheckBox.checked = data.hideShorts || false;
      hideCategoriesCheckBox.checked = data.hideCategories || false;
      toggleLockIn.checked = data.lockIn || false;

      // add this to sync the UI classes too
      updateButtonUI(hideHomeCheckBox, data.hideHome || false);
      updateButtonUI(hideShortsCheckBox, data.hideShorts || false);
      updateButtonUI(hideCategoriesCheckBox, data.hideCategories || false);
      updateButtonUI(toggleLockIn, data.lockIn || false);
    },
  );
}

// Handles switching between 'Default' and 'Locked In' states
function switchView(state) {
  document
    .getElementById("default-view")
    .classList.toggle("hidden", state !== "default");
  document
    .getElementById("locked-view")
    .classList.toggle("hidden", state !== "locked");
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
  } else {
    //when turning power on
    restoreCheckBoxStates();
  }
  //toggle the UI
  mainContainer.classList.toggle("hidden", !enabled);
  offSpan.classList.toggle("hidden", enabled);

  //lock and unlock the sliders and dropdown
  lockSliders(!enabled);
  stateDisplay.disabled = !enabled;
}

// Handles math problem logic required if the user wants to
// end the 'Locked In' mode timer early
function mathCheck(onSuccess) {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);

  document.getElementById("unlock-prompt").classList.remove("hidden");
  document.getElementById("unlock-question").textContent =
    `What is ${num1} + ${num2}?`;

  document.getElementById("unlock-confirm").onclick = () => {
    const input = parseInt(document.getElementById("unlock-input").value);
    if (input === num1 + num2) {
      document.getElementById("unlock-prompt").classList.add("hidden");
      document.getElementById("unlock-input").value = "";
      chrome.storage.local.set({ timeleft: 0 }); // reset time left in local storage
      countdownDisplay.innerText = "0:00"; // reset clock
      toggleContainer.style.display = "";
      onSuccess(); // run whatever needs to happen after correct answer
    } else {
      alert("Wrong answer!");
    }
  };

  document.getElementById("unlock-cancel").onclick = () => {
    document.getElementById("unlock-prompt").classList.add("hidden");
    document.getElementById("unlock-input").value = "";
    toggleContainer.style.display = "";
  };
}

//UI UPDATER
function updatePowerUI(enabled) {
  const statusText = enabled ? "ON" : "OFF";
  pwrBtn.textContent = statusText;
  pwrBtn.classList.toggle("on", enabled);
  pwrBtn.classList.toggle("off", !enabled);

  void chrome.action.setBadgeText({ text: statusText });
  chrome.action.setBadgeBackgroundColor({
    color: enabled ? "#2ecc71" : "#555555",
  });

  //handle all the disabling when UI changes
  disableAll(enabled);
}

// Starts the timer
function startTimer() {
  chrome.runtime.sendMessage({ action: "startTimer", timeleft });
  timer = true; // just a flag
}

// Updates the clock in "Locked In" mode based on local storage value
// that get's updated from background.js
function startDisplayUpdater() {
  setInterval(() => {
    chrome.storage.local.get(["timeleft", "timerRunning"], (data) => {
      if (data.timeleft > 0) {
        timeleft = data.timeleft;
        const mins = Math.floor(timeleft / 60);
        const secs = timeleft % 60;
        countdownDisplay.innerText = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
      } else if (data.timerRunning === false && timer) {
        // only reset UI if timer was actually running and just finished
        countdownDisplay.innerText = "0:00";
        timer = null;
        pauseButton.innerText = "Pause";
        toggleLockIn.checked = false;

        document.getElementById("unlock-prompt").classList.add("hidden");
        document.getElementById("unlock-input").value = "";
      }
    });
  }, 500);
}

// 4. INIT
function init() {
  chrome.storage.local.get(
    [
      "enabled",
      "hideHome",
      "hideShorts",
      "hideCategories",
      "state",
      "timeleft",
      "timerRunning",
    ],
    (data) => {
      restoreCheckBoxStates();
      // Define defaults
      const enabled = data.enabled ?? false;
      const hideHome = data.hideHome ?? false;
      const hideShorts = data.hideShorts ?? false;
      const hideCategories = data.hideCategories ?? false;
      const state = data.state ?? "default";
      stateDisplay.value = state;

      // Write defaults to storage if first load
      chrome.storage.local.set({
        enabled,
        hideHome,
        hideShorts,
        hideCategories,
        state,
      });

      // Paint UI with actual values
      updatePowerUI(enabled);
      if (enabled) applyState(state);
      hideHomeCheckBox.checked = hideHome;
      hideShortsCheckBox.checked = hideShorts;
      hideCategoriesCheckBox.checked = hideCategories;

      if (data.timeleft > 0) {
        timeleft = data.timeleft;
        const mins = Math.floor(timeleft / 60);
        const secs = timeleft % 60;
        countdownDisplay.innerText = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
        timer = data.timerRunning ? true : null;
        pauseButton.innerText = data.timerRunning ? "Pause" : "Play";
      }
      startDisplayUpdater();
    },
  );
}
// EVENT LISTENERS
pwrBtn.addEventListener("click", () => {
  // button is ON → contains("on") = true → !true = false → turns OFF
  // button is OFF → contains("on") = false → !false = true → turns ON
  const isNowOn = !pwrBtn.classList.contains("on");
  //check if the lockin is active prompt for input
  if (
    !isNowOn &&
    toggleLockIn.checked &&
    countdownDisplay.innerText != "0:00"
  ) {
    mathCheck(() => {
      chrome.storage.local.set({ enabled: false });
      updatePowerUI(false);
      toggleLockIn.checked = false;
      updateButtonUI(toggleLockIn, false);
      saveButtonState("lockIn", false);
    });

    return; // stop here until math check passes
  }
  chrome.storage.local.set({ enabled: isNowOn });
  updatePowerUI(isNowOn);
});

stateDisplay.addEventListener("change", (event) => {
  const newState = event.target.value;
  if (toggleLockIn.checked && countdownDisplay.innerText != "0:00") {
    stateDisplay.value = "locked";
    mathCheck(() => {
      toggleLockIn.checked = false;
      updateButtonUI(toggleLockIn, false);
      saveButtonState("lockIn", false);
      stateDisplay.value = newState;
      stateChange(newState);
      saveDropdownState("state", newState);
    });
    return; // stop here until math check passes
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

toggleLockIn.addEventListener("change", function () {
  // If the timer was started, user is required to complete math
  // problem to exit 'Locked In' mode
  if (this.checked === false && countdownDisplay.innerText != "0:00") {
    this.checked = true;
    toggleContainer.style.display = "none";
    mathCheck(() => {
      toggleLockIn.checked = false;
      updateButtonUI(toggleLockIn, false);
      saveButtonState("lockIn", false);
    });
    return;
  }
  const newState = this.checked;
  updateButtonUI(this, newState);
  saveButtonState("lockIn", newState);
});

// TIMER EVENT LISTENERS
startButton.addEventListener("click", function () {
  if (timer) return;

  const minutes = minuteInput.value;
  if (minutes === "" || isNaN(minutes)) return;

  timeleft = minutes * 60;

  chrome.storage.local.set({ lockIn: true });
  document.getElementById("toggle-lockIn").checked = true;

  startTimer();
});

pauseButton.addEventListener("click", function () {
  if (countdownDisplay.innerText == "0:00") {
    return;
  }
  if (timer) {
    chrome.runtime.sendMessage({ action: "pauseTimer" });
    timer = null;
    pauseButton.innerText = "Play";
  } else {
    chrome.runtime.sendMessage({ action: "startTimer", timeleft });
    timer = true;
    pauseButton.innerText = "Pause";
  }
});

// START
document.addEventListener("DOMContentLoaded", init);
