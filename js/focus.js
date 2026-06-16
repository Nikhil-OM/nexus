import { getTasks, getCurrentUser, updateTask } from './data.js';

let focusDuration = 25;
let breakDuration = 5;
let timerInterval = null;
let secondsLeft   = focusDuration * 60;
let isRunning     = false;
let sessionType   = 'focus'; // 'focus' | 'break'
let sessionCount  = 0;

export function renderFocus() {
  const user  = getCurrentUser();
  const myTasks = getTasks().filter(t => t.assignee === user.id && t.status !== 'done');

  const html = `
    <div class="focus-mode">
      <div class="focus-header">
        <h1 style="font-size:2rem;margin-bottom:4px">🎯 Focus Mode</h1>
        <p style="color:var(--text-secondary)">Stay in the zone. Complete tasks one at a time.</p>
      </div>

      <!-- Pomodoro -->
      <div class="pomodoro-timer" id="pomo-ring" style="border-color:${sessionType==='break'?'var(--brand-teal)':'var(--brand-primary)'}">
        <div class="pomodoro-time" id="pomo-time">${formatTime(secondsLeft)}</div>
        <div class="pomodoro-label" id="pomo-label">${sessionType==='focus'?'Focus Session':'Break Time'}</div>
      </div>

      <div class="pomodoro-controls">
        <button class="btn btn-ghost btn-sm" id="pomo-reset" title="Reset"><i data-lucide="rotate-ccw"></i></button>
        <button class="btn btn-primary" id="pomo-toggle">
          <i data-lucide="${isRunning?'pause':'play'}"></i>${isRunning?'Pause':'Start Focus'}
        </button>
        <button class="btn btn-ghost btn-sm" id="pomo-skip" title="Skip to break"><i data-lucide="skip-forward"></i></button>
      </div>

      <div style="display:flex;gap:24px;margin-bottom:var(--space-6);font-size:.8rem;color:var(--text-muted);align-items:center;flex-wrap:wrap">
        <span>🍅 Sessions today: <strong>${sessionCount}</strong></span>
        <span style="display:flex;align-items:center;gap:4px">⏱ Focus: <input type="number" id="input-focus-time" value="${focusDuration}" min="1" max="120" style="width:60px;padding:2px 6px;height:24px"> <strong>m</strong></span>
        <span style="display:flex;align-items:center;gap:4px">☕ Break: <input type="number" id="input-break-time" value="${breakDuration}" min="1" max="60" style="width:60px;padding:2px 6px;height:24px"> <strong>m</strong></span>
      </div>

      <!-- My Tasks -->
      <div class="focus-tasks">
        <div class="section-title" style="margin-bottom:var(--space-3)">Your Tasks (${myTasks.length} remaining)</div>
        ${myTasks.length === 0
          ? `<div class="empty-state"><i data-lucide="check-circle"></i><h3>All done!</h3><p>You have no pending tasks. Great work!</p></div>`
          : myTasks.sort((a,b)=>{
              const pOrder={critical:0,high:1,medium:2,low:3};
              return (pOrder[a.priority]??2)-(pOrder[b.priority]??2);
            }).map(t => `
            <div class="focus-task-item ${t.status==='done'?'completed':''}" data-task="${t.id}">
              <div class="focus-task-check ${t.status==='done'?'done':''}" data-task-check="${t.id}">
                ${t.status==='done'?'<i data-lucide="check"></i>':''}
              </div>
              <div class="focus-task-title">${t.title}</div>
              <span class="badge badge-${t.priority}">${t.priority}</span>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;

  document.getElementById('view-focus').innerHTML = html;
  lucide.createIcons();
  attachFocusEvents();
}

function attachFocusEvents() {
  document.getElementById('pomo-toggle')?.addEventListener('click', () => {
    isRunning = !isRunning;
    if (isRunning) {
      startTimer();
    } else {
      clearInterval(timerInterval);
    }
    updateToggleBtn();
  });

  document.getElementById('pomo-reset')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning   = false;
    secondsLeft = focusDuration * 60;
    sessionType = 'focus';
    updateDisplay();
    updateToggleBtn();
    const ring = document.getElementById('pomo-ring');
    if (ring) { ring.classList.remove('running'); ring.style.borderColor='var(--brand-primary)'; }
  });

  document.getElementById('pomo-skip')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    switchSession();
    updateDisplay();
    updateToggleBtn();
  });

  // Time inputs
  document.getElementById('input-focus-time')?.addEventListener('change', e => {
    focusDuration = parseInt(e.target.value) || 25;
    if (sessionType === 'focus' && !isRunning) {
      secondsLeft = focusDuration * 60;
      updateDisplay();
    }
  });

  document.getElementById('input-break-time')?.addEventListener('change', e => {
    breakDuration = parseInt(e.target.value) || 5;
    if (sessionType === 'break' && !isRunning) {
      secondsLeft = breakDuration * 60;
      updateDisplay();
    }
  });

  // Task check-off
  document.querySelectorAll('[data-task-check]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const taskId = btn.dataset.taskCheck;
      const item   = btn.closest('.focus-task-item');
      const isDone = item.classList.contains('completed');
      updateTask(taskId, { status: isDone ? 'todo' : 'done' });
      renderFocus();
    });
  });
}

function startTimer() {
  const ring = document.getElementById('pomo-ring');
  if (ring) ring.classList.add('running');
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      if (sessionType === 'focus') { sessionCount++; }
      switchSession();
      updateDisplay();
      updateToggleBtn();
      if (ring) ring.classList.remove('running');
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(sessionType==='break'?'☕ Break time!':'🎯 Focus time!', { body: sessionType==='break'?'Take a 5 minute break.':'Back to work!' });
      }
    }
  }, 1000);
}

function switchSession() {
  sessionType = sessionType === 'focus' ? 'break' : 'focus';
  secondsLeft = sessionType === 'focus' ? focusDuration * 60 : breakDuration * 60;
  const ring  = document.getElementById('pomo-ring');
  const label = document.getElementById('pomo-label');
  if (ring)  ring.style.borderColor = sessionType==='break'?'var(--brand-teal)':'var(--brand-primary)';
  if (label) label.textContent      = sessionType==='focus'?'Focus Session':'Break Time';
}

function updateDisplay() {
  const el = document.getElementById('pomo-time');
  if (el) el.textContent = formatTime(secondsLeft);
}

function updateToggleBtn() {
  const btn = document.getElementById('pomo-toggle');
  if (btn) btn.innerHTML = `<i data-lucide="${isRunning?'pause':'play'}"></i>${isRunning?'Pause':'Start Focus'}`;
  lucide.createIcons();
}

function formatTime(s) {
  const m = Math.floor(s/60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
