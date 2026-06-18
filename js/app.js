import { renderDashboard }  from './dashboard.js';
import { renderKanban }     from './kanban.js';
import { renderTimeline }   from './timeline.js';
import { renderWorkload }   from './workload.js';
import { renderFocus }      from './focus.js';
import { renderTeam }       from './team.js';
import { renderAppointments } from './appointments.js';
import { renderLogs }       from './logs.js';
import { renderSettings, initTheme, toggleTheme, loadAccent } from './settings.js';
import { initCommand }      from './command.js';
import {
  getProjects, getMembers, getTask, getTasks,
  createTask, updateTask, getMember, getCurrentUser,
  getProject, setMood, getTodayMood, calcHealthScore,
  formatDate, getStatusLabel, getPriorityLabel, fmtTime, moodEmoji,
  getAssignableMembers, switchUser, createProject, getRoleLevel,
  addTaskComment, getNotifications, markAllNotificationsRead
} from './data.js';


// ---- State ----
let currentView      = 'dashboard';
let currentProjectId = null;
let lastKanbanProjectId = null;
let activeTimers     = {}; // taskId → { start, elapsed }

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Nexus PM: Initializing...');
  
  // Safe initialization wrapper
  const safeInit = (name, fn) => {
    try {
      fn();
    } catch (e) {
      console.error(`Nexus PM: Failed to init ${name}:`, e);
    }
  };

  safeInit('Theme', () => initTheme());
  safeInit('Accent', () => loadAccent());
  
  // Safe Lucide
  safeInit('Icons', () => {
    if (window.lucide) window.lucide.createIcons();
    else console.warn('Lucide not found, icons will not render.');
  });

  safeInit('Sidebar UI', () => buildSidebar());
  safeInit('Navigation', () => navigateTo('dashboard'));
  safeInit('Command Palette', () => initCommand());
  safeInit('Mood Modal', () => initMoodModal());
  safeInit('Project Modal', () => initCreateProjectModal());
  safeInit('Task Modal', () => initCreateTaskModal());
  safeInit('Detail Modal', () => initTaskModal());
  safeInit('Topbar', () => initTopbar());
  safeInit('Sidebar Events', () => initSidebar());
  safeInit('Custom Project Select', () => initCustomProjectSelect());

  // Show mood check-in if not done today
  safeInit('Mood Prompt', () => {
    const currentUser = getCurrentUser();
    if (currentUser && getTodayMood(currentUser.id) === null) {
      setTimeout(() => showMoodModal(), 1200);
    }
  });

  // Listen for internal navigation events
  window.addEventListener('nexus:navigate', e => {
    navigateTo(e.detail.view, e.detail.projectId);
  });

  safeInit('Notif Dot', () => checkNotifDot());
});

// ---- Router ----
function navigateTo(view, projectId) {
  currentView      = view;
  
  if (view === 'kanban') {
    if (projectId !== undefined) {
      currentProjectId = projectId;
      lastKanbanProjectId = projectId;
    } else {
      currentProjectId = lastKanbanProjectId;
    }
  } else {
    currentProjectId = projectId || null;
  }

  // Update nav active states
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  // Hide all views, show target
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add('active');

  // Update breadcrumb
  const labels = { dashboard:'Dashboard', kanban:'Kanban Board', timeline:'Timeline', workload:'Workload', focus:'Focus Mode', team:'Team', settings:'Settings', logs:'Activity Logs', appointments:'Appointments' };
  document.getElementById('breadcrumb').innerHTML = `<span>${labels[view] || view}</span>`;

  // Render view
  switch (view) {
    case 'dashboard':    renderDashboard(); break;
    case 'kanban':       renderKanban(currentProjectId); break;
    case 'timeline':     renderTimeline(); break;
    case 'workload':     renderWorkload(); break;
    case 'focus':        renderFocus(); break;
    case 'team':         renderTeam(); break;
    case 'appointments': renderAppointments(); break;
    case 'logs':         renderLogs(); break;
    case 'settings':     renderSettings(); break;
  }

  // Scroll to top
  document.getElementById('main-content')?.scrollTo(0, 0);
}

// ---- Sidebar ----
function buildSidebar() {
  const user = getCurrentUser();
  const projects = getProjects();
  const container = document.getElementById('sidebar-projects');
  
  const addProjBtn = document.getElementById('add-project-btn');
  if (addProjBtn) {
    if (getRoleLevel(user.role) === 1) {
      addProjBtn.classList.remove('hidden');
    } else {
      addProjBtn.classList.add('hidden');
    }
  }

  const logsNav = document.getElementById('nav-logs');
  if (logsNav) {
    // Only Owners (1) and HR/Leads (2, 3) can see logs? The prompt said "owner or project lead". Let's allow <= 3.
    if (getRoleLevel(user.role) <= 3) {
      logsNav.style.display = '';
    } else {
      logsNav.style.display = 'none';
      if (currentView === 'logs') {
        navigateTo('dashboard'); // Redirect if they were on logs
      }
    }
  }

  if (!container) return;
  container.innerHTML = projects.map(p => {
    const health = calcHealthScore(p.id);
    return `<div class="sidebar-project-item" data-project="${p.id}">
      <span class="project-dot" style="background:${p.color}"></span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</span>
      <span style="font-size:.65rem;color:${health>=70?'var(--health-good)':health>=40?'var(--priority-medium)':'var(--priority-critical)'}">${health}</span>
    </div>`;
  }).join('');

  // Current user
  const avatarEl = document.getElementById('current-user-avatar');
  const nameEl   = document.getElementById('current-user-name');
  const roleEl   = document.getElementById('current-user-role');
  
  if (avatarEl) { avatarEl.textContent = user.initials; avatarEl.style.background = user.color; }
  if (nameEl)   nameEl.textContent = user.name;
  if (roleEl)   roleEl.textContent = user.role;
  
  lucide.createIcons();
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');

  const closeMobileSidebar = () => {
    sidebar?.classList.remove('mobile-open');
    overlay?.classList.add('hidden');
  };

  // Nav item clicks
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.view);
      closeMobileSidebar(); // Close sidebar on mobile after navigation
    });
  });

  // Project item clicks (Delegation)
  document.getElementById('sidebar-projects')?.addEventListener('click', e => {
    const item = e.target.closest('.sidebar-project-item');
    if (item && item.dataset.project) {
      navigateTo('kanban', item.dataset.project);
      closeMobileSidebar();
    }
  });

  // Collapse toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      // Mobile behavior
      sidebar?.classList.toggle('mobile-open');
      if (sidebar?.classList.contains('mobile-open')) {
        overlay?.classList.remove('hidden');
      } else {
        overlay?.classList.add('hidden');
      }
    } else {
      // Desktop behavior
      sidebar?.classList.toggle('collapsed');
    }
  });

  // Close overlay on click
  overlay?.addEventListener('click', closeMobileSidebar);

  // Mood trigger
  document.getElementById('mood-trigger')?.addEventListener('click', showMoodModal);
}

function initCustomProjectSelect() {
  const container = document.getElementById('project-custom-select');
  const trigger = container?.querySelector('.custom-select-trigger');
  const dropdown = container?.querySelector('.custom-select-dropdown');
  const searchInput = container?.querySelector('.custom-select-search-input');
  const hiddenSelect = document.getElementById('task-project-select');
  
  if (!container || !trigger || !dropdown || !searchInput) return;

  // Toggle dropdown on click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = container.classList.contains('open');
    if (isOpen) {
      closeCustomSelect();
    } else {
      openCustomSelect();
    }
  });

  // Prevent closing when clicking inside the dropdown search wrapper
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Filter options on search input
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const options = container.querySelectorAll('.custom-select-option');
    let matchCount = 0;
    
    options.forEach(opt => {
      const text = opt.textContent.toLowerCase();
      if (text.includes(query)) {
        opt.classList.remove('hidden');
        matchCount++;
      } else {
        opt.classList.add('hidden');
      }
    });

    // Handle no results
    let noResultsMsg = container.querySelector('.custom-select-no-results');
    if (matchCount === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'custom-select-no-results';
        noResultsMsg.textContent = 'No projects found';
        container.querySelector('.custom-select-options').appendChild(noResultsMsg);
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove();
    }
  });

  // Handle selection delegation
  const optionsList = document.getElementById('custom-select-options-list');
  optionsList?.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-select-option');
    if (!option) return;

    const value = option.dataset.value;
    const emoji = option.dataset.emoji;
    const name = option.dataset.name;

    // Update active option
    container.querySelectorAll('.custom-select-option').forEach(opt => {
      opt.classList.toggle('selected', opt === option);
    });

    // Sync to hidden select
    if (hiddenSelect) {
      hiddenSelect.value = value;
      hiddenSelect.dispatchEvent(new Event('change'));
    }

    // Update trigger label
    const selectedValEl = trigger.querySelector('.custom-select-selected-value');
    if (selectedValEl) {
      selectedValEl.innerHTML = `<span class="project-dot-icon" style="margin-right: 8px;">${emoji}</span> ${name}`;
    }

    // Close
    closeCustomSelect();
  });

  // Global document click to close dropdown when clicking outside
  document.addEventListener('click', () => {
    closeCustomSelect();
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCustomSelect();
    }
  });

  function openCustomSelect() {
    container.classList.add('open');
    dropdown.classList.remove('hidden');
    searchInput.value = '';
    // focus search
    setTimeout(() => searchInput.focus(), 50);
    // reset options visibility
    container.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('hidden'));
    const noResultsMsg = container.querySelector('.custom-select-no-results');
    if (noResultsMsg) noResultsMsg.remove();
  }

  function closeCustomSelect() {
    container.classList.remove('open');
    dropdown.classList.add('hidden');
  }
}

function initTopbar() {
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('topbar-create-task')?.addEventListener('click', () => openCreateTask());
  
  // Notification center
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  const clearNotifsBtn = document.getElementById('clear-notifs');

  notifBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown?.classList.toggle('hidden');
    if (!notifDropdown?.classList.contains('hidden')) {
      renderNotifications();
    }
  });

  document.addEventListener('click', (e) => {
    if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.classList.add('hidden');
    }
  });

  clearNotifsBtn?.addEventListener('click', () => {
    markAllNotificationsRead(getCurrentUser().id);
    renderNotifications();
    checkNotifDot();
  });
}

// ---- Create Project Modal ----
function initCreateProjectModal() {
  document.getElementById('add-project-btn')?.addEventListener('click', window.openCreateProject);
  document.getElementById('create-project-close')?.addEventListener('click', closeCreateProject);
  document.getElementById('cancel-create-project')?.addEventListener('click', closeCreateProject);
  document.getElementById('create-project-modal')?.addEventListener('click', e => {
    if (e.target.id === 'create-project-modal') closeCreateProject();
  });

  document.getElementById('create-project-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('proj-name-input').value.trim();
    const desc  = document.getElementById('proj-desc-input').value.trim();
    const emoji = document.getElementById('proj-emoji-input').value.trim() || '📁';
    const color = document.getElementById('proj-color-input').value;
    const startDate = document.getElementById('proj-start-input').value;
    const endDate   = document.getElementById('proj-end-input').value;

    const checkboxes = document.querySelectorAll('.proj-member-checkbox:checked');
    const members = Array.from(checkboxes).map(cb => cb.value);

    if (!name) return;
    
    // Ensure creator is always a member
    if (!members.includes(getCurrentUser().id)) {
      members.push(getCurrentUser().id);
    }

    const newProj = createProject({ name, desc, emoji, color, startDate, endDate, members });
    closeCreateProject();
    buildSidebar();
    window.dispatchEvent(new CustomEvent('nexus:navigate', { detail: { view: 'kanban', projectId: newProj.id } }));
  });
}

function closeCreateProject() {
  document.getElementById('create-project-modal')?.classList.add('hidden');
  document.getElementById('create-project-form')?.reset();
}

window.openCreateProject = function() {
  const container = document.getElementById('proj-members-container');
  // Only owners can create, so they can assign anyone
  const allMembers = getMembers(); 
  container.innerHTML = allMembers.map(m => `
    <label style="display:flex;align-items:center;gap:4px;font-size:.8rem;cursor:pointer">
      <input type="checkbox" class="proj-member-checkbox" value="${m.id}" ${m.id === getCurrentUser().id ? 'checked disabled' : ''} />
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${m.color}"></span>
      ${m.name}
    </label>
  `).join('');

  document.getElementById('create-project-modal')?.classList.remove('hidden');
  document.getElementById('proj-name-input')?.focus();
};

// ---- Mood Modal ----
function initMoodModal() {
  document.getElementById('skip-mood')?.addEventListener('click', () => {
    document.getElementById('mood-modal')?.classList.add('hidden');
  });

  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const score = parseInt(btn.dataset.mood);
      const user  = getCurrentUser();
      setMood(user.id, score);
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(() => {
        document.getElementById('mood-modal')?.classList.add('hidden');
        // Refresh dashboard if open
        if (currentView === 'dashboard') renderDashboard();
        if (currentView === 'team')      renderTeam();
        buildSidebar();
      }, 600);
    });
  });
}

function showMoodModal() {
  document.getElementById('mood-modal')?.classList.remove('hidden');
}

// ---- Create Task Modal ----
function initCreateTaskModal() {
  document.getElementById('create-modal-close')?.addEventListener('click', closeCreateTask);
  document.getElementById('cancel-create-task')?.addEventListener('click', closeCreateTask);
  document.getElementById('create-task-modal')?.addEventListener('click', e => {
    if (e.target.id === 'create-task-modal') closeCreateTask();
  });

  document.getElementById('create-task-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const title    = document.getElementById('task-title-input').value.trim();
    const desc     = document.getElementById('task-desc-input').value.trim();
    const projectId= document.getElementById('task-project-select').value;
    const status   = document.getElementById('task-status-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const assignee = document.getElementById('task-assignee-select').value;
    const dueDate  = document.getElementById('task-due-input').value;
    const tags     = document.getElementById('task-tags-input').value.split(',').map(t=>t.trim()).filter(Boolean);

    if (!title || !projectId) return;
    createTask({ title, desc, projectId, status, priority, assignee, dueDate, tags });
    closeCreateTask();

    // Refresh current view
    if (currentView === 'dashboard')  renderDashboard();
    if (currentView === 'kanban')     renderKanban(currentProjectId);
    if (currentView === 'workload')   renderWorkload();
    if (currentView === 'focus')      renderFocus();
    buildSidebar();
  });
}

function closeCreateTask() {
  document.getElementById('create-task-modal')?.classList.add('hidden');
  document.getElementById('create-task-form')?.reset();
}

window.openCreateTask = function(defaultStatus, defaultProjectId) {
  console.log('Nexus PM: Opening Create Task modal...', { defaultStatus, defaultProjectId, currentProjectId });
  try {
    const projects = getProjects() || [];
    const targetProjId = defaultProjectId || currentProjectId || (projects[0]?.id);

    // Populate project select (hidden)
    const projSel = document.getElementById('task-project-select');
    if (projSel) {
      projSel.innerHTML = projects.map(p => `<option value="${p.id}" ${p.id===targetProjId?'selected':''}>${p.emoji} ${p.name}</option>`).join('');
      projSel.value = targetProjId;
    }

    // Populate custom select options
    const customOptionsList = document.getElementById('custom-select-options-list');
    const customTriggerValue = document.querySelector('#project-custom-select .custom-select-selected-value');

    if (customOptionsList) {
      customOptionsList.innerHTML = projects.map(p => `
        <div class="custom-select-option ${p.id === targetProjId ? 'selected' : ''}" 
             data-value="${p.id}" 
             data-emoji="${p.emoji}" 
             data-name="${p.name}">
          <span class="custom-select-option-emoji" style="margin-right: 8px;">${p.emoji}</span>
          <span class="custom-select-option-name">${p.name}</span>
        </div>
      `).join('');
    }

    // Set custom trigger label
    if (customTriggerValue) {
      const selectedProj = projects.find(p => p.id === targetProjId);
      if (selectedProj) {
        customTriggerValue.innerHTML = `<span class="project-dot-icon" style="margin-right: 8px;">${selectedProj.emoji}</span> ${selectedProj.name}`;
      } else {
        customTriggerValue.textContent = 'Select Project...';
      }
    }

    // Reset dropdown search state
    const customContainer = document.getElementById('project-custom-select');
    const searchInput = customContainer?.querySelector('.custom-select-search-input');
    const dropdown = customContainer?.querySelector('.custom-select-dropdown');
    
    if (customContainer) {
      customContainer.classList.remove('open');
    }
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    if (searchInput) {
      searchInput.value = '';
    }

    // Populate assignee select based on hierarchy
    const currentUser = getCurrentUser();
    const assignable = currentUser ? getAssignableMembers(currentUser) : [];
    const assSel = document.getElementById('task-assignee-select');
    
    if (assSel) {
      assSel.innerHTML = '<option value="">Unassigned</option>' +
        assignable.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');
    }

    // Set default status
    const statusSel = document.getElementById('task-status-select');
    if (statusSel && defaultStatus) statusSel.value = defaultStatus;

    const modal = document.getElementById('create-task-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.getElementById('task-title-input')?.focus();
    } else {
      console.error('Nexus PM: Create task modal not found in DOM');
    }
  } catch (e) {
    console.error('Nexus PM: Error in openCreateTask:', e);
  }
};

// ---- Task Detail Modal ----
function initTaskModal() {
  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('task-modal')?.classList.add('hidden');
  });
  document.getElementById('task-modal')?.addEventListener('click', e => {
    if (e.target.id === 'task-modal') document.getElementById('task-modal').classList.add('hidden');
  });
}

window.openTask = function(taskId) {
  const task  = getTask(taskId);
  if (!task) return;
  const m     = getMember(task.assignee);
  const proj  = getProject(task.projectId);
  const over  = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  document.getElementById('modal-title').textContent = task.title;
  document.getElementById('modal-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-4)">
      ${task.desc ? `<p style="color:var(--text-secondary);font-size:.9rem;line-height:1.6">${task.desc}</p>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        <div>
          <div class="section-title">Project</div>
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${proj?.color||'#7c3aed'};display:inline-block"></span>
            ${proj?.name||'Unknown'}
          </span>
        </div>
        <div>
          <div class="section-title">Status</div>
          <span class="badge badge-${task.status}">${getStatusLabel(task.status)}</span>
        </div>
        <div>
          <div class="section-title">Priority</div>
          <span class="badge badge-${task.priority}">${getPriorityLabel(task.priority)}</span>
        </div>
        <div>
          <div class="section-title">Assignee</div>
          ${m ? `<span style="display:flex;align-items:center;gap:6px">
            <div class="avatar-sm" style="background:${m.color}">${m.initials}</div>${m.name}
          </span>` : '<span style="color:var(--text-muted)">Unassigned</span>'}
        </div>
        <div>
          <div class="section-title">Due Date</div>
          <span class="${over?'overdue':''}">${formatDate(task.dueDate)||'—'} ${over?'⚠️':''}</span>
        </div>
        <div>
          <div class="section-title">Time Logged</div>
          <span>${task.timeLogged ? fmtTime(task.timeLogged) : '—'}</span>
        </div>
      </div>
      ${task.tags?.length ? `<div><div class="section-title">Tags</div><div style="display:flex;gap:4px;flex-wrap:wrap">${task.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></div>` : ''}
      
      <!-- Comments Section -->
      <div style="margin-top:var(--space-4); border-top:1px solid var(--border); padding-top:var(--space-4)">
        <div class="section-title">Comments</div>
        <div id="comment-list" style="display:flex; flex-direction:column; gap:var(--space-3); margin-bottom:var(--space-4)">
          ${renderCommentsHtml(task)}
        </div>
        <div style="display:flex; gap:8px">
          <input type="text" id="comment-input" placeholder="Add a comment... (use @name to tag)" style="flex:1; height:36px" />
          <button class="btn btn-primary btn-sm" onclick="window.submitComment('${task.id}')">Post</button>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;padding-top:var(--space-2);border-top:1px solid var(--border); margin-top:var(--space-2)">
        ${task.status !== 'done' ? `<button class="btn btn-teal btn-sm" onclick="window.markDone('${task.id}')"><i data-lucide="check"></i>Mark Done</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="window.startTaskTimer('${task.id}')"><i data-lucide="play"></i>Log Time</button>
        <button class="btn btn-danger btn-sm" onclick="window.deleteTaskUI('${task.id}')"><i data-lucide="trash-2"></i>Delete</button>
      </div>
    </div>`;
  document.getElementById('task-modal')?.classList.remove('hidden');
  lucide.createIcons();
};

function renderCommentsHtml(task) {
  if (!task.comments || task.comments.length === 0) return '<p style="color:var(--text-muted); font-size:0.8rem">No comments yet.</p>';
  return task.comments.map(c => {
    const user = getMember(c.userId);
    return `
      <div style="display:flex; gap:12px">
        <div class="avatar-sm" style="background:${user?.color || '#ccc'}">${user?.initials || '?'}</div>
        <div style="flex:1">
          <div style="display:flex; justify-content:space-between; align-items:baseline">
            <span style="font-size:0.8rem; font-weight:700">${user?.name || 'Unknown'}</span>
            <span style="font-size:0.7rem; color:var(--text-muted)">${new Date(c.timestamp).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:2px">${formatMentions(c.text)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function formatMentions(text) {
  return text.replace(/@(\w+)/g, '<span style="color:var(--brand-primary); font-weight:600">@$1</span>');
}

window.submitComment = function(taskId) {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;
  addTaskComment(taskId, text);
  input.value = '';
  // Re-render comments
  const task = getTask(taskId);
  document.getElementById('comment-list').innerHTML = renderCommentsHtml(task);
  checkNotifDot(); // Check if notifications were created
};

function renderNotifications() {
  const user = getCurrentUser();
  const notifs = getNotifications(user.id);
  const container = document.getElementById('notif-list');
  
  if (notifs.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:var(--space-6); color:var(--text-muted); font-size:0.85rem">All caught up!</p>';
    return;
  }
  
  container.innerHTML = notifs.map(n => `
    <div style="padding:var(--space-3); border-radius:var(--radius-md); background:${n.read ? 'transparent' : 'var(--bg-elevated)'}; border:1px solid ${n.read ? 'var(--border)' : 'var(--border-brand)'}; cursor:pointer" onclick="window.handleNotifClick('${n.id}', '${n.relatedId}')">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px">
        <span class="badge" style="font-size:0.6rem; background:var(--brand-glow); color:var(--brand-light)">${n.type.toUpperCase()}</span>
        <span style="font-size:0.65rem; color:var(--text-muted)">${new Date(n.timestamp).toLocaleDateString()}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-primary); line-height:1.4">${n.text}</p>
    </div>
  `).join('');
}

window.handleNotifClick = function(notifId, relatedId) {
  // Close dropdown
  document.getElementById('notif-dropdown').classList.add('hidden');
  // Open task if relatedId exists
  if (relatedId) {
    window.openTask(relatedId);
  }
};

window.markDone = function(taskId) {
  updateTask(taskId, { status:'done' });
  document.getElementById('task-modal')?.classList.add('hidden');
  if (currentView === 'dashboard') renderDashboard();
  if (currentView === 'kanban')    renderKanban(currentProjectId);
  if (currentView === 'focus')     renderFocus();
  if (currentView === 'workload')  renderWorkload();
  buildSidebar();
};

window.deleteTaskUI = function(taskId) {
  if (!confirm('Delete this task?')) return;
  import('./data.js').then(({ deleteTask }) => {
    deleteTask(taskId);
    document.getElementById('task-modal')?.classList.add('hidden');
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'kanban')    renderKanban(currentProjectId);
    buildSidebar();
  });
};

window.startTaskTimer = function(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const mins = parseInt(prompt(`Log time for "${task.title}" (in minutes):`, '30'));
  if (!isNaN(mins) && mins > 0) {
    updateTask(taskId, { timeLogged: (task.timeLogged||0) + mins });
    document.getElementById('task-modal')?.classList.add('hidden');
    if (currentView === 'kanban') renderKanban(currentProjectId);
  }
};

// Notification dot: show if overdue tasks exist OR unread notifications
function checkNotifDot() {
  const user = getCurrentUser();
  const overdues = getTasks().filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date());
  const unreadNotifs = getNotifications(user?.id || '').filter(n => !n.read);
  const dot = document.getElementById('notif-dot');
  if (dot) dot.classList.toggle('hidden', overdues.length === 0 && unreadNotifs.length === 0);
}
