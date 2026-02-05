document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;
    
    // 1. 언어 설정 즉시 적용 (데이터 로드 전 실행)
    const currentLang = localStorage.getItem('language') || 'en';
    if (window.applyTranslations) window.applyTranslations(currentLang);

    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 엑셀 컬럼 위치 재설정 (보내주신 CSV 구조 기준)
            const allMatches = jsonData.slice(1).map(row => {
                return {
                    time: row[0],
                    match: `${row[1]} vs ${row[2]}`, // Home vs Away
                    prediction: row[4], // AI Recommendation
                    odds: parseFloat(row[3]),
                    hitRate: parseFloat(row[5]) / 100, // Hit rate (예: 100 -> 1.0)
                    roi: parseFloat(row[10]), // Expected ROI (K열)
                    sampleSize: parseInt(row[11]) // Sample Count (L열)
                };
            }).filter(item => item.match && !isNaN(item.roi));

            // 필터링 조건 완화 (데이터가 보일 수 있도록 조정)
            const filteredMatches = allMatches.filter(item => 
                item.roi >= 1.0 && 
                item.sampleSize >= 10
            );

            analysisList.innerHTML = '';

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches">No matches found. (Check ROI/Sample criteria)</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }
        } catch (error) {
            console.error('Error:', error);
            analysisList.innerHTML = `<p>Check sports_data.xlsx file.</p>`;
        } finally {
            // 렌더링 후 다시 한번 번역 적용
            if (window.applyTranslations) window.applyTranslations(localStorage.getItem('language') || 'en');
        }
    }

    function createMatchCard(item) {
        const isVip = sessionStorage.getItem('isVip') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        // 80% 이상 VIP 잠금
        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div class="lock-icon">🔒</div>
                <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock</a>
            `;
        } else {
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-weight:bold;">
                    <span>${item.match}</span>
                    <span>${item.time}</span>
                </div>
                <p>Pick: ${item.prediction} | ROI: ${item.roi}</p>
            `;
        }
        return card;
    }

    // 로고 클릭 이벤트 (ID: logo-link)
    document.getElementById('logo-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        logoClickCount++;
        if (logoClickCount === 5) {
            const pw = prompt('Admin Password?');
            if (pw === ADMIN_PASSWORD) {
                sessionStorage.setItem('isVip', 'true');
                location.reload();
            }
            logoClickCount = 0;
        }
    });

    // 언어 버튼 이벤트
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            if (window.applyTranslations) window.applyTranslations(lang);
        });
    });

    fetchDataAndRender();
});