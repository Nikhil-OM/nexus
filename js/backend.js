// =========================================================
//  NEXUS PM — Firebase / Firestore Backend
//  Provides the same API surface as data.js but persists
//  everything in Firestore instead of localStorage.
// =========================================================

import { firebaseConfig, FIREBASE_ENABLED } from './firebase-config.js';

// ---- Firebase SDK (loaded via compat CDN in index.html) ----
let db   = null;   // Firestore instance
let auth = null;   // Firebase Auth instance
let _currentUid = null; // UID of the logged-in Firebase user

// Firestore collection names
const COL = {
  members:      'members',
  projects:     'projects',
  tasks:        'tasks',
  logs:         'logs',
  appointments: 'appointments',
  notifications:'notifications',
  moods:        'moods',
  roles:        'roles',
  meta:         'meta',
};

// ---- In-memory cache (populated from Firestore) ----
// We mirror the same shape as the old localStorage DB so the rest of
// the app requires zero changes.
export let CLOUD_DB = null;

// ---- Initialize Firebase ----
export async function initFirebase() {
  if (!FIREBASE_ENABLED) return false;

  try {
    // Firebase compat SDK is loaded globally via CDN script tags
    firebase.initializeApp(firebaseConfig);
    db   = firebase.firestore();
    auth = firebase.auth();
    console.log('Nexus PM: Firebase initialized ✓');
    return true;
  } catch (e) {
    console.error('Nexus PM: Firebase init failed', e);
    return false;
  }
}

// ---- Auth wrappers ----
export function getFirebaseAuth()    { return auth; }
export function getCurrentFirebaseUser() { return auth?.currentUser || null; }

export async function signUpWithEmail(email, password, name, role, color) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const uid  = cred.user.uid;
  _currentUid = uid;
  await cred.user.updateProfile({ displayName: name });

  // Determine if this is the first user (becomes Owner)
  const membersSnap = await db.collection(COL.members).get();
  const isFirst = membersSnap.empty;
  const finalRole = isFirst ? 'Owner' : (role || 'Junior Developer');

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const memberDoc = {
    id:        uid,
    name,
    email,
    initials,
    color:     color || '#7c3aed',
    role:      finalRole,
    mood:      [3, 3, 3, 3, 3],
    taskCount: 0,
    createdAt: new Date().toISOString(),
  };

  await db.collection(COL.members).doc(uid).set(memberDoc);

  // If first user, seed Firestore with default roles & projects
  if (isFirst) {
    await seedFirestore(uid);
  }

  return { uid, member: memberDoc };
}

export async function signInWithEmail(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  _currentUid = cred.user.uid;
  return cred.user;
}

export async function signOutFirebase() {
  await auth?.signOut();
  _currentUid = null;
}

// ---- Seed initial Firestore data for first user ----
async function seedFirestore(ownerUid) {
  const batch = db.batch();

  const defaultRoles = [
    { id: 'r1', name: 'Owner',            authority: 1 },
    { id: 'r2', name: 'HR',               authority: 2 },
    { id: 'r3', name: 'Project Manager',  authority: 3 },
    { id: 'r4', name: 'Tech Lead',        authority: 3 },
    { id: 'r5', name: 'Senior Developer', authority: 4 },
    { id: 'r6', name: 'UI/UX Designer',   authority: 4 },
    { id: 'r7', name: 'QA Tester',        authority: 5 },
    { id: 'r8', name: 'Junior Developer', authority: 5 },
  ];

  defaultRoles.forEach(r => {
    batch.set(db.collection(COL.roles).doc(r.id), r);
  });

  // Meta doc: tracks currentUser per session (not needed in cloud but useful)
  batch.set(db.collection(COL.meta).doc('app'), {
    currentUser: ownerUid,
    seededAt: new Date().toISOString(),
  });

  await batch.commit();
  console.log('Nexus PM: Firestore seeded with default roles ✓');
}

// ---- Load all data from Firestore into memory ----
export async function loadFromFirestore(currentUid) {
  if (!db) return null;
  _currentUid = currentUid;

  const [
    membersSnap,
    projectsSnap,
    tasksSnap,
    logsSnap,
    appointmentsSnap,
    notifsSnap,
    rolesSnap,
    moodsSnap,
  ] = await Promise.all([
    db.collection(COL.members).get(),
    db.collection(COL.projects).get(),
    db.collection(COL.tasks).get(),
    db.collection(COL.logs).orderBy('timestamp', 'desc').limit(200).get(),
    db.collection(COL.appointments).get(),
    db.collection(COL.notifications).where('userId', '==', currentUid).orderBy('timestamp', 'desc').limit(100).get(),
    db.collection(COL.roles).get(),
    db.collection(COL.moods).get(),
  ]);

  const docs = snap => snap.docs.map(d => d.data());

  // Rebuild moods map: { date: { userId: score } }
  const moodsMap = {};
  moodsSnap.docs.forEach(d => {
    const data = d.data(); // { date, userId, score }
    if (!moodsMap[data.date]) moodsMap[data.date] = {};
    moodsMap[data.date][data.userId] = data.score;
  });

  CLOUD_DB = {
    currentUser:   currentUid,
    members:       docs(membersSnap),
    projects:      docs(projectsSnap),
    tasks:         docs(tasksSnap).map(t => ({ comments: [], ...t })),
    logs:          docs(logsSnap),
    appointments:  docs(appointmentsSnap),
    notifications: docs(notifsSnap),
    roles:         docs(rolesSnap),
    moods:         moodsMap,
  };

  console.log('Nexus PM: Firestore data loaded ✓', {
    members:  CLOUD_DB.members.length,
    projects: CLOUD_DB.projects.length,
    tasks:    CLOUD_DB.tasks.length,
  });

  return CLOUD_DB;
}

// ---- Set up real-time listeners ----
// Call this after loadFromFirestore to keep in-memory cache fresh.
export function attachRealtimeListeners(onUpdate) {
  if (!db || !CLOUD_DB) return;

  // Projects
  db.collection(COL.projects).onSnapshot(snap => {
    CLOUD_DB.projects = snap.docs.map(d => d.data());
    onUpdate?.('projects');
  });

  // Tasks
  db.collection(COL.tasks).onSnapshot(snap => {
    CLOUD_DB.tasks = snap.docs.map(d => ({ comments: [], ...d.data() }));
    onUpdate?.('tasks');
  });

  // Members
  db.collection(COL.members).onSnapshot(snap => {
    CLOUD_DB.members = snap.docs.map(d => d.data());
    onUpdate?.('members');
  });
}

// ---- CRUD helpers (write to Firestore + update in-memory cache) ----

export async function fsCreateMember(member) {
  const doc = db.collection(COL.members).doc(member.id);
  await doc.set(member);
  const idx = CLOUD_DB.members.findIndex(m => m.id === member.id);
  if (idx === -1) CLOUD_DB.members.push(member);
  else CLOUD_DB.members[idx] = member;
  return member;
}

export async function fsUpdateMember(id, updates) {
  await db.collection(COL.members).doc(id).update(updates);
  const idx = CLOUD_DB.members.findIndex(m => m.id === id);
  if (idx !== -1) CLOUD_DB.members[idx] = { ...CLOUD_DB.members[idx], ...updates };
}

export async function fsCreateProject(project) {
  await db.collection(COL.projects).doc(project.id).set(project);
  CLOUD_DB.projects.push(project);
  return project;
}

export async function fsUpdateProject(id, updates) {
  await db.collection(COL.projects).doc(id).update(updates);
  const idx = CLOUD_DB.projects.findIndex(p => p.id === id);
  if (idx !== -1) CLOUD_DB.projects[idx] = { ...CLOUD_DB.projects[idx], ...updates };
}

export async function fsDeleteProject(id) {
  await db.collection(COL.projects).doc(id).delete();
  CLOUD_DB.projects = CLOUD_DB.projects.filter(p => p.id !== id);
}

export async function fsCreateTask(task) {
  await db.collection(COL.tasks).doc(task.id).set(task);
  CLOUD_DB.tasks.push(task);
  return task;
}

export async function fsUpdateTask(id, updates) {
  // Firestore can't handle nested array updates easily, so we fetch & rewrite
  const ref = db.collection(COL.tasks).doc(id);
  await ref.update(updates);
  const idx = CLOUD_DB.tasks.findIndex(t => t.id === id);
  if (idx !== -1) CLOUD_DB.tasks[idx] = { ...CLOUD_DB.tasks[idx], ...updates };
  return CLOUD_DB.tasks[idx];
}

export async function fsDeleteTask(id) {
  await db.collection(COL.tasks).doc(id).delete();
  CLOUD_DB.tasks = CLOUD_DB.tasks.filter(t => t.id !== id);
}

export async function fsAddComment(taskId, comment) {
  const ref = db.collection(COL.tasks).doc(taskId);
  await ref.update({
    comments: firebase.firestore.FieldValue.arrayUnion(comment)
  });
  const task = CLOUD_DB.tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.comments) task.comments = [];
    task.comments.push(comment);
  }
}

export async function fsLogActivity(log) {
  await db.collection(COL.logs).doc(log.id).set(log);
  CLOUD_DB.logs.unshift(log);
  if (CLOUD_DB.logs.length > 200) CLOUD_DB.logs.pop();
}

export async function fsCreateAppointment(appt) {
  await db.collection(COL.appointments).doc(appt.id).set(appt);
  CLOUD_DB.appointments.push(appt);
  return appt;
}

export async function fsAddNotification(notif) {
  await db.collection(COL.notifications).doc(notif.id).set(notif);
  CLOUD_DB.notifications.unshift(notif);
  if (CLOUD_DB.notifications.length > 100) CLOUD_DB.notifications.pop();
}

export async function fsMarkAllNotifsRead(userId) {
  const snap = await db.collection(COL.notifications)
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
  CLOUD_DB.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
}

export async function fsSetMood(userId, score) {
  const today = new Date().toISOString().split('T')[0];
  const docId = `${today}_${userId}`;
  await db.collection(COL.moods).doc(docId).set({ date: today, userId, score });
  if (!CLOUD_DB.moods[today]) CLOUD_DB.moods[today] = {};
  CLOUD_DB.moods[today][userId] = score;
}

export async function fsCreateRole(role) {
  await db.collection(COL.roles).doc(role.id).set(role);
  if (!CLOUD_DB.roles) CLOUD_DB.roles = [];
  CLOUD_DB.roles.push(role);
  return role;
}

export async function fsUpdateRole(id, updates) {
  await db.collection(COL.roles).doc(id).update(updates);
  const idx = CLOUD_DB.roles.findIndex(r => r.id === id);
  if (idx !== -1) CLOUD_DB.roles[idx] = { ...CLOUD_DB.roles[idx], ...updates };
}

export async function fsDeleteRole(id) {
  await db.collection(COL.roles).doc(id).delete();
  CLOUD_DB.roles = CLOUD_DB.roles.filter(r => r.id !== id);
}

// ---- Helper: create a Firebase Auth account for a member added by admin ----
// This uses Firebase Admin-style approach via a Cloud Function OR the
// alternate: member must self-register (recommended & simpler).
// For now, admins create the record in Firestore; the user signs up with
// matching email to claim their account.
export async function fsPreRegisterMember(memberData) {
  // Admin creates the Firestore member doc (without Firebase Auth uid yet)
  // The placeholder id will be replaced when the user self-registers
  const tempId = 'pending_' + Date.now();
  const doc = { ...memberData, id: tempId, status: 'pending' };
  await db.collection(COL.members).doc(tempId).set(doc);
  CLOUD_DB.members.push(doc);
  return doc;
}
