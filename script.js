/**
 * CodeAlpha Task 3 - Fitness Tracker App
 * Phase 4: LocalStorage & Date Handling
 *
 * Implements persistent LocalStorage storage for Activity, Water Intake, Sleep,
 * and Exercise records, safe parsing/fallback mechanisms, robust date associations,
 * and seamless restoration on page startup and reload.
 *
 * Note: Weekly progress calculations are scheduled for Phase 5.
 */

// --- In-Memory Application State ---
const appData = {
  activities: [],
  waterLogs: [],
  sleepLogs: [],
  exercises: [],
};

// --- Storage Key Constant ---
const STORAGE_KEY = 'codealpha_fitness_tracker_data_v1';

// --- Lifecycle Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Date & Header Display
  initDateDisplay();

  // 2. Restore Persistent Records from LocalStorage
  loadFromLocalStorage();

  // 3. Navigation & Responsive Controls
  initNavigation();
  initMobileMenu();
  initFormInteractions();

  // 4. Initialize Tracker Subsystems
  initActivityTracker();
  initWaterTracker();
  initSleepTracker();
  initExerciseTracker();

  // 5. Render Restored Data to UI
  updateDashboardSummaries();
  updateWeeklyProgress();
  renderAllRecordLists();

  console.log('✅ Fitness Tracker App: Phase 5 Weekly Progress initialized.');
});

// ==========================================================================
// 1. LOCALSTORAGE PERSISTENCE ENGINE (PHASE 4)
// ==========================================================================

/**
 * Persists application state to browser LocalStorage safely
 */
function saveToLocalStorage() {
  try {
    const payload = JSON.stringify({
      version: 1,
      activities: appData.activities,
      waterLogs: appData.waterLogs,
      sleepLogs: appData.sleepLogs,
      exercises: appData.exercises,
      lastSaved: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (err) {
    console.error('Failed to save data to LocalStorage:', err);
  }
}

/**
 * Restores saved records from LocalStorage with corruption protection
 */
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    if (Array.isArray(parsed.activities)) {
      appData.activities = parsed.activities.filter(isValidActivityEntry);
    }
    if (Array.isArray(parsed.waterLogs)) {
      appData.waterLogs = parsed.waterLogs.filter(isValidWaterEntry);
    }
    if (Array.isArray(parsed.sleepLogs)) {
      appData.sleepLogs = parsed.sleepLogs.filter(isValidSleepEntry);
    }
    if (Array.isArray(parsed.exercises)) {
      appData.exercises = parsed.exercises.filter(isValidExerciseEntry).map((ex) => {
        // Backward compatibility: If older record has no calories, compute estimate
        if (typeof ex.calories !== 'number' || isNaN(ex.calories) || ex.calories <= 0) {
          ex.calories = estimateExerciseCalories(ex.duration, ex.intensity, ex.name);
          ex.isCalorieEstimated = true;
        }
        return ex;
      });
    }
  } catch (err) {
    console.warn('LocalStorage data was invalid or corrupted. Starting with clean defaults.', err);
  }
}

// Data validation sanitizers to prevent corrupt stored entries
function isValidActivityEntry(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.amount === 'number' &&
    item.amount > 0
  );
}

function isValidWaterEntry(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.amount === 'number'
  );
}

function isValidSleepEntry(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.hours === 'number' &&
    item.hours >= 0.5
  );
}

function isValidExerciseEntry(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.name === 'string' &&
    typeof item.duration === 'number' &&
    item.duration > 0
  );
}

// ==========================================================================
// 2. DATE & FOUNDATION HELPERS
// ==========================================================================

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone
 */
function getTodayIsoString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sets formatted date in the header and pre-fills form date inputs with today's date
 */
function initDateDisplay() {
  const dateTextElem = document.getElementById('current-date-text');
  const today = new Date();

  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  if (dateTextElem) {
    dateTextElem.textContent = today.toLocaleDateString(undefined, options);
  }

  const isoToday = getTodayIsoString();
  const dateInputIds = ['activity-date', 'water-date', 'sleep-date', 'exercise-date'];
  dateInputIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input && !input.value) {
      input.value = isoToday;
    }
  });
}

/**
 * Formats a YYYY-MM-DD string into a friendly readable label without timezone shifting
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const todayStr = getTodayIsoString();
  if (dateStr === todayStr) {
    return 'Today';
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

/**
 * Escapes HTML characters for secure UI rendering
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculates estimated active calories burned for an exercise session
 * when manual calories are not provided.
 * Uses standard MET approximations:
 * - Gentle / Light: ~5 kcal / min
 * - Moderate: ~8 kcal / min
 * - Energetic / High: ~12 kcal / min
 */
function estimateExerciseCalories(durationMins, intensity, exerciseName) {
  const duration = Math.max(0, Number(durationMins) || 0);
  let ratePerMinute = 8; // Default moderate

  const intensityLower = String(intensity || '').toLowerCase();
  if (intensityLower.includes('gentle') || intensityLower.includes('light')) {
    ratePerMinute = 5;
  } else if (intensityLower.includes('energetic') || intensityLower.includes('high')) {
    ratePerMinute = 12;
  }

  const nameLower = String(exerciseName || '').toLowerCase();
  if (nameLower.includes('run') || nameLower.includes('jog') || nameLower.includes('hiit') || nameLower.includes('rope')) {
    ratePerMinute = Math.max(ratePerMinute, 11);
  } else if (nameLower.includes('walk') || nameLower.includes('yoga') || nameLower.includes('stretch') || nameLower.includes('pilates')) {
    ratePerMinute = Math.min(ratePerMinute, 6);
  }

  return Math.round(duration * ratePerMinute);
}

/**
 * Calculates active movement calories from daily steps or active minutes
 * Standard reference: ~0.04 kcal per step (1,000 steps ≈ 40 kcal)
 * Active movement minutes: ~4 kcal per minute
 */
function estimateActivityCalories(metricType, amount) {
  const val = Math.max(0, Number(amount) || 0);
  if (metricType === 'minutes') {
    return Math.round(val * 4);
  }
  return Math.round(val * 0.04);
}

// ==========================================================================
// 3. USER FEEDBACK & NOTIFICATION HELPERS
// ==========================================================================

const feedbackTimeouts = {};

/**
 * Displays accessible inline success or error messages
 */
function showFeedback(feedbackContainerId, type, message) {
  const container = document.getElementById(feedbackContainerId);
  if (!container) return;

  if (feedbackTimeouts[feedbackContainerId]) {
    clearTimeout(feedbackTimeouts[feedbackContainerId]);
  }

  const isSuccess = type === 'success';
  container.className = `form-feedback active ${isSuccess ? 'feedback-success' : 'feedback-error'}`;

  const iconSvg = isSuccess
    ? `<svg class="feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg class="feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  container.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;

  feedbackTimeouts[feedbackContainerId] = setTimeout(() => {
    container.classList.remove('active');
  }, 5000);
}

/**
 * Clears an active feedback notification
 */
function clearFeedback(feedbackContainerId) {
  const container = document.getElementById(feedbackContainerId);
  if (container) {
    container.classList.remove('active');
    container.innerHTML = '';
  }
}

/**
 * Highlights an invalid input field
 */
function markInputError(inputElem) {
  if (!inputElem) return;
  inputElem.classList.add('input-error');
  inputElem.focus();
  inputElem.addEventListener(
    'input',
    () => {
      inputElem.classList.remove('input-error');
    },
    { once: true }
  );
}

// ==========================================================================
// 4. DAILY ACTIVITY TRACKER
// ==========================================================================

function initActivityTracker() {
  const form = document.getElementById('activity-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFeedback('activity-feedback');

    const dateInput = document.getElementById('activity-date');
    const metricSelect = document.getElementById('activity-metric-type');
    const amountInput = document.getElementById('activity-amount');
    const notesInput = document.getElementById('activity-notes');

    const dateVal = dateInput.value.trim();
    const metricVal = metricSelect.value;
    const amountVal = parseFloat(amountInput.value);
    const notesVal = notesInput ? notesInput.value.trim() : '';

    if (!dateVal) {
      markInputError(dateInput);
      showFeedback('activity-feedback', 'error', 'Please select a valid date for your activity.');
      return;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      markInputError(amountInput);
      const metricLabel = metricVal === 'minutes' ? 'active minutes' : 'steps';
      showFeedback('activity-feedback', 'error', `Please enter a valid amount of ${metricLabel} (greater than 0).`);
      return;
    }

    const maxLimit = metricVal === 'minutes' ? 720 : 100000;
    if (amountVal > maxLimit) {
      markInputError(amountInput);
      showFeedback('activity-feedback', 'error', `Amount exceeds sensible maximum (${maxLimit.toLocaleString()}).`);
      return;
    }

    const newEntry = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: dateVal,
      metricType: metricVal,
      amount: Math.round(amountVal),
      notes: notesVal,
      createdAt: new Date().toISOString(),
    };

    appData.activities.unshift(newEntry);
    saveToLocalStorage();

    renderActivityRecords();
    updateDashboardSummaries();

    const unitText = newEntry.metricType === 'minutes' ? 'active mins' : 'steps';
    showFeedback(
      'activity-feedback',
      'success',
      `Logged ${newEntry.amount.toLocaleString()} ${unitText} for ${formatDisplayDate(newEntry.date)}!`
    );

    amountInput.value = '';
    if (notesInput) notesInput.value = '';
    amountInput.classList.remove('input-error');
  });

  form.addEventListener('reset', () => {
    clearFeedback('activity-feedback');
    setTimeout(() => {
      document.getElementById('activity-date').value = getTodayIsoString();
    }, 0);
  });
}

function renderActivityRecords() {
  const emptyState = document.getElementById('activity-empty-state');
  const recordsList = document.getElementById('activity-records-list');
  if (!emptyState || !recordsList) return;

  if (appData.activities.length === 0) {
    emptyState.style.display = 'flex';
    recordsList.style.display = 'none';
    recordsList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  recordsList.style.display = 'flex';

  recordsList.innerHTML = appData.activities
    .map((item) => {
      const isMins = item.metricType === 'minutes';
      const unitLabel = isMins ? 'mins' : 'steps';
      const tagClass = 'tag-amber';

      return `
      <div class="record-item" data-id="${item.id}">
        <div class="record-info">
          <div class="record-title-row">
            <span class="record-title">${escapeHtml(item.amount.toLocaleString())} ${unitLabel}</span>
            <span class="record-tag ${tagClass}">${isMins ? 'Movement' : 'Steps'}</span>
          </div>
          <div class="record-meta">${formatDisplayDate(item.date)}</div>
          ${item.notes ? `<div class="record-notes">"${escapeHtml(item.notes)}"</div>` : ''}
        </div>
        <div class="record-actions">
          <button type="button" class="btn-action btn-delete" onclick="deleteActivityEntry('${item.id}')" title="Delete entry" aria-label="Delete activity entry">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

window.deleteActivityEntry = function (id) {
  const index = appData.activities.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    appData.activities.splice(index, 1);
    saveToLocalStorage();
    renderActivityRecords();
    updateDashboardSummaries();
    showFeedback('activity-feedback', 'success', `Activity entry removed.`);
  }
};

// ==========================================================================
// 5. WATER INTAKE TRACKER
// ==========================================================================

function initWaterTracker() {
  const quickBtns = document.querySelectorAll('.btn-water-quick');
  const removeBtn = document.querySelector('.btn-water-remove');
  const resetBtn = document.getElementById('btn-reset-water');
  const customForm = document.getElementById('water-form');

  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.getAttribute('data-amount'), 10);
      if (!isNaN(amount) && amount > 0) {
        addWaterLog(amount, getTodayIsoString());
      }
    });
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      removeWaterLog(250, getTodayIsoString());
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetTodayWater(getTodayIsoString());
    });
  }

  if (customForm) {
    customForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearFeedback('water-feedback');

      const dateInput = document.getElementById('water-date');
      const amountInput = document.getElementById('water-custom-amount');

      const dateVal = dateInput.value.trim();
      const amountVal = parseFloat(amountInput.value);

      if (!dateVal) {
        markInputError(dateInput);
        showFeedback('water-feedback', 'error', 'Please choose a date.');
        return;
      }

      if (isNaN(amountVal) || amountVal <= 0) {
        markInputError(amountInput);
        showFeedback('water-feedback', 'error', 'Please enter a valid amount (e.g. 250 ml).');
        return;
      }

      if (amountVal > 5000) {
        markInputError(amountInput);
        showFeedback('water-feedback', 'error', 'Please enter an amount under 5,000 ml per log.');
        return;
      }

      addWaterLog(Math.round(amountVal), dateVal);
      amountInput.value = '';
      amountInput.classList.remove('input-error');
    });
  }
}

function addWaterLog(amountMl, dateStr) {
  const newEntry = {
    id: 'water_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    date: dateStr,
    amount: amountMl,
    createdAt: new Date().toISOString(),
  };

  appData.waterLogs.unshift(newEntry);
  saveToLocalStorage();

  renderWaterRecords();
  updateDashboardSummaries();
  showFeedback('water-feedback', 'success', `Added +${amountMl} ml for ${formatDisplayDate(dateStr)}.`);
}

function removeWaterLog(amountMl, dateStr) {
  const dateLogs = appData.waterLogs.filter((item) => item.date === dateStr);
  const totalOnDate = dateLogs.reduce((acc, cur) => acc + cur.amount, 0);

  if (totalOnDate <= 0) {
    showFeedback('water-feedback', 'error', `Water total is already 0 ml for ${formatDisplayDate(dateStr)}.`);
    return;
  }

  if (dateLogs.length > 0) {
    const latestIndex = appData.waterLogs.findIndex((item) => item.id === dateLogs[0].id);
    if (latestIndex !== -1) {
      const removed = appData.waterLogs.splice(latestIndex, 1)[0];
      saveToLocalStorage();
      renderWaterRecords();
      updateDashboardSummaries();
      showFeedback(
        'water-feedback',
        'success',
        `Removed recent log of ${removed.amount} ml (${formatDisplayDate(dateStr)}).`
      );
      return;
    }
  }

  renderWaterRecords();
  updateDashboardSummaries();
}

function resetTodayWater(dateStr) {
  const initialCount = appData.waterLogs.length;
  appData.waterLogs = appData.waterLogs.filter((item) => item.date !== dateStr);
  saveToLocalStorage();

  renderWaterRecords();
  updateDashboardSummaries();

  if (appData.waterLogs.length < initialCount) {
    showFeedback('water-feedback', 'success', `Water intake reset to 0 ml for ${formatDisplayDate(dateStr)}.`);
  } else {
    showFeedback('water-feedback', 'success', `Water intake is already at 0 ml.`);
  }
}

function renderWaterRecords() {
  const emptyState = document.getElementById('water-empty-state');
  const recordsList = document.getElementById('water-records-list');
  if (!emptyState || !recordsList) return;

  if (appData.waterLogs.length === 0) {
    emptyState.style.display = 'flex';
    recordsList.style.display = 'none';
    recordsList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  recordsList.style.display = 'flex';

  recordsList.innerHTML = appData.waterLogs
    .map((item) => {
      const glasses = (item.amount / 250).toFixed(item.amount % 250 === 0 ? 0 : 1);
      return `
      <div class="record-item" data-id="${item.id}">
        <div class="record-info">
          <div class="record-title-row">
            <span class="record-title">+${item.amount} ml</span>
            <span class="record-tag tag-blue">${glasses} glass${glasses == 1 ? '' : 'es'}</span>
          </div>
          <div class="record-meta">${formatDisplayDate(item.date)}</div>
        </div>
        <div class="record-actions">
          <button type="button" class="btn-action btn-delete" onclick="deleteWaterEntry('${item.id}')" title="Remove this water log" aria-label="Remove water log">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

window.deleteWaterEntry = function (id) {
  const index = appData.waterLogs.findIndex((item) => item.id === id);
  if (index !== -1) {
    const removed = appData.waterLogs.splice(index, 1)[0];
    saveToLocalStorage();
    renderWaterRecords();
    updateDashboardSummaries();
    showFeedback('water-feedback', 'success', `Removed entry of ${removed.amount} ml.`);
  }
};

// ==========================================================================
// 6. SLEEP TRACKER
// ==========================================================================

function initSleepTracker() {
  const form = document.getElementById('sleep-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFeedback('sleep-feedback');

    const dateInput = document.getElementById('sleep-date');
    const hoursInput = document.getElementById('sleep-hours');
    const qualitySelect = document.getElementById('sleep-quality');
    const notesInput = document.getElementById('sleep-notes');

    const dateVal = dateInput.value.trim();
    const hoursVal = parseFloat(hoursInput.value);
    const qualityVal = qualitySelect.value;
    const notesVal = notesInput ? notesInput.value.trim() : '';

    if (!dateVal) {
      markInputError(dateInput);
      showFeedback('sleep-feedback', 'error', 'Please choose the sleep date (night of).');
      return;
    }

    if (isNaN(hoursVal) || hoursVal < 0.5 || hoursVal > 24) {
      markInputError(hoursInput);
      showFeedback('sleep-feedback', 'error', 'Please enter a valid duration between 0.5 and 24 hours.');
      return;
    }

    const newEntry = {
      id: 'sleep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: dateVal,
      hours: parseFloat(hoursVal.toFixed(1)),
      quality: qualityVal,
      notes: notesVal,
      createdAt: new Date().toISOString(),
    };

    appData.sleepLogs.unshift(newEntry);
    saveToLocalStorage();

    renderSleepRecords();
    updateDashboardSummaries();

    showFeedback(
      'sleep-feedback',
      'success',
      `Recorded ${newEntry.hours} hrs of sleep (${newEntry.quality}) for ${formatDisplayDate(newEntry.date)}!`
    );

    hoursInput.value = '';
    if (notesInput) notesInput.value = '';
    hoursInput.classList.remove('input-error');
  });

  form.addEventListener('reset', () => {
    clearFeedback('sleep-feedback');
    setTimeout(() => {
      document.getElementById('sleep-date').value = getTodayIsoString();
    }, 0);
  });
}

function renderSleepRecords() {
  const emptyState = document.getElementById('sleep-empty-state');
  const recordsList = document.getElementById('sleep-records-list');
  if (!emptyState || !recordsList) return;

  if (appData.sleepLogs.length === 0) {
    emptyState.style.display = 'flex';
    recordsList.style.display = 'none';
    recordsList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  recordsList.style.display = 'flex';

  recordsList.innerHTML = appData.sleepLogs
    .map((item) => {
      return `
      <div class="record-item" data-id="${item.id}">
        <div class="record-info">
          <div class="record-title-row">
            <span class="record-title">${item.hours} hours rest</span>
            <span class="record-tag tag-indigo">${escapeHtml(item.quality)}</span>
          </div>
          <div class="record-meta">${formatDisplayDate(item.date)}</div>
          ${item.notes ? `<div class="record-notes">"${escapeHtml(item.notes)}"</div>` : ''}
        </div>
        <div class="record-actions">
          <button type="button" class="btn-action btn-delete" onclick="deleteSleepEntry('${item.id}')" title="Delete sleep record" aria-label="Delete sleep record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

window.deleteSleepEntry = function (id) {
  const index = appData.sleepLogs.findIndex((item) => item.id === id);
  if (index !== -1) {
    appData.sleepLogs.splice(index, 1);
    saveToLocalStorage();
    renderSleepRecords();
    updateDashboardSummaries();
    showFeedback('sleep-feedback', 'success', 'Sleep entry removed.');
  }
};

// ==========================================================================
// 7. EXERCISE TRACKER (WITH EDIT, DELETE & LOCALSTORAGE)
// ==========================================================================

function initExerciseTracker() {
  const form = document.getElementById('exercise-form');
  const cancelEditBtn = document.getElementById('btn-cancel-exercise-edit');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFeedback('exercise-feedback');

    const editIdInput = document.getElementById('exercise-edit-id');
    const dateInput = document.getElementById('exercise-date');
    const nameInput = document.getElementById('exercise-name');
    const durationInput = document.getElementById('exercise-duration');
    const intensitySelect = document.getElementById('exercise-intensity');
    const caloriesInput = document.getElementById('exercise-calories');
    const notesInput = document.getElementById('exercise-notes');

    const editId = editIdInput ? editIdInput.value.trim() : '';
    const dateVal = dateInput.value.trim();
    const nameVal = nameInput.value.trim();
    const durationVal = parseFloat(durationInput.value);
    const intensityVal = intensitySelect.value;
    const rawCaloriesVal = caloriesInput ? caloriesInput.value.trim() : '';
    const notesVal = notesInput ? notesInput.value.trim() : '';

    if (!dateVal) {
      markInputError(dateInput);
      showFeedback('exercise-feedback', 'error', 'Please choose a workout date.');
      return;
    }

    if (!nameVal) {
      markInputError(nameInput);
      showFeedback('exercise-feedback', 'error', 'Please enter an exercise name or workout type.');
      return;
    }

    if (isNaN(durationVal) || durationVal <= 0 || durationVal > 600) {
      markInputError(durationInput);
      showFeedback('exercise-feedback', 'error', 'Please enter a valid workout duration between 1 and 600 minutes.');
      return;
    }

    // Optional manual calories validation
    let manualCalories = null;
    if (rawCaloriesVal !== '') {
      const parsedCal = parseFloat(rawCaloriesVal);
      if (isNaN(parsedCal) || parsedCal <= 0 || parsedCal > 10000) {
        if (caloriesInput) markInputError(caloriesInput);
        showFeedback('exercise-feedback', 'error', 'Please enter a realistic calorie number between 1 and 10,000 kcal, or leave blank to auto-estimate.');
        return;
      }
      manualCalories = Math.round(parsedCal);
    }

    const isManualCalories = manualCalories !== null;
    const finalCalories = isManualCalories
      ? manualCalories
      : estimateExerciseCalories(durationVal, intensityVal, nameVal);

    if (editId) {
      // EDIT MODE: Update existing entry in place to prevent duplicates
      const existingEntry = appData.exercises.find((item) => item.id === editId);
      if (existingEntry) {
        existingEntry.date = dateVal;
        existingEntry.name = nameVal;
        existingEntry.duration = Math.round(durationVal);
        existingEntry.intensity = intensityVal;
        existingEntry.calories = finalCalories;
        existingEntry.isCalorieEstimated = !isManualCalories;
        existingEntry.notes = notesVal;
        existingEntry.updatedAt = new Date().toISOString();

        saveToLocalStorage();

        const calFeedbackText = existingEntry.isCalorieEstimated
          ? `~${existingEntry.calories} kcal est.`
          : `${existingEntry.calories} kcal`;

        showFeedback(
          'exercise-feedback',
          'success',
          `Updated "${existingEntry.name}" (${existingEntry.duration} mins, ${calFeedbackText}) successfully!`
        );
      }
      resetExerciseEditState();
    } else {
      // ADD MODE: Create new unique entry
      const newEntry = {
        id: 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        date: dateVal,
        name: nameVal,
        duration: Math.round(durationVal),
        intensity: intensityVal,
        calories: finalCalories,
        isCalorieEstimated: !isManualCalories,
        notes: notesVal,
        createdAt: new Date().toISOString(),
      };

      appData.exercises.unshift(newEntry);
      saveToLocalStorage();

      const calFeedbackText = newEntry.isCalorieEstimated
        ? `~${newEntry.calories} kcal est.`
        : `${newEntry.calories} kcal`;

      showFeedback(
        'exercise-feedback',
        'success',
        `Logged workout "${newEntry.name}" (${newEntry.duration} mins, ${calFeedbackText}) for ${formatDisplayDate(newEntry.date)}!`
      );
    }

    renderExerciseRecords();
    updateDashboardSummaries();

    nameInput.value = '';
    durationInput.value = '';
    if (caloriesInput) caloriesInput.value = '';
    if (notesInput) notesInput.value = '';
    nameInput.classList.remove('input-error');
    durationInput.classList.remove('input-error');
    if (caloriesInput) caloriesInput.classList.remove('input-error');
  });

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetExerciseEditState();
      showFeedback('exercise-feedback', 'success', 'Edit cancelled.');
    });
  }

  form.addEventListener('reset', () => {
    clearFeedback('exercise-feedback');
    resetExerciseEditState();
    setTimeout(() => {
      document.getElementById('exercise-date').value = getTodayIsoString();
    }, 0);
  });
}

function resetExerciseEditState() {
  const editIdInput = document.getElementById('exercise-edit-id');
  const caloriesInput = document.getElementById('exercise-calories');
  const submitBtn = document.getElementById('btn-save-exercise');
  const cancelBtn = document.getElementById('btn-cancel-exercise-edit');
  const formTitle = document.getElementById('exercise-form-title');

  if (editIdInput) editIdInput.value = '';
  if (caloriesInput) caloriesInput.value = '';
  if (formTitle) formTitle.textContent = 'Add Exercise Session';
  if (cancelBtn) cancelBtn.style.display = 'none';

  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      Save Exercise
    `;
  }
}

function renderExerciseRecords() {
  const emptyState = document.getElementById('exercise-empty-state');
  const recordsList = document.getElementById('exercise-records-list');
  if (!emptyState || !recordsList) return;

  if (appData.exercises.length === 0) {
    emptyState.style.display = 'flex';
    recordsList.style.display = 'none';
    recordsList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  recordsList.style.display = 'flex';

  recordsList.innerHTML = appData.exercises
    .map((item) => {
      const calorieLabel = item.isCalorieEstimated
        ? `~${item.calories} kcal (est.)`
        : `${item.calories} kcal`;

      return `
      <div class="record-item" data-id="${item.id}">
        <div class="record-info">
          <div class="record-title-row">
            <span class="record-title">${escapeHtml(item.name)}</span>
            <span class="record-tag tag-green">${item.duration} mins</span>
            <span class="record-tag tag-rose" title="${item.isCalorieEstimated ? 'Approximate calculation based on intensity and duration' : 'Manually entered value'}">${calorieLabel}</span>
            <span class="record-tag">${escapeHtml(item.intensity)}</span>
          </div>
          <div class="record-meta">${formatDisplayDate(item.date)}</div>
          ${item.notes ? `<div class="record-notes">"${escapeHtml(item.notes)}"</div>` : ''}
        </div>
        <div class="record-actions">
          <button type="button" class="btn-action btn-edit" onclick="startEditExercise('${item.id}')" title="Edit this exercise" aria-label="Edit exercise">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="btn-action btn-delete" onclick="deleteExerciseEntry('${item.id}')" title="Delete this exercise" aria-label="Delete exercise">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

window.startEditExercise = function (id) {
  const item = appData.exercises.find((entry) => entry.id === id);
  if (!item) return;

  const editIdInput = document.getElementById('exercise-edit-id');
  const dateInput = document.getElementById('exercise-date');
  const nameInput = document.getElementById('exercise-name');
  const durationInput = document.getElementById('exercise-duration');
  const intensitySelect = document.getElementById('exercise-intensity');
  const caloriesInput = document.getElementById('exercise-calories');
  const notesInput = document.getElementById('exercise-notes');
  const submitBtn = document.getElementById('btn-save-exercise');
  const cancelBtn = document.getElementById('btn-cancel-exercise-edit');
  const formTitle = document.getElementById('exercise-form-title');

  if (editIdInput) editIdInput.value = item.id;
  if (dateInput) dateInput.value = item.date;
  if (nameInput) nameInput.value = item.name;
  if (durationInput) durationInput.value = item.duration;
  if (intensitySelect) intensitySelect.value = item.intensity;
  if (caloriesInput) caloriesInput.value = item.isCalorieEstimated ? '' : item.calories;
  if (notesInput) notesInput.value = item.notes || '';

  if (formTitle) formTitle.textContent = `Edit Exercise Session`;
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      Update Exercise
    `;
  }

  const navBtn = document.querySelector('.nav-item[data-section="section-exercise"]');
  if (navBtn) navBtn.click();

  const formCard = document.querySelector('#section-exercise .form-card');
  if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (nameInput) nameInput.focus();

  showFeedback('exercise-feedback', 'success', `Editing "${item.name}". Make updates and click Update Exercise.`);
};

window.deleteExerciseEntry = function (id) {
  const index = appData.exercises.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const removed = appData.exercises.splice(index, 1)[0];
    saveToLocalStorage();

    const editIdInput = document.getElementById('exercise-edit-id');
    if (editIdInput && editIdInput.value === id) {
      resetExerciseEditState();
      document.getElementById('exercise-name').value = '';
      document.getElementById('exercise-duration').value = '';
      if (document.getElementById('exercise-notes')) document.getElementById('exercise-notes').value = '';
    }

    renderExerciseRecords();
    updateDashboardSummaries();
    showFeedback('exercise-feedback', 'success', `Deleted exercise "${removed.name}".`);
  }
};

// ==========================================================================
// 8. DASHBOARD SUMMARIES & SNAPSHOT SYNCHRONIZATION
// ==========================================================================

/**
 * Recalculates today's metrics and updates dashboard summary cards immediately.
 * Only records matching today's local date string (YYYY-MM-DD) are used.
 */
function updateDashboardSummaries() {
  const todayStr = getTodayIsoString();

  // 1. Activity Calculation (Today only)
  const todayActivities = appData.activities.filter((item) => item.date === todayStr);
  let totalSteps = 0;
  let totalActiveMins = 0;

  todayActivities.forEach((item) => {
    if (item.metricType === 'minutes') {
      totalActiveMins += item.amount;
    } else {
      totalSteps += item.amount;
    }
  });

  const dashActivityMetric = document.getElementById('dash-activity-metric');
  const dashActivityUnit = document.getElementById('dash-activity-unit');
  const dashActivityProgress = document.getElementById('dash-activity-progress');
  const dashActivitySubtext = document.getElementById('dash-activity-subtext');
  const snapActivity = document.getElementById('snap-activity');

  if (totalSteps > 0 || totalActiveMins === 0) {
    if (dashActivityMetric) dashActivityMetric.textContent = totalSteps.toLocaleString();
    if (dashActivityUnit) dashActivityUnit.textContent = 'steps recorded today';
    const progressPercent = Math.min(100, Math.round((totalSteps / 10000) * 100));
    if (dashActivityProgress) dashActivityProgress.style.width = `${progressPercent}%`;
    if (dashActivitySubtext) {
      dashActivitySubtext.textContent =
        totalActiveMins > 0 ? `+ ${totalActiveMins} active mins` : 'Active daily steps';
    }
  } else {
    if (dashActivityMetric) dashActivityMetric.textContent = totalActiveMins.toLocaleString();
    if (dashActivityUnit) dashActivityUnit.textContent = 'active minutes today';
    const progressPercent = Math.min(100, Math.round((totalActiveMins / 60) * 100));
    if (dashActivityProgress) dashActivityProgress.style.width = `${progressPercent}%`;
    if (dashActivitySubtext) dashActivitySubtext.textContent = 'Active daily movement';
  }

  if (snapActivity) {
    if (todayActivities.length === 0) {
      snapActivity.textContent = 'No activity logged today';
    } else if (totalSteps > 0 && totalActiveMins > 0) {
      snapActivity.textContent = `${totalSteps.toLocaleString()} steps &bull; ${totalActiveMins} active mins`;
    } else if (totalSteps > 0) {
      snapActivity.textContent = `${totalSteps.toLocaleString()} steps recorded`;
    } else {
      snapActivity.textContent = `${totalActiveMins} active minutes recorded`;
    }
  }

  // 2. Water Calculation (Today only)
  const todayWaterLogs = appData.waterLogs.filter((item) => item.date === todayStr);
  const totalWaterMl = Math.max(0, todayWaterLogs.reduce((acc, cur) => acc + cur.amount, 0));
  const waterGlasses = (totalWaterMl / 250).toFixed(totalWaterMl % 250 === 0 ? 0 : 1);

  const dashWaterMetric = document.getElementById('dash-water-metric');
  const dashWaterGlasses = document.getElementById('dash-water-glasses');
  const dashWaterProgress = document.getElementById('dash-water-progress');
  const snapWater = document.getElementById('snap-water');
  const waterCurrentTotal = document.getElementById('water-current-total');
  const waterGlassesCount = document.getElementById('water-glasses-count');

  if (dashWaterMetric) {
    dashWaterMetric.innerHTML = `${totalWaterMl.toLocaleString()} <span class="metric-unit-inline">ml</span>`;
  }
  if (dashWaterGlasses) {
    dashWaterGlasses.textContent = `${waterGlasses} glasses (250ml)`;
  }
  if (dashWaterProgress) {
    const waterProgressPercent = Math.min(100, Math.round((totalWaterMl / 2000) * 100));
    dashWaterProgress.style.width = `${waterProgressPercent}%`;
  }
  if (waterCurrentTotal) {
    waterCurrentTotal.textContent = totalWaterMl.toLocaleString();
  }
  if (waterGlassesCount) {
    waterGlassesCount.textContent = `(~${waterGlasses} standard glasses)`;
  }
  if (snapWater) {
    snapWater.textContent = `${totalWaterMl.toLocaleString()} ml recorded today`;
  }

  // 3. Sleep Calculation (Today only) - Fixed for multi-entry accumulation
  const todaySleepLogs = appData.sleepLogs.filter((item) => item.date === todayStr);
  const totalSleepHours = todaySleepLogs.reduce((acc, cur) => acc + (Number(cur.hours) || 0), 0);
  const latestSleep = todaySleepLogs.length > 0 ? todaySleepLogs[0] : null;

  const dashSleepMetric = document.getElementById('dash-sleep-metric');
  const dashSleepQuality = document.getElementById('dash-sleep-quality');
  const dashSleepProgress = document.getElementById('dash-sleep-progress');
  const snapSleep = document.getElementById('snap-sleep');

  if (todaySleepLogs.length > 0) {
    if (dashSleepMetric) {
      dashSleepMetric.innerHTML = `${totalSleepHours} <span class="metric-unit-inline">hrs</span>`;
    }
    if (dashSleepQuality) {
      dashSleepQuality.textContent =
        todaySleepLogs.length > 1
          ? `${todaySleepLogs.length} entries (${totalSleepHours} hrs)`
          : `${latestSleep.quality} rest`;
    }
    if (dashSleepProgress) {
      const sleepPercent = Math.min(100, Math.round((totalSleepHours / 8) * 100));
      dashSleepProgress.style.width = `${sleepPercent}%`;
    }
    if (snapSleep) {
      snapSleep.textContent =
        todaySleepLogs.length > 1
          ? `${totalSleepHours} hrs logged (${todaySleepLogs.length} entries)`
          : `${latestSleep.hours} hrs &bull; ${latestSleep.quality}`;
    }
  } else {
    if (dashSleepMetric) {
      dashSleepMetric.innerHTML = `0 <span class="metric-unit-inline">hrs</span>`;
    }
    if (dashSleepQuality) {
      dashSleepQuality.textContent = 'Not logged yet';
    }
    if (dashSleepProgress) {
      dashSleepProgress.style.width = '0%';
    }
    if (snapSleep) {
      snapSleep.textContent = 'No sleep entry recorded';
    }
  }

  // 4. Exercise Calculation (Today only)
  const todayExercises = appData.exercises.filter((item) => item.date === todayStr);
  const exerciseCount = todayExercises.length;
  const totalWorkoutMins = todayExercises.reduce((acc, cur) => acc + cur.duration, 0);
  const totalWorkoutCalories = todayExercises.reduce((acc, cur) => acc + (Number(cur.calories) || 0), 0);

  const dashExerciseMetric = document.getElementById('dash-exercise-metric');
  const dashExerciseCount = document.getElementById('dash-exercise-count');
  const dashExerciseProgress = document.getElementById('dash-exercise-progress');
  const snapExercise = document.getElementById('snap-exercise');

  if (dashExerciseMetric) {
    dashExerciseMetric.innerHTML = `${totalWorkoutMins} <span class="metric-unit-inline">mins</span>`;
  }
  if (dashExerciseCount) {
    dashExerciseCount.textContent = `${exerciseCount} session${exerciseCount === 1 ? '' : 's'} today`;
  }
  if (dashExerciseProgress) {
    const exPercent = Math.min(100, Math.round((totalWorkoutMins / 60) * 100));
    dashExerciseProgress.style.width = `${exPercent}%`;
  }
  if (snapExercise) {
    snapExercise.textContent =
      exerciseCount === 0
        ? '0 sessions logged'
        : `${exerciseCount} session${exerciseCount === 1 ? '' : 's'} (${totalWorkoutMins} mins)`;
  }

  // 5. Calories Calculation (Today only: workouts + steps/movement)
  let todayActivityCalories = 0;
  todayActivities.forEach((item) => {
    todayActivityCalories += estimateActivityCalories(item.metricType, item.amount);
  });
  const totalDailyCalories = totalWorkoutCalories + todayActivityCalories;

  const dashCaloriesMetric = document.getElementById('dash-calories-metric');
  const dashCaloriesUnit = document.getElementById('dash-calories-unit');
  const dashCaloriesBreakdown = document.getElementById('dash-calories-breakdown');
  const snapCalories = document.getElementById('snap-calories');

  if (dashCaloriesMetric) {
    dashCaloriesMetric.innerHTML = `${totalDailyCalories.toLocaleString()} <span class="metric-unit-inline">kcal</span>`;
  }
  if (dashCaloriesUnit) {
    dashCaloriesUnit.textContent = totalDailyCalories > 0 ? 'Active energy burned today' : 'No burn recorded today';
  }
  if (dashCaloriesBreakdown) {
    dashCaloriesBreakdown.textContent = `${totalWorkoutCalories.toLocaleString()} from workouts • ${todayActivityCalories.toLocaleString()} from movement`;
  }
  if (snapCalories) {
    snapCalories.textContent = totalDailyCalories > 0
      ? `${totalDailyCalories.toLocaleString()} kcal burned today`
      : '0 kcal burned today';
  }

  // Synchronize 7-Day Weekly Progress and Charts
  updateWeeklyProgress();
}

/**
 * Renders all records lists
 */
function renderAllRecordLists() {
  renderActivityRecords();
  renderWaterRecords();
  renderSleepRecords();
  renderExerciseRecords();
}

// ==========================================================================
// 9. WEEKLY PROGRESS & CHART CONTROLLER (PHASE 5)
// ==========================================================================

const DAILY_ACTIVITY_TARGET_MINUTES = 30; // Reasonable daily active goal (30 mins recommended)

/**
 * Returns an array of the latest 7 consecutive days [6 days ago ... Today]
 * using local date arithmetic across week/month/year boundaries.
 */
function getPast7DaysList() {
  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    const dayName = targetDate.toLocaleDateString(undefined, { weekday: 'short' });
    const isToday = i === 0;

    days.push({
      isoDate,
      dayName,
      isToday,
      dateObj: targetDate,
    });
  }

  return days;
}

/**
 * Calculates activity and workout metrics for any given date
 */
function getDailyActivityMetrics(isoDate) {
  // 1. Exercise workouts on this date
  const dayExercises = appData.exercises.filter((item) => item.date === isoDate);
  const workoutMins = dayExercises.reduce((sum, item) => sum + item.duration, 0);
  const workoutCount = dayExercises.length;
  const workoutCalories = dayExercises.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);

  // 2. Activity logs on this date
  const dayActivities = appData.activities.filter((item) => item.date === isoDate);
  let directActiveMins = 0;
  let stepsCount = 0;
  let activityCalories = 0;

  dayActivities.forEach((item) => {
    activityCalories += estimateActivityCalories(item.metricType, item.amount);
    if (item.metricType === 'minutes') {
      directActiveMins += item.amount;
    } else {
      stepsCount += item.amount;
      // Convert steps to equivalent active movement: 100 steps ~= 1 active minute
      directActiveMins += Math.round(item.amount / 100);
    }
  });

  const totalActiveMins = workoutMins + directActiveMins;
  const totalCalories = workoutCalories + activityCalories;
  const isTargetAchieved = totalActiveMins >= DAILY_ACTIVITY_TARGET_MINUTES;

  // 3. Water intake on this date
  const dayWater = appData.waterLogs.filter((item) => item.date === isoDate);
  const totalWaterMl = Math.max(0, dayWater.reduce((sum, item) => sum + item.amount, 0));

  // 4. Sleep on this date (summing all recorded durations for the day)
  const daySleep = appData.sleepLogs.filter((item) => item.date === isoDate);
  const sleepHours = daySleep.reduce((sum, item) => sum + (Number(item.hours) || 0), 0);

  return {
    isoDate,
    workoutMins,
    workoutCount,
    workoutCalories,
    stepsCount,
    directActiveMins,
    activityCalories,
    totalActiveMins,
    totalCalories,
    isTargetAchieved,
    totalWaterMl,
    sleepHours,
    hasAnyData: workoutMins > 0 || dayActivities.length > 0 || totalWaterMl > 0 || sleepHours > 0 || totalCalories > 0,
  };
}

/**
 * Re-computes 7-day totals, daily completion metrics, and renders the dynamic bar charts
 */
function updateWeeklyProgress() {
  const past7Days = getPast7DaysList();
  const dailyMetrics = past7Days.map((d) => ({
    ...d,
    ...getDailyActivityMetrics(d.isoDate),
  }));

  // 1. Aggregate Weekly Summary Totals
  let weeklyActiveMinutes = 0;
  let weeklyTotalCalories = 0;
  let weeklyTotalWaterMl = 0;
  let weeklyTotalSleepHours = 0;
  let daysWithSleepRecorded = 0;
  let weeklyTotalWorkouts = 0;

  dailyMetrics.forEach((d) => {
    weeklyActiveMinutes += d.totalActiveMins;
    weeklyTotalCalories += d.totalCalories;
    weeklyTotalWaterMl += d.totalWaterMl;
    weeklyTotalWorkouts += d.workoutCount;
    if (d.sleepHours > 0) {
      weeklyTotalSleepHours += d.sleepHours;
      daysWithSleepRecorded++;
    }
  });

  const avgDailyWaterMl = Math.round(weeklyTotalWaterMl / 7);
  const avgDailyCalories = Math.round(weeklyTotalCalories / 7);
  const avgSleepHours =
    daysWithSleepRecorded > 0 ? (weeklyTotalSleepHours / daysWithSleepRecorded).toFixed(1) : '0';

  // 2. Update Weekly Metric Badges
  const weekTotalActElem = document.getElementById('week-total-activity');
  const weekAvgWaterElem = document.getElementById('week-avg-water');
  const weekAvgSleepElem = document.getElementById('week-avg-sleep');
  const weekTotalWorkoutsElem = document.getElementById('week-total-workouts');
  const weekTotalCaloriesElem = document.getElementById('week-total-calories');
  const weekAvgCaloriesElem = document.getElementById('week-avg-calories');
  const chartDateRangeElem = document.getElementById('chart-date-range');

  if (weekTotalActElem) {
    weekTotalActElem.textContent = `${weeklyActiveMinutes.toLocaleString()} mins`;
  }
  if (weekAvgWaterElem) {
    weekAvgWaterElem.textContent = `${avgDailyWaterMl.toLocaleString()} ml`;
  }
  if (weekAvgSleepElem) {
    weekAvgSleepElem.textContent = `${avgSleepHours} hrs`;
  }
  if (weekTotalWorkoutsElem) {
    weekTotalWorkoutsElem.textContent = `${weeklyTotalWorkouts} session${weeklyTotalWorkouts === 1 ? '' : 's'}`;
  }
  if (weekTotalCaloriesElem) {
    weekTotalCaloriesElem.textContent = `${weeklyTotalCalories.toLocaleString()} kcal`;
  }
  if (weekAvgCaloriesElem) {
    weekAvgCaloriesElem.textContent = `${avgDailyCalories.toLocaleString()} kcal / day avg`;
  }

  // Update chart date range subtitle
  if (chartDateRangeElem && past7Days.length === 7) {
    const firstDay = past7Days[0];
    const lastDay = past7Days[6];
    chartDateRangeElem.textContent = `${formatDisplayDate(firstDay.isoDate)} – ${formatDisplayDate(lastDay.isoDate)} (Daily Habit Target: ${DAILY_ACTIVITY_TARGET_MINUTES} mins)`;
  }

  // 3. Render Dynamic Weekly Bar Chart
  const weeklyChartElem = document.getElementById('weekly-bar-chart');
  if (weeklyChartElem) {
    // Dynamic reference scaling: 60 mins base, or max recorded day if higher
    const maxDayMins = Math.max(...dailyMetrics.map((d) => d.totalActiveMins), 60);

    weeklyChartElem.innerHTML = dailyMetrics
      .map((d) => {
        const heightPercent =
          d.totalActiveMins > 0 ? Math.min(100, Math.max(6, Math.round((d.totalActiveMins / maxDayMins) * 100))) : 0;

        const valueText = d.totalActiveMins > 0 ? `${d.totalActiveMins}m` : '0m';
        const dayClass = d.isToday ? 'is-today' : '';
        const emptyClass = d.totalActiveMins === 0 ? 'is-zero' : '';
        const targetClass = d.isTargetAchieved ? 'target-met' : '';
        const targetStatus = d.isTargetAchieved ? 'Goal met' : `${d.totalActiveMins}/${DAILY_ACTIVITY_TARGET_MINUTES}m`;
        const titleTooltip = `${d.dayName} (${formatDisplayDate(d.isoDate)}): ${d.totalActiveMins} mins • ~${d.totalCalories} kcal [${targetStatus}]`;

        return `
        <div class="chart-bar-column ${dayClass} ${emptyClass} ${targetClass}" tabindex="0" role="img" title="${escapeHtml(titleTooltip)}" aria-label="${escapeHtml(titleTooltip)}">
          <div class="bar-value-label">${valueText}</div>
          <div class="bar-track">
            <div class="bar-fill" style="height: ${heightPercent}%;"></div>
          </div>
          <div class="bar-day-label">${d.isToday ? 'Today' : d.dayName}</div>
        </div>
      `;
      })
      .join('');
  }

  // 4. Render Dashboard Mini Chart Preview
  const miniChartElem = document.getElementById('dashboard-mini-chart');
  if (miniChartElem) {
    const maxDayMins = Math.max(...dailyMetrics.map((d) => d.totalActiveMins), 60);

    miniChartElem.innerHTML = dailyMetrics
      .map((d) => {
        const heightPercent =
          d.totalActiveMins > 0 ? Math.min(100, Math.max(10, Math.round((d.totalActiveMins / maxDayMins) * 100))) : 0;
        const activeClass = d.isToday ? 'active-day' : '';
        const targetClass = d.isTargetAchieved ? 'target-met' : '';
        const titleTooltip = `${d.dayName}: ${d.totalActiveMins} mins • ~${d.totalCalories} kcal`;

        return `
        <div class="mini-bar-col" title="${escapeHtml(titleTooltip)}">
          <div class="mini-bar-fill ${activeClass} ${targetClass}" style="height: ${heightPercent}%;"></div>
          <span>${d.dayName[0]}</span>
        </div>
      `;
      })
      .join('');
  }
}

// ==========================================================================
// 10. NAVIGATION & MOBILE DRAWER (PRESERVED FROM PHASE 1 & 2)
// ==========================================================================

function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.app-section');
  const pageTitle = document.getElementById('page-title');

  const titlesMap = {
    'section-dashboard': 'Dashboard Overview',
    'section-activity': 'Daily Activity Tracker',
    'section-water': 'Water Intake Tracker',
    'section-sleep': 'Sleep Duration Tracker',
    'section-exercise': 'Exercise & Workout Tracker',
    'section-progress': 'Weekly Progress & Habits',
  };

  function switchSection(targetSectionId) {
    sections.forEach((section) => section.classList.remove('active'));
    navButtons.forEach((btn) => {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    });

    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    const matchingNavBtn = document.querySelector(`.nav-item[data-section="${targetSectionId}"]`);
    if (matchingNavBtn) {
      matchingNavBtn.classList.add('active');
      matchingNavBtn.setAttribute('aria-current', 'page');
    }

    if (pageTitle && titlesMap[targetSectionId]) {
      pageTitle.textContent = titlesMap[targetSectionId];
    }

    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSection = btn.getAttribute('data-section');
      if (targetSection) switchSection(targetSection);
    });
  });

  const actionLinks = document.querySelectorAll('[data-target]');
  actionLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute('data-target');
      if (targetSection) switchSection(targetSection);
    });
  });
}

function initMobileMenu() {
  const btnToggle = document.getElementById('btn-menu-toggle');
  const btnClose = document.getElementById('btn-close-sidebar');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (btnToggle && sidebar && overlay) {
    btnToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      btnToggle.setAttribute('aria-expanded', 'true');
      if (btnClose) btnClose.focus();
    });
  }

  if (btnClose && sidebar && overlay) {
    btnClose.addEventListener('click', closeMobileSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      closeMobileSidebar();
      if (btnToggle) btnToggle.focus();
    }
  });
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btnToggle = document.getElementById('btn-menu-toggle');

  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  if (btnToggle) btnToggle.setAttribute('aria-expanded', 'false');
}

function initFormInteractions() {
  const metricTypeSelect = document.getElementById('activity-metric-type');
  const amountLabel = document.getElementById('activity-amount-label');
  const amountInput = document.getElementById('activity-amount');

  if (metricTypeSelect && amountLabel && amountInput) {
    metricTypeSelect.addEventListener('change', () => {
      if (metricTypeSelect.value === 'minutes') {
        amountLabel.textContent = 'Active Duration (Minutes)';
        amountInput.placeholder = 'e.g., 45';
        amountInput.max = '720';
      } else {
        amountLabel.textContent = 'Amount (Steps)';
        amountInput.placeholder = 'e.g., 6000';
        amountInput.max = '100000';
      }
    });
  }
}
