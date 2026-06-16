import { getProjects, getTasks, getMember, formatDate } from './data.js';

const TRACK_WIDTH = 700; // px for full timeline
const DAY_PX = TRACK_WIDTH / 180; // 6 months

export function renderTimeline() {
  const projects = getProjects();
  const startDate = new Date('2026-03-01');
  const endDate   = new Date('2026-09-01');
  const totalDays = (endDate - startDate) / 86400000;
  const months = getMonths(startDate, endDate);

  const rows = [];
  projects.forEach(proj => {
    const tasks = getTasks(proj.id).filter(t => t.dueDate);
    rows.push({ type:'project', proj, tasks });
  });

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Timeline</h1>
        <p>Gantt-style view of all projects and tasks</p>
      </div>
    </div>
    <div class="card" style="overflow:hidden">
      <div class="timeline-container">
        <!-- Header months -->
        <div class="timeline-header">
          <div class="timeline-label-col">Task / Project</div>
          <div class="timeline-months" style="width:${TRACK_WIDTH}px">
            ${months.map(m => `<div class="timeline-month" style="width:${m.days/totalDays*TRACK_WIDTH}px">${m.label}</div>`).join('')}
          </div>
        </div>

        ${projects.map(proj => {
          const projTasks = getTasks(proj.id).filter(t => t.dueDate);
          return `
            <!-- Project row -->
            <div class="timeline-row" style="background:${proj.color}11">
              <div class="timeline-task-label">
                <span style="font-weight:700;color:${proj.color}">${proj.emoji} ${proj.name}</span>
              </div>
              <div class="timeline-track" style="width:${TRACK_WIDTH}px;position:relative">
                ${renderBar(proj.startDate, proj.endDate, proj.color, proj.name, startDate, totalDays)}
                ${renderTodayLine(startDate, totalDays)}
              </div>
            </div>
            ${projTasks.map(task => {
              const m = getMember(task.assignee);
              // Estimate start from project start
              const taskStart = new Date(proj.startDate);
              const taskEnd   = new Date(task.dueDate);
              return `<div class="timeline-row">
                <div class="timeline-task-label" style="padding-left:32px">
                  <span style="font-size:.8rem">${task.title}</span>
                  ${m ? `<span class="avatar-sm" style="background:${m.color};display:inline-flex;width:16px;height:16px;font-size:.6rem;margin-left:4px">${m.initials}</span>` : ''}
                </div>
                <div class="timeline-track" style="width:${TRACK_WIDTH}px;position:relative">
                  ${renderBar(taskStart.toISOString().split('T')[0], task.dueDate, task.status==='done'?'#10b981':m?.color||proj.color, task.title, startDate, totalDays, task.status)}
                </div>
              </div>`;
            }).join('')}
          `;
        }).join('')}
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:var(--space-5);margin-top:var(--space-4);flex-wrap:wrap">
      <div class="flex flex-center gap-2"><div style="width:12px;height:12px;border-radius:3px;background:#10b981"></div><span class="text-sm text-muted">Completed</span></div>
      <div class="flex flex-center gap-2"><div style="width:12px;height:12px;border-radius:3px;background:#3b82f6"></div><span class="text-sm text-muted">In Progress</span></div>
      <div class="flex flex-center gap-2"><div style="width:2px;height:16px;background:var(--brand-coral)"></div><span class="text-sm text-muted">Today</span></div>
    </div>
  `;
  document.getElementById('view-timeline').innerHTML = html;
  lucide.createIcons();
}

function renderBar(start, end, color, label, baseDate, totalDays, status) {
  if (!start || !end) return '';
  const s = new Date(start), e = new Date(end);
  const left = Math.max(0, (s - baseDate) / 86400000 / totalDays * TRACK_WIDTH);
  const width = Math.max(4, (e - s) / 86400000 / totalDays * TRACK_WIDTH);
  const opacity = status === 'done' ? '1' : '0.85';
  return `<div class="timeline-bar" style="left:${left}px;width:${width}px;background:${color};opacity:${opacity}" title="${label}: ${formatDate(start)} → ${formatDate(end)}">
    ${width > 60 ? label.substring(0,20) + (label.length>20?'…':'') : ''}
  </div>`;
}

function renderTodayLine(baseDate, totalDays) {
  const now = new Date();
  const left = (now - baseDate) / 86400000 / totalDays * TRACK_WIDTH;
  if (left < 0 || left > TRACK_WIDTH) return '';
  return `<div class="timeline-today" style="left:${left}px"></div>`;
}

function getMonths(start, end) {
  const months = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur < end) {
    const next = new Date(cur.getFullYear(), cur.getMonth()+1, 1);
    const clampedEnd = next > end ? end : next;
    const days = (clampedEnd - cur) / 86400000;
    months.push({ label: cur.toLocaleDateString('en-US',{month:'short',year:'2-digit'}), days });
    cur = next;
  }
  return months;
}
