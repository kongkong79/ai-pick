async function fetchDataAndRender() {
    const analysisList = document.getElementById('analysis-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!analysisList) return;

    if (loadingIndicator) loadingIndicator.style.display = 'block';
    analysisList.innerHTML = '<p style="text-align:center;">데이터를 불러오는 중...</p>';

    try {
        // [중요] 현재 도메인 루트부터 파일을 찾도록 절대 경로 방식으로 접근
        const fileName = 'sports_data.xlsx';
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
        const finalUrl = baseUrl + fileName;

        console.log("🔍 시도 중인 전체 경로:", finalUrl);

        // 캐시를 무시하고 서버의 최신 파일을 강제 호출
        const response = await fetch(finalUrl + '?v=' + new Date().getTime(), {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`파일 응답 실패 (코드: ${response.status}). 파일이 해당 경로에 존재하지 않습니다.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log("✅ 데이터 로드 성공! 총 줄 수:", jsonData.length);

        if (!jsonData || jsonData.length <= 1) {
            analysisList.innerHTML = '<p style="text-align:center;">엑셀 파일에 분석 데이터가 없습니다.</p>';
            return;
        }

        // 렌더링 함수 실행 (기존 logic 사용)
        renderMatches(jsonData.slice(1));

    } catch (error) {
        console.error('❌ 최종 에러:', error.message);
        analysisList.innerHTML = `
            <div style="text-align:center; color:#ef4444; padding:20px; border:1px solid #ef4444; border-radius:8px;">
                <strong>⚠️ 로딩 실패</strong><br>
                <small>${error.message}</small><br>
                <button onclick="location.reload()" style="margin-top:10px; padding:5px 10px; cursor:pointer;">새로고침</button>
            </div>
        `;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// 데이터를 화면에 그리는 보조 함수
function renderMatches(data) {
    const analysisList = document.getElementById('analysis-list');
    analysisList.innerHTML = '';
    
    data.forEach(row => {
        if (!row[1] || !row[2]) return; // 홈팀, 어웨이팀 없으면 스킵
        const card = document.createElement('div');
        card.className = 'analysis-list-item';
        card.innerHTML = `
            <div style="font-weight:bold; margin-bottom:5px;">${row[1]} vs ${row[2]}</div>
            <div style="font-size:0.9rem; color:#2563eb;">Pick: ${row[4] || '-'} (${row[3] || '0.00'})</div>
        `;
        analysisList.appendChild(card);
    });
}
