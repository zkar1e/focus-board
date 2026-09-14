// ---------- Storage helpers ----------
const STORAGE_KEY = "focusBoard.tasks";
const SESSIONS_KEY = "focusBoard.sessions";
const FOCUSED_KEY = "focusBoard.focusedTaskId";

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadSessions() {
  try {
    const data = JSON.parse(localStorage.getItem(SESSIONS_KEY));
    const today = new Date().toDateString();
    if (data && data.date === today) return data.count;
    return 0;
  } catch {
    return 0;
  }
}

function saveSessions(count) {
  localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify({ date: new Date().toDateString(), count })
  );
}

// ---------- State ----------
let tasks = loadTasks();
let sessionCount = loadSessions();
let focusedTaskId = localStorage.getItem(FOCUSED_KEY) || null;

const MODES = {
  focus: { label: "Focus", minutes: 25, color: "var(--focus-ring)" },
  short: { label: "Short Break", minutes: 5, color: "var(--short-ring)" },
  long: { label: "Long Break", minutes: 15, color: "var(--long-ring)" },
};

let currentMode = "focus";
let remainingSeconds = MODES[currentMode].minutes * 60;
let totalSeconds = remainingSeconds;
let timerInterval = null;
let isRunning = false;

const RING_CIRCUMFERENCE = 2 * Math.PI * 110;

// ---------- DOM refs ----------
const timeText = document.getElementById("timeText");
const ringProgress = document.getElementById("ringProgress");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const sessionCountEl = document.getElementById("sessionCount");
const focusLabel = document.getElementById("focusLabel");
const modeBtns = document.querySelectorAll(".mode-btn");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const columns = {
  todo: document.getElementById("todoList"),
  doing: document.getElementById("doingList"),
  done: document.getElementById("doneList"),
};

// ---------- Timer rendering ----------
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function renderTimer() {
  timeText.textContent = formatTime(remainingSeconds);
  const progress = 1 - remainingSeconds / totalSeconds;
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * progress;
  ringProgress.style.stroke = MODES[currentMode].color;
  sessionCountEl.textContent = sessionCount;
}

function renderFocusLabel() {
  const task = tasks.find((t) => t.id === focusedTaskId);
  focusLabel.textContent = task ? `Focusing on: ${task.text}` : "No task selected";
}

function setMode(mode) {
  currentMode = mode;
  isRunning = false;
  clearInterval(timerInterval);
  startPauseBtn.textContent = "Start";
  remainingSeconds = MODES[mode].minutes * 60;
  totalSeconds = remainingSeconds;
  modeBtns.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.mode === mode)
  );
  renderTimer();
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  } catch {
    // audio not available; ignore
  }
}

function tick() {
  remainingSeconds -= 1;
  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    renderTimer();
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = "Start";
    playChime();
    if (currentMode === "focus") {
      sessionCount += 1;
      saveSessions(sessionCount);
    }
    return;
  }
  renderTimer();
}

function startPause() {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = "Start";
  } else {
    isRunning = true;
    startPauseBtn.textContent = "Pause";
    timerInterval = setInterval(tick, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  startPauseBtn.textContent = "Start";
  remainingSeconds = MODES[currentMode].minutes * 60;
  totalSeconds = remainingSeconds;
  renderTimer();
}

startPauseBtn.addEventListener("click", startPause);
resetBtn.addEventListener("click", resetTimer);
modeBtns.forEach((btn) =>
  btn.addEventListener("click", () => setMode(btn.dataset.mode))
);

// ---------- Task board ----------
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function renderTasks() {
  Object.values(columns).forEach((col) => (col.innerHTML = ""));

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.draggable = true;
    li.dataset.id = task.id;
    if (task.id === focusedTaskId) li.classList.add("focused");

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;
    textSpan.title = "Click to set as current focus";
    textSpan.addEventListener("click", () => {
      focusedTaskId = task.id === focusedTaskId ? null : task.id;
      localStorage.setItem(FOCUSED_KEY, focusedTaskId || "");
      renderFocusLabel();
      renderTasks();
    });

    const actions = document.createElement("div");
    actions.className = "task-actions";

    if (task.status !== "done") {
      const advanceBtn = document.createElement("button");
      advanceBtn.className = "icon-btn";
      advanceBtn.textContent = "→";
      advanceBtn.title = "Move to next column";
      advanceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        task.status = task.status === "todo" ? "doing" : "done";
        saveTasks(tasks);
        renderTasks();
      });
      actions.appendChild(advanceBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn";
    deleteBtn.textContent = "×";
    deleteBtn.title = "Delete task";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      tasks = tasks.filter((t) => t.id !== task.id);
      if (focusedTaskId === task.id) {
        focusedTaskId = null;
        localStorage.removeItem(FOCUSED_KEY);
        renderFocusLabel();
      }
      saveTasks(tasks);
      renderTasks();
    });
    actions.appendChild(deleteBtn);

    li.appendChild(textSpan);
    li.appendChild(actions);

    li.addEventListener("dragstart", () => {
      li.classList.add("dragging");
      li.dataset.dragId = task.id;
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    columns[task.status].appendChild(li);
  });
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: uid(), text, status: "todo" });
  saveTasks(tasks);
  taskInput.value = "";
  renderTasks();
});

// Drag and drop between columns
Object.entries(columns).forEach(([status, col]) => {
  col.addEventListener("dragover", (e) => {
    e.preventDefault();
    col.classList.add("drag-over");
  });
  col.addEventListener("dragleave", () => {
    col.classList.remove("drag-over");
  });
  col.addEventListener("drop", (e) => {
    e.preventDefault();
    col.classList.remove("drag-over");
    const dragging = document.querySelector(".task-item.dragging");
    if (!dragging) return;
    const id = dragging.dataset.id;
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.status = status;
      saveTasks(tasks);
      renderTasks();
    }
  });
});

// ---------- Init ----------
setMode("focus");
renderFocusLabel();
renderTasks();
