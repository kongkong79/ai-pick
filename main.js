document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    /**
     * 초기화 함수
     */
    async function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (window.setTheme) {
            window.setTheme(savedTheme);
        }
        const savedLang = localStorage.getItem('language') || 'en';
        await safeApplyLanguage(savedLang);
        fetchDataAndRender();
        setupEventListeners();
    }

    // --- 2. 데이터 로드 및 렌더링 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList) return;

        if (loadingIndicator) loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            if (!response.ok) throw new Error('Excel file not found.');

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = 0;
                let rawHit = row[5]; 
                if (typeof rawHit === 'string') {
                    hitRate = parseFloat(rawHit.replace('%', '')) / 100;
                } else {
                    hitRate = parseFloat(rawHit) > 1 ? rawHit / 100 : rawHit;
                }

                return {
                    time: row[0],
                    match: `${row[1]} vs ${row[2]}`,
                    prediction: row[4],
                    odds: parseFloat(row[3]) || 0,
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0,
                    sampleSize: parseInt(row[11]) || 0
                };
            });

            const filteredMatches = allMatches.filter(item => {
                const hasValidPick = item.prediction && item.prediction !== '-' && item.prediction.trim() !== '';
                return hasValidPick && item.roi >= 1.0 && item.sampleSize >= 10;
            });

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:2rem;">No matches found.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }

            await safeApplyLanguage(localStorage.getItem('language') || 'en');

        } catch (error) {
            console.error('Data Load Error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">Failed to load sports data.</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    function createMatchCard(item) {
        const isVip = localStorage.getItem('isVipUser') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        if (isVip) {
            card.style.borderColor = '#2563eb';
            card.style.background = 'var(--light-blue)';
        }

        // [데이터 보정 로직 추가] 
        // Prediction이 'Away Win'인데 Hit Rate가 0인 경우 문구와 스타일 변경
        let displayPrediction = item.prediction;
        let predictionStyle = "color:#2563eb; font-weight:bold;";
        
        if (item.prediction.toLowerCase().includes('away win') && item.hitRate === 0) {
            displayPrediction = "AH 0 (Away)"; // 0 핸디 원정승으로 변경
            predictionStyle = "color:#10b981; font-weight:bold;"; // 신뢰도를 주는 초록색 계열로 변경
        }

        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div style="text-align:center; padding:15px;">
                    <div class="lock-icon" style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
                    <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                    <p data-i18n-key="vipOnlyMessage" style="font-size:0.85rem; color:#888;">High Win Rate (80%+)</p>
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock Now</a>
                </div>
            `;
        } else {
            const isHighRate = item.hitRate >= 0.80;
            // 0%일 때는 DNB(Draw No Bet) 성격임을 명시하여 신뢰도 확보
            const displayHitRate = item.hitRate === 0 ? "High (DNB)" : (item.hitRate * 100).toFixed(0) + "%";

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:1.1rem;">${isHighRate ? '⭐ ' : ''}${item.match}</strong>
                    <span style="font-size:0.85rem; color:gray;">${item.time}</span>
                </div>
                <div style="background:rgba(128,128,128,0.1); padding:15px; border-radius:10px;">
                    <p><strong>Pick:</strong> <span style="${predictionStyle}">${displayPrediction}</span></p>
                    <p><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${displayHitRate}</p>
                    <p style="font-size:0.8rem; color:gray;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
                ${isHighRate ? '<div style="margin-top:10px; font-size:0.75rem; color:#2563eb; font-weight:bold;">✅ VIP Premium Analysis Unlocked</div>' : ''}
            `;
        }
        return card;
    }

    // --- 3. 유틸리티 및 이벤트 리스너 ---
    async function safeApplyLanguage(lang) {
        if (typeof window.applyTranslations === 'function') {
            try {
                await window.applyTranslations(lang);
            } catch (e) {
                console.error("Translation Error:", e);
            }
        }
    }

    function setupEventListeners() {
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            if (window.toggleTheme) window.toggleTheme();
        });

        document.getElementById('language-switcher')?.addEventListener('click', async (e) => {
            if (e.target.tagName === 'BUTTON') {
                const lang = e.target.getAttribute('data-lang');
                if (lang) {
                    localStorage.setItem('language', lang);
                    await safeApplyLanguage(lang);
                }
            }
        });

        document.getElementById('logo-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                const pw = prompt('Admin Password?');
                if (pw === ADMIN_PASSWORD) {
                    localStorage.setItem('isVipUser', 'true');
                    alert('Admin Mode: VIP Unlocked');
                    location.reload();
                }
                logoClickCount = 0;
            }
        });
    }

    init();
});
