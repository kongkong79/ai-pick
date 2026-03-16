async function fetchDataAndRender() {
    const analysisList = document.getElementById('analysis-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!analysisList) return;

    if (loadingIndicator) loadingIndicator.style.display = 'block';
    analysisList.innerHTML = '';

    try {
        // 캐시 방지를 위해 타임스탬프 추가
        const response = await fetch('./sports_data.xlsx?v=' + new Date().getTime());
        if (!response.ok) throw new Error('파일을 찾을 수 없습니다.');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 엑셀 헤더 이름을 키(Key)로 사용하는 객체 배열로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            analysisList.innerHTML = '<p style="text-align:center; padding:2rem;">분석된 데이터가 없습니다.</p>';
            return;
        }

        console.log("✅ 엑셀 데이터 확인 완료:", jsonData[0]);

        jsonData.forEach(row => {
            // 실제 엑셀 파일의 영문 헤더명과 100% 일치시킴
            const home = row['Home Team'] || '';
            const away = row['Away Team'] || '';
            const prediction = row['AI Recommendation'] || '-';
            const odds = row['Home Odds'] || '0.00';
            const hitRate = row['Hit rate'] || '0';
            const time = row['Time'] || '';
            const roi = row['Expected ROI'] || '0';
            const sample = row['Sample Count'] || '0';

            // 홈팀과 어웨이팀 정보가 있는 경우에만 카드 생성
            if (home && away) {
                const card = document.createElement('div');
                card.className = 'analysis-list-item';
                
                // 적중률 표시 처리 (숫자일 경우 % 추가)
                const displayHitRate = typeof hitRate === 'number' ? hitRate + "%" : hitRate;

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="font-size:1.1rem;">${home} vs ${away}</strong>
                        <span style="font-size:0.85rem; color:gray;">${time}</span>
                    </div>
                    <div style="background:rgba(128,128,128,0.05); padding:15px; border-radius:10px;">
                        <p style="margin:5px 0;"><strong>🎯 Pick:</strong> <span style="color:#2563eb; font-weight:bold;">${prediction}</span></p>
                        <p style="margin:5px 0;"><strong>📈 Odds:</strong> ${odds} | <strong>Hit Rate:</strong> ${displayHitRate}</p>
                        <p style="margin:5px 0; font-size:0.8rem; color:gray;">ROI: ${roi} | Sample: ${sample}</p>
                    </div>
                `;
                analysisList.appendChild(card);
            }
        });

    } catch (error) {
        console.error('❌ 에러 발생:', error);
        analysisList.innerHTML = `<p style="text-align:center; color:red; padding:2rem;">데이터 로드 중 오류: ${error.message}</p>`;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
