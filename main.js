async function fetchDataAndRender() {
    const analysisList = document.getElementById('analysis-list');
    if (!analysisList) return;

    analysisList.innerHTML = '<p style="text-align:center;">데이터를 분석 중입니다...</p>';

    try {
        // 캐시를 무시하고 최신 파일을 가져옵니다.
        const response = await fetch('./sports_data.xlsx?v=' + new Date().getTime());
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 중요: 데이터를 객체 배열로 가져와서 컬럼명으로 접근합니다.
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("✅ 로드된 데이터 첫 줄:", jsonData[0]); // 콘솔에서 컬럼명 확인용

        if (jsonData.length === 0) {
            analysisList.innerHTML = '<p style="text-align:center;">분석된 경기 결과가 없습니다.</p>';
            return;
        }

        analysisList.innerHTML = ''; // 초기화

        jsonData.forEach(row => {
            // 파이썬 엑셀 헤더 이름에 맞춰 가져오기 (파일의 첫 줄 제목과 똑같아야 함)
            const home = row['홈팀'] || row['Home'] || '';
            const away = row['어웨이팀'] || row['Away'] || '';
            const prediction = row['예측'] || row['Prediction'] || '-';
            const odds = row['배당'] || row['Odds'] || '0.00';
            const hitRate = row['적중률'] || row['Hit Rate'] || '0%';

            if (home && away) {
                const card = document.createElement('div');
                card.className = 'analysis-list-item';
                card.innerHTML = `
                    <div style="font-weight:bold; font-size:1.1rem; margin-bottom:8px;">${home} vs ${away}</div>
                    <div style="background:rgba(37,99,235,0.05); padding:10px; border-radius:8px;">
                        <p style="margin:4px 0;">🎯 <b>Pick:</b> <span style="color:#2563eb;">${prediction}</span></p>
                        <p style="margin:4px 0;">📈 <b>Odds:</b> ${odds} | <b>Hit Rate:</b> ${hitRate}</p>
                    </div>
                `;
                analysisList.appendChild(card);
            }
        });

    } catch (error) {
        console.error('❌ 데이터 처리 에러:', error);
        analysisList.innerHTML = `<p style="text-align:center; color:red;">데이터 처리 중 오류 발생</p>`;
    }
}
