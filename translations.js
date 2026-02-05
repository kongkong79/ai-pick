// This file manages shared functionality like theme and language across all pages.

const TRANSLATIONS = {}; // Cache for loaded translations

/**
 * Fetches the language JSON file and applies translations to the document.
 * @param {string} lang - The language code (e.g., 'en', 'ko').
 */
window.applyTranslations = async (lang) => {
    if (!lang) lang = 'en';

    // Load translations if not already cached
    if (!TRANSLATIONS[lang]) {
        try {
            const response = await fetch(`locales/${lang}.json?v=105`);
            if (!response.ok) {
                console.error(`Could not load translation file for ${lang}.`);
                return;
            }
            TRANSLATIONS[lang] = await response.json();
        } catch (error) {
            console.error(`Error fetching or parsing translation for ${lang}:`, error);
            return;
        }
    }

    const translations = TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
            if (element.placeholder !== undefined) {
                element.placeholder = translations[key];
            } else {
                element.innerHTML = translations[key];
            }
        }
    });

    // Update active language button
    document.querySelectorAll('#language-switcher button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    localStorage.setItem('language', lang);
};

/**
 * Sets the theme on the document and saves the preference.
 * @param {string} theme - The theme name ('light' or 'dark').
 */
window.setTheme = (theme) => {
    if (theme !== 'light' && theme !== 'dark') theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon (if it exists)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // You would have SVG icons for light/dark and toggle their display
        // For simplicity, we'll just add text here.
        themeToggle.innerHTML = theme === 'light' ? '☀️' : '🌙';
    }
};

/**
 * Toggles between light and dark themes.
 */
window.toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    window.setTheme(newTheme);
};


// --- Initial Load --- //

document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme and language from storage or defaults
    const savedTheme = localStorage.getItem('theme');
    window.setTheme(savedTheme || 'light');

    const savedLang = localStorage.getItem('language');
    window.applyTranslations(savedLang || 'en');
});
