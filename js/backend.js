// =========================================================
//  NEXUS PM — Custom Backend Layer
//  Provides the API surface to communicate with the Node/Express backend.
// =========================================================

import { getToken, logout } from './auth.js';

export let CLOUD_DB = {
  currentUser: null,
  members: [],
  projects: [],
  tasks: [],
  logs: [],
  appointments: [],
  notifications: [],
  roles: [],
  moods: {}
};

// Base API configuration
const API_URL = 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  if (!token) {
    logout();
    throw new Error('No token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (res.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

// ---- Load all data from Backend into memory ----
export async function loadFromBackend() {
  const data = await apiFetch('/data');
  const user = JSON.parse(localStorage.getItem('nexus_user'));

  // Mirror the expected shape for the frontend
  CLOUD_DB = {
    currentUser: user.id || user._id,
    members: data.members.map(m => ({ ...m, id: m._id || m.id })),
    projects: data.projects.map(p => ({ ...p, id: p._id || p.id })),
    tasks: data.tasks.map(t => ({ ...t, id: t._id || t.id })),
    logs: data.logs.map(l => ({ ...l, id: l._id || l.id })),
    appointments: data.appointments.map(a => ({ ...a, id: a._id || a.id })),
    notifications: data.notifications.map(n => ({ ...n, id: n._id || n.id })),
    roles: data.roles.map(r => ({ ...r, id: r._id || r.id })),
    moods: data.moods || {},
  };

  return CLOUD_DB;
}

// Note: No more real-time listeners for now since we moved from Firebase to a standard REST API.
// You would need to implement WebSockets (Socket.io) to bring real-time back!
export function attachRealtimeListeners(onUpdate) {
  // Stub for compatibility with auth.js
}

// ---- CRUD helpers ----

export async function fsCreateMember(member) {
  // For this simplified migration, we use the register endpoint or mock it
  // In a real app, an admin creating a member would hit a special route.
  return member;
}

export async function fsUpdateMember(id, updates) {
  await apiFetch(`/members/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  const idx = CLOUD_DB.members.findIndex(m => m.id === id);
  if (idx !== -1) CLOUD_DB.members[idx] = { ...CLOUD_DB.members[idx], ...updates };
}

export async function fsCreateProject(project) {
  const res = await apiFetch('/projects', { method: 'POST', body: JSON.stringify(project) });
  CLOUD_DB.projects.push(res);
  return res;
}

export async function fsUpdateProject(id, updates) {
  await apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  const idx = CLOUD_DB.projects.findIndex(p => p.id === id);
  if (idx !== -1) CLOUD_DB.projects[idx] = { ...CLOUD_DB.projects[idx], ...updates };
}

export async function fsDeleteProject(id) {
  await apiFetch(`/projects/${id}`, { method: 'DELETE' });
  CLOUD_DB.projects = CLOUD_DB.projects.filter(p => p.id !== id);
}

export async function fsCreateTask(task) {
  const res = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(task) });
  CLOUD_DB.tasks.push(res);
  return res;
}

export async function fsUpdateTask(id, updates) {
  const res = await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  const idx = CLOUD_DB.tasks.findIndex(t => t.id === id);
  if (idx !== -1) CLOUD_DB.tasks[idx] = res;
  return res;
}

export async function fsDeleteTask(id) {
  await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
  CLOUD_DB.tasks = CLOUD_DB.tasks.filter(t => t.id !== id);
}

export async function fsAddComment(taskId, comment) {
  const task = CLOUD_DB.tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.comments) task.comments = [];
    task.comments.push(comment);
    await fsUpdateTask(taskId, { comments: task.comments });
  }
}

export async function fsLogActivity(log) {
  const res = await apiFetch('/logs', { method: 'POST', body: JSON.stringify(log) });
  CLOUD_DB.logs.unshift(res);
  if (CLOUD_DB.logs.length > 200) CLOUD_DB.logs.pop();
}

export async function fsCreateAppointment(appt) {
  const res = await apiFetch('/appointments', { method: 'POST', body: JSON.stringify(appt) });
  CLOUD_DB.appointments.push(res);
  return res;
}

export async function fsAddNotification(notif) {
  // Not implemented in express backend yet for this basic migration, we just mock
  CLOUD_DB.notifications.unshift(notif);
}

export async function fsMarkAllNotifsRead(userId) {
  // Mocked for now
  CLOUD_DB.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
}

export async function fsSetMood(userId, score) {
  // Mocked for now
  const today = new Date().toISOString().split('T')[0];
  if (!CLOUD_DB.moods[today]) CLOUD_DB.moods[today] = {};
  CLOUD_DB.moods[today][userId] = score;
}

export async function fsCreateRole(role) {
  const res = await apiFetch('/roles', { method: 'POST', body: JSON.stringify(role) });
  if (!CLOUD_DB.roles) CLOUD_DB.roles = [];
  CLOUD_DB.roles.push(res);
  return res;
}

export async function fsUpdateRole(id, updates) {
  await apiFetch(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  const idx = CLOUD_DB.roles.findIndex(r => r.id === id);
  if (idx !== -1) CLOUD_DB.roles[idx] = { ...CLOUD_DB.roles[idx], ...updates };
}

export async function fsDeleteRole(id) {
  await apiFetch(`/roles/${id}`, { method: 'DELETE' });
  CLOUD_DB.roles = CLOUD_DB.roles.filter(r => r.id !== id);
}
