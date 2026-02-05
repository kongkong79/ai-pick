
# Project Blueprint: AI Sports Betting Analysis

This document outlines the purpose, features, and implementation plan for the web application. It serves as the single source of truth for all development.

## 1. Core Purpose

To provide AI-driven sports betting analysis to users, with a clear distinction between publicly available data and exclusive VIP content.

## 2. Feature Breakdown

### A. Homepage (Public View - `index.html`)

- **Data Filtering:** Displays a curated list of matches from `sports_data.xlsx` that meet **ALL** of the following criteria:
    - Sample Size > 10
    - ROI > 1
    - Hit Rate > 51%
- **VIP Content Locking:** Any match from the filtered list with a **Hit Rate of 80% or higher** will be obfuscated and displayed as a "VIP Exclusive Prediction" card, prompting users to subscribe.
- **Layout:** A clean, card-based list layout as per the reference screenshot.
- **Header:**
    - Circular "dml" logo.
    - Navigation: Home, About, Contact, Privacy, VIP.
    - Controls: Language switcher (EN, KO, JA, CN) and a Light/Dark theme toggle.

### B. Admin-Only VIP Access

- **Trigger:** Clicking the circular "dml" logo 5 consecutive times on the homepage.
- **Password:** `MGB_ADMIN_2024`
- **Action:** Upon successful password entry, the administrator is automatically redirected to the VIP page (`vip.html`) with full access granted for that session. This is an admin-only shortcut for content verification.

### C. VIP Page (`vip.html`)

- **Standard User Access:** Users navigate here from the homepage. They are presented with a login form to enter their access key.
- **Authentication:**
    - **(Future) Gumroad Integration:** The system will validate the entered key against a list of valid license keys stored in `licenses.txt`. The temporary `7777` key will be completely removed.
- **Content:** Upon successful authentication, the user can view **ALL** match data from the spreadsheet, without any filtering. The data is presented in a sortable table format (sort by Hit Rate, ROI).

### D. Data Management (Admin)

- **Method:** The administrator updates the site's data by replacing the `sports_data.xlsx` file in the project's root directory.
- **Note:** The complex, on-page upload panel has been removed in favor of this simpler, more direct file management approach to ensure stability.

## 3. Execution Plan

1.  **[COMPLETED]** Establish this `blueprint.md` file.
2.  **[NEXT] Rebuild `index.html`:** Create the clean HTML structure based on the screenshot, removing the old admin panel code.
3.  **[PLANNED] Rebuild `style.css`:** Implement the visual design, including the circular logo and card styles.
4.  **[PLANNED] Rebuild `main.js`:** Implement the public data filtering/locking logic and the new 5-click admin access feature.
5.  **[PLANNED] Refactor VIP Access:** Once the homepage is approved, modify `vip.js` to use a `licenses.txt` file for real key validation, removing all hardcoded passwords.
