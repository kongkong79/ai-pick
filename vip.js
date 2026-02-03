document.addEventListener('DOMContentLoaded', () => {
    const vipContent = document.getElementById('vip-content');
    const accessDenied = document.getElementById('access-denied');
    const isVip = sessionStorage.getItem('isVip') === 'true';

    if (isVip) {
        accessDenied.style.display = 'none';
        vipContent.style.display = 'block';
        loadVipData();
    } else {
        vipContent.style.display = 'none';
        accessDenied.style.display = 'block';
    }

    // Ensure language is set on page load for static elements
    const savedLanguage = localStorage.getItem('language') || 'en';
    if (window.setLanguage) {
        window.setLanguage(savedLanguage);
    }
});

function loadVipData() {
    const filePath = 'sports_data.xlsx';
    fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            
            const filteredData = jsonData.filter(item => 
                item['Expected ROI'] > 1 &&
                item['Sample Count'] > 10 &&
                item['Hit rate'] > 51
            );

            let currentSort = 'hit-rate'; // or 'roi'
            renderTable(filteredData, currentSort);

            document.getElementById('sort-by-hit-rate').addEventListener('click', () => {
                currentSort = 'hit-rate';
                renderTable(filteredData, currentSort);
            });

            document.getElementById('sort-by-roi').addEventListener('click', () => {
                currentSort = 'roi';
                renderTable(filteredData, currentSort);
            });
        });
}

function renderTable(data, sortBy) {
    const tableBody = document.querySelector('#vip-table tbody');
    tableBody.innerHTML = ''; // Clear existing data

    const sortedData = [...data].sort((a, b) => {
        if (sortBy === 'hit-rate') {
            return b['Hit rate'] - a['Hit rate'];
        } else { // roi
            return b['Expected ROI'] - a['Expected ROI'];
        }
    });

    if (sortedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" data-i18n-key="vipNoMatches">No matches meet the filter criteria.</td></tr>`;
    } else {
        sortedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item['Home Team']} vs ${item['Away Team']}</td>
                <td>${item['AI Recommendation']}</td>
                <td>${item['Home Odds'].toFixed(2)}</td>
                <td>${item['Hit rate'].toFixed(2)}%</td>
                <td>${item['Expected ROI'].toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    // Re-apply translation after rendering dynamic content
    if(window.setLanguage) {
        window.setLanguage(localStorage.getItem('language') || 'en');
    }
}
