document.addEventListener('DOMContentLoaded', () => {

    // Function to set language strings (essential for dynamic content)
    async function setLanguage(lang) {
        try {
            const response = await fetch(`locales/${lang}.json?v=102`);
            if (!response.ok) return;
            const translations = await response.json();
            document.querySelectorAll('[data-i18n-key]').forEach(element => {
                const key = element.getAttribute('data-i18n-key');
                if (translations[key]) {
                    const el = element;
                    if (el.tagName === 'INPUT' && el.type !== 'submit') {
                        el.placeholder = translations[key];
                    } else {
                        el.innerHTML = translations[key];
                    }
                }
            });
        } catch (error) {
            console.error('Error setting language:', error);
        }
    }

    // Renders data into the VIP table
    function displayData(data) {
        const vipTableBody = document.querySelector('#vip-table tbody');
        if (!vipTableBody) return;
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
        const lang = localStorage.getItem('language') || 'en';
        setLanguage(lang);
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

            // Initial sort by Hit Rate
            results.sort((a, b) => b.hitRate - a.hitRate);
            displayData(results);

            // Make sorting buttons functional
            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                displayData([...results].sort((a, b) => b.hitRate - a.hitRate));
            });
            document.getElementById('sort-by-roi').addEventListener('click', () => {
                displayData([...results].sort((a, b) => b.roi - a.roi));
            });

        } catch (error) {
            console.error('Error loading VIP data:', error);
            const vipTableBody = document.querySelector('#vip-table tbody');
            if(vipTableBody) vipTableBody.innerHTML = `<tr><td colspan="5" data-i18n-key="errorLoading">Failed to load data.</td></tr>`;
            const lang = localStorage.getItem('language') || 'en';
            setLanguage(lang);
        }
    }

    // Shows the main VIP content area and loads data
    function showVipContent() {
        document.getElementById('access-denied').style.display = 'none';
        document.getElementById('vip-content').style.display = 'block';
        loadVipData();
    }

    // --- Main Execution Logic ---
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);

    // Check if user is already logged in from this session
    if (sessionStorage.getItem('isVip') === 'true') {
        showVipContent();
    } else {
        document.getElementById('access-denied').style.display = 'block';
        document.getElementById('vip-content').style.display = 'none';
    }

    // Handle the VIP login form submission
    const loginForm = document.getElementById('vip-login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('error-message');
        
        // The password remains '7777' for now
        if (passwordInput.value === '7777') {
            sessionStorage.setItem('isVip', 'true');
            showVipContent();
        } else {
            errorMessage.style.display = 'block';
            setLanguage(localStorage.getItem('language') || 'en');
        }
    });
});
