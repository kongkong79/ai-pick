document.addEventListener('DOMContentLoaded', () => {
    const vipContent = document.getElementById('vip-content');
    const accessDenied = document.getElementById('access-denied');
    const tableBody = document.querySelector('#vip-table tbody');
    let allData = [];

    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get('access_code');

    if (accessCode === 'MGB_ADMIN') {
        if(vipContent) vipContent.style.display = 'block';
        if(accessDenied) accessDenied.style.display = 'none';
        loadVipData();
    } else {
        if(vipContent) vipContent.style.display = 'none';
        if(accessDenied) accessDenied.style.display = 'block';
    }

    async function loadVipData() {
        try {
            const response = await fetch('sports_data.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            allData = jsonData.map(row => ({
                matchInfo: `${row['Home Team'] || 'N/A'} vs ${row['Away Team'] || 'N/A'}`,
                prediction: row['AI Recommendation'] || 'N/A',
                odds: parseFloat(row['Home Odds']) || 0,
                hitRate: parseFloat(row['Hit rate']) || 0,
                roi: parseFloat(row['Expected ROI']) || 0
            }));

            populateTable(allData);
        } catch (error) {
            console.error('Error loading or processing VIP data:', error);
            if(tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
            }
        }
    }

    function populateTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.matchInfo}</td>
                <td>${item.prediction}</td>
                <td>${item.odds.toFixed(2)}</td>
                <td>${item.hitRate.toFixed(2)}</td>
                <td>${item.roi.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    const sortByHitRateBtn = document.getElementById('sort-by-hit-rate');
    if(sortByHitRateBtn) {
        sortByHitRateBtn.addEventListener('click', () => {
            const sortedData = [...allData].sort((a, b) => b.hitRate - a.hitRate);
            populateTable(sortedData);
        });
    }

    const sortByRoiBtn = document.getElementById('sort-by-roi');
    if(sortByRoiBtn) {
        sortByRoiBtn.addEventListener('click', () => {
            const sortedData = [...allData].sort((a, b) => b.roi - a.roi);
            populateTable(sortedData);
        });
    }
});
