async function fetchDataAndRender() {
    const analysisList = document.getElementById('analysis-list');
    const comboContainer = document.getElementById('vip-combo-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!analysisList) return;

    if (loadingIndicator) loadingIndicator.style.display = 'block';
    analysisList.innerHTML = '';

    try {
        // 1. 현재 주소를 기반으로 파일의 전체 경로를 생성합니다.
        const fileName = 'sports_data.xlsx';
        const fileUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + fileName;
        
        console.log("🧐 시도 중인 파일 URL:", window.location.origin + fileUrl);

        // 2. fetch 시 cache: 'no-store'를 사용하여 깃허브의 이전 기록을 무시합니다.
        const response = await fetch(fileUrl + '?t=' + new Date().getTime(), {
            cache: 'no-store'
        });

        if (!response.ok) {
            // 404 에러 등이 발생하면 어떤 파일명을 찾으려 했는지 화면에 표시합니다.
            throw new Error(`파일을 찾을 수 없습니다 (상태: ${response.status}). 깃허브에 '${fileName}'이 있는지 확인해 주세요.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log("✅ 데이터 로드 성공! 첫 번째 행:", jsonData[0]);

        // --- 이후 렌더링 로직 (allMatches 변환 및 필터링) ---
        const allMatches = jsonData.slice(1).map(row => ({
            time: row[0] || '-',
            home: row[1] || '',
            away: row[2] || '',
            match: `${row[1]} vs ${row[2]}`,
            prediction: row[4] || '-',
            odds: parseFloat(row[3]) || 0,
            hitRate: (typeof row[5] === 'string' ? parseFloat(row[5]) / 100 : row[5]) || 0,
            roi: parseFloat(row[10]) || 0,
            sampleSize: parseInt(row[11]) || 0
        }));

        // 데이터가 뜨는지 확인하기 위해 필터 조건을 최소화합니다.
        const filteredMatches = allMatches.filter(item => item.home && item.away);

        if (filteredMatches.length === 0) {
            analysisList.innerHTML = `<p style="text-align:center; padding:2rem;">표시할 데이터가 없습니다. (엑셀 내용 확인 필요)</p>`;
        } else {
            filteredMatches.forEach(item => {
                analysisList.appendChild(createMatchCard(item));
            });
        }

    } catch (error) {
        console.error('❌ 최종 로드 에러:', error.message);
        analysisList.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#ef4444;">
                <h3>⚠️ 데이터 로딩 실패</h3>
                <p>${error.message}</p>
                <small style="color:#666;">콘솔 창(F12)에서 '시도 중인 파일 URL'을 클릭해 보세요.</small>
            </div>
        `;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
