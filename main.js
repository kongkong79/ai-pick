document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 ---
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    // --- 2. 초기 실행 (테마 & 언어) ---
    function initApp() {
        // 테마 초기화
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // 언어 초기화
        const savedLang = localStorage.getItem('language') || 'en';
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(savedLang);
        }
    }
    initApp();

    // --- 3. 데이터 로드 및 렌더링 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;

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

            // 필터링: PICK이 있고, ROI 1.0 이상, 표본 10 이상
            const filteredMatches = allMatches.filter(item => {
                const hasValidPick = item.prediction && item.prediction !== '-' && item.prediction.trim() !== '';
                return hasValidPick && item.roi >= 1.0 && item.sampleSize >= 10;
            });

            analysisList.innerHTML = '';

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:20px;">No matches found.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Data Error:', error);
        } finally {
            // 데이터 로드 후 번역 다시 적용
            const currentLang = localStorage.getItem('language') || 'en';
            if (typeof window.applyTranslations === 'function') window.applyTranslations(currentLang);
        }
    }

    function createMatchCard(item) {
        const isVip = sessionStorage.getItem('isVip') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div class="lock-icon" style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
                <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock Now</a>
            `;
        } else {
            card.style.textAlign = 'left';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${item.match}</strong>
                    <span style="color:#666; font-size:0.9rem;">${item.time}</span>
                </div>
                <div style="background:rgba(0,0,0,0.05); padding:15px; border-radius:10px;">
                    <p><strong>Pick:</strong> ${item.prediction}</p>
                    <p><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="font-size:0.8rem; color:#888;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // --- 4. 모든 이벤트 리스너 통합 ---

    // 로고 5번 클릭 관리자
    document.getElementById('logo-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        logoClickCount++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
        if (logoClickCount === 5) {
            const pw = prompt('Admin Password?');
            if (pw === ADMIN_PASSWORD) {
                sessionStorage.setItem('isVip', 'true');
                alert('VIP Access Granted');
                location.reload();
            }
            logoClickCount = 0;
        }
    });

    // 테마 토글 버튼
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 언어 버튼들 (data-lang 속성이 있는 모든 요소)
    document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            if (typeof window.applyTranslations === 'function') {
                window.applyTranslations(lang);
            }
        });
    });

    fetchDataAndRender();
});