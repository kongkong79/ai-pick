document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION & STATE ---
    let logoClickCount = 0;
    let logoClickTimer = null;
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';

    // --- 2. CORE FUNCTIONS ---

    /**
     * Fetches data from the Excel file, filters it, and renders the list.
     */
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList || !loadingIndicator) return;

        loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            // Fetch with cache-busting query parameter
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            if (!response.ok) throw new Error('Excel file not found.');

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
                // Normalize hit rate (e.g., 80 -> 0.8)
                if (hitRate > 1.0) hitRate /= 100;
                return {
                    time: row[0],
                    match: row[1],
                    prediction: row[2],
                    odds: parseFloat(row[3]),
                    hitRate: hitRate,
                    roi: parseFloat(row[5]),
                    sampleSize: parseInt(row[6], 10)
                };
            }).filter(item => item.match && !isNaN(item.roi) && !isNaN(item.sampleSize) && !isNaN(item.hitRate));

            // Apply public filters
            const filteredMatches = allMatches.filter(item => item.roi > 1 && item.sampleSize > 10 && item.hitRate > 0.51);

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatchesForCriteria">No matches found for today based on the specified criteria.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Error processing data:', error);
            analysisList.innerHTML = `<p data-i18n-key="errorLoading">Error loading analysis data. Please check if sports_data.xlsx exists.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
            // Apply translations after rendering
            window.applyTranslations(localStorage.getItem('language') || 'en');
        }
    }

    /**
     * Creates an HTML element for a single match card (either public or VIP locked).
     * @param {object} item - The match data item.
     * @returns {HTMLElement} The created list item element.
     */
    function createMatchCard(item) {
        const listItem = document.createElement('div');
        listItem.className = 'analysis-list-item';

        // VIP Lock Condition
        if (item.hitRate >= 0.80) {
            listItem.innerHTML = `
                <div class="lock-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h3 class="vip-exclusive-title" data-i18n-key="vipExclusive">VIP Exclusive Prediction</h3>
                <p class="vip-exclusive-text" data-i18n-key="vipOnlyMessage">This prediction (Hit Rate >= 80%) is for VIPs only.</p>
                <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Subscribe Now (7-day free trial)</a>
            `;
        } else {
            // Regular public card (This part was missing from your previous request, adding a simple layout)
            listItem.style.textAlign = 'left';
            listItem.innerHTML = `
                <h4>${item.match}</h4>
                <p><strong>Prediction:</strong> ${item.prediction} | <strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
            `;
        }
        return listItem;
    }

    /**
     * Handles the logic for admin access via logo clicks.
     */
    function handleAdminAccess() {
        logoClickCount++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => {
            logoClickCount = 0; // Reset after 2 seconds
        }, 2000);

        if (logoClickCount === 5) {
            const password = prompt('Enter admin password:');
            if (password === ADMIN_PASSWORD) {
                // Grant admin access for the session and redirect
                sessionStorage.setItem('isVip', 'true');
                window.location.href = 'vip.html';
            }
            logoClickCount = 0; // Reset after attempt
        }
    }

    // --- 3. EVENT LISTENERS & INITIALIZATION ---

    // Admin access
    const logoLink = document.getElementById('logo-link');
    if(logoLink) logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleAdminAccess();
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) themeToggle.addEventListener('click', window.toggleTheme);

    // Language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if(languageSwitcher) languageSwitcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const lang = e.target.getAttribute('data-lang');
            window.applyTranslations(lang);
        }
    });

    // Initial Load
    fetchDataAndRender();
});

