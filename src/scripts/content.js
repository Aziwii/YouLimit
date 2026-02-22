let YOUTUBE_API_KEY = null;

// Request key ONCE on load
chrome.runtime.sendMessage({ type: "GET_YOUTUBE_KEY" }, (response) => {
    if (response?.key) {
        YOUTUBE_API_KEY = response.key;
        console.log("Global API Key is ready.");
    }
});


// Create a persistent style tag once and adds it to the <head>
const shortsStyle = document.createElement('style');
shortsStyle.id = 'hide-shorts-style';
document.head.appendChild(shortsStyle); // add style to DOM


const videoStyle = document.createElement('style');
videoStyle.id = 'hide-videos-style';
document.head.appendChild(videoStyle); // add style to DOM


const ALLOWED_CATEGORIES = ['27','28'];

//========================================================================================//
// FUNCTIONS
//========================================================================================//

// Toggles recomended visibility depending on the state of the toggleRecommended switch
// in the popup.html
 function toggleHome(homeToggleState) {
        const feed = document.querySelector('ytd-rich-grid-renderer'); // Targets main for you feed
        const sidebar = document.querySelector('#secondary-inner'); // targets side bar
        //console.log("PRINTING hideHome", homeToggleState);
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




// Listen for changes to the chrome local storage
chrome.storage.onChanged.addListener((changes) => {
    const hideHome = changes.hideHome;
    const hideShorts = changes.hideShorts;
    const hideCategories = changes.hideCategories;
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

        if (hideCategories) {
            console.log("IN LISTNEER FOR CATEGORIES", hideCategories);
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

    // FIX, ADD CHECK FOR MASTER SWITCH
    chrome.storage.local.get(['enabled', 'state', 'hideHome', 'hideShorts', 'hideCategories'], (data) => {
        if (chrome.runtime?.lastError) return; // Catch errors if context just died
        if (data.state == "default") {
            toggleHome(data.hideHome);
            toggleShorts(data.hideShorts);
        }

        else if (data.state == "locked") {
            toggleHome(true);
            toggleShorts(true);
            //(true);
        }
            
    });

    //console.log("INSIDE OBSERVER BEFORE STATE GET");

    // chrome.storage.local.get(['state', 'hideHome', 'hideShorts'], (data) => {
    //     if (chrome.runtime?.lastError) return; // Catch errors if context just died
    //     //console.log("INSIDE OBSERVER AFTER STATE GET");

    //     if (data.state == "default") {
    //         toggleHome(data.hideHome);
    //         toggleShorts(data.hideShorts);
    //     }

    //     else if (data.state == "locked") {
    //         toggleHome(data.hideHome);
    //         toggleShorts(data.hideShorts);
    //         (data.)
    //     }
        
    // });
});


// Start watching the page for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Runs once on initial page load
chrome.storage.local.get(['enabled', 'hideHome', 'hideShorts', 'hideCategories'], (data) => {
    
    toggleHome(data.hideHome);
    toggleShorts(data.hideShorts);


});