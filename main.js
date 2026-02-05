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
    
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translation for ${lang}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
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

    // DATA - RAW DEBUGGING
    const loadingIndicator = document.getElementById('loading-indicator');
    const analysisTableBody = document.getElementById('analysis-table-body');

    async function fetchAndDisplayRawData() {
        if (!analysisTableBody) return;

        loadingIndicator.style.display = 'block';
        analysisTableBody.innerHTML = '';

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
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "(empty)" });

            if (jsonData.length <= 1) {
                analysisTableBody.innerHTML = `<tr><td colspan="7">No data found in the Excel file.</td></tr>`;
                return;
            }

            // Skip header row and display all other rows as-is
            jsonData.slice(1).forEach(row => {
                const tableRow = document.createElement('tr');
                let rowHTML = '';
                for (let i = 0; i < 7; i++) { // Display first 7 columns
                     rowHTML += `<td>${row[i] !== undefined ? row[i] : '(undefined)'}</td>`;
                }
                tableRow.innerHTML = rowHTML;
                analysisTableBody.appendChild(tableRow);
            });

        } catch (error) { 
            console.error('Error fetching or processing data:', error);
            analysisTableBody.innerHTML = `<tr><td colspan="7">Error loading data. Please check the console for details.</td></tr>`;
        } finally {
             loadingIndicator.style.display = 'none';
        }
    }

    fetchAndDisplayRawData();
});
