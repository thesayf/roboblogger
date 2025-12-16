// Blog Admin Authentication Utilities

const ADMIN_SESSION_KEY = 'blog_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
}

// Check if user has valid admin session
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) return false;
    
    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();
    
    // Check if session is valid and not expired
    if (session.authenticated && session.expiresAt > now) {
      return true;
    }
    
    // Session expired, clean it up
    if (session.expiresAt <= now) {
      clearAdminSession();
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin session:', error);
    clearAdminSession();
    return false;
  }
}

// Set admin session (24 hour expiry)
export function setAdminSession(): void {
  if (typeof window === 'undefined') return;
  
  const session: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error setting admin session:', error);
  }
}

// Clear admin session
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing admin session:', error);
  }
}

// Get session time remaining in hours
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) return 0;
    
    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();
    const timeRemaining = session.expiresAt - now;
    
    return timeRemaining > 0 ? Math.ceil(timeRemaining / (60 * 60 * 1000)) : 0;
  } catch (error) {
    console.error('Error getting session time:', error);
    return 0;
  }
}

// Verify password on server side
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return false;
  }
}