document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 관리 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    // --- 2. 초기화 실행 (페이지 로드 시 가장 먼저 실행) ---
    function init() {
        // [테마 설정] 저장된 테마 불러오기
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // [언어 설정] 저장된 언어 불러오기
        const savedLang = localStorage.getItem('language') || 'en';
        applyLanguage(savedLang);

        // 데이터 로드 실행
        fetchDataAndRender();
        
        // 이벤트 리스너 연결
        setupEventListeners();
    }

    // --- 3. 핵심 기능: 데이터 불러오기 및 화면 표시 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;

        analysisList.innerHTML = '<p style="text-align:center;">Loading...</p>';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 데이터 가공 (엑셀 컬럼 인덱스 맞춤)
            const allMatches = jsonData.slice(1).map(row => {
                let hitRate = 0;
                let rawHit = row[5]; // F열: Hit rate
                if (typeof rawHit === 'string') {
                    hitRate = parseFloat(rawHit.replace('%', '')) / 100;
                } else {
                    hitRate = parseFloat(rawHit) > 1 ? rawHit / 100 : rawHit;
                }

                return {
                    time: row[0], // A열: Time
                    match: `${row[1]} vs ${row[2]}`, // B vs C
                    prediction: row[4], // E열: AI Recommendation
                    odds: parseFloat(row[3]) || 0, // D열: Odds
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0, // K열: Expected ROI
                    sampleSize: parseInt(row[11]) || 0 // L열: Sample Count
                };
            });

            // 필터링: ROI 1.0 이상, 표본 10 이상, PICK이 있는 것만
            const filteredMatches = allMatches.filter(item => {
                const hasValidPick = item.prediction && item.prediction !== '-' && item.prediction.trim() !== '';
                return hasValidPick && item.roi >= 1.0 && item.sampleSize >= 10;
            });

            analysisList.innerHTML = '';

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:20px;">No matches found matching criteria.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Data loading error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">Excel file error. Please check sports_data.xlsx</p>`;
        } finally {
            // 데이터 출력 후 번역 재적용
            const currentLang = localStorage.getItem('language') || 'en';
            applyLanguage(currentLang);
        }
    }

    // 경기 카드 UI 생성
    function createMatchCard(item) {
        const isVip = sessionStorage.getItem('isVip') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        // 승률 80% 이상 VIP 전용 잠금
        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div class="lock-icon" style="font-size: 2rem; margin-bottom: 10px; text-align:center;">🔒</div>
                <h3 data-i18n-key="vipExclusive" style="text-align:center;">VIP Exclusive</h3>
                <p data-i18n-key="vipOnlyMessage" style="text-align:center; font-size:0.9rem;">Hit Rate 80%+</p>
                <div style="text-align:center; margin-top:10px;">
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock with VIP Code</a>
                </div>
            `;
        } else {
            card.style.textAlign = 'left';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:1.1rem; color:var(--text-color);">${item.match}</strong>
                    <span style="color:#888; font-size:0.85rem;">${item.time}</span>
                </div>
                <div style="background:rgba(128,128,128,0.1); padding:12px; border-radius:8px;">
                    <p style="margin:5px 0;"><strong>Pick:</strong> <span style="color:#2563eb;">${item.prediction}</span></p>
                    <p style="margin:5px 0;"><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="margin:5px 0; font-size:0.8rem; color:#666;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // --- 4. 이벤트 및 보조 기능 ---

    function setupEventListeners() {
        // [로고 클릭] 5번 클릭 시 관리자 모드
        document.getElementById('logo-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                const pw = prompt('Admin Password?');
                if (pw === ADMIN_PASSWORD) {
                    sessionStorage.setItem('isVip', 'true');
                    alert('Admin/VIP access granted!');
                    location.reload();
                }
                logoClickCount = 0;
            }
        });

        // [테마 토글]
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // [언어 버튼] 모든 언어 버튼에 이벤트 연결
        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = btn.getAttribute('data-lang');
                if (lang) {
                    localStorage.setItem('language', lang);
                    applyLanguage(lang);
                }
            });
        });
    }

    // 언어 적용 함수 (translations.js 연동)
    function applyLanguage(lang) {
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(lang);
        } else if (typeof applyTranslations === 'function') {
            applyTranslations(lang);
        }
    }

    // 실행 시작
    init();
});