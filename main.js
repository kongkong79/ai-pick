async function fetchDataAndRender() {
    const analysisList = document.getElementById('analysis-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!analysisList) return;

    analysisList.innerHTML = '<p style="text-align:center;">분석 데이터를 동기화 중입니다...</p>';

    try {
        // Netlify 환경에서 가장 안전한 상대 경로 호출
        const response = await fetch('./sports_data.xlsx?v=' + new Date().getTime());
        
        if (!response.ok) {
            throw new Error(`파일을 찾을 수 없습니다. (상태 코드: ${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 헤더를 포함한 전체 데이터를 가져옴
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length <= 1) {
            analysisList.innerHTML = '<p style="text-align:center;">데이터가 비어 있습니다. 파이썬 분석기를 먼저 실행해 주세요.</p>';
            return;
        }

        console.log("데이터 로드 성공! 샘플 데이터:", jsonData[1]);

        analysisList.innerHTML = ''; // 초기화

        // 파이썬 파일의 저장 순서에 맞게 인덱스 매핑 (이미지 기반 추정)
        jsonData.slice(1).forEach((row) => {
            // row[1]: 홈팀, row[2]: 어웨이팀, row[4]: 예측, row[3]: 배당
            if (!row[1] || !row[2]) return; 

            const matchCard = document.createElement('div');
            matchCard.className = 'analysis-list-item';
            
            // 적중률(row[5]) 처리: 0.85 또는 "85%" 형태 모두 대응
            let hitRate = row[5];
            if (typeof hitRate === 'string') hitRate = hitRate.replace('%', '');
            const displayHitRate = hitRate ? parseFloat(hitRate).toFixed(0) + "%" : "0%";

            matchCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; font-size:1.1rem;">${row[1]} vs ${row[2]}</span>
                    <span style="font-size:0.8rem; color:gray;">${row[0] || ''}</span>
                </div>
                <div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.03); border-radius:5px;">
                    <p style="margin:5px 0;">🎯 <b>Pick:</b> <span style="color:#2563eb;">${row[4] || '-'}</span></p>
                    <p style="margin:5px 0;">📈 <b>Odds:</b> ${row[3] || '0.00'} | <b>Hit Rate:</b> ${displayHitRate}</p>
                </div>
            `;
            analysisList.appendChild(matchCard);
        });

    } catch (error) {
        console.error('Error:', error);
        analysisList.innerHTML = `<p style="text-align:center; color:red;">로드 실패: ${error.message}</p>`;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
