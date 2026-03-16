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
        if (!response.ok) throw new Error('Excel file not found.');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // header: 1 대신 객체 형태로 가져와서 열 이름으로 접근 (더 안전함)
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("로드된 원본 데이터 첫 줄:", jsonData[0]);

        const allMatches = jsonData.map(row => {
            // 엑셀 컬럼명에 맞춰 매핑 (컬럼명이 다르면 이 부분을 수정하세요)
            return {
                time: row['시간'] || row['Time'] || '-',
                home: row['홈팀'] || row['Home'] || '',
                away: row['어웨이팀'] || row['Away'] || '',
                match: `${row['홈팀'] || 'Home'} vs ${row['어웨이팀'] || 'Away'}`,
                prediction: row['예측'] || row['Prediction'] || '-',
                odds: parseFloat(row['배당'] || row['Odds']) || 0,
                hitRate: parseFloat(row['적중률'] || row['Hit Rate']) || 0,
                roi: parseFloat(row['ROI']) || 0,
                sampleSize: parseInt(row['샘플'] || row['Sample']) || 0
            };
        });

        // --- 필터 조건 완화 (디버깅용) ---
        // 일단 데이터가 뜨는지 확인하기 위해 모든 경기를 허용합니다.
        const filteredMatches = allMatches.filter(item => item.home && item.away);

        console.log("표시될 경기 수:", filteredMatches.length);

        if (filteredMatches.length === 0) {
            analysisList.innerHTML = `<p style="text-align:center; padding:2rem;">분석된 경기 데이터가 없습니다.</p>`;
        } else {
            filteredMatches.forEach(item => {
                analysisList.appendChild(createMatchCard(item));
            });
        }

        // VIP 로직 실행
        const isVip = localStorage.getItem('isVipUser') === 'true';
        if (isVip && comboContainer) {
            renderVipCombo(filteredMatches, comboContainer);
        }

    } catch (error) {
        console.error('Data Load Error:', error);
        analysisList.innerHTML = `<p style="text-align:center; color:red;">데이터 로드 오류: ${error.message}</p>`;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
