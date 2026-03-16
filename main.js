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
        const comboContainer = document.getElementById('vip-combo-container');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!analysisList) return;

        if (loadingIndicator) loadingIndicator.style.display = 'block';
        analysisList.innerHTML = '';
        if (comboContainer) comboContainer.innerHTML = '';

        try {
            // 파일명을 sports_data.xlsx로 고정 (대소문자 주의!)
            const fileName = 'sports_data.xlsx';
            console.log(`[시도] ${fileName} 파일을 불러오는 중...`);

            const response = await fetch(`${fileName}?v=${new Date().getTime()}`);
            
            if (!response.ok) {
                console.error(`[에러] 파일을 찾을 수 없습니다. 상태 코드: ${response.status}`);
                throw new Error('Excel file not found.');
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            console.log("[성공] 엑셀 원본 데이터 로드 완료:", jsonData);

            const allMatches = jsonData.slice(1).map((row, index) => {
                // 데이터 파싱 및 안전한 변환
                let hitRate = 0;
                let rawHit = row[5]; 
                if (typeof rawHit === 'string') {
                    hitRate = parseFloat(rawHit.replace('%', '')) / 100;
                } else {
                    hitRate = parseFloat(rawHit) > 1 ? rawHit / 100 : rawHit;
                }

                return {
                    time: row[0] || '-',
                    home: row[1] || 'Unknown',
                    away: row[2] || 'Unknown',
                    match: `${row[1]} vs ${row[2]}`,
                    prediction: row[4] || '-',
                    odds: parseFloat(row[3]) || 0,
                    hitRate: hitRate || 0,
                    roi: parseFloat(row[10]) || 0,
                    sampleSize: parseInt(row[11]) || 0
                };
            });

            // --- 필터링 조건 완화 (디버깅용) ---
            // 일단 홈팀과 어웨이팀 이름만 있으면 모두 표시하도록 수정했습니다.
            // 데이터가 잘 나오는 것을 확인한 후 다시 조건을 강화하세요.
            const filteredMatches = allMatches.filter(item => {
                return item.home !== 'Unknown' && item.away !== 'Unknown';
                // 원래 조건: return item.prediction && item.roi >= 1.0 && item.sampleSize >= 10;
            });

            console.log(`[결과] 표시할 경기 수: ${filteredMatches.length}개`);

            // [VIP 3배 조합 생성]
            const isVip = localStorage.getItem('isVipUser') === 'true';
            if (isVip && comboContainer) {
                renderVipCombo(filteredMatches, comboContainer);
            }

            if (filteredMatches.length === 0) {
                analysisList.innerHTML = `<p style="text-align:center; padding:2rem;">표시할 데이터가 없습니다. (필터 조건 확인 필요)</p>`;
            } else {
                filteredMatches.forEach(item => {
                    analysisList.appendChild(createMatchCard(item));
                });
            }

            await safeApplyLanguage(localStorage.getItem('language') || 'en');

        } catch (error) {
            console.error('Data Load Error:', error);
            analysisList.innerHTML = `<p style="text-align:center; color:red;">데이터 로딩 실패: ${error.message}</p>`;
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    // (나머지 renderVipCombo, createMatchCard, setupEventListeners 함수들은 기존과 동일)
    // ... [기존 코드 유지] ...
