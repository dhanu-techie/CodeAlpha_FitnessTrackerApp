# CodeAlpha Task 3 &mdash; Fitness Tracker App

A modern, responsive, beginner-friendly web application designed to help users record everyday wellness habits such as daily movement, water intake, sleep duration, and exercise sessions, then review their progress over time.

> **Guiding Principle:** Focus on consistent healthy habits and personal progress. Avoid weight-loss pressure, body comparisons, or restrictive targets.

---

## 📌 Project Overview

- **Project Name:** Fitness Tracker App
- **Suggested Repository Name:** `CodeAlpha_FitnessTrackerApp`
- **Internship:** CodeAlpha Web Development Internship &bull; Task 3
- **Technology Stack:** HTML5, CSS3, Vanilla JavaScript, Browser LocalStorage
- **Development Tool:** Antigravity
- **External Dependencies:** None (100% Pure Vanilla Web Stack)

---

## 🚀 Key Features

### 1. Dashboard Overview
- **Four Habit Summary Cards:** Displays today's recorded activity, hydration volume, sleep duration, and exercise sessions with animated progress bars.
- **Today's Wellness Snapshot:** Real-time consolidated summary of movement, hydration, rest, and workout metrics for the current day.
- **7-Day Consistency Mini-Preview:** Quick visual glance of the 7-day habit completion pattern directly on the dashboard.

### 2. Daily Activity Tracker
- **Dual Tracking Metric:** Toggle flexibly between counting **Steps** or recording **Active Minutes**.
- **Dynamic Form Controls:** Form labels, placeholders, and validation thresholds update dynamically when the metric changes.
- **Validation & Feedback:** Ensures entries have valid positive amounts; highlights invalid fields and provides accessible green/red alert banners.
- **Activity Log History:** Chronological log with metric badges, date stamps, and optional notes with instant deletion capability.

### 3. Water Intake Tracker
- **Quick-Add Actions:** One-click logging for `+250 ml (1 Glass)` and `+500 ml (1 Bottle)`.
- **Correction & Removal:** Dedicated `-250 ml` button to correct accidental logs without dipping below 0 ml.
- **Custom Amount Logging:** Allows recording specific volumes between 50 ml and 5,000 ml.
- **Total Reset:** Single-click reset to clear today's water total.
- **Volume & Glass Indicator:** Real-time counter and estimated standard glasses readout (`~X standard glasses`).

### 4. Sleep Tracker
- **Duration & Quality:** Records sleep duration (0.5 to 24 hours in 0.5-hr steps) and subjective rest quality (*Restful & Refreshed*, *Good / Normal*, *Light / Disturbed*, or *Tired / Inadequate*).
- **Bedtime Habits / Notes:** Optional habit logging (e.g., reading before bed, screen-free evening).
- **Sleep Log Records:** Saved records with dedicated indigo tags and delete support.

### 5. Exercise & Workout Tracker
- **Workout Suggestions:** Built-in datalist suggestions for common exercises (*Brisk Walking*, *Running*, *Cycling*, *Yoga*, *Strength Training*, *Swimming*, *Pilates*, etc.) while supporting custom entries.
- **Session Duration & Intensity:** Logs duration in minutes and intensity (*Gentle*, *Moderate*, *Energetic*).
- **Full In-Place Editing:** Clicking edit loads the record into the form, activates edit mode, smoothly scrolls to the form, and updates the existing entry without creating duplicates.
- **Session Deletion:** Removes individual workouts and updates dashboard counters immediately.

### 6. Dynamic Weekly Progress & Pure CSS Bar Chart
- **Rolling 7-Day Window:** Automatically computes the past 7 consecutive days `[Today - 6 days ... Today]` using timezone-safe local date arithmetic across week, month, and year boundaries.
- **Pure CSS Bar Chart:** Proportional vertical bars dynamically scaled to recorded activity, with hover tooltips, date labels, and dedicated highlight on *Today*.
- **Rest Day Distinction:** Unrecorded or zero-activity days display `0m` with `0%` bar fill rather than misleading placeholder data.
- **Daily Target Completion:** Days reaching or exceeding the healthy habit target (30 minutes of daily intentional movement) receive a green `.target-met` achievement badge.
- **Weekly Summary Badges:** Computes weekly active minutes, average daily water volume, average sleep hours, and total workout count.

### 7. Accessibility (WCAG AA Compliant) & User Experience
- **Semantic Structure:** Clean landmark hierarchy (`<header>`, `<aside>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`).
- **Heading Order:** Valid heading hierarchy (`h1` &rarr; `h2` &rarr; `h3` &rarr; `h4`) with zero skipped levels.
- **Form Label Parity:** Every form control is explicitly associated with a matching `<label for="...">`.
- **Accessible Feedback:** Dynamic messages use `role="alert"` and `aria-live="polite"` for instant screen-reader announcements.
- **Keyboard Operability:** Logical Tab order, high-contrast `:focus-visible` outlines, `Escape` key drawer dismissal, and keyboard-focusable chart bars (`tabindex="0"` and `role="img"`).
- **Non-Color Reliance:** Values, tooltips, and day labels ensure chart readability without relying exclusively on color hue.
- **Motion Sensitivity:** Respects `@media (prefers-reduced-motion: reduce)` by disabling transitions and decorative animations.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Markup** | HTML5 | Semantic page structure, forms, ARIA attributes, SVG icons |
| **Styling** | CSS3 | Custom properties (CSS variables), Flexbox, CSS Grid, media queries, animations |
| **Logic** | Vanilla JavaScript (ES6+) | Modular functions, event listeners, in-memory state, date arithmetic |
| **Storage** | Browser LocalStorage | Client-side JSON persistence with schema versioning and corruption handling |
| **External Libraries** | None | 100% self-contained with zero third-party dependencies |

---

## 📖 Development Roadmap

- [x] **Phase 1: Project Foundation & Layout** &mdash; Initial semantic structure, responsive grid, and view navigation.
- [x] **Phase 2: Dashboard Styling Refinement** &mdash; Calm aesthetic theme, WCAG AA color contrast, tactile button feedback, and focus rings.
- [x] **Phase 3: Daily Tracking Features** &mdash; Form validations, dynamic log rendering, water actions, sleep records, and exercise edit/delete flows.
- [x] **Phase 4: LocalStorage & Date Handling** &mdash; Schema versioning, corruption handling, reload restoration, and date isolation.
- [x] **Phase 5: Weekly Progress & Chart** &mdash; 7-day rolling window, weekly summary metrics, and pure CSS dynamic bar chart.
- [x] **Phase 6: Testing & Accessibility Audit** &mdash; Form parity, keyboard accessibility, screen reader testing, and regression suite.
- [x] **Phase 7: Documentation & GitHub Preparation** &mdash; Professional README, `.gitignore`, demo outline, and submission checklist.
- [x] **Phase 8: Final Review & Submission Readiness** &mdash; End-to-end verification, code quality check, and final handover.

---

## 📂 Project Folder Structure

```text
CodeAlpha_FitnessTrackerApp/
├── assets/
│   └── images/
│       ├── hero-wellness.svg         # Lightweight wellness vector hero illustration
│       ├── illustration-activity.svg # Daily activity movement badge illustration
│       ├── illustration-water.svg    # Hydration and water bottle badge illustration
│       ├── illustration-sleep.svg    # Sleep rest and crescent moon badge illustration
│       └── illustration-exercise.svg # Exercise and dumbbell workout badge illustration
├── favicon.png      # Custom fitness app favicon icon
├── index.html       # Complete semantic structure, navigation, forms & dashboard layout
├── style.css        # Responsive styling, design system, theme variables & media queries
├── script.js        # Core tracking logic, LocalStorage engine & weekly progress chart
├── README.md        # Comprehensive documentation, setup guide & demo outline
└── .gitignore       # Git ignore rules for OS artifacts and editor directories
```

---

## 💻 Setup & Run Instructions

Because this application uses standard vanilla web technologies without build steps or package managers, running it locally is instant:

### Option 1: Direct Browser Launch
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/CodeAlpha_FitnessTrackerApp.git
   ```
2. Open the project folder:
   ```bash
   cd CodeAlpha_FitnessTrackerApp
   ```
3. Double-click `index.html` or right-click and choose **Open with** &rarr; **Google Chrome** (or any modern web browser such as Edge, Firefox, or Safari).

### Option 2: Using a Local Development Server
For hot reloading or live preview:
- **VS Code Live Server:** Right-click `index.html` inside VS Code and select **Open with Live Server**.
- **Python HTTP Server:**
  ```bash
  python -m http.server 8000
  ```
  Then open `http://localhost:8000` in your browser.
- **Node.js `serve`:**
  ```bash
  npx serve .
  ```

---

## 💾 How LocalStorage Works

1. **Storage Schema:** All entries are serialized under a single versioned key: `codealpha_fitness_tracker_data_v1`.
   ```json
   {
     "version": 1,
     "activities": [
       { "id": "act_...", "date": "2026-11-16", "metricType": "steps", "amount": 6000, "notes": "", "createdAt": "..." }
     ],
     "waterLogs": [
       { "id": "water_...", "date": "2026-11-16", "amount": 250, "createdAt": "..." }
     ],
     "sleepLogs": [
       { "id": "sleep_...", "date": "2026-11-16", "hours": 7.5, "quality": "Restful", "notes": "", "createdAt": "..." }
     ],
     "exercises": [
       { "id": "ex_...", "date": "2026-11-16", "name": "Yoga", "duration": 30, "intensity": "Moderate", "notes": "", "createdAt": "..." }
     ],
     "lastSaved": "2026-11-16T14:30:00.000Z"
   }
   ```
2. **Automatic Restoration:** On page load (`DOMContentLoaded`), `loadFromLocalStorage()` parses the stored JSON, validates each record against sanitization rules, and populates the application state before rendering the UI.
3. **Synchronized Persistence:** Adding, editing, deleting, or resetting any record triggers `saveToLocalStorage()` immediately.
4. **Corruption & Quota Protection:** Guarded with `try...catch` blocks to safely handle corrupted JSON or private browsing storage restrictions without crashing.

---

## 📊 Weekly Progress Calculation Overview

- **7-Day Rolling Window:** Evaluates records between `[Today - 6 days]` and `[Today]`.
- **Daily Movement Metric:**
  $$\text{Daily Active Minutes} = \text{Exercise Workout Minutes} + \text{Activity Movement Minutes}$$
  *(100 daily steps count as 1 active minute of movement if steps were logged).*
- **Daily Habit Goal:** A balanced, achievable guideline of **30 active minutes per day** based on general wellness recommendations.
- **Dynamic Scale:** The chart dynamically scales between a 60-minute base reference or the maximum active minutes recorded in the week, ensuring bars are readable without distortion.
- **Date Boundary Safety:** Uses `new Date(year, month, day - i)` which natively handles month boundaries (e.g., crossing from October into November) and leap years.

---

## ⚠️ Documented Application Limitations

1. **Single-Device / Single-Browser Scope:** All user activities, water logs, sleep records, and exercise entries are persisted client-side within the browser's `localStorage` (`codealpha_fitness_tracker_data_v1`). Data remains persistent across page reloads and browser restarts on that specific browser profile, but is not automatically synchronized across multiple physical devices or separate browsers (which would require a centralized backend API and user authentication layer).
2. **7-Day Rolling Progress Scope:** The weekly progress bar chart and summary analytics focus specifically on the latest 7-day rolling window (`[Today - 6 days]` to `[Today]`). Historical records prior to the rolling window are safely retained in LocalStorage but are not included in the 7-day visualization.
3. **Client-Side Storage Limits:** Browser `localStorage` typically enforces a standard 5 MB quota per origin. Because the app stores lightweight serialized JSON (~1–2 KB for hundreds of daily entries), this capacity is more than sufficient for years of daily tracking, but clearing browser cookies/site data will reset the local storage.

---

## 🎬 Project Demo Outline (For Internship Submission)

When preparing your demo video or presentation for CodeAlpha submission, follow this recommended walkthrough:

1. **Introduction & Overview (0:00 &ndash; 0:30):**
   - Introduce the app name (**HabitPulse / Fitness Tracker**) and its guiding principle: sustainable daily habits without restrictive pressure.
   - Show the responsive layout, header date badge, and clean sidebar navigation.
2. **Logging Daily Activity & Water (0:30 &ndash; 1:15):**
   - Log 6,000 steps in the **Daily Activity Tracker**; show the instant green success feedback and the updated Activity summary card.
   - Switch to the **Water Intake Tracker**; click `+250 ml` and `+500 ml` to demonstrate instant hydration counter updates and glasses estimation.
3. **Recording Sleep & Managing Exercises (1:15 &ndash; 2:15):**
   - Log 7.5 hours of sleep with a *Restful* quality rating in the **Sleep Tracker**.
   - Navigate to the **Exercise Tracker**; add a 30-minute workout (*"Morning Jog"*).
   - Click the **Edit** icon on the workout to show in-place editing (change duration to 45 mins) and save.
   - Demonstrate the **Delete** action on a record.
4. **Weekly Progress & Chart Synchronization (2:15 &ndash; 2:45):**
   - Open the **Weekly Progress** view.
   - Explain the dynamic 7-day bar chart, the 30-minute habit target badges (`target-met`), and the 0m rest days.
   - Point out the aggregated weekly metrics (weekly active minutes, daily water average, sleep average).
5. **Persistence & Mobile Responsiveness (2:45 &ndash; 3:15):**
   - **Refresh the page** in the browser to show all entries, dashboard counters, and weekly charts persist from `LocalStorage`.
   - Resize the window or toggle device emulation in DevTools to show the mobile navigation drawer, responsive cards, and zero horizontal overflow.

---

## ✅ GitHub Repository Submission Checklist

Before submitting the task to CodeAlpha:

- [x] Repository created with exact suggested name: `CodeAlpha_FitnessTrackerApp`.
- [x] All core source files and vector assets committed: `index.html`, `style.css`, `script.js`, `README.md`, `favicon.png`, `assets/images/`.
- [x] `.gitignore` included to prevent OS/IDE file clutter.
- [x] Zero console errors verified via `node --check script.js`.
- [x] No private credentials, tokens, or personal information committed.
- [x] All 8 development phases completed, audited, and verified.
- [x] LocalStorage persistence tested across browser reloads.
- [x] Mobile and desktop responsive layouts verified.

---

## 📜 License & Attribution

Developed as part of the **CodeAlpha Web Development Internship** (Task 3).
Open source for educational and portfolio demonstration.
