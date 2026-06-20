import { getRoles, createRole, updateRole, deleteRole, getCurrentUser, getRoleLevel } from './data.js';

export function renderRoles() {
  const roles = getRoles();
  const user = getCurrentUser();
  const isOwner = getRoleLevel(user.role) === 1;

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Roles Management</h1>
        <p>Define team roles and their authority levels (1 = Owner, 5 = Contributor)</p>
      </div>
    </div>

    ${isOwner ? `
      <div class="card" style="margin-bottom:var(--space-6);padding:var(--space-3) var(--space-4)">
        <form id="add-role-form" style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap">
          <input type="text" id="new-role-name" placeholder="Role Name (e.g. Marketing Lead)" required style="flex:1;min-width:180px" />
          <input type="number" id="new-role-auth" placeholder="Authority (1-5)" min="1" max="5" required style="width:120px" />
          <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Create Role</button>
        </form>
      </div>
    ` : '<div class="alert alert-info" style="margin-bottom:var(--space-4); padding:var(--space-3); background:var(--bg-elevated); border-radius:var(--radius-md);">Only the Owner can create or edit roles.</div>'}

    <div class="grid stagger" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4);">
      ${roles.map(r => `
        <div class="card team-card" style="align-items:flex-start; text-align:left; position:relative; padding:var(--space-4)">
          <h3 style="margin-bottom:4px; font-size:1.1rem">${r.name}</h3>
          <div style="font-size:0.8rem; color:var(--text-secondary)">Authority Level: <strong style="color:var(--text-primary)">${r.authority}</strong></div>
          ${isOwner && r.name !== 'Owner' ? `
            <div style="position:absolute; top:var(--space-3); right:var(--space-3); display:flex; gap:4px">
              <button class="icon-btn btn-xs edit-role-btn" data-id="${r.id}" data-name="${r.name}" data-auth="${r.authority}"><i data-lucide="edit-2"></i></button>
              <button class="icon-btn btn-xs delete-role-btn" data-id="${r.id}"><i data-lucide="trash-2"></i></button>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('view-roles').innerHTML = html;
  lucide.createIcons();

  if (isOwner) {
    document.getElementById('add-role-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-role-name').value.trim();
      const auth = parseInt(document.getElementById('new-role-auth').value, 10);
      if (name && auth >= 1 && auth <= 5) {
        createRole({ name, authority: auth });
        renderRoles();
      }
    });

    document.querySelectorAll('.delete-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this role?')) {
          deleteRole(btn.dataset.id);
          renderRoles();
        }
      });
    });

    document.querySelectorAll('.edit-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const currentName = btn.dataset.name;
        const currentAuth = btn.dataset.auth;

        const newName = prompt('Edit Role Name:', currentName);
        if (newName === null) return;
        const newAuth = parseInt(prompt('Edit Authority Level (1-5):', currentAuth), 10);
        if (isNaN(newAuth) || newAuth < 1 || newAuth > 5) {
          alert('Invalid authority level. Must be between 1 and 5.');
          return;
        }

        updateRole(id, { name: newName.trim(), authority: newAuth });
        renderRoles();
      });
    });
  }
}
