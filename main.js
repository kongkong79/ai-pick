document.addEventListener('DOMContentLoaded', () => {

    // 1. ALL FUNCTION DEFINITIONS

    // Theme management
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        if (lightIcon && darkIcon) {
            lightIcon.style.display = theme === 'dark' ? 'none' : 'inline-block';
            darkIcon.style.display = theme === 'dark' ? 'inline-block' : 'none';
        }
    }

    // Language management
    async function setLanguage(lang) {
        try {
            const response = await fetch(`locales/${lang}.json?v=12`); // Cache bust
            const translations = await response.json();
            document.querySelectorAll('[data-i18n-key]').forEach(element => {
                const key = element.getAttribute('data-i18n-key');
                if (translations[key]) {
                     if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translations[key];
                    } else {
                        element.innerHTML = translations[key];
                    }
                }
            });
            localStorage.setItem('language', lang);
        } catch (error) {
            console.error(`Error setting language ${lang}:`, error);
        }
    }

    // Data fetching and processing
    async function fetchAndProcessData() {
        const loadingIndicator = document.getElementById('loading-indicator');
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return; 

        loadingIndicator.style.display = 'block';
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const results = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
                if (hitRate > 1.0) hitRate /= 100;
                return {
                    match: row[1], prediction: row[2], odds: parseFloat(row[3]),
                    hitRate: hitRate, roi: parseFloat(row[5]), sampleSize: parseInt(row[6], 10)
                };
            }).filter(item => item.match && !isNaN(item.hitRate));

            window.sportsData = results;
            
            if (results.length === 0) {
                 resultsContainer.innerHTML = `<p data-i18n-key="noMatches">No matches found in the data file.</p>`;
            } else {
                results.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'result-card';
                    
                    if (item.hitRate >= 0.80) {
                        card.classList.add('vip-card');
                        card.innerHTML = `
                            <div class="card-header">${item.match}</div>
                            <div class="vip-lock-container">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <p data-i18n-key="vipExclusive">VIP Exclusive Prediction</p>
                                <a href="vip.html" class="btn-subscribe" data-i18n-key="subscribeButtonShort">Subscribe</a>
                            </div>
                        `;
                    } else { 
                        card.innerHTML = `
                            <div class="card-header">${item.match}</div>
                            <div class="card-body">
                                <p><strong data-i18n-key="cardPrediction">Prediction:</strong> ${item.prediction}</p>
                                <p><strong data-i18n-key="cardOdds">Odds:</strong> ${item.odds.toFixed(2)}</p>
                                <p><strong data-i18n-key="cardHitRate">Hit Rate:</strong> ${(item.hitRate * 100).toFixed(2)}%</p>
                                <p><strong data-i18n-key="cardROI">ROI:</strong> ${item.roi.toFixed(2)}</p>
                            </div>
                        `;
                    }
                    resultsContainer.appendChild(card);
                });
            }

        } catch (error) {
            console.error('Error processing data:', error);
            resultsContainer.innerHTML = `<p data-i18n-key="errorLoading">Error loading data.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
            setLanguage(localStorage.getItem('language') || 'en');
        }
    }

    // Admin functionality
    function setupAdminFeatures() {
        const logoLink = document.getElementById('logo-link');
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            const password = prompt('Enter admin password:');
            if (password === '0000') {
                 alert('Admin access granted. Panel feature is available in the restored code.');
            }
        });
    }

    // 2. EXECUTION LOGIC
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    fetchAndProcessData();
    setupAdminFeatures();

    document.getElementById('theme-toggle').addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    document.getElementById('language-switcher').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            setLanguage(event.target.getAttribute('data-lang'));
        }
    });
});
