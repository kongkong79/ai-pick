document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 관리 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    // --- 2. 초기화 (테마 및 언어) ---
    function initApp() {
        // 테마 설정 복구
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // 언어 설정 복구 (최우선 실행)
        const savedLang = localStorage.getItem('language') || 'en';
        applyLanguage(savedLang);

        // 데이터 로드 및 이벤트 연결
        fetchDataAndRender();
        setupEventListeners();
    }

    // --- 3. 데이터 로드 및 필터링 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;

        analysisList.innerHTML = '<div style="text-align:center; padding:20px;">Loading Data...</div>';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = 0;
                let rawHit = row[5]; // Hit rate 열
                if (typeof rawHit === 'string') {
                    hitRate = parseFloat(rawHit.replace('%', '')) / 100;
                } else {
                    hitRate = parseFloat(rawHit) > 1 ? rawHit / 100 : rawHit;
                }

                return {
                    time: row[0],
                    match: `${row[1]} vs ${row[2]}`,
                    prediction: row[4], // AI Recommendation
                    odds: parseFloat(row[3]) || 0,
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0, // K열: ROI
                    sampleSize: parseInt(row[11]) || 0 // L열: Sample
                };
            });

            // 필터링: PICK이 '-'이 아니고, ROI >= 1.0, Sample >= 10
            const filteredMatches = allMatches.filter(item => {
                const hasValidPick = item.prediction && item.prediction !== '-' && item.prediction.trim() !== '';
                return hasValidPick && item.roi >= 1.0 && item.sampleSize >= 10;
            });

            analysisList.innerHTML = '';

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:40px;">No matches found.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Data loading error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red; padding:20px;">Error: Could not load sports_data.xlsx</p>`;
        } finally {
            // 데이터 로드 후 번역 다시 적용 (데이터가 새로 생겼으므로)
            applyLanguage(localStorage.getItem('language') || 'en');
        }
    }

    function createMatchCard(item) {
        const isVip = sessionStorage.getItem('isVip') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div style="text-align:center; padding:15px;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
                    <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                    <p data-i18n-key="vipOnlyMessage" style="font-size:0.85rem; color:#666;">High Win Rate (80%+)</p>
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow" style="display:inline-block; margin-top:10px; padding:8px 16px; background:#2563eb; color:#fff; border-radius:5px; text-decoration:none;">Unlock</a>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <strong style="font-size:1.05rem;">${item.match}</strong>
                    <span style="font-size:0.85rem; color:#888;">${item.time}</span>
                </div>
                <div style="background:rgba(128,128,128,0.08); padding:12px; border-radius:8px;">
                    <p style="margin:4px 0;"><strong>Pick:</strong> <span style="color:#2563eb;">${item.prediction}</span></p>
                    <p style="margin:4px 0;"><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="margin:4px 0; font-size:0.8rem; color:#666;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // --- 4. 이벤트 연결 (중요: 언어 버튼 포함) ---
    function setupEventListeners() {
        // 로고 클릭 (관리자 모드)
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

        // 테마 모드 토글
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // 언어 버튼 클릭 (이벤트 위임 방식 - 가장 확실함)
        document.addEventListener('click', (e) => {
            const langBtn = e.target.closest('[data-lang]');
            if (langBtn) {
                const lang = langBtn.getAttribute('data-lang');
                localStorage.setItem('language', lang);
                applyLanguage(lang);
            }
        });
    }

    // translations.js와 연동하는 핵심 함수
    function applyLanguage(lang) {
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(lang);
        }
    }

    initApp();
});