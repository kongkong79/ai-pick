document.addEventListener('DOMContentLoaded', () => {
    const vipContent = document.getElementById('vip-content');
    const accessDenied = document.getElementById('access-denied');
    const tableBody = document.querySelector('#vip-table tbody');
    const filePath = 'sports_data.xlsx';

    async function initialize() {
        // VIP status is now checked from sessionStorage, set by main.js admin login
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

            // Apply the same base filter as the main page for consistency
            const tableData = jsonData.filter(item => 
                item['Expected ROI'] > 1 &&
                item['Sample Count'] > 10 &&
                item['Hit rate'] > 51
            );

            displayTable(tableData);

            // --- Sorting Controls --- 
            let currentSort = { key: 'Hit rate', order: 'desc' };

            const sortAndDisplay = () => {
                tableData.sort((a, b) => {
                    const valA = a[currentSort.key] || 0;
                    const valB = b[currentSort.key] || 0;
                    return currentSort.order === 'asc' ? valA - valB : valB - valA;
                });
                displayTable(tableData);
            };

            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                currentSort = { key: 'Hit rate', order: 'desc' };
                sortAndDisplay();
            });

            document.getElementById('sort-by-roi').addEventListener('click', () => {
                currentSort = { key: 'Expected ROI', order: 'desc' };
                sortAndDisplay();
            });
            
            // Initial sort
            sortAndDisplay();

        } catch (error) {
            console.error('Error loading VIP data:', error);
            tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
        }
    }

    function displayTable(data) {
        tableBody.innerHTML = '';
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">No matches meet the filter criteria.</td></tr>`;
            return;
        }

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
