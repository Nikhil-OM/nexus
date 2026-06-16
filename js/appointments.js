import { getAppointmentsForUser, getCurrentUser, getMembers, getMember, createAppointment, isUserFree, formatDate } from './data.js';

export function renderAppointments() {
  const user = getCurrentUser();
  const appointments = getAppointmentsForUser(user.id);
  
  // Sort by date then time
  appointments.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Appointments & Meetings</h1>
        <p>Manage your schedule and coordinate with your team.</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary btn-sm" id="btn-open-create-appt"><i data-lucide="plus"></i>Schedule Meeting</button>
      </div>
    </div>
    
    <div style="display:grid;gap:16px;">
      ${appointments.length === 0 ? '<div style="background:var(--bg-elevated);padding:3rem;text-align:center;border-radius:var(--radius-lg);border:1px solid var(--border);color:var(--text-muted)">No upcoming appointments.</div>' : appointments.map(appt => {
        const creator = getMember(appt.creator);
        return `
        <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);border:1px solid var(--border);padding:var(--space-4);display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
          <div>
            <h3 style="margin-bottom:8px;">${appt.title}</h3>
            <div style="display:flex;gap:16px;color:var(--text-secondary);font-size:0.9rem;">
              <span style="display:flex;align-items:center;gap:6px;"><i data-lucide="calendar" style="width:16px;height:16px;"></i>${formatDate(appt.date)}</span>
              <span style="display:flex;align-items:center;gap:6px;"><i data-lucide="clock" style="width:16px;height:16px;"></i>${appt.startTime} - ${appt.endTime}</span>
            </div>
            ${creator ? `<div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted)">Scheduled by ${creator.name}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <span style="font-size:0.8rem;color:var(--text-muted)">Participants</span>
            <div style="display:flex;gap:4px;">
              ${appt.participants.map(pid => {
                const m = getMember(pid);
                if (!m) return '';
                return `<div class="avatar-sm" style="background:${m.color}" title="${m.name}">${m.initials}</div>`;
              }).join('')}
            </div>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('view-appointments').innerHTML = html;
  lucide.createIcons();
  
  document.getElementById('btn-open-create-appt')?.addEventListener('click', openCreateAppointment);
}

function initAppointmentModal() {
  document.getElementById('create-appointment-close')?.addEventListener('click', closeCreateAppointment);
  document.getElementById('cancel-create-appointment')?.addEventListener('click', closeCreateAppointment);
  
  const form = document.getElementById('create-appointment-form');
  const dateInput = document.getElementById('appt-date-input');
  const startInput = document.getElementById('appt-start-input');
  const endInput = document.getElementById('appt-end-input');
  const container = document.getElementById('appt-members-container');
  
  // Real-time availability check
  const checkAvailability = () => {
    const date = dateInput.value;
    const start = startInput.value;
    const end = endInput.value;
    
    if (!date || !start || !end) return;
    
    const checkboxes = document.querySelectorAll('.appt-member-checkbox');
    let statusHtml = '';
    let allFree = true;
    
    checkboxes.forEach(cb => {
      if (cb.checked) {
        const userId = cb.value;
        const member = getMember(userId);
        const free = isUserFree(userId, date, start, end);
        
        if (!free) allFree = false;
        
        statusHtml += `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${free ? 'var(--status-done)' : 'var(--status-review)'}"></span>
            <span style="color:var(--text-secondary)">${member.name} is <b style="color:${free ? 'var(--status-done)' : 'var(--status-review)'}">${free ? 'Free' : 'Busy'}</b></span>
          </div>
        `;
      }
    });
    
    document.getElementById('appt-availability-status').innerHTML = statusHtml;
    
    // Optionally disable submit if someone is busy (commented out to allow forcing meeting)
    // document.getElementById('btn-create-appt').disabled = !allFree;
  };

  dateInput?.addEventListener('change', checkAvailability);
  startInput?.addEventListener('change', checkAvailability);
  endInput?.addEventListener('change', checkAvailability);
  container?.addEventListener('change', checkAvailability); // Delegate to checkboxes

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('appt-title-input').value.trim();
    const date = dateInput.value;
    const startTime = startInput.value;
    const endTime = endInput.value;
    
    const checkboxes = document.querySelectorAll('.appt-member-checkbox:checked');
    const participants = Array.from(checkboxes).map(cb => cb.value);
    
    if (!participants.includes(getCurrentUser().id)) {
      participants.push(getCurrentUser().id);
    }
    
    if (startTime >= endTime) {
      alert("Start time must be before end time.");
      return;
    }

    createAppointment({ title, date, startTime, endTime, participants });
    closeCreateAppointment();
    renderAppointments(); // Re-render view
  });
}

function openCreateAppointment() {
  const container = document.getElementById('appt-members-container');
  const allMembers = getMembers(); 
  container.innerHTML = allMembers.map(m => `
    <label style="display:flex;align-items:center;gap:4px;font-size:.8rem;cursor:pointer">
      <input type="checkbox" class="appt-member-checkbox" value="${m.id}" ${m.id === getCurrentUser().id ? 'checked disabled' : ''} />
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${m.color}"></span>
      ${m.name}
    </label>
  `).join('');

  document.getElementById('appt-availability-status').innerHTML = '';
  document.getElementById('create-appointment-modal')?.classList.remove('hidden');
}

function closeCreateAppointment() {
  document.getElementById('create-appointment-modal')?.classList.add('hidden');
  document.getElementById('create-appointment-form')?.reset();
}

// Call init once when file loaded
initAppointmentModal();
