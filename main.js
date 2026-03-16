async function fetchDataAndRender() {
    const analysisList = document.getElementById('analysis-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!analysisList) return;

    // 1. 라이브러리 체크
    if (typeof XLSX === 'undefined') {
        analysisList.innerHTML = '<p style="color:red; text-align:center;">오류: XLSX 라이브러리가 로드되지 않았습니다.</p>';
        return;
    }

    if (loadingIndicator) loadingIndicator.style.display = 'block';
    analysisList.innerHTML = '<p style="text-align:center;">데이터 동기화 중...</p>';

    try {
        // 2. 캐시 파괴(v=Date)를 적용하여 강제 호출
        const response = await fetch('./sports_data.xlsx?v=' + Date.now());
        if (!response.ok) throw new Error('파일 호출 실패(404)');

        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 3. 데이터를 배열 형태로 변환 (헤더 이름 무시)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 데이터가 헤더 포함 2줄 이상이어야 함
        if (rows.length < 2) {
            analysisList.innerHTML = '<p style="text-align:center;">표시할 데이터가 없습니다.</p>';
            return;
        }

        console.log("불러온 첫 데이터:", rows[1]);

        let html = '';
        // 4. i=1부터 시작 (0은 헤더)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // 엑셀 실제 순서 매핑
            const time = row[0] || '';         // Time
            const home = row[1] || '';         // Home Team
            const away = row[2] || '';         // Away Team
            const odds = row[3] || '-';        // Home Odds
            const pick = row[4] || '-';        // AI Recommendation
            const hit = row[5] || '0';         // Hit rate
            const roi = row[10] || '0';        // Expected ROI
            const sample = row[11] || '0';     // Sample Count

            if (home && away) {
                html += `
                <div class="analysis-list-item" style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:10px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-weight:bold;">${home} vs ${away}</span>
                        <span style="font-size:0.8rem; color:gray;">${time}</span>
                    </div>
                    <div style="font-size:0.9rem; background:#f8fafc; padding:10px; border-radius:5px;">
                        <div>🎯 <b>Pick:</b> <span style="color:#2563eb;">${pick}</span></div>
                        <div>📈 <b>Odds:</b> ${odds} | <b>Hit Rate:</b> ${hit}%</div>
                        <div style="font-size:0.8rem; color:gray; margin-top:5px;">ROI: ${roi} | Sample: ${sample}</div>
                    </div>
                </div>`;
            }
        }
        analysisList.innerHTML = html;

    } catch (error) {
        console.error('Final Error:', error);
        analysisList.innerHTML = `<p style="color:red; text-align:center;">에러 발생: ${error.message}</p>`;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
