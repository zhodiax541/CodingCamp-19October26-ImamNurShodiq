# Requirements Document

## Introduction

This document covers five enhancements to the existing To-Do List Life Dashboard — a standalone, client-side single-page application built with plain HTML, CSS, and JavaScript (no build step, no frameworks). The enhancements are:

1. **Light / Dark mode toggle** — switches the entire Dashboard between a light and a dark colour theme; preference is persisted across sessions.
2. **Custom name in greeting** — the Greeting_Widget personalises the greeting with the user's name (e.g., "Good Morning, Alice!"); the name is persisted across sessions.
3. **Configurable Pomodoro duration** — the user can change the Focus_Timer's starting duration from the default 25 minutes to any value between 1 and 60 minutes.
4. **Duplicate task prevention** — the Todo_List rejects a new task submission when an existing task with an identical description (case-insensitive, trimmed) already exists.
5. **Task sorting** — the user can sort the task list by creation date (newest first or oldest first) or by completion status (incomplete tasks first); the active sort preference is persisted across sessions.

All existing localStorage keys (`tld_todos`, `tld_links`) are unchanged. New keys introduced by these enhancements: `tld_theme`, `tld_username`, `tld_sort_order`.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI component that implements a configurable Pomodoro-style countdown timer.
- **Todo_List**: The UI component that manages the user's task items.
- **Task**: A single to-do item with a text description, a completion state, and a creation timestamp.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons to external URLs.
- **Theme_Toggle**: The UI control that switches between the light theme and the dark theme.
- **Light_Theme**: The default visual theme using a light background and dark foreground colours, matching the current stylesheet.
- **Dark_Theme**: The alternative visual theme using a dark background and light foreground colours with equivalent contrast ratios.
- **Username**: The display name entered by the User, used to personalise the greeting message.
- **Sort_Order**: The currently active rule used to order tasks in the Todo_List.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **User**: The person interacting with the Dashboard in a modern web browser.

---

## Requirements

### Requirement 1: Light / Dark Mode Toggle

**User Story:** As a User, I want to switch between a light and a dark theme, so that I can use the Dashboard comfortably in different lighting conditions without resetting my preference on every visit.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme_Toggle control positioned in the page header, with a minimum click/tap target size of 24×24 px, that remains present in the DOM on every page view.
2. WHEN the User activates the Theme_Toggle while the Light_Theme is active, THE Dashboard SHALL switch the entire page to the Dark_Theme immediately, with no page reload.
3. WHEN the User activates the Theme_Toggle while the Dark_Theme is active, THE Dashboard SHALL switch the entire page to the Light_Theme immediately, with no page reload.
4. WHILE the Dark_Theme is active, THE Dashboard SHALL apply dark-background colours to all widget surfaces, text, borders, and interactive controls such that all text-to-background contrast ratios remain at a minimum of 4.5:1 for body text and 3:1 for large text (= 18 px); WHILE the Light_Theme is active, THE Dashboard SHALL apply light-background colours to all widget surfaces, text, borders, and interactive controls such that all text-to-background contrast ratios remain at a minimum of 4.5:1 for body text and 3:1 for large text (= 18 px).
5. WHEN the User activates the Theme_Toggle, THE Dashboard SHALL persist the selected theme identifier (`"light"` or `"dark"`) to Local_Storage under the key `tld_theme` within 500 milliseconds.
6. WHEN the Dashboard loads, THE Dashboard SHALL read the `tld_theme` key from Local_Storage and apply the stored theme before any visible content is rendered to the viewport.
7. IF the `tld_theme` key is absent or contains a value other than `"light"` or `"dark"` on Dashboard load, THEN THE Dashboard SHALL apply the Light_Theme as the default.
8. IF Local_Storage is unavailable when the Dashboard loads or when the User activates the Theme_Toggle, THEN THE Dashboard SHALL apply the Light_Theme and continue operating without throwing a script error.
8. IF Local_Storage is unavailable when the Dashboard loads or when the User activates the Theme_Toggle, THEN THE Dashboard SHALL apply the Light_Theme and continue operating without throwing a script error.

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a User, I want to enter my name so that the greeting addresses me personally, so that the Dashboard feels tailored to me rather than generic.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide a name input field and a save control that allow the User to enter and save a Username.
2. WHEN the User enters a Username between 1 and 50 characters and activates the save control, THE Greeting_Widget SHALL update the greeting to the format "[Greeting], [Username]!" (e.g., "Good Morning, Alice!") within 200 milliseconds.
3. WHILE a non-empty Username is saved, THE Greeting_Widget SHALL append ", [Username]!" to the time-based greeting string on every render cycle.
4. WHEN the User saves a Username, THE Greeting_Widget SHALL persist the Username to Local_Storage under the key `tld_username` within 500 milliseconds.
5. WHEN the Dashboard loads, THE Greeting_Widget SHALL read the `tld_username` key from Local_Storage and restore the Username so the personalised greeting is shown immediately.
6. IF the `tld_username` key is absent or empty on Dashboard load, THEN THE Greeting_Widget SHALL display the greeting without a name suffix (e.g., "Good Morning").
7. IF the User activates the save control with a Username exceeding 50 characters, THEN THE Greeting_Widget SHALL reject the submission and display an error message directly below the name input field without updating the stored Username.
8. IF the User activates the save control with an empty or whitespace-only Username, THEN THE Greeting_Widget SHALL clear the stored Username, remove the `tld_username` key from Local_Storage, and update the displayed greeting to the no-name format (e.g., "Good Morning") within 200 milliseconds.

---

### Requirement 3: Configurable Pomodoro Duration

**User Story:** As a User, I want to set the Focus_Timer duration to a value between 1 and 60 minutes, so that I can adapt my work sessions to different tasks without being locked into the default 25-minute preset.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide a duration input field and a set control that allow the User to specify a session length in whole minutes.
2. WHEN the User enters a whole number of minutes between 1 and 60 inclusive and activates the set control, THE Focus_Timer SHALL update its starting duration to that value and reset the countdown to the new duration within 1 second.
3. WHILE the Focus_Timer is counting down, WHEN the User activates the set control with a valid duration value, THE Focus_Timer SHALL stop the current countdown and reset to the new duration within 1 second.
4. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL use the currently configured duration as the reference value for the Reset control.
5. WHILE a custom duration has been configured, WHEN the User activates the Reset control, THE Focus_Timer SHALL restore the countdown to the most recently configured duration rather than the default 25 minutes.
6. IF the User enters a value outside the range 1–60 or a non-integer value in the duration input and activates the set control, THEN THE Focus_Timer SHALL reject the input, display an error message adjacent to the duration input field, and clear that error message as soon as the User modifies the duration input field.
7. IF the duration input field is empty when the User activates the set control, THEN THE Focus_Timer SHALL reject the input, display an error message adjacent to the duration input field, and clear that error message as soon as the User modifies the duration input field.

---

### Requirement 4: Prevent Duplicate Tasks

**User Story:** As a User, I want the system to prevent me from adding the same task twice, so that my task list stays clean and free of accidental duplicates.

#### Acceptance Criteria

1. WHEN the User submits a task description whose trimmed, case-insensitive value matches the trimmed, case-insensitive description of any existing Task in the Todo_List, THE Todo_List SHALL reject the submission.
2. WHEN the Todo_List rejects a submission due to a duplicate description, THE Todo_List SHALL display an error message directly below the task input field indicating the task already exists, and SHALL remove that error message when the User next modifies the input field content.
3. WHEN the Todo_List rejects a submission due to a duplicate description, THE Todo_List SHALL leave the input field content unchanged so the User can review and modify the description.
4. WHEN the User activates the edit control on a Task and confirms a new description whose trimmed, case-insensitive value matches the trimmed, case-insensitive description of a different existing Task, THE Todo_List SHALL reject the change and display an error message directly below the edit input field indicating the task already exists, and SHALL remove that error message when the User next modifies the edit input field content.
5. WHEN the Todo_List rejects an edit change due to a duplicate description, THE Todo_List SHALL leave the edit input field content unchanged so the User can review and modify the description.
6. WHEN the User confirms an edit with a description that is identical (trimmed, case-insensitive) to the Task's own current description, THE Todo_List SHALL treat this as a no-change confirmation and return the Task to display mode without showing an error.

---

### Requirement 5: Sort Tasks

**User Story:** As a User, I want to sort my task list by creation date or by completion status, so that I can prioritise the tasks that matter most in the current moment.

#### Acceptance Criteria

1. THE Todo_List SHALL provide sort controls that allow the User to select one of the following Sort_Order values: newest first (creation date descending), oldest first (creation date ascending), or incomplete first (incomplete tasks before complete tasks; within each group, original creation order is preserved).
2. WHEN the User selects a Sort_Order, THE Todo_List SHALL reorder the displayed task list according to that order within 100 milliseconds, without adding, removing, or modifying any Task.
3. WHILE a Sort_Order is active, WHEN a Task is added, deleted, toggled, or edited, THE Todo_List SHALL apply the active Sort_Order to the displayed list before the updated list is rendered.
4. WHEN the User selects a Sort_Order, THE Todo_List SHALL persist the Sort_Order identifier to Local_Storage under the key `tld_sort_order` within 500 milliseconds.
5. WHEN the Dashboard loads, THE Todo_List SHALL read the `tld_sort_order` key from Local_Storage and apply the stored Sort_Order to the initial task list render.
6. IF the `tld_sort_order` key is absent or contains an unrecognised value on Dashboard load, THEN THE Todo_List SHALL default to the newest first Sort_Order.
7. THE Todo_List SHALL treat sorting as a display-only operation, such that switching Sort_Order at any time produces the same task set with no tasks added, removed, or modified.
8. IF Local_Storage is unavailable or the `tld_sort_order` write fails, THEN THE Todo_List SHALL apply the selected Sort_Order for the current session and display an error message indicating that the sort preference could not be saved.