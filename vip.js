document.addEventListener('DOMContentLoaded', () => {

    // 1. ALL FUNCTION DEFINITIONS

    // Applies translations to elements
    async function setLanguage(lang) {
        try {
            const response = await fetch(`locales/${lang}.json?v=5`);
            const translations = await response.json();
            document.querySelectorAll('[data-i18n-key]').forEach(element => {
                const key = element.getAttribute('data-i18n-key');
                if (translations[key]) {
                     if (element.tagName === 'INPUT' && element.type !== 'submit') {
                        element.placeholder = translations[key];
                    } else {
                        element.innerHTML = translations[key];
                    }
                }
            });
            localStorage.setItem('language', lang);
        } catch (error) {
            console.error('Error setting language:', error);
        }
    }

    // Renders data into the VIP table
    function displayData(data) {
        const vipTableBody = document.querySelector('#vip-table tbody');
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
    }

    // Fetches, processes, and displays all data for VIPs
    async function loadVipData() {
        try {
            const response = await fetch('sports_data.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            let results = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
                if (hitRate > 1.0) hitRate /= 100;
                return {
                    match: row[1],
                    prediction: row[2],
                    odds: parseFloat(row[3]),
                    hitRate: hitRate,
                    roi: parseFloat(row[5]),
                };
            }).filter(item => item.match && !isNaN(item.hitRate));

            displayData(results);

            // Sorting functionality
            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                displayData([...results].sort((a, b) => b.hitRate - a.hitRate));
            });
            document.getElementById('sort-by-roi').addEventListener('click', () => {
                displayData([...results].sort((a, b) => b.roi - a.roi));
            });

        } catch (error) {
            console.error('Error loading VIP data:', error);
        }
    }

    // Shows the main VIP content area
    function showVipContent() {
        document.getElementById('access-denied').style.display = 'none';
        document.getElementById('vip-content').style.display = 'block';
        loadVipData();
    }


    // 2. EXECUTION LOGIC

    // Initialize language first
    setLanguage(localStorage.getItem('language') || 'en');

    // Check for VIP status on page load
    if (sessionStorage.getItem('isVip') === 'true') {
        showVipContent();
    } else {
        document.getElementById('access-denied').style.display = 'block';
        document.getElementById('vip-content').style.display = 'none';
    }

    // Handle VIP login form submission
    const loginForm = document.getElementById('vip-login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        // The correct password is '7777'
        if (password === '7777') {
            sessionStorage.setItem('isVip', 'true');
            showVipContent();
        } else {
            errorMessage.style.display = 'block';
        }
    });
});
