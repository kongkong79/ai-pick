// 이 파일은 모든 페이지에서 테마와 언어 설정을 관리합니다.

const TRANSLATIONS = {}; // 로드된 번역 데이터를 저장하는 캐시

/**
 * 언어 JSON 파일을 가져와서 문서에 적용합니다.
 * 파일이 locales 폴더가 아닌 루트(최상위)에 있으므로 경로를 수정했습니다.
 */
window.applyTranslations = async (lang) => {
    if (!lang) lang = 'en';

    // 캐시에 없는 경우에만 파일 호출
    if (!TRANSLATIONS[lang]) {
        try {
            // 현재 파일들이 최상위에 있으므로 'locales/' 경로를 제거함
            const response = await fetch(`${lang}.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                console.error(`번역 파일(${lang}.json)을 찾을 수 없습니다. 위치를 확인하세요.`);
                return;
            }
            TRANSLATIONS[lang] = await response.json();
        } catch (error) {
            console.error(`번역 로딩 에러 (${lang}):`, error);
            return;
        }
    }

    const translations = TRANSLATIONS[lang];
    
    // [data-i18n-key] 속성을 가진 모든 엘리먼트 번역
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[key];
            } else {
                element.innerHTML = translations[key];
            }
        }
    });

    // 버튼 활성화 스타일 업데이트
    document.querySelectorAll('#language-switcher button').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
            btn.style.fontWeight = 'bold';
        } else {
            btn.classList.remove('active');
            btn.style.fontWeight = 'normal';
        }
    });

    localStorage.setItem('language', lang);
};

/**
 * 테마를 설정하고 로컬 스토리지에 저장합니다.
 */
window.setTheme = (theme) => {
    if (theme !== 'light' && theme !== 'dark') theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'light' ? '☀️' : '🌙';
    }
};

/**
 * 다크/라이트 테마를 토글합니다.
 */
window.toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    window.setTheme(newTheme);
};

// --- 초기 실행 --- //
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    window.setTheme(savedTheme);

    const savedLang = localStorage.getItem('language') || 'en';
    window.applyTranslations(savedLang);
});