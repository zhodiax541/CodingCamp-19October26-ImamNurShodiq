# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a standalone, client-side dashboard as three plain files (`index.html`, `css/style.css`, `js/app.js`). The build order is: HTML skeleton → CSS layout → JS state + Storage module → Greeting widget → Timer widget → To-Do List widget → Quick Links widget → global error handler → wiring + integration tests. Each step is independently testable in a browser with no build tooling required.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` at the project root with `<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`, and a `<link>` to `css/style.css` and a `<script defer src="js/app.js">`.
  - Add four `<section>` widget containers with the semantic IDs required by the design: one each for greeting, timer, to-do list, and quick links.
  - Inside the greeting section add elements with IDs `#greeting-time`, `#greeting-date`, `#greeting-text`.
  - Inside the timer section add `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, and `#timer-complete` (hidden by default via a CSS class).
  - Inside the to-do section add `#todo-input`, `#todo-add-btn`, `#todo-error`, and `#todo-list` (`<ul>`).
  - Inside the quick-links section add `#link-label-input`, `#link-url-input`, `#link-add-btn`, `#link-label-error`, `#link-url-error`, and `#links-list`.
  - Create empty stub files `css/style.css` and `js/app.js` so the page loads without errors.
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement base CSS layout and visual design
  - [x] 2.1 Write responsive grid layout and widget base styles
    - Implement a CSS grid or flexbox layout that places the four widget sections on screen without horizontal scrolling at viewport widths ≥ 320 px.
    - Add section separators (visible divider or ≥ 16 px spacing) between widgets.
    - Set body font-size to at least 14 px for all task and link label text.
    - Ensure heading levels are at least 4 px larger than the level below.
    - Apply colour palette with text-to-background contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text (≥ 18 px).
    - _Requirements: 6.3, 6.4, 6.5_
  - [x] 2.2 Style widget-level error banner and inline error states
    - Add `.widget-error-banner` class used by the global error handler to mark a failed widget region.
    - Add `.error-msg` visible style for `#todo-error`, `#link-label-error`, `#link-url-error`.
    - Add `.hidden` utility class (used to show/hide `#timer-complete` and error elements).
    - _Requirements: 6.6, 3.2, 3.6, 4.2_

- [x] 3. Implement State object and Storage module in `js/app.js`
  - [x] 3.1 Define the `state` object and data-model helpers
    - Declare `const state = { todos: [], links: [], timer: { remaining: 1500, intervalId: null, running: false } }`.
    - Write `generateId()` — returns `crypto.randomUUID()` when available, falls back to `Date.now().toString()`.
    - Define `Task` factory: `createTask(description)` → `{ id, description, done: false, createdAt: Date.now() }`.
    - Define `Link` factory: `createLink(label, url)` → `{ id, label, url }`.
    - _Requirements: 3.1, 4.1, 5.4_
  - [x] 3.2 Implement the Storage module
    - Implement `Storage.loadTodos()` — reads `tld_todos` from `localStorage`, parses JSON, returns `Task[]`; returns `[]` on any error.
    - Implement `Storage.saveTodos(tasks)` — serialises to JSON and writes `tld_todos`; fails silently on error.
    - Implement `Storage.loadLinks()` — reads `tld_links` from `localStorage`, parses JSON, returns `Link[]`; returns `[]` on any error.
    - Implement `Storage.saveLinks(links)` — serialises to JSON and writes `tld_links`; on `QuotaExceededError` or unavailability, displays an error inside `#links-list` and does NOT overwrite the previously saved state.
    - Wrap every `localStorage` call in `try/catch`.
    - _Requirements: 3.9, 3.10, 3.11, 4.6, 4.7, 4.9_
  
- [x] 4. Implement Greeting widget
  - [x] 4.1 Write `Greeting.getGreeting(hour)` and `Greeting.render()`
    - Implement `getGreeting(hour)` as a pure function: returns `"Good Morning"` for 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–21, `"Good Night"` for 22–23 and 0–4.
    - Implement `Greeting.render()`: read `new Date()`, format `HH:MM` (zero-padded), format date as `"Day, DD Month YYYY"`, call `getGreeting`, update `#greeting-time`, `#greeting-date`, `#greeting-text`. On any thrown error, display `"--:--"`, `"Date unavailable"`, and empty greeting.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 4.2 Write `Greeting.start()` and wire 60-second interval
    - Implement `Greeting.start()`: call `Greeting.render()` immediately, then start a `setInterval` at 60 000 ms that calls `Greeting.render()` each tick.
    - _Requirements: 1.1_
  
- [x] 5. Implement Focus Timer widget
  - [x] 5.1 Write `Timer.format()` and `Timer.init()`
    - Implement `Timer.format(seconds)`: returns zero-padded `"MM:SS"` string for any integer in [0, 1500].
    - Implement `Timer.init()`: set `#timer-display` to `Timer.format(state.timer.remaining)`, bind click handlers on `#timer-start`, `#timer-stop`, `#timer-reset`.
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.3 Write `Timer.tick()`, `Timer.start()`, `Timer.stop()`, and `Timer.reset()`
    - Implement `Timer.tick()`: decrement `state.timer.remaining`, update `#timer-display`, if remaining reaches 0 call `Timer.stop()` and show `#timer-complete`.
    - Implement `Timer.start()`: no-op if `state.timer.running` is `true` or `remaining` is 0; set `state.timer.running = true`, start `setInterval` at 1 000 ms, store handle in `state.timer.intervalId`.
    - Implement `Timer.stop()`: clear interval, set `state.timer.running = false`, retain `state.timer.remaining`.
    - Implement `Timer.reset()`: call `Timer.stop()`, set `state.timer.remaining = 1500`, update `#timer-display`, hide `#timer-complete`.
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7_

- [x] 6. Checkpoint — verify Greeting and Timer in browser
  - Open `index.html` directly in a browser; confirm the time updates, greeting text is correct, and Start/Stop/Reset controls work. Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement To-Do List widget
  - [x] 7.1 Write `Todos.render()` and `Todos.init()`
    - Implement `Todos.render()`: clear `#todo-list`, then for each task in `state.todos` create an `<li>` containing: a checkbox (complete toggle), a `<span>` with the description (struck-through when `done: true`), an edit button, and a delete button; append to `#todo-list`.
    - Implement `Todos.init()`: load from `Storage.loadTodos()`, assign to `state.todos`, call `Todos.render()`.
    - Bind `#todo-add-btn` click and `#todo-input` Enter keydown to `Todos.add`.
    - _Requirements: 3.10, 3.11_
  - [x] 7.2 Write `Todos.add(description)`
    - Validate: if empty/whitespace-only → show `#todo-error`, abort. If length > 500 → show `#todo-error`, abort.
    - On success: call `createTask(description)`, push to `state.todos`, call `Todos.render()`, call `Todos.save()`, clear `#todo-input`, hide `#todo-error`.
    - Clear `#todo-error` whenever user starts typing in `#todo-input`.
    - _Requirements: 3.1, 3.2, 3.9_
   - [x] 7.4 Write `Todos.toggle(id)`, `Todos.delete(id)`, and `Todos.save()`
    - `Todos.toggle(id)`: find task by id, flip `done`, call `Todos.render()`, call `Todos.save()`.
    - `Todos.delete(id)`: filter task out of `state.todos`, call `Todos.render()`, call `Todos.save()`.
    - `Todos.save()`: call `Storage.saveTodos(state.todos)`.
    - Wire the checkbox, edit, and delete buttons rendered in `Todos.render()` to their respective handlers.
    - _Requirements: 3.3, 3.8, 3.9_
  - [ ]* 7.5 Write property test for toggle involution (Property 6)
    - **Property 6: Toggle is an involution**
    - **Validates: Requirements 3.3**
    - Generator: pre-populate `state.todos` with at least one task; call `Todos.toggle(id)` twice; assert `done` is unchanged.
  - [x] 7.6 Write `Todos.startEdit(id)`, `Todos.confirmEdit(id, newDesc)`, and `Todos.cancelEdit(id)`
    - `Todos.startEdit(id)`: replace the task's `<span>` with an `<input>` pre-populated with current description; show a confirm and a cancel button; hide edit and delete buttons for that item.
    - `Todos.confirmEdit(id, newDesc)`: if `newDesc` is empty/whitespace-only → silently revert to display mode with original description. If `newDesc.length > 500` → stay in edit mode, retain input value, show error adjacent to field. Otherwise save new description, call `Todos.render()`, call `Todos.save()`.
    - `Todos.cancelEdit(id)`: revert task `<li>` to display mode with original description.
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.9_

- [x] 8. Implement Quick Links widget
  - [x] 8.1 Write `Links.normaliseUrl(url)` and `Links.render()`
    - `Links.normaliseUrl(url)`: if url does not begin with `http://` or `https://` (case-insensitive), prepend `https://`; return the result unchanged otherwise.
    - `Links.render()`: clear `#links-list`; for each link in `state.links` create a button element (label text) that calls `Links.openLink(url)` on click, plus a delete button; append to `#links-list`.
    - _Requirements: 4.3, 4.4, 4.5_
  - [ ]* 8.2 Write property test for URL normalisation idempotence (Property 7)
    - **Property 7: Valid URL normalisation idempotence**
    - **Validates: Requirements 4.3**
    - Generator: `fc.webUrl()` (already valid URLs starting with http:// or https://); assert `normaliseUrl(url) === url`.
  - [x] 8.3 Write `Links.add(label, url)`, `Links.delete(id)`, `Links.openLink(url)`, `Links.save()`, and `Links.init()`
    - `Links.add(label, url)`: validate label (non-empty, ≤ 50 chars), URL (non-empty, ≤ 2048 chars), and list size (≤ 20); show field-specific errors on failure. On success: normalise URL, call `createLink`, push to `state.links`, call `Links.render()`, call `Links.save()`.
    - `Links.delete(id)`: filter link out of `state.links`, call `Links.render()`, call `Links.save()`.
    - `Links.openLink(url)`: `window.open(url, '_blank', 'noopener,noreferrer')`.
    - `Links.save()`: call `Storage.saveLinks(state.links)`.
    - `Links.init()`: load from `Storage.loadLinks()`, assign to `state.links`, call `Links.render()`; bind `#link-add-btn` click to `Links.add` using input field values.
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7, 4.8, 4.9_
  - [ ]* 8.4 Write property test for link list cap (Property 8)
    - **Property 8: Link list never exceeds 20 entries**
    - **Validates: Requirements 4.8**
    - Pre-fill `state.links` with 20 entries; call `Links.add` with valid data; assert `state.links.length === 20`.

- [x] 9. Checkpoint — verify To-Do List and Quick Links in browser
  - Open `index.html` in a browser; add/edit/complete/delete tasks; add/open/delete links; verify localStorage persistence by reloading the page. Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement global error handler and `init()` wiring
  - [x] 10.1 Write the `window.onerror` global error handler
    - In `js/app.js`, register a `window.onerror` handler that, given a source file name or stack trace, identifies which widget's container is affected and injects a `.widget-error-banner` element reading "Widget failed to load" inside that container.
    - All remaining widgets must stay interactive after a single widget fails.
    - _Requirements: 6.6_
  - [x] 10.2 Write `init()` and wire `DOMContentLoaded`
    - Implement `init()`: call `Storage.loadTodos()` and `Storage.loadLinks()`, assign results to `state.todos` and `state.links`, then call `Greeting.start()`, `Timer.init()`, `Todos.init()`, `Links.init()` in order.
    - Register `document.addEventListener('DOMContentLoaded', init)`.
    - Verify in the browser that all four widgets render on first load and that a hard reload restores persisted tasks and links.
    - _Requirements: 5.4, 3.10, 3.11, 4.7_
  - [ ]* 10.3 Write integration tests for full init() sequence
    - Test 1: pre-populate a `localStorage` mock with known tasks and links; call `init()`; assert all four widgets render their saved data.
    - Test 2: simulate `localStorage` unavailability; call `init()`; assert all four widgets render in their empty-state defaults without throwing.
    - Test 3: add a task → complete it → delete it; assert `localStorage` state is empty after deletion.
    - _Requirements: 3.10, 3.11, 4.7, 5.4_

- [x] 11. Final checkpoint — full regression pass
  - Run all property-based and unit tests. Open `index.html` in Chrome, Firefox, Edge, and Safari; confirm no console errors, all controls respond within 100 ms, and page renders within 2 seconds on a local file load. Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they do not need to be executed by a coding agent automatically.
- Each task references specific requirements for traceability.
- Checkpoints (tasks 6, 9, 11) are manual browser verification steps, not coding tasks.
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with ≥ 100 iterations per property.
- Unit tests can be run with any lightweight test harness (e.g., a plain `<script type="module">` test file, or jsdom via Vitest/Jest) — no build step is mandated by requirements.
- The `window.onerror` handler identifies widgets by correlating error source with widget container IDs; a best-effort match is acceptable since no module bundler is used.
- `crypto.randomUUID()` is available in all modern browsers; the `Date.now().toString()` fallback covers older environments.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2"] },
    { "id": 3, "tasks": ["3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["7.2"] },
    { "id": 8, "tasks": ["7.3", "7.4"] },
    { "id": 9, "tasks": ["7.5", "7.6", "8.1"] },
    { "id": 10, "tasks": ["7.6", "8.2", "8.3"] },
    { "id": 11, "tasks": ["8.4", "10.1"] },
    { "id": 12, "tasks": ["10.2"] },
    { "id": 13, "tasks": ["10.3"] }
  ]
}
```
