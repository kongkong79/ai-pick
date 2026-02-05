document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_PASSWORD = 'MGB_ADMIN_2024';
    let logoClickCount = 0;

    // 1. 초기 언어 설정 실행
    const initLanguage = () => {
        const savedLang = localStorage.getItem('language') || 'en';
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(savedLang);
        }
    };
    initLanguage();

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
                // 승률(Hit rate) 데이터 보정
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
                    roi: parseFloat(row[10]) || 0,
                    sampleSize: parseInt(row[11]) || 0
                };
            });

            // *** 필터링 로직 업데이트 ***
            const filteredMatches = allMatches.filter(item => {
                const hasValidPick = item.prediction && item.prediction !== '-' && item.prediction.trim() !== ''; // PICK이 비어있거나 '-'인 경우 제외
                const meetsRoi = item.roi >= 1.0; // ROI 1 이상
                const meetsSample = item.sampleSize >= 10; // 표본 10 이상
                
                return hasValidPick && meetsRoi && meetsSample;
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
            console.error('Data Load Error:', error);
        } finally {
            // 데이터 출력 후 번역 다시 한번 입히기
            initLanguage();
        }
    }

    function createMatchCard(item) {
        const isVip = sessionStorage.getItem('isVip') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        // 승률 80% 이상 VIP 잠금
        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div class="lock-icon" style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
                <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                <p data-i18n-key="vipOnlyMessage">This prediction is for VIP members.</p>
                <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock (Gumroad)</a>
            `;
        } else {
            card.style.textAlign = 'left';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:1.1rem;">${item.match}</strong>
                    <span style="color:#666; font-size:0.9rem;">${item.time}</span>
                </div>
                <div style="background:#f1f5f9; padding:15px; border-radius:10px;">
                    <p><strong>Pick:</strong> <span style="color:#2563eb;">${item.prediction}</span></p>
                    <p><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${(item.hitRate * 100).toFixed(0)}%</p>
                    <p style="font-size:0.8rem; color:#64748b; margin-top:5px;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
            `;
        }
        return card;
    }

    // 로고 5번 클릭 관리자 모드
    document.getElementById('logo-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        logoClickCount++;
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

    // 언어 전환 버튼 연결
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            initLanguage(); // 즉시 번역 적용
        });
    });

    fetchDataAndRender();
});