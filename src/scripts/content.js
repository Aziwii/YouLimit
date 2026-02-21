//import { API_KEY } from './config.js';


// Create a persistent style tag once and adds it to the <head>
const shortsStyle = document.createElement('style');
shortsStyle.id = 'hide-shorts-style';
document.head.appendChild(shortsStyle); // add style to DOM


const videoStyle = document.createElement('style');
videoStyle.id = 'hide-videos-style';
document.head.appendChild(videoStyle); // add style to DOM


const ALLOWED_CATEGORIES = ['27','28'];



// Toggles recomended visibility depending on the state of the toggleRecommended switch
// in the popup.html
 function toggleHome(homeToggleState) {
        const feed = document.querySelector('ytd-rich-grid-renderer'); // Targets main for you feed
        const sidebar = document.querySelector('#secondary-inner'); // targets side bar
        console.log("PRINTING hideHome", homeToggleState);
        if (feed != null && sidebar != null) {
            if (homeToggleState) {
                feed.style.display = 'none';
                sidebar.style.display = 'none';
            }

            else {
                feed.style.display = 'block';
                sidebar.style.display = 'block';
            }
        }
}
// toggles shorts visibility depending on the state of the toggleShorts switch
// in the popup.html
function toggleShorts(shortsToggleState) {
    const shortsSelectors = [
    // 1. Target Sections ONLY if they contain Shorts
    'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
    'ytd-rich-section-renderer:has(grid-shelf-view-model.ytGridShelfViewModelHost)',
    'ytd-item-section-renderer:has(ytd-reel-shelf-renderer)',
    
    // 2. Specific Shorts UI components (won't affect regular videos)
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    'ytm-shorts-lockup-view-model-v2',
    'ytm-shorts-lockup-view-model',
    
    // 3. Navigation and Sidebar (Safe)
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
    
    // 4. Individual Shorts in Search Results
    'ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])',
    'ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])'
    ];

    // For all the above shorts tags, add them to the shortsStyle
    // in the header and add the attribute to display:none
    if (shortsToggleState) {
        shortsStyle.textContent = `${shortsSelectors.join(', ')} { display: none !important; }`;
    } else {
        shortsStyle.textContent = '';
    }
}


async function toggleCategories(categoriesState) {
    // Get all video elements that haven't been checked yet
    const videoElements = document.querySelectorAll('ytd-rich-item-renderer:not([data-checked])');
    const videoIds = []; // stores the video id's
    const elementMap = {};

    videoElements.forEach(el => {
        const link = el.querySelector('a#video-title-link')?.href;
        if (link) {
            const id = new URL(link).searchParams.get('v');
            videoIds.push(id);
            elementMap[id] = el;
            el.setAttribute('data-checked', 'true'); // Mark as checked
        }
    });

    if (videoIds.length === 0) return;

    // Call YouTube API (Batch up to 50)
    const response = await fetch(
        `https://www.googleapis.com{videoIds.join(',')}&key=${API_KEY}`
    );
    const data = await response.json();

    // If videos don't belong to Education (27) or Science & Tech (28)
    // Hide them
    data.items.forEach(video => {
        if (!ALLOWED_CATEGORIES.includes(video.snippet.categoryId)) {
            if (categoriesState) {
                elementMap[video.id].style.display = 'none';
            }
            else {
                elementMap[video.id].style.display = '';
            }
        }
    });
}


// Listen for changes to the chrome local storage
chrome.storage.onChanged.addListener((changes) => {
    const hideHome = changes.hideHome;
    const hideShorts = changes.hideShorts;
    const tabState = changes.state?.newValue;
    console.log("PRINTING TABSTATE", tabState);

    if (typeof tabState === "undefined") {
        if (hideHome) {
            console.log("INSIDE UNDEFINED CONDITION, HIDE HOME", hideHome.newValue);
            toggleHome(hideHome.newValue);
        }

        if (hideShorts) {
            toggleShorts(hideShorts.newValue);
        }
    }

    else {
        if (tabState == "locked") {
            toggleHome(true);
            toggleShorts(true);
        }

        else if (tabState == "default") {
            // Get the current keys for homeState and apply previous settings made in default state
            chrome.storage.local.get(['hideHome', 'hideShorts'], (data) => {
                if (chrome.runtime?.lastError) return; // Catch errors if context just died
                    toggleHome(data.hideHome);
                    toggleShorts(data.hideShorts);
            });
        }
    }
    
});


// Listen for changes to DOM tree, if observed, calls toggleHome and toggleShorts to hide newly 
// loaded content
const observer = new MutationObserver(() => {
    // Check if the extension context is still valid
    if (!chrome.runtime?.id) {
        observer.disconnect(); // Stop observing if extension was reloaded
        return;
    }

    // FIX, ADD CHECK FOR MASTER
    chrome.storage.local.get(['enabled', 'hideHome', 'hideShorts'], (data) => {
        if (chrome.runtime?.lastError) return; // Catch errors if context just died
        toggleHome(data.hideHome);
        toggleShorts(data.hideShorts);
    });

    console.log("INSIDE OBSERVER BEFORE STATE GET");

    chrome.storage.local.get(['state', 'hideHome', 'hideShorts'], (data) => {
        if (chrome.runtime?.lastError) return; // Catch errors if context just died
        console.log("INSIDE OBSERVER AFTER STATE GET");

        if (data.state == "default") {
            toggleHome(data.hideHome);
            toggleShorts(data.hideShorts);
        }

        else if (data.state == "locked") {
            toggleHome(data.hideHome);
            toggleShorts(data.hideShorts);
        }
        
    });
});


// Start watching the page for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Runs once on initial page load
chrome.storage.local.get('enabled', (data) => {
    toggleHome(data.hideHome);
    toggleShorts(data.hideShorts);
    //toggleCategories(data.hideCategories);


});