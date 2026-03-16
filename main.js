document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    let logoClickTimer = null;

    async function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (window.setTheme) window.setTheme(savedTheme);
        const savedLang = localStorage.getItem('language') || 'en';
        await safeApplyLanguage(savedLang);
        fetchDataAndRender();
        setupEventListeners();
    }

    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        const comboContainer = document.getElementById('vip-combo-container');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList) return;

        if (loadingIndicator) loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';

        try {
            // 캐시 방지를 위해 타임스탬프 추가
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            if (!response.ok) throw new Error('엑셀 파일을 찾을 수 없습니다 (404).');

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            console.log("엑셀 데이터 로드 성공! 총 라인 수:", jsonData.length);

            const allMatches = jsonData.slice(1).map((row, index) => {
                // 파이썬 결과 파일 구조에 맞게 인덱스 재설정 필요 (예시 기준)
                let hitRate = 0;
                let rawHit = row[5]; 
                if (typeof rawHit === 'string') {
                    hitRate = parseFloat(rawHit.replace('%', '')) / 100;
                } else {
                    hitRate = parseFloat(rawHit) > 1 ? rawHit / 100 : rawHit;
                }

                return {
                    time: row[0] || '-',
                    home: row[1] || '',
                    away: row[2] || '',
                    match: `${row[1]} vs ${row[2]}`,
                    prediction: row[4] || '-',
                    odds: parseFloat(row[3]) || 0,
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0,      // 11번째 열
                    sampleSize: parseInt(row[11]) || 0  // 12번째 열
                };
            });

            // --- [중요] 필터 조건 완화: 데이터가 뜨는지 먼저 확인하기 위함 ---
            const filteredMatches = allMatches.filter(item => {
                // 팀 이름이 있고, 예측 값이 존재하는 모든 경기를 일단 표시
                return item.home && item.away && item.prediction !== '-';
            });

            console.log("필터링 후 표시될 경기 수:", filteredMatches.length);

            const isVip = localStorage.getItem('isVipUser') === 'true';
            if (isVip && comboContainer) {
                renderVipCombo(filteredMatches, comboContainer);
            }

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p style="text-align:center; padding:2rem;">표시할 분석 데이터가 없습니다. 엑셀 파일 내용을 확인해주세요.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }

            await safeApplyLanguage(localStorage.getItem('language') || 'en');

        } catch (error) {
            console.error('Data Load Error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red; padding:2rem;">데이터 로드 중 오류 발생: ${error.message}</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    // --- 나머지 유틸리티 함수 (기존과 동일) ---
    function createMatchCard(item) {
        const isVip = localStorage.getItem('isVipUser') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';
        if (isVip) card.style.borderColor = '#2563eb';

        const displayHitRate = (item.hitRate * 100).toFixed(0) + "%";
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <strong style="font-size:1.1rem;">${item.match}</strong>
                <span style="font-size:0.85rem; color:gray;">${item.time}</span>
            </div>
            <div style="background:rgba(128,128,128,0.05); padding:15px; border-radius:10px;">
                <p><strong>Pick:</strong> <span style="color:#2563eb; font-weight:bold;">${item.prediction}</span></p>
                <p><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${displayHitRate}</p>
                <p style="font-size:0.8rem; color:gray;">ROI: ${item.roi.toFixed(2)} | Sample: ${item.sampleSize}</p>
            </div>
        `;
        return card;
    }

    async function safeApplyLanguage(lang) {
        if (typeof window.applyTranslations === 'function') {
            try { await window.applyTranslations(lang); } catch (e) { console.error("Translation Error:", e); }
        }
    }

    function setupEventListeners() {
        document.getElementById('logo-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                const pw = prompt('Admin Password?');
                if (pw === ADMIN_PASSWORD) {
                    localStorage.setItem('isVipUser', 'true');
                    alert('VIP Mode Unlocked');
                    location.reload();
                }
            }
        });
    }

    init();
});
