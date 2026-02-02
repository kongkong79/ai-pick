const translations = {
    en: {
        appTitle: "Sports Betting Analysis",
        headerTitle: "Sports Betting Analysis",
        headerSubtitle: "Harness the power of AI for smarter sports betting. We provide free, data-driven predictions to help you make informed decisions.",
        analysisTitle: "Today's Betting Analysis",
        filterDescription: "Showing matches with ROI > 1, Sample Size > 10, and AI Hit Rate > 51%.",
        premiumTitle: "Premium Subscription",
        premiumSubtitle: "Get higher win rate predictions. Access exclusive data from our team of expert analysts.",
        subscribeButton: "Subscribe Now",
        footerText: "&copy; 2024 Sports Betting Analysis. All rights reserved.",
        cardTime: "Time",
        cardHomeOdds: "Home Odds",
        cardPrediction: "AI Prediction",
        cardProbability: "Hit Rate",
        cardRoi: "Expected ROI",
        noResults: "No matches found matching the criteria.",
        premiumLockTitle: "Premium Prediction",
        premiumLockMessage: "Subscribe to view predictions with over 80% hit rate.",
        toggleTheme: "Toggle Theme",
        navHome: "Home",
        navAbout: "About Us",
        navContact: "Contact",
        navPrivacy: "Privacy Policy"
    },
    ko: {
        appTitle: "스포츠 베팅 분석",
        headerTitle: "스포츠 베팅 분석",
        headerSubtitle: "AI의 힘으로 더 스마트한 스포츠 베팅을 경험하세요. 정보에 기반한 결정을 내릴 수 있도록 데이터 기반 예측을 무료로 제공합니다.",
        analysisTitle: "오늘의 베팅 분석",
        filterDescription: "ROI > 1, 표본수 > 10, AI 적중 확률 > 51%인 경기만 표시합니다.",
        premiumTitle: "프리미엄 구독",
        premiumSubtitle: "더 높은 승률의 예측 정보를 받아보세요. 전문 분석가 팀이 제공하는 독점 데이터에 액세스할 수 있습니다.",
        subscribeButton: "구독하기",
        footerText: "&copy; 2024 스포츠 베팅 분석. 모든 권리 보유.",
        cardTime: "경기 시간",
        cardHomeOdds: "홈팀 배당률",
        cardPrediction: "AI 추천",
        cardProbability: "적중 확률",
        cardRoi: "예상 ROI",
        noResults: "조건에 맞는 경기가 없습니다.",
        premiumLockTitle: "프리미엄 예측",
        premiumLockMessage: "적중률 80% 이상의 예측을 보려면 구독하세요.",
        toggleTheme: "테마 변경",
        navHome: "홈",
        navAbout: "소개",
        navContact: "문의하기",
        navPrivacy: "개인정보처리방침"
    },
    ja: {
        appTitle: "スポーツベッティング分析",
        headerTitle: "スポーツベッティング分析",
        headerSubtitle: "AIの力で、よりスマートなスポーツベッティングを。情報に基づいた意思決定を支援するために、データ駆動型の予測を無料で提供します。",
        analysisTitle: "今日のベッティング分析",
        filterDescription: "ROI > 1, サンプル数 > 10, AI的中確率 > 51%の試合のみ表示します。",
        premiumTitle: "プレミアム購読",
        premiumSubtitle: "より高い勝率の予測情報を入手してください。専門アナリストチームからの独占データにアクセスできます。",
        subscribeButton: "購読する",
        footerText: "&copy; 2024 スポーツベッティング分析. 全著作権所有.",
        cardTime: "試合時間",
        cardHomeOdds: "ホームチームのオッズ",
        cardPrediction: "AI推薦",
        cardProbability: "的中確率",
        cardRoi: "予想ROI",
        noResults: "条件に一致する試合は見つかりませんでした。",
        premiumLockTitle: "プレミアム予測",
        premiumLockMessage: "的中率80%以上の予測を購読して表示します。",
        toggleTheme: "テーマを切り替え",
        navHome: "ホーム",
        navAbout: "概要",
        navContact: "お問い合わせ",
        navPrivacy: "プライバシーポリシー"
    },
    zh: {
        appTitle: "体育博彩分析",
        headerTitle: "体育博彩分析",
        headerSubtitle: "利用AI的力量进行更智能的体育博彩。我们免费提供数据驱动的预测，以帮助您做出明智的决策。",
        analysisTitle: "今日博彩分析",
        filterDescription: "仅显示 ROI > 1、样本量 > 10 且 AI 命中率 > 51% 的比赛。",
        premiumTitle: "高级订阅",
        premiumSubtitle: "获取更高胜率的预测。访问我们专家分析师团队的独家数据。",
        subscribeButton: "立即订阅",
        footerText: "&copy; 2024 体育博彩分析. 版权所有.",
        cardTime: "比赛时间",
        cardHomeOdds: "主队赔率",
        cardPrediction: "AI推荐",
        cardProbability: "命中率",
        cardRoi: "预期ROI",
        noResults: "未找到符合条件的比赛。",
        premiumLockTitle: "高级预测",
        premiumLockMessage: "订阅以查看命中率超过80%的预测。",
        toggleTheme: "切换主题",
        navHome: "首页",
        navAbout: "关于我们",
        navContact: "联系我们",
        navPrivacy: "隐私政策"
    }
};

let currentLanguage = 'en';
let currentTheme = 'light';

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n-key]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-key');
        if (translations[lang] && translations[lang][key]) {
            elem.innerHTML = translations[lang][key];
        }
    });
    loadAndDisplayExcelData();
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
}

class BettingResultCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const isLocked = this.hasAttribute('locked');
        const t = translations[currentLanguage] || translations.en;

        const time = this.getAttribute('time');
        const homeTeam = this.getAttribute('home-team');
        const awayTeam = this.getAttribute('away-team');
        const prediction = this.getAttribute('prediction');
        const homeOdds = this.getAttribute('home-odds');
        const probability = this.getAttribute('probability');
        const roi = this.getAttribute('roi');

        let cardContent;

        if (isLocked) {
            cardContent = `
                <div class="card locked">
                    <div class="lock-overlay">
                        <span class="lock-icon">🔒</span>
                        <h3>${t.premiumLockTitle}</h3>
                        <p>${t.premiumLockMessage}</p>
                    </div>
                    <p><strong>${t.cardTime}:</strong> ${time}</p>
                    <h3>${homeTeam} vs ${awayTeam}</h3>
                     <div class="details blurred">
                        <p><strong>${t.cardPrediction}:</strong> ???</p>
                        <p><strong>${t.cardHomeOdds}:</strong> ${homeOdds}</p>
                        <p><strong>${t.cardProbability}:</strong> > 80%</p>
                        <p><strong>${t.cardRoi}:</strong> ???</p>
                    </div>
                </div>
            `;
        } else {
            cardContent = `
                <div class="card">
                    <p><strong>${t.cardTime}:</strong> ${time}</p>
                    <h3>${homeTeam} vs ${awayTeam}</h3>
                    <div class="details">
                        <p><strong>${t.cardPrediction}:</strong> ${prediction}</p>
                        <p><strong>${t.cardHomeOdds}:</strong> ${homeOdds}</p>
                        <p><strong>${t.cardProbability}:</strong> ${probability}</p>
                        <p><strong>${t.cardRoi}:</strong> ${roi}</p>
                    </div>
                </div>
            `;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .card { position: relative; background-color: var(--primary-color, #ffffff); border-radius: 8px; padding: 1.5rem; border-left: 5px solid var(--accent-color, #007bff); box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.3s ease, border-color 0.3s ease; }
                .card:hover { transform: translateY(-5px); box-shadow: 0 8px 12px rgba(0,0,0,0.15); }
                h3, p { margin: 0; color: var(--text-color, #333); transition: color 0.3s ease;}
                h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
                p { font-size: 1rem; margin-bottom: 0.3rem; line-height: 1.4; }
                .details { margin-top: 0.75rem; border-top: 1px solid var(--border-color, #dee2e6); padding-top: 0.75rem; transition: border-color 0.3s ease; }
                .card.locked { border-left-color: var(--pending-color, #ffc107); }
                .lock-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; z-index: 10; border-radius: 8px; }
                [data-theme="dark"] .lock-overlay { background: rgba(0, 0, 0, 0.7); }
                .lock-icon { font-size: 2.5rem; }
                .blurred { filter: blur(5px); user-select: none; }
            </style>
            ${cardContent}
        `;
    }
}

customElements.define('betting-result-card', BettingResultCard);

async function loadAndDisplayExcelData() {
    const container = document.getElementById('results-container');
    const filterDesc = document.getElementById('filter-description');
    container.innerHTML = '';
    const t = translations[currentLanguage] || translations.en;
    if(filterDesc) filterDesc.innerHTML = t.filterDescription;

    try {
        const response = await fetch('./today.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { cellDates: true });

        const filteredData = jsonData.filter(row => {
            const roi = parseFloat(row['Expected ROI']); 
            const sampleSize = parseInt(row['Sample Count'], 10);
            const hitRate = parseFloat(row['Hit rate']);
            return roi > 1 && sampleSize > 10 && hitRate > 51;
        });

        if (filteredData.length === 0) {
            container.innerHTML = `<p class="no-results">${t.noResults}</p>`;
            return;
        }

        filteredData.forEach(row => {
            const card = document.createElement('betting-result-card');
            const hitRate = parseFloat(row['Hit rate']);

            if (hitRate > 80) {
                card.setAttribute('locked', 'true');
            }

            let timeStr = 'N/A';
            const timeVal = row['Time'];

            if (timeVal instanceof Date) {
                timeStr = timeVal.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else if (typeof timeVal === 'number' && timeVal > 0 && timeVal < 1) {
                const totalMinutes = Math.floor(timeVal * 1440);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            } else if (timeVal) { 
                timeStr = String(timeVal);
            }

            card.setAttribute('time', timeStr);
            card.setAttribute('home-team', row['Home Team'] || 'N/A');
            card.setAttribute('away-team', row['Away Team'] || 'N/A');
            card.setAttribute('prediction', row['AI Recommendation'] || 'N/A');
            card.setAttribute('home-odds', row['Home Odds'] || 'N/A');
            card.setAttribute('probability', row['Hit rate'] || 'N/A');
            card.setAttribute('roi', row['Expected ROI'] || 'N/A');
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading or processing excel file:', error);
        container.innerHTML = `<p style="color: var(--loss-color);">Failed to load data. Please check the file and its headers.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyInitialTheme();

    const initialLang = navigator.language.split('-')[0];
    setLanguage(translations[initialLang] ? initialLang : 'en');

    document.getElementById('language-switcher').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const lang = e.target.getAttribute('data-lang');
            if (lang) setLanguage(lang);
        }
    });

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    document.getElementById('subscribe-button').addEventListener('click', () => {
        alert('Subscription feature is currently under development. Coming soon!');
    });
});
