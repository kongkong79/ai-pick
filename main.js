document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results-container');
    const filePath = 'sports_data.xlsx';

    async function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const accessCode = urlParams.get('access_code');
        const isVip = accessCode === 'MGB_ADMIN';

        console.log(`Final Check: Is User VIP? ${isVip}`);

        if (!resultsContainer) {
            console.error('CRITICAL: results-container not found.');
            return;
        }

        resultsContainer.innerHTML = `<p>Loading match data...</p>`;

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Could not load sports_data.xlsx.');
            
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            displayResults(jsonData, isVip);

        } catch (error) {
            console.error('Error during initialization:', error);
            resultsContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function displayResults(data, isVipAccess) {
        resultsContainer.innerHTML = ''; 

        if (!data || data.length === 0) {
            resultsContainer.innerHTML = `<p>No match data available.</p>`;
            return;
        }

        if (isVipAccess) {
            console.log('VIP PATH: Displaying all matches.');
            data.forEach(item => createFullCard(item));
        } else {
            console.log('NORMAL USER PATH: Filtering matches.');
            const freeMatches = data.filter(item => 
                item['Expected ROI'] > 1 && item['Sample Count'] > 10 && item['Hit rate'] > 51
            );
            const premiumMatches = data.filter(item => 
                !(item['Expected ROI'] > 1 && item['Sample Count'] > 10 && item['Hit rate'] > 51)
            );

            if (freeMatches.length > 0) {
                freeMatches.forEach(item => createFullCard(item));
            }
            
            // Show a few locked cards to entice users
            const lockedCardsToShow = Math.min(premiumMatches.length, 3);
            for (let i = 0; i < lockedCardsToShow; i++) {
                createLockedCard();
            }

            if (freeMatches.length === 0) {
                 resultsContainer.innerHTML = `<p>No free matches today. Subscribe to VIP for full access.</p>`;
                 // Still show some locked cards
                 premiumMatches.slice(0, 5).forEach(() => createLockedCard());
            }
        }
    }

    function createFullCard(item) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="match-time">${item['Time'] || 'N/A'}</span>
                <span class="match-league">${item['League'] || 'N/A'}</span>
            </div>
            <div class="card-content">
                <h4>${item['Home Team'] || 'N/A'} vs ${item['Away Team'] || 'N/A'}</h4>
                <p class="prediction"><span>AI Prediction:</span> <strong>${item['AI Recommendation'] || 'N/A'}</strong></p>
                <div class="stats-grid">
                    <div><span>Odds</span><p>${(parseFloat(item['Home Odds']) || 0).toFixed(2)}</p></div>
                    <div><span>Hit Rate</span><p>${(parseFloat(item['Hit rate']) || 0).toFixed(2)}%</p></div>
                    <div><span>ROI</span><p>${(parseFloat(item['Expected ROI']) || 0).toFixed(2)}</p></div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    }

    function createLockedCard() {
        const card = document.createElement('div');
        card.className = 'result-card locked';
        card.innerHTML = `
            <div class="card-content">
                <div class="lock-icon"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                <h4>VIP Exclusive Prediction</h4>
                <p>This prediction is available for VIP members only.</p>
                <a href="https://kongkong79.gumroad.com/l/ai-sports-vip" class="btn-subscribe-card" target="_blank">Subscribe Now</a>
            </div>
        `;
        resultsContainer.appendChild(card);
    }
    
    initialize();
});
