# Focus Board

A simple Pomodoro-style timer paired with a drag-and-drop task board, built with plain HTML, CSS, and JavaScript — no build step, no dependencies.

## Features

- **Timer** with Focus / Short Break / Long Break modes, each with its own duration and ring color.
- **Task board** with To Do / Doing / Done columns. Tasks can be dragged between columns or advanced with a button.
- **Focus tracking** — click a task to mark it as your current focus; it's shown above the timer.
- **Session count** — tracks how many focus sessions you've completed today.
- All state (tasks, session count, focused task) is saved to `localStorage`, so it persists across page reloads.

## Running locally

Open `index.html` directly in a browser, or serve the folder so relative paths behave the same as they would when deployed:

```powershell
./serve.ps1
```

This starts a local server at `http://localhost:5500/`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and layout |
| `style.css` | Styling, including light/dark theme support |
| `script.js` | Timer logic, task board rendering, and `localStorage` persistence |
| `serve.ps1` | Minimal PowerShell static file server for local development |
