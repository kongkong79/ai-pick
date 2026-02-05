document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 관리 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    /**
     * 초기 실행 함수
     * 테마와 언어를 설정하고 데이터를 불러옵니다.
     */
    async function init() {
        // [테마 초기화]
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (window.setTheme) {
            window.setTheme(savedTheme);
        } else {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // [언어 초기화] 번역 파일 로드를 기다립니다.
        const savedLang = localStorage.getItem('language') || 'en';
        await safeApplyLanguage(savedLang);

        // [데이터 로드]
        fetchDataAndRender();
        
        // [이벤트 연결]
        setupEventListeners();
    }

    // --- 2. 핵심 기능: 데이터 불러오기 및 렌더링 ---

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

            // 데이터 가공 (엑셀 컬럼 위치: Time(0), Home(1), Away(2), Odds(3), Rec(4), Hit(5)...)
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
                    prediction: row[4], // AI Recommendation (PICK)
                    odds: parseFloat(row[3]) || 0,
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0, // K열
                    sampleSize: parseInt(row[11]) || 0 // L열
                };
            });

            // 필터링: PICK이 있고, ROI >= 1.0, Sample >= 10
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

            // 데이터 로드 후 동적 텍스트 번역 재적용
            await safeApplyLanguage(localStorage.getItem('language') || 'en');

        } catch (error) {
            console.error('Error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">Data Load Error.</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    function createMatchCard(item) {
        const isVip = sessionStorage.getItem('isVip') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        // 승률 80% 이상 VIP 잠금 로직
        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div style="text-align:center; padding:15px;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
                    <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                    <p data-i18n-key="vipOnlyMessage" style="font-size:0.85rem; color:var(--text-muted);">High Win Rate (80%+)</p>
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow" style="display:inline-block; margin-top:10px; padding:10px 20px; background:var(--primary-color); color:#fff; border-radius:5px; text-decoration:none;">Unlock Now</a>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:1.1rem;">${item.match}</strong>
                    <span style="font-size:0.85rem; color:gray;">${item.time}</span>
                </div>
                <div style="background:rgba(128,128,128,0.1); padding:15px; border-radius:10px;">
                    <p style="margin:5px 0;"><strong>Pick:</strong> <span style="color:#2563eb;">${item.prediction}</span></p>
                    <p style="margin:5px 0;"><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="margin:5px 0; font-size:0.8rem; color:gray;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // --- 3. 이벤트 리스너 및 보조 기능 ---

    async function safeApplyLanguage(lang) {
        if (window.applyTranslations) {
            await window.applyTranslations(lang);
        }
    }

    function setupEventListeners() {
        // [테마 전환]
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            if (window.toggleTheme) window.toggleTheme();
        });

        // [언어 전환]
        document.getElementById('language-switcher')?.addEventListener('click', async (e) => {
            if (e.target.tagName === 'BUTTON') {
                const lang = e.target.getAttribute('data-lang');
                if (lang) {
                    localStorage.setItem('language', lang);
                    await safeApplyLanguage(lang);
                }
            }
        });

        // [로고 클릭 관리자]
        document.getElementById('logo-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                const pw = prompt('Admin Password?');
                if (pw === ADMIN_PASSWORD) {
                    sessionStorage.setItem('isVip', 'true');
                    alert('VIP Mode Activated');
                    location.reload();
                }
                logoClickCount = 0;
            }
        });
    }

    // 초기화 시작
    init();
});