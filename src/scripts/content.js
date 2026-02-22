const API_KEY = CONFIG.apiKey;
const ALLOWED_CATEGORIES = ["27", "28"]; // Education, Science & Tech video category ID's
const cache = new Map();

// Request key ONCE on load
chrome.runtime.sendMessage({ type: "GET_YOUTUBE_KEY" }, (response) => {
  if (response?.key) {
    YOUTUBE_API_KEY = response.key;
    console.log("Global API Key is ready.");
  }
});

// Create a persistent style tag once and adds it to the <head>
const shortsStyle = document.createElement("style");
shortsStyle.id = "hide-shorts-style";
document.head.appendChild(shortsStyle); // add style to DOM

//========================================================================================//
// FUNCTIONS
//========================================================================================//

// (FOCUS FEATURE) Toggles recomended visibility depending on the state of the toggleRecommended switch
// in the popup.html
function toggleHome(homeToggleState) {
  const feed = document.querySelector("ytd-rich-grid-renderer"); // Targets main for you feed
  const sidebar = document.querySelector("#secondary-inner"); // targets side bar
  //console.log("PRINTING hideHome", homeToggleState);
  if (feed != null && sidebar != null) {
    if (homeToggleState) {
      feed.style.display = "none";
      sidebar.style.display = "none";
    } else {
      feed.style.display = "block";
      sidebar.style.display = "block";
    }
  }
}
// (FOCUS FEATURE) Toggles shorts visibility depending on the state
// of the toggleShorts switch in the popup.html
function toggleShorts(shortsToggleState) {
  const shortsSelectors = [
    // Target Sections ONLY if they contain Shorts
    "ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])",
    "ytd-rich-section-renderer:has(grid-shelf-view-model.ytGridShelfViewModelHost)",
    "ytd-item-section-renderer:has(ytd-reel-shelf-renderer)",

    // Specific Shorts UI components (won't affect regular videos)
    "ytd-rich-shelf-renderer[is-shorts]",
    "ytd-reel-shelf-renderer",
    "ytm-shorts-lockup-view-model-v2",
    "ytm-shorts-lockup-view-model",

    // Navigation and Sidebar (Safe)
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',

    // Individual Shorts in Search Results
    'ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])',
    'ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])',
  ];

  // For all the above shorts tags, add them to the shortsStyle
  // in the header and add the attribute to display:none
  if (shortsToggleState) {
    shortsStyle.textContent = `${shortsSelectors.join(", ")} { display: none !important; }`;
  } else {
    shortsStyle.textContent = "";
  }
}
// function to get all viewable youtube video elements by
// analyzing the href link
function getVideoId(renderer) {
  const anchor = renderer.querySelector("a[href*='watch?v=']");
  if (!anchor) return null;
  try {
    return new URL(anchor.href).searchParams.get("v");
  } catch {
    return null;
  }
}
// (FOCUS FEATURE) Toggles visibility of videos belonging to
// 'Education' or 'Science and Technology' depending on the
// state of the toggleCategories switch in the popup.html
async function toggleCategories(toggleCategoriesState) {
  // If toggleCategories is off, then reset video filter so they
  // can all be checked again when toggleCategories is on
  if (!toggleCategoriesState) {
    document
      .querySelectorAll(
        "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer",
      )
      .forEach((r) => {
        r.style.display = "";
        delete r.dataset.filtered;
      });
    return;
  }
  // Filters through elements to find all videos
  const renderers = [
    ...document.querySelectorAll(
      "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer",
    ),
  ].filter((r) => !r.dataset.filtered);

  const toFetch = [];
  const rendererMap = new Map();
  // Get video ID's
  for (const renderer of renderers) {
    const id = getVideoId(renderer);
    if (!id) continue;
    renderer.dataset.filtered = "true";
    rendererMap.set(id, renderer);
    if (!cache.has(id)) toFetch.push(id);
  }
  // API request allows for batches of up to 50 videos, returns object containing
  // video metadata
  if (toFetch.length) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${toFetch.join(",")}&key=${API_KEY}`,
    );
    const data = await res.json();
    const { items = [] } = data;
    for (const item of items) {
      cache.set(item.id, item.snippet.categoryId);
    }
  }
  // If the video category does not belong to the allowed set,
  // hide the video
  for (const [id, renderer] of rendererMap) {
    if (!ALLOWED_CATEGORIES.includes(cache.get(id))) {
      renderer.style.display = "none";
    }
  }
}
//========================================================================================//
// LISTENERS
//========================================================================================//

// Listen for changes to the chrome local storage
chrome.storage.onChanged.addListener((changes) => {
  const enabled = changes.enabled; // Master on/off switch
  const hideHome = changes.hideHome;
  const hideShorts = changes.hideShorts;
  const hideCategories = changes.hideCategories;
  const lockInState = changes.lockIn;
  const tabState = changes.state?.newValue;
  console.log("PRINTING TABSTATE", tabState);

  // If master switch was turned ON, load current states from
  // chrome storage
  if (enabled) {
    console.log(enabled.newValue);
    if (enabled.newValue) {
      // Get the current keys for homeState
      // and apply previous settings made in default state
      chrome.storage.local.get(
        ["hideHome", "hideShorts", "hideCategories"],
        (data) => {
          if (chrome.runtime?.lastError) return; // Catch errors if context just died
          toggleHome(data.hideHome);
          toggleShorts(data.hideShorts);
          toggleCategories(data.hideCategories);
        },
      );
    }
    // The master switch was turned off so turn off all focus features
    else {
      toggleHome(false);
      toggleShorts(false);
      toggleCategories(false);
    }

    return;
  }

  // Default mode toggle checks
  if (hideHome) {
    toggleHome(hideHome.newValue);
  } else if (hideShorts) {
    toggleShorts(hideShorts.newValue);
  } else if (hideCategories) {
    toggleCategories(hideCategories.newValue);
  }
  // if 'Lock In' mode is turned on, apply all focus features
  // implicitly, if 'Lock In' mode is turned off, remove all
  // focus features.
  else if (lockInState) {
    if (lockInState.newValue) {
      toggleHome(true);
      toggleShorts(true);
      toggleCategories(true);
    } else {
      toggleHome(false);
      toggleShorts(false);
      toggleCategories(false);
    }
  }
});

// Listen for changes to DOM tree, if observed, calls focus feature functions
const observer = new MutationObserver((mutations) => {
  const hasNewVideos = mutations.some((m) =>
    [...m.addedNodes].some(
      (node) =>
        node.nodeName &&
        [
          "YTD-VIDEO-RENDERER",
          "YTD-RICH-ITEM-RENDERER",
          "YTD-COMPACT-VIDEO-RENDERER",
        ].includes(node.nodeName.toUpperCase()),
    ),
  );

  if (!hasNewVideos) return;

  // Check if the extension context is still valid
  if (!chrome.runtime?.id) {
    observer.disconnect(); // Stop observing if extension was reloaded
    return;
  }
  console.log("IN OBSERVER");

  // FIX, ADD CHECK FOR MASTER SWITCH
  chrome.storage.local.get(
    ["enabled", "state", "hideHome", "hideShorts", "hideCategories", "lockIn"],
    (data) => {
      if (chrome.runtime?.lastError) return; // Catch errors if context just died
      if (data.state == "default") {
        toggleHome(data.hideHome);
        toggleShorts(data.hideShorts);
        toggleCategories(data.hideCategories);
      } else if (data.lockIn) {
        toggleHome(true);
        toggleShorts(true);
        toggleCategories(true);
      }
    },
  );
});

// Start watching the page for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial read on page load
chrome.storage.local.get(
  ["enabled", "hideHome", "hideShorts", "hideCategories"],
  (data) => {
    if (!data.enabled) return; // add this check
    toggleHome(data.hideHome);
    toggleShorts(data.hideShorts);
    toggleCategories(data.hideCategories);
  },
);
