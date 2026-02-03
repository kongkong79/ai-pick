document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results-container');
    const filePath = 'sports_data.xlsx';

    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get('access_code');
    const isVip = accessCode === 'MGB_ADMIN';

    const translations = {
        en: {
            appTitle: "Sports Betting Analysis",
            headerTitle: "Sports Betting Analysis",
            headerSubtitle: "Harness the power of AI for smarter sports betting. We provide free, data-driven predictions to help you make informed decisions.",
            analysisTitle: "Today's Betting Analysis",
            filterDescription: "Showing matches with ROI > 1, Sample Size > 10, and AI Hit Rate > 51%.",
            premiumTitle: "Premium Subscription",
            premiumSubtitle: "Get higher win rate predictions. Access exclusive data from our team of expert analysts.",
            freeTrial: "7-day free trial of our VIP service.",
            subscribeButton: "Subscribe Now",
            navHome: "Home",
            navAbout: "About",
            navContact: "Contact",
            navPrivacy: "Privacy",
            navVip: "VIP",
            footerText: "© 2024 Sports Betting Analysis. All rights reserved.",
            aiPrediction: "AI Prediction:",
            odds: "Odds",
            hitRate: "Hit Rate",
            tableRoi: "ROI",
            loading: "Loading data...",
            error: "Error loading data. Please try again later.",
            noMatches: "No matches meet the free criteria today. Check back later or subscribe to VIP for more predictions.",
            lockedPrediction: "VIP Exclusive Prediction",
            lockedMessage: "This prediction is available for VIP members only.",
            // ... other pages
        },
        ko: {
            appTitle: "스포츠 베팅 분석",
            headerTitle: "스포츠 베팅 분석",
            headerSubtitle: "AI의 힘을 활용하여 더 현명한 스포츠 베팅을 경험하세요. 데이터 기반 예측을 무료로 제공하여 정보에 입각한 결정을 내릴 수 있도록 돕습니다.",
            analysisTitle: "오늘의 베팅 분석",
            filterDescription: "ROI > 1, 샘플 수 > 10, AI 적중률 > 51%인 경기만 표시합니다.",
            premiumTitle: "프리미엄 구독",
            premiumSubtitle: "더 높은 승률의 예측을 받아보세요. 전문 분석가 팀의 독점 데이터에 액세스할 수 있습니다.",
            freeTrial: "7일 무료 VIP 서비스 체험.",
            subscribeButton: "지금 구독하기",
            navHome: "홈",
            navAbout: "소개",
            navContact: "문의",
            navPrivacy: "개인정보",
            navVip: "VIP",
            footerText: "© 2024 스포츠 베팅 분석. 모든 권리 보유.",
            aiPrediction: "AI 예측:",
            odds: "배당률",
            hitRate: "적중률",
            tableRoi: "수익률",
            loading: "데이터를 불러오는 중입니다...",
            error: "데이터를 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.",
            noMatches: "오늘 무료 기준을 충족하는 경기가 없습니다. 나중에 다시 확인하거나 VIP를 구독하여 더 많은 예측을 확인하세요.",
            lockedPrediction: "VIP 전용 예측",
            lockedMessage: "이 예측은 VIP 회원에게만 제공됩니다.",
        }
    };

    let currentLanguage = 'en';

    function updateTranslations(lang = 'en') {
        currentLanguage = lang;
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            element.textContent = translations[lang][key] || element.textContent;
        });
    }

    document.getElementById('language-switcher').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const lang = event.target.getAttribute('data-lang');
            if (lang) {
                updateTranslations(lang);
            }
        }
    });

    async function loadAndDisplayData() {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = `<p data-i18n-key="loading">${translations[currentLanguage].loading}</p>`;

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Network response was not ok');
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            displayResults(jsonData, isVip);

        } catch (error) {
            console.error('Error loading or parsing Excel file:', error);
            resultsContainer.innerHTML = `<p data-i18n-key="error">${translations[currentLanguage].error}</p>`;
        }
        updateTranslations(currentLanguage);
    }

    function displayResults(data, isVipAccess) {
        resultsContainer.innerHTML = '';
        let hasFreeMatches = false;

        data.forEach(item => {
            const meetsFreeCriteria = item['Expected ROI'] > 1 && item['Sample Count'] > 10 && item['Hit rate'] > 51;

            if (isVipAccess || meetsFreeCriteria) {
                createFullCard(item);
                if (meetsFreeCriteria) hasFreeMatches = true;
            } else {
                createLockedCard();
            }
        });

        if (!isVipAccess && !hasFreeMatches && data.length > 0) {
            resultsContainer.innerHTML = `<p data-i18n-key="noMatches">${translations[currentLanguage].noMatches}</p>`;
        }
        
        if (data.length === 0) {
             resultsContainer.innerHTML = `<p data-i18n-key="noMatches">${translations[currentLanguage].noMatches}</p>`;
        }
    }

    function createFullCard(item) {
        const roi = parseFloat(item['Expected ROI']) || 0;
        const hitRate = parseFloat(item['Hit rate']) || 0;
        const odds = parseFloat(item['Home Odds']) || 0;

        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="card-header">
                 <span class="match-time">${item['Time'] || 'N/A'}</span>
                 <span class="match-league">${item['League'] || 'N/A'}</span>
            </div>
            <div class="card-content">
                <h4>${item['Home Team'] || 'N/A'} vs ${item['Away Team'] || 'N/A'}</h4>
                <p class="prediction">
                    <span data-i18n-key="aiPrediction">${translations[currentLanguage].aiPrediction}</span>
                    <strong>${item['AI Recommendation'] || 'N/A'}</strong>
                </p>
                <div class="stats-grid">
                    <div>
                        <span data-i18n-key="odds">${translations[currentLanguage].odds}</span>
                        <p>${odds.toFixed(2)}</p>
                    </div>
                    <div>
                        <span data-i18n-key="hitRate">${translations[currentLanguage].hitRate}</span>
                        <p>${hitRate.toFixed(2)}%</p>
                    </div>
                    <div>
                        <span data-i18n-key="tableRoi">${translations[currentLanguage].tableRoi}</span>
                        <p>${roi.toFixed(2)}</p>
                    </div>
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
                <div class="lock-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h4 data-i18n-key="lockedPrediction">${translations[currentLanguage].lockedPrediction}</h4>
                <p data-i18n-key="lockedMessage">${translations[currentLanguage].lockedMessage}</p>
                <a href="https://kongkong79.gumroad.com/l/ai-sports-vip" class="btn-subscribe-card" target="_blank" data-i18n-key="subscribeButton">${translations[currentLanguage].subscribeButton}</a>
            </div>
        `;
        resultsContainer.appendChild(card);
    }

    // Theme Toggler
    const themeToggle = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            lightIcon.style.display = 'block';
            darkIcon.style.display = 'none';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'block';
        }
    });
    
    // Initial Load
    updateTranslations(); // Set default language
    loadAndDisplayData(); // Load data from Excel
});
