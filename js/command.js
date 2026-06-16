import { getProjects, getMembers, getTasks } from './data.js';

let selectedIdx = -1;
let filteredItems = [];

const COMMANDS = [
  { group:'Navigate', label:'Dashboard',   icon:'layout-dashboard', action:()=>navigate('dashboard') },
  { group:'Navigate', label:'Kanban Board',icon:'columns',          action:()=>navigate('kanban') },
  { group:'Navigate', label:'Timeline',    icon:'gantt-chart',      action:()=>navigate('timeline') },
  { group:'Navigate', label:'Workload',    icon:'activity',         action:()=>navigate('workload') },
  { group:'Navigate', label:'Focus Mode',  icon:'target',           action:()=>navigate('focus') },
  { group:'Navigate', label:'Team',        icon:'users',            action:()=>navigate('team') },
  { group:'Navigate', label:'Settings',   icon:'settings',          action:()=>navigate('settings') },
  { group:'Actions',  label:'New Task',    icon:'plus-circle',      action:()=>{ closeCmd(); window.openCreateTask(); } },
  { group:'Actions',  label:'Toggle Theme',icon:'moon',             action:()=>{ closeCmd(); document.getElementById('theme-toggle')?.click(); } },
  { group:'Actions',  label:'Daily Mood Check-in', icon:'heart',   action:()=>{ closeCmd(); document.getElementById('mood-trigger')?.click(); } },
];

export function initCommand() {
  const overlay = document.getElementById('command-overlay');
  const input   = document.getElementById('command-input');
  const results = document.getElementById('command-results');

  // Open via Ctrl+K
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); openCmd(); }
    if (e.key==='Escape') closeCmd();
  });

  document.getElementById('open-command')?.addEventListener('click', openCmd);

  overlay?.addEventListener('click', e => { if (e.target===overlay) closeCmd(); });

  input?.addEventListener('input', () => render(input.value.trim().toLowerCase()));

  input?.addEventListener('keydown', e => {
    if (e.key==='ArrowDown') { selectedIdx=Math.min(selectedIdx+1,filteredItems.length-1); highlight(); e.preventDefault(); }
    if (e.key==='ArrowUp')   { selectedIdx=Math.max(selectedIdx-1,0); highlight(); e.preventDefault(); }
    if (e.key==='Enter' && selectedIdx>=0) { filteredItems[selectedIdx]?.action(); }
  });
}

function buildItems() {
  const projects = getProjects();
  const members  = getMembers();
  const tasks    = getTasks();
  const all = [...COMMANDS];
  projects.forEach(p => all.push({ group:'Projects', label:p.name, icon:'folder', emoji:p.emoji, action:()=>{ closeCmd(); window.dispatchEvent(new CustomEvent('nexus:navigate',{detail:{view:'kanban',projectId:p.id}})); } }));
  members.forEach(m  => all.push({ group:'Team',     label:m.name, icon:'user',   action:()=>{ closeCmd(); navigate('team'); } }));
  tasks.slice(0,10).forEach(t => all.push({ group:'Recent Tasks', label:t.title, icon:'check-square', action:()=>{ closeCmd(); window.openTask(t.id); } }));
  return all;
}

function openCmd() {
  const overlay = document.getElementById('command-overlay');
  const input   = document.getElementById('command-input');
  overlay?.classList.remove('hidden');
  input?.focus();
  input.value = '';
  render('');
}
function closeCmd() {
  document.getElementById('command-overlay')?.classList.add('hidden');
  selectedIdx = -1;
}
function navigate(view) {
  closeCmd();
  window.dispatchEvent(new CustomEvent('nexus:navigate',{detail:{view}}));
}

function render(query) {
  const all = buildItems();
  filteredItems = query ? all.filter(i=>i.label.toLowerCase().includes(query)) : all;
  selectedIdx = query ? 0 : -1;

  const results = document.getElementById('command-results');
  if (!results) return;

  if (!filteredItems.length) {
    results.innerHTML = `<div class="command-item" style="color:var(--text-muted);justify-content:center">No results for "${query}"</div>`;
    return;
  }

  let html = '';
  let lastGroup = null;
  filteredItems.forEach((item, i) => {
    if (item.group !== lastGroup) {
      html += `<div class="command-group">${item.group}</div>`;
      lastGroup = item.group;
    }
    html += `<div class="command-item ${i===selectedIdx?'selected':''}" data-idx="${i}">
      ${item.emoji ? `<span style="font-size:1rem">${item.emoji}</span>` : `<i data-lucide="${item.icon}"></i>`}
      <span class="command-item-label">${item.label}</span>
    </div>`;
  });
  results.innerHTML = html;
  lucide.createIcons();

  results.querySelectorAll('.command-item[data-idx]').forEach(el => {
    el.addEventListener('click', () => filteredItems[+el.dataset.idx]?.action());
    el.addEventListener('mouseenter', () => { selectedIdx=+el.dataset.idx; highlight(); });
  });
}

function highlight() {
  document.querySelectorAll('.command-item[data-idx]').forEach(el => {
    el.classList.toggle('selected', +el.dataset.idx===selectedIdx);
  });
}
