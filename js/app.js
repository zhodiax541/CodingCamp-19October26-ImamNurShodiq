/* app.js — To-Do Life Dashboard application logic */

/* ─────────────────────────────────────────────
   Task 3.1 — State object and data-model helpers
   ───────────────────────────────────────────── */

/** Single source of truth for all mutable runtime data. */
const state = {
  todos: [],          // Task[]
  links: [],          // Link[]
  timer: {
    remaining:  1500, // seconds (25 minutes)
    intervalId: null, // setInterval handle or null when stopped
    running:    false // boolean
  }
};

/**
 * Generates a unique ID.
 * Uses crypto.randomUUID() when available; falls back to Date.now().toString().
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

/**
 * Task factory — creates a new Task object.
 * @param {string} description - Task text (1–500 characters)
 * @returns {{ id: string, description: string, done: boolean, createdAt: number }}
 */
function createTask(description) {
  return {
    id:          generateId(),
    description: description,
    done:        false,
    createdAt:   Date.now()
  };
}

/**
 * Link factory — creates a new Link object.
 * @param {string} label - Display label (1–50 characters)
 * @param {string} url   - Target URL (already normalised; 1–2048 characters)
 * @returns {{ id: string, label: string, url: string }}
 */
function createLink(label, url) {
  return {
    id:    generateId(),
    label: label,
    url:   url
  };
}

/* ─────────────────────────────────────────────
   Task 3.2 — Storage module
   ───────────────────────────────────────────── */

/**
 * Storage module — centralises all localStorage interactions.
 * Every method wraps its body in try/catch and returns a safe default on failure.
 *
 * Keys:
 *   tld_todos  → JSON-serialised Task[]
 *   tld_links  → JSON-serialised Link[]
 */
const Storage = {
  /**
   * Reads tld_todos from localStorage, parses JSON, and returns a Task[].
   * Returns [] on any error (key missing, JSON invalid, localStorage unavailable).
   * @returns {Array<{id: string, description: string, done: boolean, createdAt: number}>}
   */
  loadTodos() {
    try {
      const raw = localStorage.getItem('tld_todos');
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  },

  /**
   * Serialises tasks to JSON and writes to tld_todos.
   * Fails silently on any error — the in-memory state is still up to date.
   * @param {Array<{id: string, description: string, done: boolean, createdAt: number}>} tasks
   */
  saveTodos(tasks) {
    try {
      localStorage.setItem('tld_todos', JSON.stringify(tasks));
    } catch (_err) {
      // Silent fail — requirement 3.9/3.11: unavailability must not throw to the caller.
    }
  },

  /**
   * Reads tld_links from localStorage, parses JSON, and returns a Link[].
   * Returns [] on any error (key missing, JSON invalid, localStorage unavailable).
   * @returns {Array<{id: string, label: string, url: string}>}
   */
  loadLinks() {
    try {
      const raw = localStorage.getItem('tld_links');
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  },

  /**
   * Serialises links to JSON and writes to tld_links.
   * On QuotaExceededError or any other write failure:
   *   - Does NOT overwrite the previously saved state.
   *   - Displays an error message inside #links-list.
   * @param {Array<{id: string, label: string, url: string}>} links
   */
  saveLinks(links) {
    try {
      localStorage.setItem('tld_links', JSON.stringify(links));
    } catch (_err) {
      // Could not write — surface an error inside the Quick Links widget.
      const container = document.getElementById('links-list');
      if (container) {
        // Remove any existing storage-error banner to avoid duplicates.
        const existing = container.querySelector('.storage-error');
        if (existing) existing.remove();

        const banner = document.createElement('p');
        banner.className = 'storage-error error-msg';
        banner.textContent = 'Links could not be saved. Storage is unavailable or full.';
        container.prepend(banner);
      }
      // Do not rethrow — calling code must not see an exception here.
    }
  }
};

/* ─────────────────────────────────────────────
   Task 4.1 — Greeting widget: getGreeting() and Greeting.render()
   ───────────────────────────────────────────── */

/**
 * Pure function — maps a 24-hour integer hour to a greeting string.
 * Ranges:
 *   05–11 → "Good Morning"
 *   12–17 → "Good Afternoon"
 *   18–21 → "Good Evening"
 *   22–23, 00–04 → "Good Night"
 *
 * @param {number} hour - Integer in [0, 23]
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"|"Good Night"}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 21) return 'Good Evening';
  return 'Good Night'; // covers 22–23 and 0–4
}

/**
 * Greeting widget — renders the current time, date, and greeting into the DOM.
 * Greeting.start() (task 4.2) will be merged into this object later.
 */
const Greeting = {
  /**
   * Reads the current local time via `new Date()`, formats it, and updates
   * the three greeting DOM elements:
   *   #greeting-time  → "HH:MM" (zero-padded 24-hour clock)
   *   #greeting-date  → "Day, DD Month YYYY"  e.g. "Friday, 23 October 2026"
   *   #greeting-text  → one of the four greeting strings
   *
   * On ANY thrown error, falls back to:
   *   #greeting-time  → "--:--"
   *   #greeting-date  → "Date unavailable"
   *   #greeting-text  → "" (empty string)
   *
   * Requirement 1.7: if time cannot be determined show fallback values.
   */
  render() {
    // Helper: safely set textContent, tolerating a missing element.
    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    try {
      const now = new Date();

      // -- Time: "HH:MM:SS" ----------------------------------------------
      const hours   = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;

      // ── Date: "Day, DD Month YYYY" ─────────────────────────────────────
      const DAY_NAMES = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
      ];
      const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const dayName   = DAY_NAMES[now.getDay()];
      const dayNumber = now.getDate();
      const monthName = MONTH_NAMES[now.getMonth()];
      const year      = now.getFullYear();
      const dateStr   = `${dayName}, ${dayNumber} ${monthName} ${year}`;

      // ── Greeting ───────────────────────────────────────────────────────
      const greetingStr = getGreeting(now.getHours());

      setText('greeting-time', timeStr);
      setText('greeting-date', dateStr);
      setText('greeting-text', greetingStr);

    } catch (_err) {
      // Requirement 1.7 — time could not be determined; show fallback values.
      setText('greeting-time', '--:--:--');
      setText('greeting-date', 'Date unavailable');
      setText('greeting-text', '');
    }
  },

  /**
   * Renders immediately, then schedules a re-render every second.
   * Satisfies Requirement 1.1: greeting and clock update every second.
   */
  start() {
    this.render();
    setInterval(() => this.render(), 1_000);
  }
};

/* ─────────────────────────────────────────────
   Task 5.1 — Timer widget: Timer.format() and Timer.init()
   ───────────────────────────────────────────── */

/**
 * Focus Timer widget — Pomodoro-style 25-minute countdown.
 *
 * Methods added in task 5.1: format(), init()
 * Methods added in task 5.3: tick(), start(), stop(), reset()
 */
const Timer = {
  /**
   * Formats a number of seconds as a zero-padded "MM:SS" string.
   *
   * @param {number} seconds - Integer in [0, 1500]
   * @returns {string} e.g. format(0) → "00:00", format(90) → "01:30", format(1500) → "25:00"
   */
  format(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },

  /**
   * Initialises the timer widget:
   *   - Sets #timer-display to the formatted remaining time.
   *   - Binds click handlers on #timer-start, #timer-stop, #timer-reset
   *     to Timer.start, Timer.stop, Timer.reset respectively.
   *
   * Requirement 2.1: initialise with 25 minutes (1500 seconds).
   * Requirement 2.3: display remaining time in MM:SS format.
   */
  init() {
    // Set initial display.
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = Timer.format(state.timer.remaining);
    }

    // Bind Start button.
    const startBtn = document.getElementById('timer-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        Timer.start();
      });
    }

    // Bind Stop button.
    const stopBtn = document.getElementById('timer-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        Timer.stop();
      });
    }

    // Bind Reset button.
    const resetBtn = document.getElementById('timer-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        Timer.reset();
      });
    }
  },

  /* ── Task 5.3 methods ─────────────────────────────────────────────── */

  /**
   * Called once per second while the timer is running.
   * Decrements remaining by 1, updates #timer-display, and — when
   * remaining reaches 0 — stops the timer and reveals #timer-complete.
   *
   * Requirement 2.3: display updates every second.
   * Requirement 2.6: stop and show notification when 00:00 is reached.
   */
  tick() {
    state.timer.remaining -= 1;

    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = Timer.format(state.timer.remaining);
    }

    if (state.timer.remaining <= 0) {
      Timer.stop();

      // Show the session-complete notification (remove .hidden).
      const complete = document.getElementById('timer-complete');
      if (complete) {
        complete.classList.remove('hidden');
      }
    }
  },

  /**
   * Begins or resumes the countdown.
   * No-op when the timer is already running or has reached 00:00.
   *
   * Requirement 2.2: start counting down one second at a time.
   * Requirement 2.7: ignore Start if already running or remaining is 0.
   */
  start() {
    // Guard: already running, or nothing left to count down.
    if (state.timer.running || state.timer.remaining <= 0) return;

    state.timer.running    = true;
    document.getElementById('timer-start').disabled = true;
    document.getElementById('timer-stop').disabled = false;
    state.timer.intervalId = setInterval(function () {
      Timer.tick();
    }, 1000);
  },

  /**
   * Pauses the countdown; retains the current remaining time.
   *
   * Requirement 2.4: pause on Stop, keep remaining time.
   */
  stop() {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
    state.timer.running    = false;
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-stop').disabled = true;

    // state.timer.remaining is intentionally left unchanged.
  },

  /**
   * Stops any active countdown, restores remaining to 1500, updates the
   * display, and hides the session-complete notification.
   *
   * Requirement 2.5: restore to 25 minutes on Reset.
   */
  reset() {
    Timer.stop();

    state.timer.remaining = 1500;

    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = Timer.format(1500);
    }

    // Re-hide the session-complete notification.
    const complete = document.getElementById('timer-complete');
    if (complete) {
      complete.classList.add('hidden');
    }
  }
};

/* ─────────────────────────────────────────────
   Task 7.1 — To-Do List widget: Todos.render() and Todos.init()
   ───────────────────────────────────────────── */

/**
 * To-Do List widget — manages task CRUD and DOM synchronisation.
 *
 * Methods added in task 7.1: render(), init()
 * Methods added in task 7.2: add()
 * Methods added in task 7.4: toggle(), delete(), save()
 * Methods added in task 7.6: startEdit(), confirmEdit(), cancelEdit()
 */
const Todos = {
  /**
   * Full DOM sync — clears #todo-list and rebuilds it from state.todos.
   *
   * Each <li> contains:
   *   - a checkbox input (checked when task.done is true) that calls Todos.toggle(id)
   *   - a <span class="todo-desc"> with the task description
   *   - an edit <button> that calls Todos.startEdit(id)
   *   - a delete <button> that calls Todos.delete(id)
   *
   * The <li> receives the class "done" when task.done is true,
   * allowing CSS to apply strikethrough styling.
   *
   * Requirement 3.10: restore previously saved tasks on load.
   */
  render() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    // Clear existing children.
    list.innerHTML = '';

    state.todos.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      // ── Checkbox ────────────────────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark task complete');
      checkbox.addEventListener('change', function () {
        if (typeof Todos.toggle === 'function') Todos.toggle(task.id);
      });

      // ── Description span ────────────────────────────────────────────────
      const span = document.createElement('span');
      span.className   = 'todo-desc';
      span.textContent = task.description;

      // ── Edit button ──────────────────────────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.type        = 'button';
      editBtn.className   = 'todo-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.addEventListener('click', function () {
        if (typeof Todos.startEdit === 'function') Todos.startEdit(task.id);
      });

      // ── Delete button ────────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type        = 'button';
      deleteBtn.className   = 'todo-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.addEventListener('click', function () {
        if (typeof Todos.delete === 'function') Todos.delete(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  },

  /**
   * Initialises the To-Do List widget:
   *   1. Loads saved tasks from localStorage via Storage.loadTodos().
   *   2. Assigns the result to state.todos.
   *   3. Calls Todos.render() to populate the DOM.
   *   4. Binds #todo-add-btn click → Todos.add (added in task 7.2).
   *   5. Binds #todo-input Enter keydown → Todos.add (added in task 7.2).
   *
   * Both event handlers guard against Todos.add not yet being defined, so
   * init() is safe to call even before task 7.2 is implemented.
   *
   * Requirement 3.10: restore previously saved tasks on Dashboard load.
   * Requirement 3.11: if localStorage is unavailable or corrupt, start empty.
   */
  init() {
    // Load persisted data (returns [] when unavailable or corrupt — Req 3.11).
    state.todos = Storage.loadTodos();

    // Populate DOM from loaded state.
    Todos.render();

    // ── Bind Add button ──────────────────────────────────────────────────
    const addBtn = document.getElementById('todo-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (typeof Todos.add === 'function') {
          const input = document.getElementById('todo-input');
          Todos.add(input ? input.value : '');
        }
      });
    }

    // ── Bind Enter key on input ──────────────────────────────────────────
    const input = document.getElementById('todo-input');
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          if (typeof Todos.add === 'function') {
            Todos.add(input.value);
          }
        }
      });

      // ── Clear error while user is typing (Requirement 3.2) ─────────────
      input.addEventListener('input', function () {
        const errorEl = document.getElementById('todo-error');
        if (errorEl) errorEl.classList.add('hidden');
      });
    }
  },

  /* ── Task 7.2 — add() ─────────────────────────────────────────────── */

  /**
   * Validates `description` and, if valid, creates a new Task, appends it
   * to state.todos, re-renders the list, persists to localStorage, and
   * clears the input field.
   *
   * Validation rules (Requirement 3.2):
   *   • Empty or whitespace-only → show error in #todo-error, abort.
   *   • Length > 500 characters  → show error in #todo-error, abort.
   *
   * On success (Requirement 3.1):
   *   • createTask(description) → push to state.todos
   *   • Todos.render()
   *   • Todos.save()  (guarded — added in task 7.4)
   *   • Clear #todo-input value
   *   • Hide #todo-error
   *
   * @param {string} description - Raw value from the input field.
   */
  add(description) {
    const errorEl = document.getElementById('todo-error');

    /** Show an error message and abort. */
    function showError(msg) {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
      }
    }

    /** Hide any existing error message. */
    function clearError() {
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    }

    // ── Validation ────────────────────────────────────────────────────────
    if (!description || description.trim() === '') {
      showError('Task description cannot be empty.');
      return;
    }

    if (description.length > 500) {
      showError('Task description must be 500 characters or fewer.');
      return;
    }

    // ── Success path ──────────────────────────────────────────────────────
    const task = createTask(description.trim());
    state.todos.push(task);

    Todos.render();

    // save() is added in task 7.4 — call it only when it exists.
    if (typeof Todos.save === 'function') {
      Todos.save();
    }

    // Clear the input field.
    const inputEl = document.getElementById('todo-input');
    if (inputEl) inputEl.value = '';

    clearError();
  },

  /* ── Task 7.4 — toggle(), delete(), save() ────────────────────────── */

  /**
   * Flips the `done` flag of the task identified by `id`, re-renders the
   * list, and persists the new state to localStorage.
   *
   * Requirement 3.3: clicking the checkbox marks/unmarks a task as complete.
   * Requirement 3.8: changes are persisted to localStorage.
   *
   * @param {string} id - The task's unique identifier.
   */
  toggle(id) {
    const task = state.todos.find(function (t) { return t.id === id; });
    if (task) {
      task.done = !task.done;
    }
    Todos.render();
    Todos.save();
  },

  /**
   * Removes the task identified by `id` from `state.todos`, re-renders the
   * list, and persists the updated array to localStorage.
   *
   * Requirement 3.9: deleting a task removes it from the list and storage.
   *
   * @param {string} id - The task's unique identifier.
   */
  delete(id) {
    state.todos = state.todos.filter(function (t) { return t.id !== id; });
    Todos.render();
    Todos.save();
  },

  /**
   * Persists the current `state.todos` array to localStorage via the
   * Storage module.
   *
   * Requirement 3.8: tasks must survive a page reload.
   */
  save() {
    Storage.saveTodos(state.todos);
  },

  /* ── Task 7.6 — startEdit(), confirmEdit(), cancelEdit() ─────────── */

  /**
   * Switches the task row identified by `id` into edit mode.
   *
   * Steps:
   *   1. Locate the <li data-id="…"> in #todo-list.
   *   2. Replace <span class="todo-desc"> with <input type="text"> pre-filled
   *      with the current description.
   *   3. Append a <span class="todo-edit-error error-msg hidden"> for inline
   *      validation messages (used by confirmEdit).
   *   4. Insert a Confirm button and a Cancel button after the input.
   *   5. Hide the existing Edit and Delete buttons for this row.
   *
   * Requirement 3.4: clicking the edit control switches to editable input.
   *
   * @param {string} id - The task's unique identifier.
   */
  startEdit(id) {
    const list = document.getElementById('todo-list');
    if (!list) return;

    // Find the <li> for this task.
    const li = list.querySelector('[data-id="' + id + '"]');
    if (!li) return;

    // Locate the description span and the existing edit/delete buttons.
    const span      = li.querySelector('.todo-desc');
    const editBtn   = li.querySelector('.todo-edit-btn');
    const deleteBtn = li.querySelector('.todo-delete-btn');

    if (!span) return;

    // ── Build edit input ────────────────────────────────────────────────
    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'todo-edit-input';
    input.value     = span.textContent;
    input.setAttribute('aria-label', 'Edit task description');
    // Allow confirming with Enter key.
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        Todos.confirmEdit(id, input.value);
      } else if (event.key === 'Escape') {
        Todos.cancelEdit(id);
      }
      // Clear the inline error whenever the user types.
      const errEl = li.querySelector('.todo-edit-error');
      if (errEl && event.key !== 'Enter' && event.key !== 'Escape') {
        errEl.classList.add('hidden');
      }
    });
    // Also clear error on every keystroke (input event).
    input.addEventListener('input', function () {
      const errEl = li.querySelector('.todo-edit-error');
      if (errEl) errEl.classList.add('hidden');
    });

    // ── Inline error element ────────────────────────────────────────────
    const errorSpan = document.createElement('span');
    errorSpan.className = 'todo-edit-error error-msg hidden';

    // ── Confirm button ──────────────────────────────────────────────────
    const confirmBtn = document.createElement('button');
    confirmBtn.type        = 'button';
    confirmBtn.className   = 'todo-confirm-btn';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.setAttribute('aria-label', 'Confirm edit');
    confirmBtn.addEventListener('click', function () {
      Todos.confirmEdit(id, input.value);
    });

    // ── Cancel button ───────────────────────────────────────────────────
    const cancelBtn = document.createElement('button');
    cancelBtn.type        = 'button';
    cancelBtn.className   = 'todo-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.addEventListener('click', function () {
      Todos.cancelEdit(id);
    });

    // ── Swap span → input + error, insert action buttons ───────────────
    li.replaceChild(input, span);
    // Insert errorSpan, confirmBtn, cancelBtn directly after the input.
    input.insertAdjacentElement('afterend', errorSpan);
    errorSpan.insertAdjacentElement('afterend', confirmBtn);
    confirmBtn.insertAdjacentElement('afterend', cancelBtn);

    // Hide existing edit and delete buttons.
    if (editBtn)   editBtn.classList.add('hidden');
    if (deleteBtn) deleteBtn.classList.add('hidden');

    // Focus the input for immediate typing.
    input.focus();
  },

  /**
   * Handles the user confirming an in-progress edit.
   *
   * Validation rules (Requirements 3.5, 3.6, 3.7):
   *   • newDesc is empty or whitespace-only → revert silently to display mode
   *     (original description is retained because state.todos is unchanged).
   *   • newDesc.length > 500 → stay in edit mode, retain current input value,
   *     show inline error adjacent to the edit input.
   *   • Otherwise → update task.description = newDesc.trim(), render, save.
   *
   * Requirement 3.9: persist to localStorage after successful edit.
   *
   * @param {string} id      - The task's unique identifier.
   * @param {string} newDesc - Raw value from the edit input.
   */
  confirmEdit(id, newDesc) {
    // ── Case 1: empty / whitespace-only → silent revert ──────────────────
    if (!newDesc || newDesc.trim() === '') {
      Todos.render();
      return;
    }

    // ── Case 2: description too long → stay in edit mode with error ───────
    if (newDesc.length > 500) {
      // Surface the error inside the currently open edit row.
      const list = document.getElementById('todo-list');
      if (list) {
        const li = list.querySelector('[data-id="' + id + '"]');
        if (li) {
          const errEl = li.querySelector('.todo-edit-error');
          if (errEl) {
            errEl.textContent = 'Description must be 500 characters or fewer.';
            errEl.classList.remove('hidden');
          }
        }
      }
      // Retain the input value — do not call render() or alter state.todos.
      return;
    }

    // ── Case 3: valid description → update state, render, persist ─────────
    const task = state.todos.find(function (t) { return t.id === id; });
    if (task) {
      task.description = newDesc.trim();
    }
    Todos.render();
    Todos.save();
  },

  /**
   * Reverts the task row for `id` back to display mode without saving any
   * changes. Delegates to Todos.render() which rebuilds the list from the
   * unchanged state.todos.
   *
   * Requirement 3.4: user can cancel an edit and restore the original text.
   *
   * @param {string} id - The task's unique identifier.
   */
  cancelEdit(id) {
    // Re-rendering from state restores the original description.
    Todos.render();
  }
};

/* ─────────────────────────────────────────────
   Task 8.1 — Quick Links widget: Links.normaliseUrl() and Links.render()
   ───────────────────────────────────────────── */

/**
 * Quick Links widget — manages shortcut-button CRUD and DOM synchronisation.
 *
 * Methods added in task 8.1: normaliseUrl(), render()
 * Methods added in task 8.3: add(), delete(), openLink(), save(), init()
 */
const Links = {
  /**
   * Ensures a URL begins with "http://" or "https://".
   * The check is case-insensitive. If neither prefix is present, "https://"
   * is prepended. If a matching prefix already exists, the URL is returned
   * unchanged.
   *
   * Requirement 4.3: auto-prepend https:// to URLs without an explicit scheme.
   *
   * @param {string} url - Raw URL string from user input.
   * @returns {string} Normalised URL that begins with http:// or https://.
   */
  normaliseUrl(url) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return 'https://' + url;
  },

  /**
   * Full DOM sync — clears #links-list and rebuilds it from state.links.
   *
   * For each link a <div role="listitem"> wrapper is created containing:
   *   - A <button class="link-open-btn"> with the link's label text that
   *     calls Links.openLink(link.url) on click. If Links.openLink is not yet
   *     defined the click is a no-op, making this safe to call before task 8.3.
   *   - A <button class="link-delete-btn"> labelled "Delete" that calls
   *     Links.delete(link.id) on click. Similarly guarded against absence.
   *
   * Requirement 4.4: clicking a link button opens the URL in a new tab.
   * Requirement 4.5: each link has a delete control to remove it immediately.
   *
   * @returns {void}
   */
  render() {
    const container = document.getElementById('links-list');
    if (!container) return;

    // Clear existing children (but preserve any storage-error banner that
    // Storage.saveLinks may have injected — remove it so it doesn't linger
    // after a successful re-render).
    container.innerHTML = '';

    state.links.forEach(function (link) {
      // ── Wrapper ────────────────────────────────────────────────────────
      const item = document.createElement('div');
      item.className = 'link-item';
      item.setAttribute('role', 'listitem');
      item.dataset.id = link.id;

      // ── Open-link button ───────────────────────────────────────────────
      const openBtn = document.createElement('button');
      openBtn.type        = 'button';
      openBtn.className   = 'link-open-btn';
      openBtn.textContent = link.label;
      openBtn.setAttribute('aria-label', 'Open ' + link.label);
      openBtn.addEventListener('click', function () {
        // Guard: Links.openLink is added in task 8.3.
        if (typeof Links.openLink === 'function') {
          Links.openLink(link.url);
        }
      });

      // ── Delete button ──────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type        = 'button';
      deleteBtn.className   = 'link-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete ' + link.label);
      deleteBtn.addEventListener('click', function () {
        // Guard: Links.delete is added in task 8.3.
        if (typeof Links.delete === 'function') {
          Links.delete(link.id);
        }
      });

      item.appendChild(openBtn);
      item.appendChild(deleteBtn);
      container.appendChild(item);
    });
  },

  /* ── Task 8.3 — add(), delete(), openLink(), save(), init() ─────── */

  /**
   * Validates label and url, normalises the URL, creates a new Link, appends
   * it to state.links, re-renders, and persists to localStorage.
   *
   * Validation rules (Requirement 4.2, 4.8):
   *   • label empty              → show #link-label-error, abort.
   *   • label > 50 characters    → show #link-label-error, abort.
   *   • url empty                → show #link-url-error, abort.
   *   • url > 2048 characters    → show #link-url-error, abort.
   *   • state.links.length >= 20 → show #link-url-error ("Maximum 20 links reached"), abort.
   *
   * On success (Requirements 4.1, 4.3, 4.6):
   *   • normalise URL, call createLink, push to state.links
   *   • Links.render(), Links.save()
   *   • clear input fields and hide both error elements
   *
   * @param {string} label - Raw label value from #link-label-input.
   * @param {string} url   - Raw URL value from #link-url-input.
   */
  add(label, url) {
    const labelErrorEl = document.getElementById('link-label-error');
    const urlErrorEl   = document.getElementById('link-url-error');

    /** Show an error on the label field and abort. */
    function showLabelError(msg) {
      if (labelErrorEl) {
        labelErrorEl.textContent = msg;
        labelErrorEl.classList.remove('hidden');
      }
    }

    /** Show an error on the url field and abort. */
    function showUrlError(msg) {
      if (urlErrorEl) {
        urlErrorEl.textContent = msg;
        urlErrorEl.classList.remove('hidden');
      }
    }

    /** Hide both error elements. */
    function clearErrors() {
      if (labelErrorEl) {
        labelErrorEl.textContent = '';
        labelErrorEl.classList.add('hidden');
      }
      if (urlErrorEl) {
        urlErrorEl.textContent = '';
        urlErrorEl.classList.add('hidden');
      }
    }

    // ── Validate label ───────────────────────────────────────────────────
    if (!label || label.trim() === '') {
      showLabelError('Link label cannot be empty.');
      return;
    }

    if (label.length > 50) {
      showLabelError('Link label must be 50 characters or fewer.');
      return;
    }

    // ── Validate URL ─────────────────────────────────────────────────────
    if (!url || url.trim() === '') {
      showUrlError('Link URL cannot be empty.');
      return;
    }

    if (url.length > 2048) {
      showUrlError('Link URL must be 2048 characters or fewer.');
      return;
    }

    // ── Validate list size cap ────────────────────────────────────────────
    if (state.links.length >= 20) {
      showUrlError('Maximum 20 links reached.');
      return;
    }

    // ── Success path ──────────────────────────────────────────────────────
    const normalisedUrl = Links.normaliseUrl(url.trim());
    const link = createLink(label.trim(), normalisedUrl);
    state.links.push(link);

    Links.render();
    Links.save();

    // Clear input fields.
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';

    clearErrors();
  },

  /**
   * Removes the link identified by `id` from state.links, re-renders, and
   * persists the updated array to localStorage.
   *
   * Requirement 4.5: delete control removes the link immediately.
   * Requirement 4.6: persist to localStorage on deletion.
   *
   * @param {string} id - The link's unique identifier.
   */
  delete(id) {
    state.links = state.links.filter(function (link) { return link.id !== id; });
    Links.render();
    Links.save();
  },

  /**
   * Opens the given URL in a new browser tab with security attributes.
   *
   * Requirement 4.4: clicking a link button opens the URL in a new tab.
   *
   * @param {string} url - The fully-normalised URL to open.
   */
  openLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Persists the current state.links array to localStorage via the
   * Storage module.
   *
   * Requirement 4.6: link list is persisted on every mutation.
   * Requirement 4.9: on write failure the Storage module surfaces the error.
   */
  save() {
    Storage.saveLinks(state.links);
  },

  /**
   * Initialises the Quick Links widget:
   *   1. Loads saved links from localStorage via Storage.loadLinks().
   *   2. Assigns the result to state.links.
   *   3. Calls Links.render() to populate the DOM.
   *   4. Binds #link-add-btn click → Links.add using values from the two
   *      input fields.
   *   5. Clears field-specific error elements when the user starts typing.
   *
   * Requirement 4.7: restore previously saved links on Dashboard load.
   * Requirement 4.9: if localStorage is unavailable, start with empty list.
   */
  init() {
    // Load persisted data (returns [] when unavailable or corrupt).
    state.links = Storage.loadLinks();

    // Populate DOM from loaded state.
    Links.render();

    // ── Bind Add button ──────────────────────────────────────────────────
    const addBtn = document.getElementById('link-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const labelInput = document.getElementById('link-label-input');
        const urlInput   = document.getElementById('link-url-input');
        Links.add(
          labelInput ? labelInput.value : '',
          urlInput   ? urlInput.value   : ''
        );
      });
    }

    // ── Clear label error while user is typing ───────────────────────────
    const labelInput = document.getElementById('link-label-input');
    if (labelInput) {
      labelInput.addEventListener('input', function () {
        const errorEl = document.getElementById('link-label-error');
        if (errorEl) errorEl.classList.add('hidden');
      });
    }

    // ── Clear URL error while user is typing ─────────────────────────────
    const urlInput = document.getElementById('link-url-input');
    if (urlInput) {
      urlInput.addEventListener('input', function () {
        const errorEl = document.getElementById('link-url-error');
        if (errorEl) errorEl.classList.add('hidden');
      });
    }
  }
};

/* ─────────────────────────────────────────────
   Task 10.2 — init() and DOMContentLoaded wiring
   ───────────────────────────────────────────── */

/**
 * Application entry point — initialises all four widgets in sequence.
 *
 * Execution order:
 *   1. Greeting.start()  — renders time/date/greeting immediately and starts
 *                          the 60-second refresh interval.
 *   2. Timer.init()      — sets the initial timer display and binds
 *                          Start/Stop/Reset button handlers.
 *   3. Todos.init()      — loads tasks from localStorage (Storage.loadTodos),
 *                          populates state.todos, renders the list, and binds
 *                          the add-task controls.
 *   4. Links.init()      — loads links from localStorage (Storage.loadLinks),
 *                          populates state.links, renders the link buttons, and
 *                          binds the add-link controls.
 *
 * Todos.init() and Links.init() each call the relevant Storage.load* internally
 * and overwrite state.todos / state.links, satisfying Requirements 3.10, 3.11,
 * and 4.7.  If localStorage is unavailable or contains unreadable data those
 * methods return the safe empty-array default, so init() never throws due to a
 * storage failure.
 *
 * Requirement 5.4: all widget data is sourced from js/app.js; no HTTP requests
 * are made at runtime.
 * Requirements 3.10, 3.11: previously saved tasks are restored on load; empty
 * list used when storage is unavailable.
 * Requirement 4.7: previously saved links are restored on load.
 */
function init() {
  Greeting.start();
  Timer.init();
  Todos.init();
  Links.init();
}

// Wire init() to fire once the HTML document has been fully parsed.
// Using DOMContentLoaded (rather than load) means the four widgets start
// rendering as soon as the DOM is ready, without waiting for images or other
// sub-resources.
document.addEventListener('DOMContentLoaded', init);

/* ─────────────────────────────────────────────
   Task 10.1 — Global error handler (Requirement 6.6)
   ───────────────────────────────────────────── */

/**
 * Maps a best-effort hint string (error message, filename, or stack snippet)
 * to a widget container ID.
 *
 * The hint is lowercased before matching so the check is case-insensitive.
 *
 * Heuristics (applied in priority order):
 *   1. "greeting"       → #greeting-widget
 *   2. "timer"          → #timer-widget
 *   3. "todo" / "task"  → #todo-widget
 *   4. "link"           → #links-widget
 *
 * Returns null when no widget can be identified.
 *
 * @param {string} hint - A string derived from the error (message + filename + stack).
 * @returns {string|null} A widget container ID, or null.
 */
function identifyWidget(hint) {
  const h = (hint || '').toLowerCase();
  if (h.includes('greeting')) return 'greeting-widget';
  if (h.includes('timer'))    return 'timer-widget';
  if (h.includes('todo') || h.includes('task')) return 'todo-widget';
  if (h.includes('link'))     return 'links-widget';
  return null;
}

/**
 * Injects a `.widget-error-banner` element reading "Widget failed to load"
 * into the container identified by `containerId`, unless one has already
 * been injected (idempotent).
 *
 * @param {string} containerId - The ID of the target widget container element.
 */
function injectWidgetErrorBanner(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Avoid duplicate banners on repeated errors from the same widget.
  if (container.querySelector('.widget-error-banner')) return;

  const banner = document.createElement('p');
  banner.className   = 'widget-error-banner';
  banner.textContent = 'Widget failed to load';
  container.prepend(banner);
}

/**
 * Global error handler — catches uncaught JavaScript errors, attempts to
 * identify the responsible widget from the error information, and injects
 * an error banner into that widget's container so the remaining widgets
 * stay fully interactive.
 *
 * Returns `false` to preserve the browser's default error-reporting
 * behaviour (console logging, etc.).
 *
 * Requirement 6.6: widget failure must not affect other widgets; the failed
 * widget's region must display "Widget failed to load".
 *
 * @param {string}    message  - Human-readable error description.
 * @param {string}    source   - URL of the script where the error occurred.
 * @param {number}    lineno   - Line number where the error occurred.
 * @param {number}    colno    - Column number where the error occurred.
 * @param {Error|null} error   - The Error object, if available.
 * @returns {false}
 */
window.onerror = function (message, source, lineno, colno, error) {
  // Build a combined hint from every available piece of error information.
  const stackHint   = (error && error.stack) ? error.stack : '';
  const sourceHint  = source  || '';
  const messageHint = message || '';
  const hint        = messageHint + ' ' + sourceHint + ' ' + stackHint;

  const widgetId = identifyWidget(hint);

  if (widgetId) {
    injectWidgetErrorBanner(widgetId);
  }

  // Return false: let the browser continue its own error reporting.
  return false;
};
