export function renderSettings() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';

  const html = `
    <div class="view-header">
      <div class="view-header-left">
        <h1>Settings</h1>
        <p>Customize your Nexus PM experience</p>
      </div>
    </div>

    <div style="max-width:640px">

      <!-- Appearance -->
      <div class="settings-section">
        <h3><i data-lucide="palette" style="width:16px;height:16px;display:inline;margin-right:8px"></i>Appearance</h3>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Dark Mode</h4>
            <p>Switch between dark and light themes</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-dark-mode" ${theme==='dark'?'checked':''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

      </div>

      <!-- Notifications -->
      <div class="settings-section">
        <h3><i data-lucide="bell" style="width:16px;height:16px;display:inline;margin-right:8px"></i>Notifications</h3>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Browser Notifications</h4>
            <p>Get notified when Pomodoro sessions end</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="request-notif">Enable</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Overdue Task Alerts</h4>
            <p>Show badge when tasks are overdue</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-overdue-alerts" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Daily Mood Check-in</h4>
            <p>Show mood prompt when opening the app</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-mood-checkin" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Focus / Pomodoro -->
      <div class="settings-section">
        <h3><i data-lucide="target" style="width:16px;height:16px;display:inline;margin-right:8px"></i>Focus Mode</h3>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Focus Session Length</h4>
            <p>Duration of each Pomodoro work session</p>
          </div>
          <select id="setting-focus-len" style="width:100px">
            <option value="25">25 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="50">50 min</option>
          </select>
        </div>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Break Length</h4>
            <p>Duration of each short break</p>
          </div>
          <select id="setting-break-len" style="width:100px">
            <option value="5">5 min</option>
            <option value="10">10 min</option>
            <option value="15">15 min</option>
          </select>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-section">
        <h3><i data-lucide="database" style="width:16px;height:16px;display:inline;margin-right:8px"></i>Data</h3>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Reset Demo Data</h4>
            <p>Restore all seed projects and tasks to defaults</p>
          </div>
          <button class="btn btn-danger btn-sm" id="reset-data">Reset</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Export Data</h4>
            <p>Download all your data as JSON</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="export-data"><i data-lucide="download" style="width:14px;height:14px;margin-right:4px"></i>Export</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Import Data</h4>
            <p>Restore database from a backup file</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="import-data-trigger"><i data-lucide="upload" style="width:14px;height:14px;margin-right:4px"></i>Import</button>
        </div>
      </div>

      <!-- Session Management -->
      <div class="settings-section">
        <h3><i data-lucide="refresh-cw" style="width:16px;height:16px;display:inline;margin-right:8px"></i>Session Management</h3>
        <div class="settings-row">
          <div class="settings-row-left">
            <h4>Reset Session</h4>
            <p>Clear all local data and reset to demo defaults</p>
          </div>
          <button class="btn btn-danger btn-sm" id="settings-logout">Reset Session</button>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h3><i data-lucide="info" style="width:16px;height:16px;display:inline;margin-right:8px"></i>About Nexus PM</h3>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:.85rem;color:var(--text-secondary)">
          <div>Version: <strong style="color:var(--text-primary)">1.0.0</strong></div>
          <div>Stack: <strong style="color:var(--text-primary)">HTML · CSS · Vanilla JS · LocalStorage</strong></div>
          <div>Unique features: <strong style="color:var(--brand-teal)">Focus Mode · Team Mood · Health Score · Command Palette</strong></div>
          <div style="margin-top:8px;padding:12px;background:var(--bg-elevated);border-radius:var(--radius-md);border:1px solid var(--border-brand)">
            💡 <strong>Tip:</strong> Press <kbd style="background:var(--bg-overlay);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:.8rem">Ctrl+K</kbd> anywhere to open the command palette
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('view-settings').innerHTML = html;
  lucide.createIcons();
  attachSettingsEvents();
}

export function initTheme() {
  const saved = localStorage.getItem('nexus_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

export function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nexus_theme', next);
  updateThemeIcon(next);
  // Refresh settings if open
  const settingsView = document.getElementById('view-settings');
  if (settingsView && settingsView.classList.contains('active')) renderSettings();
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? '<i data-lucide="sun"></i>'
    : '<i data-lucide="moon"></i>';
  lucide.createIcons();
}

function attachSettingsEvents() {
  document.getElementById('setting-dark-mode')?.addEventListener('change', toggleTheme);

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  document.getElementById('request-notif')?.addEventListener('click', async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      const btn  = document.getElementById('request-notif');
      if (btn) btn.textContent = perm === 'granted' ? '✅ Enabled' : '❌ Blocked';
    }
  });

  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (confirm('Reset all data to demo defaults? This cannot be undone.')) {
      localStorage.removeItem('nexus_pm_data');
      location.reload();
    }
  });
  
  document.getElementById('settings-logout')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your session? This will clear all changes and restore demo defaults.')) {
      import('./auth.js').then(({ logout }) => logout());
    }
  });

  document.getElementById('export-data')?.addEventListener('click', () => {
    const data = localStorage.getItem('nexus_pm_data') || '{}';
    const blob = new Blob([data], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `nexus-pm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const importInput = document.getElementById('import-db-input');
  document.getElementById('import-data-trigger')?.addEventListener('click', () => {
    importInput?.click();
  });

  importInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      try {
        const data = JSON.parse(content);
        if (data.projects && data.tasks && data.members) {
          if (confirm('Are you sure? This will overwrite ALL current data with the backup.')) {
            localStorage.setItem('nexus_pm_data', content);
            location.reload();
          }
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse the backup file.');
      }
    };
    reader.readAsText(file);
  });

}

export function loadAccent() {
  localStorage.removeItem('nexus_accent');
}
