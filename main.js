document.addEventListener('DOMContentLoaded', () => {

    // 1. HELPER FUNCTION DEFINITIONS

    // Theme management
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            if(themeIconLight) themeIconLight.style.display = 'none';
            if(themeIconDark) themeIconDark.style.display = 'inline-block';
        } else {
            if(themeIconLight) themeIconLight.style.display = 'inline-block';
            if(themeIconDark) themeIconDark.style.display = 'none';
        }
    }

    // Language management
    const languageSwitcher = document.getElementById('language-switcher');

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json?v=5`); // Cache bust
            if (!response.ok) throw new Error(`Translation file for ${lang} not found`);
            return await response.json();
        } catch (error) {
            console.error(error);
            const response = await fetch(`locales/en.json?v=5`);
            return await response.json();
        }
    }

    async function setLanguage(lang) {
        const translations = await loadTranslations(lang);
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            const translation = translations[key];
            if (translation) {
                 if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.innerHTML = translation;
                }
            }
        });
        localStorage.setItem('language', lang);
    }

    // Data fetching and rendering for the main page (CARD-BASED)
    async function fetchAndDisplayData() {
        const resultsContainer = document.getElementById('results-container');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!resultsContainer) return;

        loadingIndicator.style.display = 'block';
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const results = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
                if (hitRate > 1.0) hitRate /= 100;
                return {
                    match: row[1],
                    prediction: row[2],
                    odds: parseFloat(row[3]),
                    hitRate: hitRate,
                    roi: parseFloat(row[5]),
                    sampleSize: parseInt(row[6], 10)
                };
            }).filter(item => item.match && !isNaN(item.hitRate) && !isNaN(item.roi) && !isNaN(item.sampleSize));

            const filteredResults = results.filter(item => item.roi > 1 && item.sampleSize > 10 && item.hitRate > 0.51);

            if (filteredResults.length === 0) {
                resultsContainer.innerHTML = `<p data-i18n-key="noMatches">No matches found for today.</p>`;
            } else {
                filteredResults.forEach(item => {
                    const card = document.createElement('div');
                    card.classList.add('result-card');

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
            console.error('Error fetching or processing data:', error);
            resultsContainer.innerHTML = `<p data-i18n-key="errorLoading">Error loading data. Please try again later.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
            setLanguage(localStorage.getItem('language') || 'en');
        }
    }

    // 2. EXECUTION LOGIC

    // Set initial theme
    setTheme(localStorage.getItem('theme') || 'light');

    // Set initial language and then fetch data
    setLanguage(localStorage.getItem('language') || 'en').then(() => {
        fetchAndDisplayData();
    });

    // Add event listeners
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    if (languageSwitcher) {
        languageSwitcher.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const lang = event.target.getAttribute('data-lang');
                setLanguage(lang);
            }
        });
    }
});
