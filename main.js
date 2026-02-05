document.addEventListener('DOMContentLoaded', () => {

    // Theme and Language functions (no changes)
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        if(lightIcon && darkIcon) {
            lightIcon.style.display = theme === 'dark' ? 'none' : 'inline-block';
            darkIcon.style.display = theme === 'dark' ? 'inline-block' : 'none';
        }
    }

    async function setLanguage(lang) {
        try {
            const response = await fetch(`locales/${lang}.json?v=101`);
            if (!response.ok) throw new Error('Translation file not found');
            const translations = await response.json();
            document.querySelectorAll('[data-i18n-key]').forEach(element => {
                const key = element.getAttribute('data-i18n-key');
                if (translations[key]) {
                    const el = element; // Avoid re-declaration issues
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translations[key];
                    } else {
                        el.innerHTML = translations[key];
                    }
                }
            });
            localStorage.setItem('language', lang);
        } catch (error) {
            console.error(`Error setting language ${lang}:`, error);
        }
    }

    // NEW Data processing and rendering based on the screenshot
    async function fetchDataAndRender() {
        const loadingIndicator = document.getElementById('loading-indicator');
        const analysisList = document.getElementById('analysis-list');
        loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
                if (hitRate > 1.0) hitRate /= 100; // Normalize percentage
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

            // Apply the filter from the screenshot
            const filteredMatches = allMatches.filter(item => item.roi > 1 && item.sampleSize > 10 && item.hitRate > 0.51);

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatchesForCriteria">No matches found for today based on the specified criteria.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    const listItem = document.createElement('div');
                    listItem.className = 'analysis-list-item';

                    if (item.hitRate >= 0.80) {
                        // VIP locked item
                        listItem.classList.add('vip-locked');
                        listItem.innerHTML = `
                            <div class="lock-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                            <h3 data-i18n-key="vipExclusive">VIP Exclusive Prediction</h3>
                            <p data-i18n-key="vipOnlyMessage">This prediction (Hit Rate >= 80%) is for VIPs only.</p>
                            <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Subscribe Now (7-day free trial)</a>
                        `;
                    } else {
                        // Public item
                        listItem.innerHTML = `
                           <div class="item-row">
                                <span class="item-time">${item.time}</span>
                                <span class="item-match">${item.match}</span>
                                <span class="item-prediction">${item.prediction}</span>
                                <span class="item-odds"><strong>Odds:</strong> ${item.odds.toFixed(2)}</span>
                                <span class="item-hitrate"><strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</span>
                           </div>
                        `;
                    }
                    analysisList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            analysisList.innerHTML = `<p data-i18n-key="errorLoading">Error loading analysis data.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
            setLanguage(localStorage.getItem('language') || 'en');
        }
    }

    // Initial setup calls
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    fetchDataAndRender();

    // Event listeners
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    document.getElementById('language-switcher').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const lang = event.target.getAttribute('data-lang');
            setLanguage(lang);
        }
    });
});
