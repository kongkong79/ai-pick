document.addEventListener('DOMContentLoaded', () => {

    // 1. ALL FUNCTION DEFINITIONS

    // Handles language switching by loading the correct translation file
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json?v=3`); // Version bump to ensure fresh file
            if (!response.ok) throw new Error(`Translation file for ${lang} not found`);
            return await response.json();
        } catch (error) {
            console.error(error);
            // Fallback to English if the requested language is not found
            const response = await fetch(`locales/en.json?v=3`);
            return await response.json();
        }
    }

    // Applies translations to all elements with a data-i18n-key attribute
    async function setLanguage(lang) {
        const translations = await loadTranslations(lang);
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            if (translations[key]) {
                element.innerHTML = translations[key];
            }
        });
        localStorage.setItem('language', lang);
    }

    // Renders the provided data into the VIP table
    function displayData(data) {
        const vipTableBody = document.querySelector('#vip-table tbody');
        if (!vipTableBody) return;
        vipTableBody.innerHTML = ''; // Clear previous data
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.match}</td>
                <td>${item.prediction}</td>
                <td>${item.odds.toFixed(2)}</td>
                <td>${(item.hitRate * 100).toFixed(2)}%</td>
                <td>${item.roi.toFixed(2)}</td>
            `;
            vipTableBody.appendChild(row);
        });
        // Re-apply language after rendering new content
        setLanguage(localStorage.getItem('language') || 'en');
    }

    // Fetches and processes the Excel data for VIP users
    async function loadVipData() {
        const vipTableBody = document.querySelector('#vip-table tbody');
        try {
            const response = await fetch('sports_data.xlsx');
            if (!response.ok) throw new Error('Excel file not found');

            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Process and clean the data
            let results = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]); // Column E
                if (hitRate > 1.0) hitRate /= 100; // Normalize percentage
                return {
                    match: row[1],        // Column B
                    prediction: row[2], // Column C
                    odds: parseFloat(row[3]),   // Column D
                    hitRate: hitRate,
                    roi: parseFloat(row[5]),      // Column F
                    sampleSize: parseInt(row[6], 10) // Column G
                };
            }).filter(item => item.match && !isNaN(item.hitRate)); // Filter out any invalid or empty rows

            // Initial display and sort functionality
            displayData(results);

            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                displayData([...results].sort((a, b) => b.hitRate - a.hitRate));
            });

            document.getElementById('sort-by-roi').addEventListener('click', () => {
                displayData([...results].sort((a, b) => b.roi - a.roi));
            });

        } catch (error) {
            console.error('Error loading VIP data:', error);
            if(vipTableBody) vipTableBody.innerHTML = `<tr><td colspan="5">Failed to load data.</td></tr>`;
        }
    }


    // 2. EXECUTION LOGIC

    const accessDeniedSection = document.getElementById('access-denied');
    const vipContentSection = document.getElementById('vip-content');
    const isVip = sessionStorage.getItem('isVip') === 'true';

    if (isVip) {
        // If user is VIP, show content and load data
        if(accessDeniedSection) accessDeniedSection.style.display = 'none';
        if(vipContentSection) vipContentSection.style.display = 'block';
        loadVipData();
    } else {
        // If user is not VIP, show access denied message
        if(accessDeniedSection) accessDeniedSection.style.display = 'block';
        if(vipContentSection) vipContentSection.style.display = 'none';
        // Set language for the "access denied" message
        setLanguage(localStorage.getItem('language') || 'en');
    }
});
