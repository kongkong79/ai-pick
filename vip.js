document.addEventListener('DOMContentLoaded', () => {
    const vipContent = document.getElementById('vip-content');
    const accessDenied = document.getElementById('access-denied');
    const tableBody = document.querySelector('#vip-table tbody');
    const filePath = 'sports_data.xlsx';

    async function initialize() {
        // VIP status is now stored in sessionStorage by main.js
        const isVip = sessionStorage.getItem('isVip') === 'true';

        if (!isVip) {
            accessDenied.style.display = 'block';
            vipContent.style.display = 'none';
            return;
        }

        accessDenied.style.display = 'none';
        vipContent.style.display = 'block';

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Failed to load sports_data.xlsx');

            const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' });
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            let tableData = jsonData;
            displayTable(tableData);

            // Sorting controls
            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                tableData.sort((a, b) => (b['Hit rate'] || 0) - (a['Hit rate'] || 0));
                displayTable(tableData);
            });

            document.getElementById('sort-by-roi').addEventListener('click', () => {
                tableData.sort((a, b) => (b['Expected ROI'] || 0) - (a['Expected ROI'] || 0));
                displayTable(tableData);
            });

        } catch (error) {
            console.error('Error loading VIP data:', error);
            tableBody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
        }
    }

    function displayTable(data) {
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item['Home Team'] || 'N/A'} vs ${item['Away Team'] || 'N/A'}</td>
                <td>${item['AI Recommendation'] || 'N/A'}</td>
                <td>${(item['Home Odds'] || 0).toFixed(2)}</td>
                <td>${(item['Hit rate'] || 0).toFixed(2)}%</td>
                <td>${(item['Expected ROI'] || 0).toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    initialize();
});
