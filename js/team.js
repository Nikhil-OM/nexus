import { getMembers, getTasks, moodEmoji, moodColor, createMember, getCurrentUser, canUserAddMembers, getRoles, updateMemberRole } from './data.js';

export function renderTeam() {
  const members = getMembers();
  const allTasks = getTasks();

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Team</h1>
        <p>Track member workload, mood trends, and contributions</p>
      </div>
    </div>

    ${canUserAddMembers(getCurrentUser()) ? `
      <!-- Add Member Bar -->
      <div class="card" style="margin-bottom:var(--space-6);padding:var(--space-3) var(--space-4)">
        <form id="add-member-form" style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap">
          <input type="text" id="new-member-name" placeholder="Member Name (e.g. Jane Doe)" required style="flex:1;min-width:180px" />
          <select id="new-member-role" required style="flex:1;min-width:180px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px">
            <option value="" disabled selected>Select Role</option>
            ${getRoles().map(r => `<option value="${r.name}">${r.name}</option>`).join('')}
          </select>
          <input type="email" id="new-member-email" placeholder="Email (e.g. jane@nexus.com)" required style="flex:1.2;min-width:220px" />
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <label for="new-member-color" style="font-size:0.8rem;color:var(--text-secondary);font-weight:600">Color:</label>
            <input type="color" id="new-member-color" value="#06d6a0" title="Member Color" style="width:36px;height:36px;padding:0;border:none;border-radius:4px;cursor:pointer;background:transparent" />
          </div>
          <button type="submit" class="btn btn-primary"><i data-lucide="user-plus"></i> Add Member</button>
        </form>
      </div>
    ` : ''}

    <div class="team-grid stagger">
      ${members.map(m => {
        const active = allTasks.filter(t => t.assignee===m.id && t.status!=='done');
        const done   = allTasks.filter(t => t.assignee===m.id && t.status==='done');
        const latestMood = m.mood.at(-1) || 3;
        const avgMood = (m.mood.reduce((a,b)=>a+b,0)/m.mood.length).toFixed(1);
        return `
          <div class="team-card">
            <div class="team-avatar" style="background:linear-gradient(135deg,${m.color},${m.color}88)">
              ${m.initials}
              <span class="mood-indicator">${moodEmoji(latestMood)}</span>
            </div>
            <div class="team-name" style="display:flex; justify-content:center; align-items:center; position:relative;">
              <span style="text-align:center">${m.name}</span>
              ${canUserAddMembers(getCurrentUser()) ? `
                <button class="icon-btn btn-xs edit-member-btn" data-id="${m.id}" data-name="${m.name}" data-role="${m.role}" title="Edit Role" style="position:absolute; right:0;">
                  <i data-lucide="edit-2"></i>
                </button>
              ` : ''}
            </div>
            <div class="team-role">${m.role}</div>

            <!-- Mood history dots -->
            <div style="margin-bottom:8px">
              <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:4px">Mood this week</div>
              <div class="mood-history">
                ${m.mood.slice(-5).map(score => `
                  <div class="mood-dot" style="background:${moodColor(score)}" title="${moodEmoji(score)}"></div>
                `).join('')}
              </div>
              <div style="font-size:.7rem;color:var(--text-muted);margin-top:4px">Avg: ${avgMood}/5</div>
            </div>

            <div class="divider" style="margin:8px 0"></div>

            <div class="team-stats">
              <div class="team-stat">
                <div class="team-stat-val">${active.length}</div>
                <div class="team-stat-lbl">Active</div>
              </div>
              <div class="team-stat">
                <div class="team-stat-val" style="color:var(--health-good)">${done.length}</div>
                <div class="team-stat-lbl">Done</div>
              </div>
              <div class="team-stat">
                <div class="team-stat-val" style="color:var(--brand-primary)">${active.length+done.length}</div>
                <div class="team-stat-lbl">Total</div>
              </div>
            </div>

            <!-- Active task preview -->
            ${active.length > 0 ? `
              <div style="margin-top:var(--space-3);text-align:left">
                <div style="font-size:.7rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Current tasks</div>
                ${active.slice(0,2).map(t=>`
                  <div style="display:flex;align-items:center;gap:4px;padding:3px 0;font-size:.75rem">
                    <span class="badge badge-${t.priority}" style="padding:1px 5px">${t.priority[0].toUpperCase()}</span>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</span>
                  </div>
                `).join('')}
                ${active.length > 2 ? `<div style="font-size:.72rem;color:var(--brand-primary)">+${active.length-2} more tasks</div>` : ''}
              </div>
            ` : '<div style="margin-top:var(--space-3);font-size:.8rem;color:var(--health-good)">🎉 No active tasks!</div>'}
          </div>
        `;
      }).join('')}
    </div>

    <!-- Team Summary -->
    <div class="card" style="margin-top:var(--space-6)">
      <div class="card-header"><span class="card-title">Team Health Summary</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--space-4)">
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800">${members.length}</div>
          <div style="font-size:.8rem;color:var(--text-muted)">Team Members</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--brand-teal)">
            ${(members.reduce((s,m)=>s+(m.mood.at(-1)||3),0)/members.length).toFixed(1)}/5
          </div>
          <div style="font-size:.8rem;color:var(--text-muted)">Avg Team Mood</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--priority-high)">
            ${allTasks.filter(t=>t.status!=='done').length}
          </div>
          <div style="font-size:.8rem;color:var(--text-muted)">Open Tasks</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--health-good)">
            ${allTasks.filter(t=>t.status==='done').length}
          </div>
          <div style="font-size:.8rem;color:var(--text-muted)">Completed</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('view-team').innerHTML = html;
  lucide.createIcons();

  document.getElementById('add-member-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-member-name').value.trim();
    const role = document.getElementById('new-member-role').value.trim();
    const email = document.getElementById('new-member-email').value.trim();
    const color = document.getElementById('new-member-color').value;
    
    if (name && role && email) {
      const password = generateSecurePassword();
      createMember({ name, role, email, color, password });
      
      // Show credentials modal
      showCredentialsModal(name, email, password);
      
      renderTeam(); // Automatically re-renders the team grid
    }
  });

  document.querySelectorAll('.edit-member-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const role = btn.dataset.role;

      const modal = document.getElementById('edit-member-modal');
      const nameInput = document.getElementById('edit-member-name');
      const roleSelect = document.getElementById('edit-member-role');
      const idInput = document.getElementById('edit-member-id');

      if (!modal) return;

      idInput.value = id;
      nameInput.value = name;
      nameInput.readOnly = true;
      
      roleSelect.innerHTML = getRoles().map(r => `<option value="${r.name}" ${r.name === role ? 'selected' : ''}>${r.name}</option>`).join('');

      modal.classList.remove('hidden');
    });
  });

  document.getElementById('edit-member-close')?.addEventListener('click', () => {
    document.getElementById('edit-member-modal')?.classList.add('hidden');
  });
  document.getElementById('cancel-edit-member')?.addEventListener('click', () => {
    document.getElementById('edit-member-modal')?.classList.add('hidden');
  });

  const editForm = document.getElementById('edit-member-form');
  if (editForm) {
    const newEditForm = editForm.cloneNode(true);
    editForm.parentNode.replaceChild(newEditForm, editForm);
    newEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-member-id').value;
      const newRole = document.getElementById('edit-member-role').value;
      updateMemberRole(id, newRole);
      document.getElementById('edit-member-modal').classList.add('hidden');
      renderTeam();
    });
  }
}

function generateSecurePassword() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~|}{[]:;?><,./-=";
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = "";
  // Ensure at least one of each type is in the password for high security
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Fill the rest of the 12 characters
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

function showCredentialsModal(name, email, password) {
  const modal = document.getElementById('credentials-modal');
  const nameEl = document.getElementById('cred-name');
  const emailEl = document.getElementById('cred-email');
  const passwordInput = document.getElementById('cred-password');
  const copyBtn = document.getElementById('copy-password-btn');
  const closeBtn = document.getElementById('credentials-modal-close');
  const okBtn = document.getElementById('credentials-modal-ok-btn');

  if (!modal || !nameEl || !emailEl || !passwordInput) return;

  nameEl.textContent = name;
  emailEl.textContent = email;
  passwordInput.value = password;

  if (copyBtn) {
    copyBtn.textContent = 'Copy';
    copyBtn.className = 'btn btn-ghost btn-xs';
    
    // Remove previous listeners by replacing the element
    const newCopyBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
    
    newCopyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(password).then(() => {
        newCopyBtn.textContent = 'Copied!';
        newCopyBtn.className = 'btn btn-teal btn-xs';
        setTimeout(() => {
          newCopyBtn.textContent = 'Copy';
          newCopyBtn.className = 'btn btn-ghost btn-xs';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy password: ', err);
      });
    });
  }

  const closeModal = () => {
    modal.classList.add('hidden');
  };

  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }
  if (okBtn) {
    okBtn.onclick = closeModal;
  }

  // Handle outside modal click
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  modal.classList.remove('hidden');
}
