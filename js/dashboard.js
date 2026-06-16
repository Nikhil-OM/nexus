import { getProjects, getTasks, getMembers, getMember, calcHealthScore, formatDate, isOverdue, isDueSoon, moodEmoji, getCurrentUser, getTodayMood } from './data.js';

export function renderDashboard() {
  console.log('Nexus PM: Rendering Dashboard...');
  const projects = getProjects() || [];
  const allTasks = getTasks() || [];
  const members = getMembers() || [];
  const user = getCurrentUser();
  const now = new Date();

  if (!user) {
    console.error('Nexus PM: No current user found during dashboard render');
    return;
  }

  // Stats
  const totalTasks = allTasks.length;
  const doneTasks  = allTasks.filter(t => t.status === 'done').length;
  const overdueTasks = allTasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const inProgressTasks = allTasks.filter(t => t.status === 'inprogress').length;

  // Upcoming deadlines (next 7 days, not done)
  const upcoming = allTasks
    .filter(t => t.dueDate && t.status !== 'done')
    .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Team mood avg
  const moodAvg = (members.reduce((s,m) => s + (m.mood.at(-1)||3), 0) / members.length).toFixed(1);

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Good ${greeting()}, ${user.name ? user.name.split(' ')[0] : 'Member'} 👋</h1>
        <p>Here's your project overview for today</p>
      </div>
      <div class="view-header-actions">
        <span style="font-size:0.85rem;color:var(--text-secondary)">${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid-4 stagger" style="margin-bottom:var(--space-6)">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--brand-primary)"><i data-lucide="check-square"></i></div>
        <div class="stat-value">${doneTasks}<span style="font-size:1rem;color:var(--text-muted)">/${totalTasks}</span></div>
        <div class="stat-label">Tasks Completed</div>
        <div class="stat-change up"><i data-lucide="trending-up"></i>${Math.round(doneTasks/totalTasks*100)}% completion rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--status-inprogress)"><i data-lucide="loader"></i></div>
        <div class="stat-value">${inProgressTasks}</div>
        <div class="stat-label">In Progress</div>
        <div class="stat-change" style="color:var(--brand-sky)"><i data-lucide="activity"></i>Active right now</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--priority-critical)"><i data-lucide="alert-triangle"></i></div>
        <div class="stat-value" style="color:${overdueTasks>0?'var(--priority-critical)':'var(--health-good)'}">${overdueTasks}</div>
        <div class="stat-label">Overdue Tasks</div>
        <div class="stat-change ${overdueTasks>0?'down':'up'}">
          <i data-lucide="${overdueTasks>0?'alert-circle':'check-circle'}"></i>${overdueTasks>0?'Needs attention':'All on track'}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--brand-teal)"><i data-lucide="heart"></i></div>
        <div class="stat-value">${moodEmoji(Math.round(parseFloat(moodAvg)))}<span style="font-size:1rem;margin-left:4px">${moodAvg}</span></div>
        <div class="stat-label">Team Mood</div>
        <div class="stat-change up"><i data-lucide="users"></i>${members.length} members checked in</div>
      </div>
    </div>

    <!-- Projects + Sidebar -->
    <div class="dashboard-layout">
      <div>
        <div class="section-title">Active Projects</div>
        <div class="grid-auto stagger" id="project-cards-grid">
          ${projects.map(p => renderProjectCard(p)).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <!-- Upcoming -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Upcoming Deadlines</span>
            <i data-lucide="calendar" style="width:16px;height:16px;color:var(--text-muted)"></i>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${upcoming.map(t => {
              const m = getMember(t.assignee);
              const over = isOverdue(t.dueDate, t.status);
              const soon = isDueSoon(t.dueDate, t.status);
              return `<div class="focus-task-item view-upcoming-task" style="cursor:pointer" data-id="${t.id}">
                <div class="avatar-sm" style="background:${m?.color||'#7c3aed'}">${m?.initials||'?'}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</div>
                  <div style="font-size:.72rem;color:${over?'var(--priority-critical)':soon?'var(--priority-high)':'var(--text-muted)'}">
                    ${over?'⚠️ Overdue · ':''}${formatDate(t.dueDate)}
                  </div>
                </div>
                <span class="badge badge-${t.priority}">${t.priority}</span>
              </div>`;
            }).join('') || '<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:var(--space-4)">🎉 No upcoming deadlines!</p>'}
          </div>
        </div>

        <!-- Team Mood Heatmap -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Team Mood Today</span>
            <i data-lucide="heart" style="width:16px;height:16px;color:var(--brand-coral)"></i>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${members.map(m => {
              const today = getTodayMood(m.id);
              const score = today ?? m.mood.at(-1) ?? 3;
              return `<div style="display:flex;align-items:center;gap:var(--space-2)">
                <div class="avatar-sm" style="background:${m.color}">${m.initials}</div>
                <div style="flex:1;font-size:.8rem;font-weight:500">${m.name.split(' ')[0]}</div>
                <div style="display:flex;gap:3px">${[1,2,3,4,5].map(i=>`<div style="width:10px;height:10px;border-radius:50%;background:${i<=score?moodColor(score):'var(--border-strong)'}"></div>`).join('')}</div>
                <span style="font-size:1rem">${moodEmoji(score)}</span>
              </div>`;
            }).join('')}
          </div>
          <p style="font-size:.72rem;color:var(--text-muted);margin-top:var(--space-3);text-align:center">Click ❤️ in the sidebar to check in</p>
        </div>
      </div>
    </div>
  `;
  document.getElementById('view-dashboard').innerHTML = html;
  if (window.lucide) window.lucide.createIcons();

  // Upcoming task clicks
  document.querySelectorAll('.view-upcoming-task').forEach(el => {
    el.addEventListener('click', () => {
      if (window.openTask) window.openTask(el.dataset.id);
    });
  });

  // Project card click → switch to kanban filtered
  document.querySelectorAll('.project-card[data-project]').forEach(card => {
    card.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('nexus:navigate', { detail: { view:'kanban', projectId: card.dataset.project } }));
    });
  });
}

function renderProjectCard(p) {
  const tasks = getTasks(p.id);
  const done  = tasks.filter(t => t.status === 'done').length;
  const pct   = tasks.length ? Math.round(done/tasks.length*100) : 0;
  const health = calcHealthScore(p.id);
  const healthClass = health >= 70 ? 'good' : health >= 40 ? 'warn' : 'danger';
  const healthLabel = health >= 70 ? 'Healthy' : health >= 40 ? 'At Risk' : 'Critical';
  const memberColors = p.members.map(uid => getMember(uid)?.color || '#7c3aed');

  return `<div class="project-card" data-project="${p.id}">
    <div class="project-card-top">
      <div class="project-icon" style="background:${p.color}22">${p.emoji}</div>
      <span class="badge badge-health-${healthClass}">${healthLabel} · ${health}</span>
    </div>
    <div class="project-name">${p.name}</div>
    <div class="project-desc">${p.desc}</div>
    <div class="project-progress-bar"><div class="project-progress-fill" style="width:${pct}%"></div></div>
    <div class="project-meta">
      <div class="project-members">
        ${memberColors.map((c,i) => `<div class="member-stack" style="background:${c}">${getMember(p.members[i])?.initials||'?'}</div>`).join('')}
      </div>
      <span style="font-size:.75rem;color:var(--text-secondary)">${done}/${tasks.length} tasks · ${pct}%</span>
    </div>
  </div>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function moodColor(score) {
  return ['','#ef4444','#f97316','#f59e0b','#10b981','#06d6a0'][score]||'#f59e0b';
}
