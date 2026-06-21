// =========================================================
//  NEXUS PM — Authentication Layer
//  Bridges Firebase Auth with the rest of the app.
//  Falls back to local-only mode if Firebase is not enabled.
// =========================================================

import { FIREBASE_ENABLED }    from './firebase-config.js';
import {
  initFirebase, signInWithEmail, signOutFirebase,
  loadFromFirestore, attachRealtimeListeners, CLOUD_DB,
} from './backend.js';

// ---- Check if user is authenticated ----
export async function checkAuth() {
  if (!FIREBASE_ENABLED) return null;

  const ok = await initFirebase();
  if (!ok) return null;

  return new Promise((resolve) => {
    const auth = firebase.auth();
    // onAuthStateChanged fires once with current user (or null)
    const unsub = auth.onAuthStateChanged(async (user) => {
      unsub(); // unsubscribe after first call
      if (user) {
        // Load all Firestore data into memory
        await loadFromFirestore(user.uid);
        attachRealtimeListeners(() => {
          // Optionally trigger a UI refresh event when remote data changes
          window.dispatchEvent(new CustomEvent('nexus:dataUpdated'));
        });
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
}

// ---- Login (called from auth.html) ----
export async function login(email, password) {
  await initFirebase();
  return signInWithEmail(email, password);
}

// ---- Logout ----
export function logout() {
  if (FIREBASE_ENABLED) {
    signOutFirebase().then(() => {
      // Redirect to the login page
      window.location.href = 'auth.html';
    });
  } else {
    // Local-only fallback: reset demo data
    localStorage.removeItem('nexus_pm_data');
    location.reload();
  }
}

// ---- Init Auth UI guard ----
// Called on DOMContentLoaded in index.html.
// Redirects to auth.html if no user is logged in.
export async function initAuthUI() {
  if (!FIREBASE_ENABLED) {
    console.log('Nexus PM: Firebase disabled, running in local demo mode.');
    return; // No redirect — local mode works without login
  }

  const user = await checkAuth();
  if (!user) {
    // Not logged in — go to the auth page
    window.location.href = 'auth.html';
  }
}

// ---- Legacy stub kept for compatibility ----
export async function handleAuthState(clerkInstance) {
  return null;
}
