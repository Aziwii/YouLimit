 function hideRecommendations() {
        // Targets the main feed grid
        const feed = document.querySelector('ytd-rich-grid-renderer');
        if (feed) {
            feed.style.display = 'none';
        }
        // Targets the sidebar recommendations on watch page
        const sidebar = document.querySelector('#secondary-inner');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
    }

    // Run on load and on scroll/DOM changes
    window.addEventListener('load', hideRecommendations);
    document.addEventListener('scroll', hideRecommendations);