document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    // --- 2. 초기화 실행 ---
    async function initApp() {
        // 저장된 테마/언어 불러오기
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('language') || 'en';

        // 테마 적용 (translations.js의 setTheme 호출)
        if (window.setTheme) {
            window.setTheme(savedTheme);
        } else {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // 언어 적용 (비동기 완료 대기)
        await applyLang(savedLang);

        // 데이터 로드
        await fetchDataAndRender();
        
        // 버튼 이벤트 연결
        setupEventListeners();
    }

    // --- 3. 데이터 로드 및 렌더링 ---
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

            // 엑셀 컬럼 매핑 (보내주신 데이터 구조 기준)
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
                    prediction: row[4], // AI Recommendation (PICK)
                    odds: parseFloat(row[3]) || 0,
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0,
                    sampleSize: parseInt(row[11]) || 0
                };
            });

            // 필터링: PICK이 유효하고 ROI >= 1.0, Sample >= 10
            const filteredMatches = allMatches.filter(item => {
                const hasValidPick = item.prediction && item.prediction !== '-' && item.prediction.trim() !== '';
                return hasValidPick && item.roi >= 1.0 && item.sampleSize >= 10;
            });

            analysisList.innerHTML = '';

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:40px;">No matches found matching criteria.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
            
            // 데이터 출력 후 동적으로 생성된 텍스트들을 위해 번역 재적용
            await applyLang(localStorage.getItem('language') || 'en');

        } catch (error) {
            console.error('Data loading error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">Excel file error.</p>`;
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
                    <p data-i18n-key="vipOnlyMessage" style="font-size:0.85rem; color:#888;">High Win Rate (80%+)</p>
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow" style="display:inline-block; margin-top:10px; padding:8px 16px; background:#2563eb; color:#fff; border-radius:5px; text-decoration:none;">Unlock</a>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <strong style="font-size:1.05rem;">${item.match}</strong>
                    <span style="font-size:0.85rem; color:#888;">${item.time}</span>
                </div>
                <div style="background:rgba(128,128,128,0.1); padding:12px; border-radius:8px;">
                    <p style="margin:4px 0;"><strong>Pick:</strong> <span style="color:#2563eb;">${item.prediction}</span></p>
                    <p style="margin:4px 0;"><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="margin:4px 0; font-size:0.8rem; color:#888;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // --- 4. 이벤트 및 보조 함수 ---

    async function applyLang(lang) {
        if (window.applyTranslations) {
            await window.applyTranslations(lang);
        }
    }

    function setupEventListeners() {
        // 테마 토글 (translations.js의 toggleTheme 호출)
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            if (window.toggleTheme) {
                window.toggleTheme();
            }
        });

        // 언어 버튼 (이벤트 위임)
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-lang]');
            if (btn) {
                const lang = btn.getAttribute('data-lang');
                localStorage.setItem('language', lang);
                await applyLang(lang);
            }
        });

        // 로고 관리자 모드
        document.getElementById('logo-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                const pw = prompt('Admin Password?');
                if (pw === ADMIN_PASSWORD) {
                    sessionStorage.setItem('isVip', 'true');
                    location.reload();
                }
                logoClickCount = 0;
            }
        });
    }

    initApp();
});