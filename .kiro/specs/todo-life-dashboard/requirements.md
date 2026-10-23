# Requirements Document

## Introduction

The To-Do List Life Dashboard is a standalone, client-side web application that combines four productivity widgets into a single clean interface: a time-based greeting, a Pomodoro-style focus timer, a persistent to-do list, and a configurable quick-links panel. All data is stored in the browser's Local Storage. The application requires no backend server, no build step, and no external frameworks — only a single HTML file, one CSS file, and one JavaScript file.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown Pomodoro-style timer.
- **Todo_List**: The UI component that manages the user's task items.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **User**: The person interacting with the Dashboard in a modern web browser.

---

## Requirements

### Requirement 1: Time and Date Greeting

**User Story:** As a User, I want to see the current time, date, and a contextual greeting, so that I have an at-a-glance awareness of the time of day when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 24-hour HH:MM:SS format, updated every second.
2. THE Greeting_Widget SHALL display the current local date in the order: day name, day number, month name, year (e.g., "Friday, 23 October 2026").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local time is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local time is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. IF the local time cannot be determined, THEN THE Greeting_Widget SHALL display "--:--:--" for the time, omit the greeting text, and display the date as "Date unavailable".

---

### Requirement 2: Focus Timer

**User Story:** As a User, I want a Pomodoro-style countdown timer, so that I can track focused work sessions of 25 minutes.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL initialise with a duration of 25 minutes (1500 seconds).
2. WHEN the User activates the Start control, THE Focus_Timer SHALL begin counting down from the current remaining time, one second at a time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in MM:SS format, updated every second.
4. WHEN the User activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the User activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the remaining time to 25 minutes (1500 seconds).
6. WHEN the remaining time reaches 00:00, THE Focus_Timer SHALL stop the countdown automatically and display a visible session-complete notification to the User.
7. IF the User activates the Start control while the Focus_Timer is already counting down or has reached 00:00, THEN THE Focus_Timer SHALL ignore the activation.

---

### Requirement 3: To-Do List

**User Story:** As a User, I want to create, edit, complete, and delete tasks, so that I can manage my daily activities from the Dashboard.

#### Acceptance Criteria

1. WHEN the User submits a task description between 1 and 500 characters, THE Todo_List SHALL add a new Task with that description and an incomplete state.
2. IF the User submits an empty task description, THEN THE Todo_List SHALL reject the submission and display an error message adjacent to the task input field.
3. WHEN the User activates the complete control on a Task, THE Todo_List SHALL toggle the Task's completion state between complete and incomplete.
4. WHEN the User activates the edit control on a Task, THE Todo_List SHALL replace the Task's display text with an editable input field pre-populated with the current description.
5. WHEN the User confirms an edit with a description between 1 and 500 characters, THE Todo_List SHALL save the updated description and return the Task to display mode.
6. IF the User confirms an edit with a description exceeding 500 characters, THEN THE Todo_List SHALL reject the change, retain the invalid input in the editable input field, and display an error message adjacent to the edit input field.
7. IF the User confirms an edit with an empty description, THEN THE Todo_List SHALL reject the change, retain the original description, and return the Task to display mode.
8. WHEN the User activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list permanently.
9. WHEN any Task is added, updated, completed, or deleted, THE Todo_List SHALL persist the full task list to Local_Storage within 500 milliseconds.
10. WHEN the Dashboard loads, THE Todo_List SHALL read and restore all previously saved Tasks from Local_Storage.
11. IF Local_Storage is unavailable or contains unreadable data on Dashboard load, THEN THE Todo_List SHALL initialize with an empty task list.

---

### Requirement 4: Quick Links

**User Story:** As a User, I want to add, use, and remove shortcut buttons for my favourite websites, so that I can navigate to them quickly from the Dashboard.

#### Acceptance Criteria

1. WHEN the User submits a new Link with a label between 1 and 50 characters and a URL between 1 and 2048 characters that begins with "http://" or "https://", THE Quick_Links SHALL add a button for that Link.
2. IF the User submits a new Link with an empty label, an empty URL, a label exceeding 50 characters, or a URL exceeding 2048 characters, THEN THE Quick_Links SHALL reject the submission and display an inline error message adjacent to the invalid field.
3. IF the User submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL prepend "https://" to the URL before saving.
4. WHEN the User activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
5. WHEN the User activates the delete control on a Link, THE Quick_Links SHALL remove the Link immediately without requiring confirmation.
6. WHEN any Link is added or deleted, THE Quick_Links SHALL persist the full link list to Local_Storage immediately.
7. WHEN the Dashboard loads, THE Quick_Links SHALL read and restore all previously saved Links from Local_Storage.
8. IF the User submits a new Link when the saved link list already contains 20 Links, THEN THE Quick_Links SHALL reject the submission and display an inline error message indicating the maximum link count has been reached.
9. IF Local_Storage is unavailable or the write quota is exceeded when saving the link list, THEN THE Quick_Links SHALL display an error message indicating that the link could not be saved and preserve the previous saved state.

---

### Requirement 5: File Structure and Code Quality

**User Story:** As a developer, I want the project to follow a strict single-file-per-type structure, so that the codebase remains clean, readable, and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file named `index.html` at the project root directory.
2. THE Dashboard SHALL reference exactly one external CSS file located at `css/style.css`, and SHALL NOT reference any other external stylesheet files.
3. THE Dashboard SHALL reference exactly one external JavaScript file located at `js/app.js`, and SHALL NOT reference any other external script files.
4. THE Dashboard SHALL load and render all four widgets using only data embedded within `js/app.js` or `index.html`, with no HTTP requests issued to any backend server or external API at runtime.
5. THE Dashboard SHALL operate correctly in the latest stable releases of Chrome, Firefox, Edge, and Safari, where "operates correctly" means all four widgets render with accurate data, all interactive controls respond within 1 second, and no JavaScript errors are thrown in the browser console.

---

### Requirement 6: Performance and Visual Design

**User Story:** As a User, I want the Dashboard to load instantly and respond without lag, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete initial render within 2 seconds on a network connection of at least 10 Mbps download speed and no more than 50ms round-trip latency.
2. WHEN the User performs any UI interaction (adding a task, starting the timer, clicking a link), THE Dashboard SHALL reflect the change within 100 milliseconds.
3. THE Dashboard SHALL apply a consistent visual hierarchy where each heading level is at least 4px larger than the heading level below it, text-to-background contrast ratios meet a minimum of 4.5:1 for body text and 3:1 for text at or above 18px, and each section is separated by a visible divider or spacing of at least 16px.
4. THE Dashboard SHALL use a body font size of at least 14px for all task and link label text.
5. WHILE the Dashboard is displayed on a viewport width of at least 320px, THE Dashboard SHALL render all four widgets without horizontal scrolling.
6. IF a widget fails to complete rendering within 5 seconds of the initial load, THEN THE Dashboard SHALL display an error message within that widget's region indicating that the widget failed to load, and allow the remaining widgets to remain fully interactive.
