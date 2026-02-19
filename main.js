document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 설정 및 상태 ---
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

    // --- 2. 데이터 로드 및 렌더링 ---
    async function fetchDataAndRender() {
        const analysisList = document.getElementById('analysis-list');
        const comboContainer = document.getElementById('vip-combo-container'); // VIP 조합 박스
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList) return;

        if (loadingIndicator) loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';
        if (comboContainer) comboContainer.innerHTML = '';

        try {
            const response = await fetch('sports_data.xlsx?v=' + new Date().getTime());
            if (!response.ok) throw new Error('Excel file not found.');

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
                    home: row[1],
                    away: row[2],
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

            // [VIP 3배 조합 생성 로직 실행]
            const isVip = localStorage.getItem('isVipUser') === 'true';
            if (isVip && comboContainer) {
                renderVipCombo(filteredMatches, comboContainer);
            }

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p data-i18n-key="noMatches" style="text-align:center; padding:2rem;">No matches found.</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }

            await safeApplyLanguage(localStorage.getItem('language') || 'en');

        } catch (error) {
            console.error('Data Load Error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">Failed to load sports data.</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    /**
     * VIP 전용 3배 조합 렌더링 함수
     */
    function renderVipCombo(matches, container) {
        // 1. 적중률 70% 이상, 배당 1.4~2.2 사이의 안정적인 경기 선별
        const candidates = matches.filter(m => m.hitRate >= 0.70 && m.odds >= 1.4 && m.odds <= 2.2);
        
        let bestCombo = null;
        let closestToTarget = 999;

        // 2. 두 경기를 조합하여 합산 배당이 3.0에 가장 가까운 세트 찾기
        for (let i = 0; i < candidates.length; i++) {
            for (let j = i + 1; j < candidates.length; j++) {
                const totalOdds = candidates[i].odds * candidates[j].odds;
                const diff = Math.abs(totalOdds - 3.0);
                if (totalOdds >= 2.7 && totalOdds <= 3.6 && diff < closestToTarget) {
                    closestToTarget = diff;
                    bestCombo = [candidates[i], candidates[j], totalOdds];
                }
            }
        }

        if (bestCombo) {
            const [m1, m2, finalOdds] = bestCombo;
            
            // 데이터 보정 적용 (Away Win 0% 처리)
            const getPick = (m) => (m.prediction.toLowerCase().includes('away win') && m.hitRate === 0) ? "AH 0 (Away)" : m.prediction;

            container.innerHTML = `
                <div class="vip-combo-card" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 20px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(37,99,235,0.3);">
                    <div style="text-align:center; margin-bottom:15px;">
                        <span style="background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:bold;">AI STRATEGY</span>
                        <h2 style="margin:10px 0; font-size:1.4rem;">🎯 Today's 300% Target Combo</h2>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; border-top:1px solid rgba(255,255,255,0.2); padding-top:15px;">
                        <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:8px;">
                            <div style="font-size:0.75rem; opacity:0.8;">Match 1</div>
                            <div style="font-weight:bold; font-size:0.9rem; margin:4px 0;">${m1.match}</div>
                            <div style="color:#4ade80; font-weight:bold;">${getPick(m1)}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:8px;">
                            <div style="font-size:0.75rem; opacity:0.8;">Match 2</div>
                            <div style="font-weight:bold; font-size:0.9rem; margin:4px 0;">${m2.match}</div>
                            <div style="color:#4ade80; font-weight:bold;">${getPick(m2)}</div>
                        </div>
                    </div>
                    <div style="text-align:center; margin-top:15px; font-size:1.2rem; font-weight:bold;">
                        Total Odds: <span style="font-size:1.5rem; color:#facc15;">${finalOdds.toFixed(2)}x</span>
                    </div>
                </div>
            `;
        }
    }

    function createMatchCard(item) {
        const isVip = localStorage.getItem('isVipUser') === 'true';
        const card = document.createElement('div');
        card.className = 'analysis-list-item';

        if (isVip) {
            card.style.borderColor = '#2563eb';
            card.style.background = 'var(--light-blue)';
        }

        let displayPrediction = item.prediction;
        let predictionStyle = "color:#2563eb; font-weight:bold;";
        
        if (item.prediction.toLowerCase().includes('away win') && item.hitRate === 0) {
            displayPrediction = "AH 0 (Away)";
            predictionStyle = "color:#10b981; font-weight:bold;";
        }

        if (item.hitRate >= 0.80 && !isVip) {
            card.innerHTML = `
                <div style="text-align:center; padding:15px;">
                    <div class="lock-icon" style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
                    <h3 data-i18n-key="vipExclusive">VIP Exclusive</h3>
                    <p data-i18n-key="vipOnlyMessage" style="font-size:0.85rem; color:#888;">High Win Rate (80%+)</p>
                    <a href="vip.html" class="subscribe-button" data-i18n-key="subscribeNow">Unlock Now</a>
                </div>
            `;
        } else {
            const isHighRate = item.hitRate >= 0.80;
            const displayHitRate = item.hitRate === 0 ? "High (DNB)" : (item.hitRate * 100).toFixed(0) + "%";

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:1.1rem;">${isHighRate ? '⭐ ' : ''}${item.match}</strong>
                    <span style="font-size:0.85rem; color:gray;">${item.time}</span>
                </div>
                <div style="background:rgba(128,128,128,0.1); padding:15px; border-radius:10px;">
                    <p><strong>Pick:</strong> <span style="${predictionStyle}">${displayPrediction}</span></p>
                    <p><strong>Odds:</strong> ${item.odds.toFixed(2)} | <strong>Hit Rate:</strong> ${displayHitRate}</p>
                    <p style="font-size:0.8rem; color:gray;">ROI: ${item.roi} | Sample: ${item.sampleSize}</p>
                </div>
                ${isHighRate ? '<div style="margin-top:10px; font-size:0.75rem; color:#2563eb; font-weight:bold;">✅ VIP Premium Analysis Unlocked</div>' : ''}
            `;
        }
        return card;
    }

    // --- 3. 유틸리티 및 이벤트 리스너 ---
    async function safeApplyLanguage(lang) {
        if (typeof window.applyTranslations === 'function') {
            try { await window.applyTranslations(lang); } catch (e) { console.error("Translation Error:", e); }
        }
    }

    function setupEventListeners() {
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            if (window.toggleTheme) window.toggleTheme();
        });

        document.getElementById('language-switcher')?.addEventListener('click', async (e) => {
            if (e.target.tagName === 'BUTTON') {
                const lang = e.target.getAttribute('data-lang');
                if (lang) {
                    localStorage.setItem('language', lang);
                    await safeApplyLanguage(lang);
                }
            }
        });

        document.getElementById('logo-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                const pw = prompt('Admin Password?');
                if (pw === ADMIN_PASSWORD) {
                    localStorage.setItem('isVipUser', 'true');
                    alert('Admin Mode: VIP Unlocked');
                    location.reload();
                }
                logoClickCount = 0;
            }
        });
    }

    init();
});
