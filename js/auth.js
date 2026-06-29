import { loadFromBackend } from './backend.js';

// Get token from local storage
export function getToken() {
  return localStorage.getItem('nexus_token');
}

// ---- Check if user is authenticated ----
export async function checkAuth() {
  const token = getToken();
  if (!token) return null;

  try {
    // If token exists, we fetch data to make sure it's valid
    const userStr = localStorage.getItem('nexus_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      await loadFromBackend();
      
      // Ensure the user wasn't deleted from the database
      const { getCurrentUser } = await import('./data.js');
      if (!getCurrentUser()) {
        logout();
        return null;
      }

      window.dispatchEvent(new CustomEvent('nexus:dataUpdated'));
      return user;
    }
    return null;
  } catch (err) {
    console.error('Auth check failed', err);
    logout();
    return null;
  }
}

// ---- Login ----
export async function login(email, password) {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');

  localStorage.setItem('nexus_token', data.token);
  localStorage.setItem('nexus_user', JSON.stringify(data.user));
  return data.user;
}

// ---- Sign Up ----
export async function signUp(email, password, name, color) {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, color })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed');

  localStorage.setItem('nexus_token', data.token);
  localStorage.setItem('nexus_user', JSON.stringify(data.user));
  return data.user;
}

// ---- Logout ----
export function logout() {
  localStorage.removeItem('nexus_token');
  localStorage.removeItem('nexus_user');
  window.location.href = 'auth.html';
}

// ---- Init Auth UI guard ----
export async function initAuthUI() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = 'auth.html';
  }
}
