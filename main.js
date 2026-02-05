document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 관리 ---
    let logoClickCount = 0;
    let logoClickTimer = null;
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    const isUserVip = sessionStorage.getItem('isVip') === 'true';

    // --- 2. 핵심 함수: 데이터 불러오기 및 렌더링 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList) return;

        if (loadingIndicator) loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            // 캐시 방지용 타임스탬프
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            if (!response.ok) throw new Error('Excel file not found.');

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // 데이터를 JSON으로 변환 (빈 행 무시)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 데이터 매핑 및 필터링
            const allMatches = jsonData.slice(1) // 헤더 제외
                .filter(row => row.length >= 7 && row[1]) // 유효한 데이터 행만 필터링
                .map(row => {
                    // 승률(Hit Rate) 보정: 문자열 "85%" 또는 숫자 0.85/85 처리
                    let rawHR = row[4];
                    let hitRate = 0;
                    if (typeof rawHR === 'string') {
                        hitRate = parseFloat(rawHR.replace('%', '')) / 100;
                    } else {
                        hitRate = parseFloat(rawHR) > 1 ? rawHR / 100 : rawHR;
                    }

                    return {
                        time: row[0],
                        match: row[1],
                        prediction: row[2],
                        odds: parseFloat(row[3]) || 0,
                        hitRate: hitRate || 0,
                        roi: parseFloat(row[5]) || 0,
                        sampleSize: parseInt(row[6], 10) || 0
                    };
                });

            // *** 조건 필터링: ROI >= 1, Sample >= 10, Hit Rate >= 0.51 ***
            const filteredMatches = allMatches.filter(item => 
                item.roi >= 1.0 && 
                item.sampleSize >= 10 && 
                item.hitRate >= 0.51
            );

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p style="text-align:center; padding:2rem;" data-i18n-key="noMatchesForCriteria">No matches found for today.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Data loading error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">Data loading error. Please check Excel file.</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            // 중요: 에러가 나더라도 언어 변환 함수는 반드시 호출
            applyFinalTranslations();
        }
    }

    function createMatchCard(item) {
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        // 80% 이상 잠금 (VIP가 아닐 때만)
        if (item.hitRate >= 0.80 && !isUserVip) {
            card.innerHTML = `
                <div class="lock-icon">🔒</div>
                <h3 class="vip-exclusive-title" data-i18n-key="vipExclusive">VIP Exclusive</h3>
                <p class="vip-exclusive-text" data-i18n-key="vipOnlyMessage">This prediction is for VIPs only (80%+).</p>
                <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Subscribe Now</a>
            `;
        } else {
            card.style.textAlign = 'left';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0;">${item.match}</h4>
                    <span style="font-size: 0.85rem; color: #666;">${item.time}</span>
                </div>
                <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px;">
                    <p style="margin: 4px 0;"><strong>Prediction:</strong> ${item.prediction}</p>
                    <p style="margin: 4px 0;"><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="margin: 4px 0; font-size: 0.8rem; color: #888;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // --- 3. 언어 및 이벤트 리스너 ---
    function applyFinalTranslations() {
        const currentLang = localStorage.getItem('language') || 'en';
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(currentLang);
        }
    }

    // 로고 5번 클릭 관리자 접속
    const logoLink = document.getElementById('logo-link');
    logoLink?.addEventListener('click', (e) => {
        e.preventDefault();
        logoClickCount++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
        
        if (logoClickCount === 5) {
            const password = prompt('Enter admin password:');
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('isVip', 'true');
                alert('Admin/VIP mode activated!');
                location.reload();
            }
            logoClickCount = 0;
        }
    });

    // 언어 전환 버튼 이벤트 (HTML의 버튼 ID들에 맞춰 확인 필요)
    document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            applyFinalTranslations();
        });
    });

    fetchDataAndRender();
});