document.addEventListener('DOMContentLoaded', () => {
    // THEME
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const currentTheme = localStorage.getItem('theme') || 'light';

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            themeIconLight.style.display = 'none';
            themeIconDark.style.display = 'inline-block';
        } else {
            themeIconLight.style.display = 'inline-block';
            themeIconDark.style.display = 'none';
        }
    }

    setTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // LANGUAGE
    const languageSwitcher = document.getElementById('language-switcher');
    const translations = {
        // ... (translation data) ...
    };

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translation for ${lang}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            // Fallback to English
            const response = await fetch(`locales/en.json`);
            return await response.json();
        }
    }

    async function setLanguage(lang) {
        const translations = await loadTranslations(lang);
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
    }

    languageSwitcher.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const lang = event.target.getAttribute('data-lang');
            setLanguage(lang);
        }
    });

    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);

    // DATA
    const loadingIndicator = document.getElementById('loading-indicator');
    const analysisTableBody = document.getElementById('analysis-table-body');

    async function fetchAndDisplayData() {
        if (!analysisTableBody) return; // Only run on pages with the table

        loadingIndicator.style.display = 'block';
        analysisTableBody.innerHTML = ''; // Clear previous results

        try {
            const response = await fetch('sports_data.xlsx');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const results = jsonData.slice(1).map(row => ({
                match: row[0],
                prediction: row[1],
                odds: parseFloat(row[2]),
                hitRate: parseFloat(row[3]),
                roi: parseFloat(row[4]),
                sampleSize: parseInt(row[5], 10)
            }));

            const filteredResults = results.filter(item => 
                item.roi > 1 && item.sampleSize > 10 && item.hitRate > 0.51
            );

            if (filteredResults.length === 0) {
                analysisTableBody.innerHTML = `<tr><td colspan="5" data-i18n-key="noMatches">No matches found for today.</td></tr>`;
                setLanguage(localStorage.getItem('language') || 'en'); // re-apply translation
                return;
            }

            filteredResults.forEach(item => {
                const row = document.createElement('tr');
                
                if (item.hitRate >= 0.80) {
                    row.classList.add('vip-row');
                    row.innerHTML = `
                        <td>${item.match}</td>
                        <td colspan="4" class="vip-locked-cell">
                            <div class="vip-lock-container">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <span data-i18n-key="vipExclusive">VIP Exclusive Prediction</span>
                                <a href="vip.html" class="btn-subscribe" data-i18n-key="subscribeButtonShort">Subscribe</a>
                            </div>
                        </td>
                    `;
                } else {
                     row.innerHTML = `
                        <td>${item.match}</td>
                        <td>${item.prediction}</td>
                        <td>${item.odds.toFixed(2)}</td>
                        <td>${(item.hitRate * 100).toFixed(2)}%</td>
                        <td>${item.roi.toFixed(2)}</td>
                    `;
                }
                analysisTableBody.appendChild(row);
            });
            
            setLanguage(localStorage.getItem('language') || 'en'); // re-apply translations to new content

        } catch (error) { 
            console.error('Error fetching or processing data:', error);
            analysisTableBody.innerHTML = `<tr><td colspan="5" data-i18n-key="errorLoading">Error loading data. Please try again later.</td></tr>`;
            setLanguage(localStorage.getItem('language') || 'en');
        } finally {
             loadingIndicator.style.display = 'none';
        }
    }

    fetchAndDisplayData();

});
