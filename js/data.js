// ===== DATA LAYER — LocalStorage + Seed Data =====
const STORAGE_KEY = 'nexus_pm_data';

const SEED = {
  currentUser: 'u1',
  projects: [
    { id:'p1', name:'Nexus Website Redesign', emoji:'🚀', color:'#7c3aed', desc:'Full redesign of marketing site with new brand identity.', startDate:'2026-04-01', endDate:'2026-06-30', members:['u1','u2','u3'] },
    { id:'p2', name:'Mobile App v2.0', emoji:'📱', color:'#06d6a0', desc:'Feature-packed next version of the iOS & Android app.', startDate:'2026-03-15', endDate:'2026-07-15', members:['u1','u2','u4','u5'] },
    { id:'p3', name:'Data Analytics Dashboard', emoji:'📊', color:'#f72585', desc:'Internal BI dashboard for real-time business metrics.', startDate:'2026-04-15', endDate:'2026-05-31', members:['u3','u4'] },
    { id:'p4', name:'API Gateway Migration', emoji:'⚡', color:'#fbbf24', desc:'Migrate legacy REST APIs to GraphQL gateway.', startDate:'2026-05-01', endDate:'2026-08-01', members:['u2','u5'] }
  ],
  tasks: [
    { id:'t1',  projectId:'p1', title:'Design new hero section',         desc:'Create 3 variants of the hero with A/B testing in mind.',  status:'done',       priority:'high',     assignee:'u2', dueDate:'2026-05-05', tags:['design','frontend'], timeLogged:180 },
    { id:'t2',  projectId:'p1', title:'Set up Tailwind config',          desc:'Configure design tokens, colors, and typography scale.',    status:'done',       priority:'medium',   assignee:'u1', dueDate:'2026-04-28', tags:['frontend'],          timeLogged:90  },
    { id:'t3',  projectId:'p1', title:'Build navigation component',      desc:'Sticky nav with mobile hamburger and smooth scroll.',       status:'inprogress', priority:'high',     assignee:'u3', dueDate:'2026-05-10', tags:['frontend','design'],  timeLogged:45  },
    { id:'t4',  projectId:'p1', title:'Implement contact form',          desc:'Contact form with validation and Formspree backend.',       status:'inprogress', priority:'medium',   assignee:'u1', dueDate:'2026-05-12', tags:['frontend'],          timeLogged:30  },
    { id:'t5',  projectId:'p1', title:'SEO meta tags audit',             desc:'Review and update all meta tags, OG images, sitemaps.',    status:'todo',       priority:'low',      assignee:'u2', dueDate:'2026-05-18', tags:['seo'],               timeLogged:0   },
    { id:'t6',  projectId:'p1', title:'Performance optimization',        desc:'Achieve Lighthouse score >90 on all pages.',               status:'review',     priority:'high',     assignee:'u3', dueDate:'2026-05-08', tags:['performance'],       timeLogged:120 },
    { id:'t7',  projectId:'p2', title:'User authentication flow',        desc:'JWT login, refresh tokens, biometric auth on mobile.',     status:'done',       priority:'critical', assignee:'u4', dueDate:'2026-04-30', tags:['backend','security'], timeLogged:360 },
    { id:'t8',  projectId:'p2', title:'Onboarding screens design',       desc:'5-step onboarding flow with illustrations.',               status:'inprogress', priority:'high',     assignee:'u5', dueDate:'2026-05-15', tags:['design','mobile'],   timeLogged:80  },
    { id:'t9',  projectId:'p2', title:'Push notifications setup',        desc:'FCM integration for iOS and Android.',                     status:'todo',       priority:'medium',   assignee:'u4', dueDate:'2026-05-22', tags:['mobile','backend'],  timeLogged:0   },
    { id:'t10', projectId:'p2', title:'Dark mode implementation',        desc:'System-aware + manual toggle for dark/light modes.',       status:'inprogress', priority:'medium',   assignee:'u1', dueDate:'2026-05-14', tags:['design','mobile'],   timeLogged:60  },
    { id:'t11', projectId:'p2', title:'App store submission prep',       desc:'Screenshots, description, review guidelines compliance.',  status:'todo',       priority:'high',     assignee:'u5', dueDate:'2026-07-01', tags:['marketing'],         timeLogged:0   },
    { id:'t12', projectId:'p3', title:'Database schema design',          desc:'Design star schema for analytics data warehouse.',         status:'done',       priority:'critical', assignee:'u3', dueDate:'2026-04-20', tags:['backend','data'],    timeLogged:240 },
    { id:'t13', projectId:'p3', title:'Build KPI widgets',              desc:'Revenue, MAU, churn rate, NPS score widgets.',            status:'inprogress', priority:'high',     assignee:'u4', dueDate:'2026-05-09', tags:['frontend','data'],   timeLogged:150 },
    { id:'t14', projectId:'p3', title:'Real-time data pipeline',        desc:'Kafka → ClickHouse streaming pipeline.',                  status:'review',     priority:'critical', assignee:'u3', dueDate:'2026-05-07', tags:['backend','data'],    timeLogged:400 },
    { id:'t15', projectId:'p4', title:'GraphQL schema definition',       desc:'Define types, queries, mutations for all entities.',       status:'done',       priority:'high',     assignee:'u2', dueDate:'2026-05-03', tags:['backend'],           timeLogged:200 },
    { id:'t16', projectId:'p4', title:'Auth middleware migration',       desc:'Migrate API key auth to OAuth2 with GraphQL.',            status:'inprogress', priority:'critical', assignee:'u5', dueDate:'2026-05-20', tags:['backend','security'], timeLogged:90  },
    { id:'t17', projectId:'p4', title:'Rate limiting implementation',    desc:'Per-user and per-IP rate limiting on gateway.',           status:'todo',       priority:'medium',   assignee:'u2', dueDate:'2026-06-01', tags:['backend'],           timeLogged:0   },
    { id:'t18', projectId:'p1', title:'Write copy for services section', desc:'Compelling copy for all 6 service cards.',                status:'todo',       priority:'low',      assignee:'u1', dueDate:'2026-05-20', tags:['content'],           timeLogged:0   }
  ],
  members: [
    { id:'u1', name:'Alex Rivera',   initials:'AR', color:'#7c3aed', role:'Owner',              mood:[4,5,3,4,5], taskCount:4 },
    { id:'u2', name:'Sam Chen',      initials:'SC', color:'#06d6a0', role:'Frontend Engineer',  mood:[3,4,4,5,4], taskCount:5 },
    { id:'u3', name:'Priya Patel',   initials:'PP', color:'#f72585', role:'HR',                 mood:[5,5,4,4,3], taskCount:4 },
    { id:'u4', name:'Jordan Kim',    initials:'JK', color:'#fbbf24', role:'Project Lead',       mood:[2,3,4,3,4], taskCount:4 },
    { id:'u5', name:'Morgan Davis',  initials:'MD', color:'#38bdf8', role:'UI/UX Designer',     mood:[4,4,5,5,4], taskCount:3 }
  ],
  moods: {},
  timerState: null,
  logs: [
    { id:'l1', userId:'u1', action:'created_project', details:'Nexus Website Redesign', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id:'l2', userId:'u2', action:'completed_task', details:'Design new hero section', timestamp: new Date(Date.now() - 3600000).toISOString() }
  ],
  appointments: [
    { id:'a1', title:'Weekly Sync', date: new Date().toISOString().split('T')[0], startTime:'10:00', endTime:'11:00', participants:['u1','u2','u4'], creator:'u1' }
  ]
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function init() {
  console.log('Nexus PM: Initializing Data Layer...');
  let data = load();
  
  if (data) {
    console.log('Nexus PM: Data loaded from LocalStorage');
  } else {
    console.warn('Nexus PM: No data found in LocalStorage, using SEED');
  }

  // Basic validation and reset if critical data is missing
  if (!data || !data.members || !Array.isArray(data.members) || data.members.length === 0) {
    console.log('Nexus PM: Resetting to SEED data (missing members)');
    data = JSON.parse(JSON.stringify(SEED));
    save(data);
  }

  // Force data migration/reset if the old roles are present (missing 'Owner')
  if (!data.members.find(m => m.role === 'Owner')) { 
    console.log('Nexus PM: Resetting to SEED data (missing Owner role)');
    data = JSON.parse(JSON.stringify(SEED)); 
    save(data); 
  }

  // Ensure all required arrays exist
  if (!data.logs) data.logs = [];
  if (!data.appointments) data.appointments = [];
  if (!data.notifications) data.notifications = [];
  if (!data.projects) data.projects = [];
  if (!data.tasks) data.tasks = [];
  if (!data.moods) data.moods = {};

  // Heal currentUser if it doesn't exist
  if (!data.members.find(m => m.id === data.currentUser)) {
    data.currentUser = data.members[0].id;
  }
  
  // Ensure all tasks have a comments array
  data.tasks.forEach(t => {
    if (!t.comments) t.comments = [];
  });

  save(data);
  return data;
}

export const DB = init();

export function saveDB() { save(DB); }

export function getProjects() { 
  const user = getCurrentUser();
  if (!user) return DB.projects || [];
  if (getRoleLevel(user.role) === 1) return DB.projects || []; 
  return (DB.projects || []).filter(p => p.members && p.members.includes(user.id));
}
export function getProject(id) { return (DB.projects || []).find(p => p.id === id); }
export function getTasks(projectId) { 
  const tasks = DB.tasks || [];
  return projectId ? tasks.filter(t => t.projectId === projectId) : tasks; 
}
export function getTask(id) { return (DB.tasks || []).find(t => t.id === id); }
export function getMembers() { return DB.members || []; }
export function getMember(id) { 
  return (DB.members || []).find(m => m.id === id) || null;
}

export function getCurrentUser() { 
  const user = getMember(DB.currentUser);
  if (!user && DB.members.length > 0) return DB.members[0];
  return user;
}

export function switchUser(userId) {
  DB.currentUser = userId;
  saveDB();
}

// --- Hierarchy & Permissions ---
export const ROLE_HIERARCHY = {
  'Owner': 1,
  'HR': 2,
  'Project Lead': 3,
  'Manager': 3
};

export function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 4; // Defaults to 4 (Contributor)
}

export function canUserAddMembers(user) {
  if (!user) return false;
  return getRoleLevel(user.role) <= 2; // Level 1 (Owner) or Level 2 (HR)
}

export function getAssignableMembers(currentUser) {
  const myLevel = getRoleLevel(currentUser.role);
  return getMembers().filter(m => {
    if (myLevel <= 2) return true; // Owner/HR can assign to anyone
    if (myLevel === 3) return getRoleLevel(m.role) >= 3; // Managers assign to managers & below
    return m.id === currentUser.id; // Contributors can only assign to themselves
  });
}
// -------------------------------

export function createMember(member) {
  const id = 'u' + Date.now();
  const initials = member.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  const newMember = { id, initials, mood: [3,3,3,3,3], taskCount: 0, ...member };
  DB.members.push(newMember);
  saveDB();
  return newMember;
}

export function createProject(project) {
  const id = 'p' + Date.now();
  const newProject = { id, ...project };
  DB.projects.push(newProject);
  logActivity(getCurrentUser().id, 'created_project', project.name);
  saveDB();
  return newProject;
}

export function createTask(task) {
  const id = 't' + Date.now();
  const newTask = { id, timeLogged: 0, tags: [], ...task };
  DB.tasks.push(newTask);
  logActivity(getCurrentUser().id, 'created_task', task.title);
  
  if (task.assignee && task.assignee !== getCurrentUser().id) {
    addNotification(task.assignee, `${getCurrentUser().name} assigned a new task to you: "${task.title}"`, 'assignment', id);
  }

  saveDB();
  return newTask;
}
export function updateTask(id, updates) {
  const idx = DB.tasks.findIndex(t => t.id === id);
  if (idx !== -1) { 
    const oldTask = { ...DB.tasks[idx] };
    DB.tasks[idx] = { ...DB.tasks[idx], ...updates }; 
    
    if (updates.status === 'done' && oldTask.status !== 'done') {
      logActivity(getCurrentUser().id, 'completed_task', DB.tasks[idx].title);
    }
    
    if (updates.assignee && updates.assignee !== oldTask.assignee && updates.assignee !== getCurrentUser().id) {
      addNotification(updates.assignee, `${getCurrentUser().name} assigned a task to you: "${DB.tasks[idx].title}"`, 'assignment', id);
    }

    saveDB(); 
  }
  return DB.tasks[idx];
}
export function deleteTask(id) {
  const idx = DB.tasks.findIndex(t => t.id === id);
  if (idx !== -1) { 
    logActivity(getCurrentUser().id, 'deleted_task', DB.tasks[idx].title);
    DB.tasks.splice(idx, 1); 
    saveDB(); 
  }
}

// --- Logs & Appointments ---
export function logActivity(userId, action, details) {
  const log = { id: 'l' + Date.now(), userId, action, details, timestamp: new Date().toISOString() };
  DB.logs.unshift(log); // Prepend to keep newest first
  if (DB.logs.length > 200) DB.logs.pop(); // Keep array size manageable
  saveDB();
}

export function getLogs() {
  return DB.logs || [];
}

export function getAppointments() {
  return DB.appointments || [];
}

export function getAppointmentsForUser(userId) {
  return (DB.appointments || []).filter(a => a.participants.includes(userId));
}

export function createAppointment(appt) {
  const id = 'a' + Date.now();
  const newAppt = { id, ...appt, creator: getCurrentUser().id };
  DB.appointments.push(newAppt);
  logActivity(getCurrentUser().id, 'created_appointment', appt.title);
  saveDB();
  return newAppt;
}

export function isUserFree(userId, date, startTime, endTime) {
  return true;
}

// --- Comments & Notifications ---
export function addTaskComment(taskId, text) {
  const task = getTask(taskId);
  if (!task) return;
  
  const user = getCurrentUser();
  const comment = {
    id: 'c' + Date.now(),
    userId: user.id,
    text,
    timestamp: new Date().toISOString()
  };
  
  if (!task.comments) task.comments = [];
  task.comments.push(comment);
  
  // Handle mentions: @Name
  const mentions = text.match(/@(\w+)/g);
  if (mentions) {
    mentions.forEach(m => {
      const namePart = m.substring(1).toLowerCase();
      const mentionedUser = DB.members.find(u => u.name.toLowerCase().includes(namePart));
      if (mentionedUser && mentionedUser.id !== user.id) {
        addNotification(mentionedUser.id, `${user.name} mentioned you in a comment: "${text.substring(0, 30)}..."`, 'mention', taskId);
      }
    });
  }
  
  saveDB();
  return comment;
}

export function addNotification(userId, text, type, relatedId) {
  if (!DB.notifications) DB.notifications = [];
  const notif = {
    id: 'n' + Date.now(),
    userId,
    text,
    type,
    relatedId,
    read: false,
    timestamp: new Date().toISOString()
  };
  DB.notifications.unshift(notif);
  if (DB.notifications.length > 100) DB.notifications.pop();
  saveDB();
}

export function getNotifications(userId) {
  return (DB.notifications || []).filter(n => n.userId === userId);
}

export function markAllNotificationsRead(userId) {
  const userNotifs = getNotifications(userId);
  userNotifs.forEach(n => n.read = true);
  saveDB();
}

// --- Data Management ---
export function exportData() {
  const dataStr = JSON.stringify(DB, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `nexus-pm-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

export function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    // Basic validation
    if (data.projects && data.tasks && data.members) {
      save(data);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
}
// ---------------------------

export function setMood(userId, mood) {
  const today = new Date().toISOString().split('T')[0];
  if (!DB.moods[today]) DB.moods[today] = {};
  DB.moods[today][userId] = mood;
  const member = getMember(userId);
  if (member) { member.mood = [...member.mood.slice(-4), mood]; }
  saveDB();
}
export function getTodayMood(userId) {
  const today = new Date().toISOString().split('T')[0];
  return DB.moods[today]?.[userId] ?? null;
}

export function calcHealthScore(projectId) {
  const tasks = getTasks(projectId);
  if (!tasks.length) return 100;
  const now = new Date();
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).length;
  const critical = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length;
  let score = 100;
  score -= (overdue / tasks.length) * 40;
  score -= (critical / Math.max(tasks.length, 1)) * 20;
  score += (done / tasks.length) * 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date();
}
export function isDueSoon(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}
export function getStatusLabel(s) {
  return { todo:'To Do', inprogress:'In Progress', review:'In Review', done:'Done' }[s] || s;
}
export function getPriorityLabel(p) {
  return { low:'Low', medium:'Medium', high:'High', critical:'Critical' }[p] || p;
}
export function fmtTime(mins) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}
export function moodEmoji(score) {
  return ['','😩','😔','😐','😊','🤩'][score] || '😐';
}
export function moodColor(score) {
  return ['','#ef4444','#f97316','#f59e0b','#10b981','#06d6a0'][score] || '#f59e0b';
}
