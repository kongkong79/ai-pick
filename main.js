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

    // VIP 유저 여부 확인 (로고 클릭 관리자 모드와 연동)
    const isVipUser = localStorage.getItem('isVipUser') === 'true';

    try {
        // 2. 새로운 파일명 적용 및 캐시 방지
        const response = await fetch('./today_ai_all_picks.xlsx?v=' + Date.now());
        if (!response.ok) throw new Error('데이터 파일을 찾을 수 없습니다.');

        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 3. 데이터를 객체 배열 형태로 변환 (컬럼명으로 접근 가능하게 하여 실수 방지)
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            analysisList.innerHTML = '<p style="text-align:center;">표시할 데이터가 없습니다.</p>';
            return;
        }

        let html = '';

        // 4. 데이터 반복 처리
        jsonData.forEach(row => {
            // 예상확률 파싱 (숫자로 변환)
            const hitRate = parseFloat(row['예상확률']) || 0;
            
            // [조건 1] 70% 미만은 리스트에서 아예 제외
            if (hitRate < 70) return;

            // [조건 2] 85% 이상은 VIP 등급
            const isVipMatch = hitRate >= 85;

            // 변수 매핑 (엑셀 컬럼명 기준)
            const time = row['시간'] || 'TBD';
            const home = row['홈팀'] || '';
            const away = row['원정팀'] || '';
            const homeOdds = row['홈승배당'] || '-';
            const drawOdds = row['무승부배당'] || '-';
            const awayOdds = row['원정승배당'] || '-';
            const pick = row['AI추천'] || '-';
            const sample = row['총경기수'] || '0';

            if (home && away) {
                if (isVipMatch && !isVipUser) {
                    // --- [VIP 잠금 카드 카드] ---
                    html += `
                    <div class="analysis-list-item" style="border:2px dashed #2563eb; padding:25px; margin-bottom:15px; border-radius:12px; text-align:center; background:#f8faff;">
                        <div style="font-size: 1.5rem; margin-bottom: 10px;">🔒 VIP 전용 분석</div>
                        <div style="font-weight:bold; font-size:1.1rem; margin-bottom:5px;">${home} vs ${away}</div>
                        <p style="font-size:0.85rem; color:#64748b; margin-bottom:15px;">이 경기는 승률 <b>${hitRate.toFixed(1)}%</b>의 고확률 경기입니다.</p>
                        <a href="vip.html" style="display:inline-block; padding:8px 20px; background:#2563eb; color:white; border-radius:5px; text-decoration:none; font-weight:bold; font-size:0.9rem;">VIP 가입하고 확인하기</a>
                    </div>`;
                } else {
                    // --- [일반 공개 및 VIP 해제 카드] ---
                    const badgeStyle = isVipMatch 
                        ? 'background:#2563eb; color:white;' 
                        : 'background:#e2e8f0; color:#475569;';
                    const badgeText = isVipMatch ? `VIP ${hitRate.toFixed(1)}%` : `추천 ${hitRate.toFixed(1)}%`;

                    html += `
                    <div class="analysis-list-item" style="border:1px solid #e2e8f0; padding:20px; margin-bottom:15px; border-radius:12px; background:white; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                            <div>
                                <span style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:2px;">🕒 ${time}</span>
                                <strong style="font-size:1.1rem;">${home} vs ${away}</strong>
                            </div>
                            <span style="padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:bold; ${badgeStyle}">${badgeText}</span>
                        </div>
                        <div style="background:${isVipMatch ? '#f0f7ff' : '#f8fafc'}; padding:15px; border-radius:10px; border-left:4px solid ${isVipMatch ? '#2563eb' : '#94a3b8'};">
                            <div style="margin-bottom:8px;">🎯 <b>AI 추천:</b> <span style="color:#2563eb; font-size:1.1rem; font-weight:bold;">${pick}</span></div>
                            <div style="display:flex; gap:15px; font-size:0.85rem; color:#475569;">
                                <span><b>배당:</b> ${homeOdds} / ${drawOdds} / ${awayOdds}</span>
                                <span><b>표본:</b> ${sample}회</span>
                            </div>
                        </div>
                    </div>`;
                }
            }
        });
        
        analysisList.innerHTML = html || '<p style="text-align:center; padding:20px;">조건에 맞는 경기가 없습니다.</p>';

    } catch (error) {
        console.error('Final Error:', error);
        analysisList.innerHTML = `<p style="color:red; text-align:center;">에러 발생: ${error.message}</p>`;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
