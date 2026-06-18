import { getTasks, getProjects, getMember, updateTask, createTask, getMembers, formatDate, isOverdue, getStatusLabel, getPriorityLabel } from './data.js';

const COLS = [
  { id:'todo',       label:'To Do',      color:'var(--status-todo)' },
  { id:'inprogress', label:'In Progress',color:'var(--status-inprogress)' },
  { id:'review',     label:'In Review',  color:'var(--status-review)' },
  { id:'done',       label:'Done',       color:'var(--status-done)' }
];

let activeProjectId = null;
let draggedTaskId   = null;

export function renderKanban(projectId) {
  activeProjectId = projectId || null;
  const projects = getProjects();
  const tasks    = getTasks(activeProjectId);

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Kanban Board</h1>
        <p>Drag tasks between columns to update status</p>
      </div>
      <div class="view-header-actions">
        <select id="kanban-project-filter" style="width:180px">
          <option value="">All Projects</option>
          ${projects.map(p => `<option value="${p.id}" ${p.id===activeProjectId?'selected':''}>${p.emoji} ${p.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="kanban-board" id="kanban-board">
      ${COLS.map(col => renderCol(col, tasks)).join('')}
    </div>
  `;
  document.getElementById('view-kanban').innerHTML = html;
  lucide.createIcons();
  attachKanbanEvents();
}

function renderCol(col, allTasks) {
  const tasks = allTasks.filter(t => t.status === col.id);
  return `<div class="kanban-col" data-col="${col.id}">
    <div class="kanban-col-header">
      <span style="width:10px;height:10px;border-radius:50%;background:${col.color};display:inline-block"></span>
      <span class="kanban-col-title">${col.label}</span>
      <span class="kanban-col-count">${tasks.length}</span>
    </div>
    <div class="kanban-drop-zone" id="drop-${col.id}" data-col="${col.id}">
      ${tasks.map(t => renderCard(t)).join('')}
    </div>
    <button class="kanban-add-btn" data-col="${col.id}">
      <i data-lucide="plus"></i>Add task
    </button>
  </div>`;
}

function renderCard(t) {
  const m = getMember(t.assignee);
  const over = isOverdue(t.dueDate, t.status);
  const timeMins = t.timeLogged || 0;
  return `<div class="kanban-card" draggable="true" data-task="${t.id}" id="kcard-${t.id}" onclick="window.openTask('${t.id}')">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
      <div class="kanban-card-title">${t.title}</div>
      <span class="badge badge-${t.priority}" style="flex-shrink:0">${t.priority}</span>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
      ${(t.tags||[]).map(tag=>`<span class="tag">${tag}</span>`).join('')}
    </div>
    <div class="kanban-card-meta">
      ${t.dueDate ? `<span class="kanban-card-due ${over?'overdue':''}"><i data-lucide="calendar"></i>${formatDate(t.dueDate)}</span>` : ''}
      ${timeMins ? `<span class="kanban-card-timer" title="Time logged"><i data-lucide="clock"></i>${fmtTime(timeMins)}</span>` : ''}
      ${m ? `<div class="kanban-card-assignee" style="background:${m.color}" title="${m.name}">${m.initials}</div>` : ''}
    </div>
  </div>`;
}

function attachKanbanEvents() {
  // Project filter
  document.getElementById('kanban-project-filter')?.addEventListener('change', e => {
    window.dispatchEvent(new CustomEvent('nexus:navigate', {
      detail: { view: 'kanban', projectId: e.target.value || null }
    }));
  });

  // Add task buttons
  document.querySelectorAll('.kanban-add-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); window.openCreateTask(btn.dataset.col, activeProjectId); });
  });

  attachDragEvents();
}

function attachDragEvents() {
  // Drag start
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      draggedTaskId = card.dataset.task;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedTaskId = null; });
  });

  // Drop zones
  document.querySelectorAll('.kanban-drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (!draggedTaskId) return;
      const newStatus = zone.dataset.col;
      const task = updateTask(draggedTaskId, { status: newStatus });
      // Re-render board
      renderKanban(activeProjectId);
    });
  });
}

function updateColCount(colId, tasks) {
  const count = tasks.filter(t=>t.status===colId).length;
  const header = document.querySelector(`[data-col="${colId}"] .kanban-col-count`);
  if (header) header.textContent = count;
}

function fmtTime(mins) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}
