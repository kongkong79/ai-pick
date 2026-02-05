document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ALL FUNCTION DEFINITIONS ---

    // Theme & Language (No changes)
    function setTheme(theme) { /* ... same as before ... */ }
    async function setLanguage(lang) { /* ... same as before ... */ }

    // --- Screenshot-based Data Rendering (No changes) ---
    async function fetchDataAndRender() {
        const loadingIndicator = document.getElementById('loading-indicator');
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;
        loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = parseFloat(row[4]);
                if (hitRate > 1.0) hitRate /= 100;
                return { time: row[0], match: row[1], prediction: row[2], odds: parseFloat(row[3]), hitRate: hitRate, roi: parseFloat(row[5]), sampleSize: parseInt(row[6], 10) };
            }).filter(item => item.match && !isNaN(item.roi) && !isNaN(item.sampleSize) && !isNaN(item.hitRate));

            window.sportsData = allMatches; // Store for admin panel

            const filteredMatches = allMatches.filter(item => item.roi > 1 && item.sampleSize > 10 && item.hitRate > 0.51);

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatchesForCriteria">No matches found for today based on the specified criteria.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    const listItem = document.createElement('div');
                    listItem.className = 'analysis-list-item';
                    if (item.hitRate >= 0.80) {
                        listItem.classList.add('vip-locked');
                        listItem.innerHTML = `...`; // VIP card HTML as before
                    } else {
                        listItem.innerHTML = `...`; // Public card HTML as before
                    }
                    analysisList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            analysisList.innerHTML = `<p data-i18n-key="errorLoading">Error loading analysis data.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
            setLanguage(localStorage.getItem('language') || 'en');
        }
    }

    // --- NEW / RESTORED: Admin Panel Functionality ---
    function setupAdminFeatures() {
        const logoLink = document.getElementById('logo-link');
        const adminPanel = document.getElementById('admin-panel');
        const closeAdminBtn = document.getElementById('close-admin-btn');
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-btn');

        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            const password = prompt('Enter admin password:');
            if (password === '0000') {
                displayAdminData();
                adminPanel.style.display = 'block';
            }
        });

        closeAdminBtn.addEventListener('click', () => {
            adminPanel.style.display = 'none';
        });

        uploadBtn.addEventListener('click', () => {
            if (fileInput.files.length > 0) {
                // NOTE: This is a simulation. Actual file upload requires a server.
                alert('File selected: ' + fileInput.files[0].name + '\nIn a real application, this would be uploaded to the server.');
                 // Refresh the main page data to reflect potential changes
                fetchDataAndRender(); 
                adminPanel.style.display = 'none';
            }
        });
    }
    
    function displayAdminData() {
        const tableBody = document.querySelector('#admin-data-table tbody');
        tableBody.innerHTML = '';
        if (window.sportsData && window.sportsData.length > 0) {
            window.sportsData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.time}</td>
                    <td>${item.match}</td>
                    <td>${item.prediction}</td>
                    <td>${item.odds.toFixed(2)}</td>
                    <td>${(item.hitRate * 100).toFixed(1)}%</td>
                    <td>${item.roi.toFixed(2)}</td>
                    <td>${item.sampleSize}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="7">No data loaded.</td></tr>';
        }
    }

    // --- 2. EXECUTION LOGIC ---
    setTheme(localStorage.getItem('theme') || 'light');
    fetchDataAndRender();
    setupAdminFeatures(); // Initialize admin listeners

    // Event listeners (Theme, Language)
    document.getElementById('theme-toggle').addEventListener('click', () => { /* ... */ });
    document.getElementById('language-switcher').addEventListener('click', (e) => { /* ... */ });
});
