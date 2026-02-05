# Blueprint: AI Sports Betting Analysis Website

## 1. Project Overview

An AI-powered sports betting analysis website that provides users with data-driven predictions for various matches. The site features a public area with filtered results and an exclusive VIP section with premium predictions, accessible through a subscription.

Key features include:
-   AI-generated match predictions from an Excel data source.
-   A secure, session-based VIP/Admin access system.
-   Multi-language support (English, Korean, Japanese, Chinese).
-   A light/dark theme toggle for user comfort.
-   A clean, responsive, and modern user interface.
-   Direct Excel file download for VIP users.

## 2. Style, Design, and Feature Documentation

This section details all implemented design elements and features from the initial version to the current one.

### v1: Initial Setup
-   **Core Files**: `index.html`, `style.css`, `main.js`.
-   **Functionality**: Fetched data from `sports_data.xlsx` and displayed it.

### v2: Internationalization (I18N)
-   **Feature**: Added multi-language support (EN, KO, JA, CN).
-   **Implementation**: Created a `translations` object in `main.js` and a `setLanguage` function to dynamically update UI text. Language preference is saved in `localStorage`.

### v3: VIP/Admin Access
-   **Feature**: Implemented a hidden admin access feature.
-   **Implementation**: Clicking the site logo 5 times triggers a password prompt. Correct password grants VIP access by setting a `isVip` flag in `sessionStorage`.

### v4: Theming
-   **Feature**: Added a light/dark mode theme toggle.
-   **Implementation**: Used CSS variables for colors and a JavaScript function to toggle a `data-theme` attribute on the `<html>` element. Theme preference is saved in `localStorage`.

### v5: UI/UX Refinement
-   **Design**: Modernized the UI with improved cards, a sticky header, and better visual hierarchy.
-   **Files**: Updated `style.css` with new styles for cards, header, and layout.

### v6: Multi-Page Architecture
-   **Feature**: Expanded the site into multiple pages: Home, About, Contact, Privacy, and VIP.
-   **Implementation**: Created `about.html`, `contact.html`, `privacy.html`, and `vip.html`. The navigation bar was updated to link to these pages.

### v7: VIP Page Content
-   **Feature**: The VIP page now displays all match data in a sortable table.
-   **Implementation**: Created `vip.js` to handle fetching data and populating the table. Added sorting functionality for 'Hit Rate' and 'ROI'.

### v8: Polished UI & Logo Update
-   **Design**: Replaced the text-based admin placeholder logo with a circular icon (`Icon-1.svg`).
-   **Implementation**: Updated the `<img>` tag in all HTML files and added styles in `style.css` to make it circular and interactive on hover.

### v9 (Current): VIP Excel Download & Code Unification
-   **Feature**: Added a feature for VIP users to download the full analysis report.
-   **Implementation**:
    1.  Added a "Download Full Analysis Report" section to `vip.html` with a download button.
    2.  The button links directly to the `sports_data.xlsx` file, allowing users to download it.
    3.  Added new translation keys for the download section to `main.js`.
    4.  Styled the new download section and button in `style.css` for a consistent look.
-   **Code Quality**:
    1.  Unified the logo across all pages (`index.html`, `about.html`, `contact.html`, `privacy.html`) to use the new circular icon.
    2.  Incremented the version of all JavaScript files (`main.js`, `vip.js`) to `v=16` in all relevant HTML files to prevent browser caching issues.

---

## 3. Current Task Plan (Completed)

**Objective**: Implement a file download feature for VIP users and unify the site's branding.

-   **Step 1: Add Download UI to VIP Page** - **COMPLETED**
    -   Modified `vip.html` to include a new section for downloading the Excel file.
-   **Step 2: Add Translations** - **COMPLETED**
    -   Updated the `translations` object in `main.js` with keys `vipDownloadTitle` and `vipDownloadButton`.
-   **Step 3: Correct File Path** - **COMPLETED**
    -   Initially linked to a non-existent `sports_data_vip.xlsx`. Corrected the `href` attribute in the download button in `vip.html` to point to the correct `sports_data.xlsx` file.
-   **Step 4: Style the Download Section** - **COMPLETED**
    -   Added CSS rules in `style.css` for `.download-section` and `.btn-download` to ensure the new section is visually appealing.
-   **Step 5: Unify Logos and Script Versions** - **COMPLETED**
    -   Updated `index.html`, `about.html`, `contact.html`, and `privacy.html` to use the new circular SVG logo.
    -   Updated the script tags in all HTML files to `?v=16` to ensure the latest JavaScript is loaded.
