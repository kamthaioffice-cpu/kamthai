import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Sheets and Google Drive File scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// User Profiles registry
// By default, we register the owner as Admin.
// In a full application, these would be synchronized with a "Users" sheet in Google Sheets.
const DEFAULT_PROFILES: Record<string, UserProfile> = {
  'kamthai.office@gmail.com': { email: 'kamthai.office@gmail.com', role: 'Admin', name: 'Admin User' }
};

export const getUserProfile = (email: string | null, displayName: string | null): UserProfile => {
  if (!email) {
    return { email: 'guest@demo.com', role: 'Employee', name: 'Guest User' };
  }
  
  const normalizedEmail = email.toLowerCase();
  if (DEFAULT_PROFILES[normalizedEmail]) {
    return DEFAULT_PROFILES[normalizedEmail];
  }
  
  // Default first user or specific emails to Admin/Manager, others to Employee
  if (normalizedEmail.includes('admin') || normalizedEmail === 'kamthai.office@gmail.com') {
    return { email: normalizedEmail, role: 'Admin', name: displayName || 'Admin' };
  }
  
  return { email: normalizedEmail, role: 'Employee', name: displayName || 'Employee' };
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string, profile: UserProfile) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        const profile = getUserProfile(user.email, user.displayName);
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken, profile);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; profile: UserProfile } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    const profile = getUserProfile(result.user.email, result.user.displayName);
    return { user: result.user, accessToken: cachedAccessToken, profile };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
