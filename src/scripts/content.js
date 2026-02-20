
// Toggles reccomendations based on if the primary toggle is 'on' (true) or 'off' (false)
 function toggleRecommendations(appState) {
        // Targets the main feed grid
        // Check if the youtube feed class exists and the YouLimit main toggle is 'ON'
        const feed = document.querySelector('ytd-rich-grid-renderer');
        const sidebar = document.querySelector('#secondary-inner');
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


// Listen for changes to the chrome local storage
chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
        toggleRecommendations(changes.enabled.newValue);
    }
});


// Listen for changes to DOM tree, if observed, calls toggleReccomendation to hide newly 
// loaded content
const observer = new MutationObserver(() => {
    chrome.storage.local.get('enabled', (data) => {
        toggleRecommendations(data.enabled);
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