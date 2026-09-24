import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

export const AUTH_STORAGE_KEY = 'edumaster_auth_state';

export interface StoredUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface StoredAuthState {
  user: StoredUser | null;
  accessToken: string | null;
  connectedAt: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const getStoredAuthState = (): StoredAuthState | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Lỗi đọc auth state từ localStorage:', e);
    return null;
  }
};

export const saveAuthState = (user: User | StoredUser | null, token: string | null) => {
  if (!user && !token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  try {
    const data: StoredAuthState = {
      user: user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }
        : null,
      accessToken: token,
      connectedAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Lỗi lưu auth state vào localStorage:', e);
  }
};

export const clearStoredAuthState = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // First check localStorage for persistent auth state
  const stored = getStoredAuthState();
  if (stored?.accessToken && stored?.user) {
    cachedAccessToken = stored.accessToken;
    if (onAuthSuccess) {
      onAuthSuccess(stored.user as unknown as User, stored.accessToken);
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const currentStored = getStoredAuthState();
      const token = cachedAccessToken || currentStored?.accessToken;
      if (token) {
        cachedAccessToken = token;
        saveAuthState(user, token);
        if (onAuthSuccess) onAuthSuccess(user, token);
      }
    } else {
      const currentStored = getStoredAuthState();
      if (!currentStored?.accessToken) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể nhận Access Token từ Google Workspace');
    }

    cachedAccessToken = credential.accessToken;
    saveAuthState(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google Workspace:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const stored = getStoredAuthState();
  return stored?.accessToken || null;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.error(e);
  }
  cachedAccessToken = null;
  clearStoredAuthState();
};
