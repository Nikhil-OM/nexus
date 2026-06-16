import { getMembers, getTasks, getMember, getProjects } from './data.js';

export function renderWorkload() {
  const members = getMembers();
  const allTasks = getTasks();
  const maxTasks = Math.max(...members.map(m => allTasks.filter(t => t.assignee===m.id && t.status!=='done').length), 1);

  const memberData = members.map(m => {
    const active   = allTasks.filter(t => t.assignee===m.id && t.status!=='done');
    const critical = active.filter(t => t.priority==='critical').length;
    const high     = active.filter(t => t.priority==='high').length;
    const done     = allTasks.filter(t => t.assignee===m.id && t.status==='done').length;
    const pct      = Math.round(active.length / maxTasks * 100);
    const level    = pct > 85 ? 'crit' : pct > 60 ? 'high' : pct > 30 ? 'med' : 'low';
    return { ...m, active, critical, high, done, pct, level };
  });

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Team Workload</h1>
        <p>See who's overloaded and who has capacity</p>
      </div>
    </div>

    <!-- Workload Bars -->
    <div class="card" style="margin-bottom:var(--space-4)">
      <div class="card-header">
        <span class="card-title">Workload Distribution</span>
        <div style="display:flex;gap:12px;font-size:.75rem;color:var(--text-muted)">
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:var(--health-good);display:inline-block"></span>Normal</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:var(--priority-medium);display:inline-block"></span>Busy</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:var(--priority-high);display:inline-block"></span>Heavy</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:var(--priority-critical);display:inline-block"></span>Overloaded</span>
        </div>
      </div>
      <div class="workload-grid stagger">
        ${memberData.map(m => `
          <div class="workload-row">
            <div class="workload-member">
              <div class="avatar-sm" style="background:${m.color};width:32px;height:32px;font-size:.75rem">${m.initials}</div>
              <div>
                <div class="workload-member-name">${m.name.split(' ')[0]}</div>
                <div style="font-size:.7rem;color:var(--text-muted)">${m.role}</div>
              </div>
            </div>
            <div class="workload-bar-track">
              <div class="workload-bar-fill workload-${m.level}" style="width:${m.pct}%"></div>
            </div>
            <div class="workload-count">${m.active.length} active</div>
            ${m.level==='crit' ? '<span style="font-size:1rem" title="Overloaded">🔥</span>' : m.level==='high' ? '<span style="font-size:1rem">⚠️</span>' : '<span style="font-size:1rem">✅</span>'}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Member Cards -->
    <div class="section-title">Member Task Breakdown</div>
    <div class="grid-auto stagger">
      ${memberData.map(m => `
        <div class="card">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)">
            <div class="avatar-sm" style="background:${m.color};width:44px;height:44px;font-size:1rem;border-radius:50%">${m.initials}</div>
            <div>
              <div style="font-weight:700">${m.name}</div>
              <div style="font-size:.75rem;color:var(--text-muted)">${m.role}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-bottom:var(--space-3)">
            <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:var(--space-2)">
              <div style="font-size:1.3rem;font-weight:800">${m.active.length}</div>
              <div style="font-size:.7rem;color:var(--text-muted)">Active</div>
            </div>
            <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:var(--space-2)">
              <div style="font-size:1.3rem;font-weight:800;color:var(--health-good)">${m.done}</div>
              <div style="font-size:.7rem;color:var(--text-muted)">Done</div>
            </div>
          </div>
          ${m.critical ? `<div style="font-size:.8rem;color:var(--priority-critical);margin-bottom:4px">⚡ ${m.critical} critical task${m.critical>1?'s':''}</div>` : ''}
          <div style="font-size:.75rem;color:var(--text-muted)">
            ${m.active.slice(0,3).map(t=>`<div style="padding:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">· ${t.title}</div>`).join('')}
            ${m.active.length > 3 ? `<div style="color:var(--brand-primary)">+${m.active.length-3} more</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('view-workload').innerHTML = html;
  lucide.createIcons();
}
