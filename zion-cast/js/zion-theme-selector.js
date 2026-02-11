// Theme Selector Event Listener
(function initThemeSelector() {
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            window.setTheme(e.target.value);
        });
    }
})();
