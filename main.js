document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    // --- 2. 언어 변환 핵심 함수 (가장 먼저 정의) ---
    function applyLanguage(lang) {
        if (!lang) return;
        
        console.log("Applying Language:", lang);
        
        // 1. translations.js의 전역 함수 호출 시도
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(lang);
        } else if (typeof applyTranslations === 'function') {
            applyTranslations(lang);
        } else {
            console.error("translations.js를 찾을 수 없거나 applyTranslations 함수가 없습니다.");
        }
        
        // 2. 버튼 활성화 상태 표시 (UI 피드백)
        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    }

    // --- 3. 초기화 (테마 및 언어 즉시 적용) ---
    function initApp() {
        // 테마 복구
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // 언어 복구
        const savedLang = localStorage.getItem('language') || 'en';
        applyLanguage(savedLang);

        // 데이터 로드 및 이벤트 리스너 연결
        fetchDataAndRender();
        setupEventListeners();
    }

    // --- 4. 데이터 로드 및 렌더링 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;

        analysisList.innerHTML = '<div style="text-align:center; padding:20px;">Loading...</div>';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
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

            analysisList.innerHTML = '';

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:40px;">No matches found.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Data Error:', error);
        } finally {
            // 데이터 로드 후 한 번 더 번역 적용
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
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock</a>
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

    // --- 5. 이벤트 리스너 설정 ---
    function setupEventListeners() {
        // [테마]
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // [언어] - 클릭 이벤트 가로채기 (이벤트 위임)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-lang]');
            if (btn) {
                const lang = btn.getAttribute('data-lang');
                console.log("Language Button Clicked:", lang);
                localStorage.setItem('language', lang);
                applyLanguage(lang);
            }
        });

        // [로고] 관리자 접속
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