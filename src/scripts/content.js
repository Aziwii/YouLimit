// Create a persistent style tag once and adds it to the <head>
const shortsStyle = document.createElement('style');
shortsStyle.id = 'hide-shorts-style';
document.head.appendChild(shortsStyle); // add style to DOM



// Toggles recomended visibility depending on the state of the toggleRecommended switch
// in the popup.html
 function toggleRecommendations(appState) {
        const feed = document.querySelector('ytd-rich-grid-renderer'); // Targets main for you feed
        const sidebar = document.querySelector('#secondary-inner'); // targets side bar
        if (feed != null && sidebar != null) {
            if (appState) {
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
function toggleShorts(appState) {
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
    if (appState) {
        shortsStyle.textContent = `${shortsSelectors.join(', ')} { display: none !important; }`;
    } else {
        shortsStyle.textContent = '';
    }
}


// Listen for changes to the chrome local storage
chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
        toggleRecommendations(changes.enabled.newValue);
        toggleShorts(changes.enabled.newValue);
    }
});


// Listen for changes to DOM tree, if observed, calls toggleReccomendation to hide newly 
// loaded content
const observer = new MutationObserver(() => {
    // Check if the extension context is still valid
    if (!chrome.runtime?.id) {
        observer.disconnect(); // Stop observing if extension was reloaded
        return;
    }

    chrome.storage.local.get('enabled', (data) => {
        if (chrome.runtime?.lastError) return; // Catch errors if context just died
        toggleRecommendations(data.enabled);
        toggleShorts(data.enabled);
    });
});


// Start watching the page for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Runs once on initial page load
chrome.storage.local.get('enabled', (data) => {
    toggleRecommendations(data.enabled);
});