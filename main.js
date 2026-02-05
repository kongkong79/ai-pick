document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION & STATE ---
    let logoClickCount = 0;
    let logoClickTimer = null;
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';

    // --- 2. CORE FUNCTIONS ---

    /**
     * Fetches data, filters it, and renders the list.
     */
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList || !loadingIndicator) return;

        loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            if (!response.ok) throw new Error('Excel file not found.');

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
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

            // *** CORRECTED FILTERING LOGIC ***
            // Ensure floating point comparisons are handled safely.
            const filteredMatches = allMatches.filter(item => 
                item.roi > 1.0 && 
                item.sampleSize > 10 && 
                item.hitRate > 0.51
            );

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
            window.applyTranslations(localStorage.getItem('language') || 'en');
        }
    }

    /**
     * Creates a card for a single match (public or VIP).
     */
    function createMatchCard(item) {
        const listItem = document.createElement('div');
        listItem.className = 'analysis-list-item';

        if (item.hitRate >= 0.80) {
            listItem.innerHTML = `
                <div class="lock-icon">...</div>
                <h3 class="vip-exclusive-title" data-i18n-key="vipExclusive">VIP Exclusive Prediction</h3>
                <p class="vip-exclusive-text" data-i18n-key="vipOnlyMessage">This prediction (Hit Rate >= 80%) is for VIPs only.</p>
                <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Subscribe Now (7-day free trial)</a>
            `;
        } else {
            listItem.style.textAlign = 'left';
             listItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="margin: 0; font-size: 1.1rem;">${item.match}</h4>
                    <span style="font-size: 0.9rem; color: var(--text-muted);">${item.time}</span>
                </div>
                <p style="margin: 0;">
                    <strong>Prediction:</strong> ${item.prediction} | 
                    <strong>Odds:</strong> ${item.odds.toFixed(2)} | 
                    <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%
                </p>
            `;
        }
        return listItem;
    }

    /**
     * Handles admin access via logo clicks.
     */
    function handleAdminAccess() {
        logoClickCount++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);

        if (logoClickCount === 5) {
            const password = prompt('Enter admin password:');
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('isVip', 'true');
                window.location.href = 'vip.html';
            }
            logoClickCount = 0;
        }
    }

    // --- 3. EVENT LISTENERS & INITIALIZATION ---
    document.getElementById('logo-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleAdminAccess();
    });
    
    document.getElementById('theme-toggle')?.addEventListener('click', window.toggleTheme);

    document.getElementById('language-switcher')?.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const lang = e.target.getAttribute('data-lang');
            window.applyTranslations(lang);
        }
    });

    fetchDataAndRender();
});
