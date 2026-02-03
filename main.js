document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const resultsContainer = document.getElementById('results-container');
    const filePath = 'sports_data.xlsx';

    // --- I18N Translation Data ---
    const translations = {
        en: {
            appTitle: "Sports Betting Analysis",
            headerTitle: "Sports Betting Analysis",
            headerSubtitle: "Harness the power of AI for smarter sports betting. We provide free, data-driven predictions to help you make informed decisions.",
            analysisTitle: "Today's Betting Analysis",
            filterDescription: "Showing matches with ROI > 1, Sample Size > 10, and AI Hit Rate > 51%.",
            premiumTitle: "Premium Subscription",
            subscribeButton: "Subscribe Now",
            navHome: "Home", navAbout: "About", navContact: "Contact", navPrivacy: "Privacy", navVip: "VIP",
            footerText: "© 2024 Sports Betting Analysis. All rights reserved.",
            aiPrediction: "AI Prediction:", odds: "Odds", hitRate: "Hit Rate", tableRoi: "ROI",
            loading: "Loading match data, please wait...",
            error: "Error loading data. Please try again later.",
            noMatches: "No free matches today. Subscribe for full access.",
            lockedPrediction: "VIP Exclusive Prediction",
            lockedMessage: "This prediction is for VIP members only.",
        },
        ko: {
            appTitle: "스포츠 베팅 분석",
            headerTitle: "스포츠 베팅 분석",
            headerSubtitle: "AI의 힘으로 더 현명한 스포츠 베팅을 경험하세요. 데이터 기반 예측을 무료로 제공합니다.",
            analysisTitle: "오늘의 베팅 분석",
            filterDescription: "ROI > 1, 샘플 수 > 10, AI 적중률 > 51% 경기 표시 중",
            premiumTitle: "프리미엄 구독",
            subscribeButton: "지금 구독하기",
            navHome: "홈", navAbout: "소개", navContact: "문의", navPrivacy: "개인정보", navVip: "VIP",
            footerText: "© 2024 스포츠 베팅 분석. 모든 권리 보유.",
            aiPrediction: "AI 예측:", odds: "배당률", hitRate: "적중률", tableRoi: "수익률",
            loading: "경기 데이터를 불러오는 중입니다...",
            error: "데이터 로딩 오류. 나중에 다시 시도해주세요.",
            noMatches: "오늘의 무료 경기가 없습니다. 전체 액세스를 위해 구독하세요.",
            lockedPrediction: "VIP 전용 예측",
            lockedMessage: "이 예측은 VIP 회원 전용입니다.",
        },
        ja: {
            appTitle: "スポーツベッティング分析",
            headerTitle: "スポーツベッティング分析",
            headerSubtitle: "AIの力で、より賢いスポーツベッティングを。データに基づいた予測を無料で提供します。",
            analysisTitle: "今日のベッティング分析",
            filterDescription: "ROI > 1, サンプル数 > 10, AIヒット率 > 51% の試合を表示中",
            premiumTitle: "プレミアムサブスクリプション",
            subscribeButton: "今すぐ購読",
            navHome: "ホーム", navAbout: "概要", navContact: "お問い合わせ", navPrivacy: "プライバシー", navVip: "VIP",
            footerText: "© 2024 スポーツベッティング分析. 全著作権所有.",
            aiPrediction: "AI予測:", odds: "オッズ", hitRate: "ヒット率", tableRoi: "ROI",
            loading: "試合データを読み込んでいます...",
            error: "データ読み込みエラー。後でもう一度お試しください。",
            noMatches: "今日の無料試合はありません。フルアクセスはご購読ください。",
            lockedPrediction: "VIP限定予測",
            lockedMessage: "この予測はVIPメンバー専用です。",
        },
        zh: {
            appTitle: "体育博彩分析",
            headerTitle: "体育博彩分析",
            headerSubtitle: "利用AI的力量进行更智能的体育博彩。我们免费提供数据驱动的预测。",
            analysisTitle: "今日博彩分析",
            filterDescription: "显示 ROI > 1, 样本量 > 10, AI 命中率 > 51% 的比赛",
            premiumTitle: "高级订阅",
            subscribeButton: "立即订阅",
            navHome: "首页", navAbout: "关于", navContact: "联系", navPrivacy: "隐私", navVip: "VIP",
            footerText: "© 2024 体育博彩分析. 版权所有.",
            aiPrediction: "AI预测:", odds: "赔率", hitRate: "命中率", tableRoi: "投资回报率",
            loading: "正在加载比赛数据...",
            error: "数据加载出错。请稍后重试。",
            noMatches: "今天没有免费比赛。订阅以获得完全访问权限。",
            lockedPrediction: "VIP独家预测",
            lockedMessage: "此预测仅供VIP会员使用。",
        }
    };
    let currentLanguage = 'en';

    function setLanguage(lang) {
        currentLanguage = lang;
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            const translation = translations[lang]?.[key] || translations['en'][key];
            if (translation) element.textContent = translation;
        });
    }

    // --- Main Initialization Logic ---
    async function initialize() {
        // 1. Check for VIP status
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('access_code') && urlParams.get('access_code') === 'MGB_ADMIN') {
            sessionStorage.setItem('isVip', 'true');
        }
        const isVip = sessionStorage.getItem('isVip') === 'true';

        // 2. Setup UI controls
        setupThemeToggle();
        setupLanguageSwitcher();

        // 3. Load and display data
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `<p data-i18n-key="loading">${translations.en.loading}</p>`;
        setLanguage(localStorage.getItem('language') || 'en');

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Failed to load sports_data.xlsx');

            const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' });
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            displayResults(jsonData, isVip);
        } catch (error) {
            console.error('Error during initialization:', error);
            resultsContainer.innerHTML = `<p data-i18n-key="error" style="color: red;">${translations[currentLanguage].error}</p>`;
            setLanguage(currentLanguage);
        }
    }

    function displayResults(data, isVip) {
        resultsContainer.innerHTML = '';
        if (!data || data.length === 0) {
            resultsContainer.innerHTML = `<p data-i18n-key="noMatches"></p>`;
            setLanguage(currentLanguage);
            return;
        }

        data.forEach(item => {
            const isFree = item['Expected ROI'] > 1 && item['Sample Count'] > 10 && item['Hit rate'] > 51;
            if (isVip || isFree) {
                createFullCard(item);
            } else {
                createLockedCard();
            }
        });
        setLanguage(currentLanguage); // Apply translations after rendering cards
    }

    // --- Card Creation ---
    function createFullCard(item) {
        const league = item['League'] ? `<span class="match-league">${item['League']}</span>` : '';
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="match-time">${item['Time'] || ''}</span>
                ${league}
            </div>
            <div class="card-content">
                <h4>${item['Home Team'] || 'N/A'} vs ${item['Away Team'] || 'N/A'}</h4>
                <p class="prediction"><span data-i18n-key="aiPrediction"></span>: <strong>${item['AI Recommendation'] || 'N/A'}</strong></p>
                <div class="stats-grid">
                    <div><span data-i18n-key="odds"></span><p>${(item['Home Odds'] || 0).toFixed(2)}</p></div>
                    <div><span data-i18n-key="hitRate"></span><p>${(item['Hit rate'] || 0).toFixed(2)}%</p></div>
                    <div><span data-i18n-key="tableRoi"></span><p>${(item['Expected ROI'] || 0).toFixed(2)}</p></div>
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
                <h4 data-i18n-key="lockedPrediction"></h4>
                <p data-i18n-key="lockedMessage"></p>
                <a href="https://kongkong79.gumroad.com/l/ai-sports-vip" class="btn-subscribe-card" target="_blank" data-i18n-key="subscribeButton"></a>
            </div>
        `;
        resultsContainer.appendChild(card);
    }

    // --- UI Control Setup ---
    function setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        const savedTheme = localStorage.getItem('theme') || 'light';

        document.documentElement.setAttribute('data-theme', savedTheme);
        lightIcon.style.display = savedTheme === 'dark' ? 'none' : 'block';
        darkIcon.style.display = savedTheme === 'dark' ? 'block' : 'none';

        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            lightIcon.style.display = theme === 'dark' ? 'none' : 'block';
            darkIcon.style.display = theme === 'dark' ? 'block' : 'none';
        });
    }

    function setupLanguageSwitcher() {
        document.getElementById('language-switcher').addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const lang = event.target.getAttribute('data-lang');
                if (lang) {
                    setLanguage(lang);
                    localStorage.setItem('language', lang);
                }
            }
        });
    }

    // --- Start Application ---
    initialize();
});
