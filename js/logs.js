import { getLogs, getMember, formatDate, getRoleLevel, getCurrentUser } from './data.js';

export function renderLogs() {
  const user = getCurrentUser();
  // Double check permissions (fallback in case UI check fails)
  if (getRoleLevel(user.role) > 3) {
    document.getElementById('view-logs').innerHTML = `
      <div class="view-header">
        <div class="view-header-left">
          <h1>Activity Logs</h1>
          <p>Access Denied. Only Owners and Project Leads can view logs.</p>
        </div>
      </div>`;
    return;
  }

  const logs = getLogs();

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Activity Logs</h1>
        <p>Monitor team actions and updates in real-time.</p>
      </div>
    </div>
    <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);border:1px solid var(--border);padding:var(--space-4);">
      ${logs.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No activity logs found.</p>' : `
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${logs.map(log => {
            const member = getMember(log.userId);
            if (!member) return '';
            return `
              <div style="display:flex;gap:16px;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid var(--border);">
                <div class="avatar-sm" style="background:${member.color};flex-shrink:0;">${member.initials}</div>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;">
                    <strong style="color:var(--text-primary);font-size:0.95rem;">${member.name}</strong>
                    <span style="font-size:0.8rem;color:var(--text-muted);">${formatTime(log.timestamp)}</span>
                  </div>
                  <div style="margin-top:4px;font-size:0.9rem;color:var(--text-secondary);">
                    <span style="color:var(--text-primary);font-weight:500;">${formatAction(log.action)}</span> 
                    ${log.details ? `— <em>${log.details}</em>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  document.getElementById('view-logs').innerHTML = html;
}
