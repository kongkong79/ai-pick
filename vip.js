document.addEventListener('DOMContentLoaded', () => {
    const accessDeniedSection = document.getElementById('access-denied');
    const vipContentSection = document.getElementById('vip-content');
    const vipTableBody = document.querySelector('#vip-table tbody');

    const isVip = sessionStorage.getItem('isVip') === 'true';

    if (isVip) {
        accessDeniedSection.style.display = 'none';
        vipContentSection.style.display = 'block';
        loadVipData();
    } else {
        accessDeniedSection.style.display = 'block';
        vipContentSection.style.display = 'none';
        setLanguage(localStorage.getItem('language') || 'en');
    }

    async function loadVipData() {
        try {
            const response = await fetch('sports_data.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            let results = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]); // Column E is Hit Rate
                if (hitRate > 1.0) {
                    hitRate = hitRate / 100;
                }
                return {
                    match: row[1],
                    prediction: row[2],
                    odds: parseFloat(row[3]),
                    hitRate: hitRate,
                    roi: parseFloat(row[5]),
                    sampleSize: parseInt(row[6], 10)
                };
            }).filter(item => item.match && !isNaN(item.hitRate)); // Filter out invalid rows

            displayData(results); // Initial display

            // Add sorting functionality
            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                const sortedByHitRate = [...results].sort((a, b) => b.hitRate - a.hitRate);
                displayData(sortedByHitRate);
            });

            document.getElementById('sort-by-roi').addEventListener('click', () => {
                const sortedByRoi = [...results].sort((a, b) => b.roi - a.roi);
                displayData(sortedByRoi);
            });

        } catch (error) {
            console.error('Error loading VIP data:', error);
            vipTableBody.innerHTML = `<tr><td colspan="5">Failed to load data.</td></tr>`;
        }
    }

    function displayData(data) {
        vipTableBody.innerHTML = '';
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
        setLanguage(localStorage.getItem('language') || 'en');
    }
    
    //This function needs to be available for displayData to work
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

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error('failed to load');
            return await response.json();
        } catch (error) {
            const response = await fetch(`locales/en.json`);
            return await response.json();
        }
    }
});
