import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  fullName: string;
  role: string;
  organizationId: string;
  locationId: string;
  locationCode: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

type TokenPayload = {
  sub: string;
  organizationId: string;
  locationId: string;
  role: string;
  locationCode: string;
  exp: number;
};

function parseToken(token: string | null): User | null {
  if (!token) return null;
  if (typeof window === 'undefined') return null;
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const persistedUser = localStorage.getItem('cp-user');
    const baseUser = persistedUser ? (JSON.parse(persistedUser) as User) : null;
    return {
      id: decoded.sub,
      fullName: baseUser?.fullName ?? '',
      role: decoded.role,
      organizationId: decoded.organizationId,
      locationId: decoded.locationId,
      locationCode: decoded.locationCode
    };
  } catch (error) {
    console.error('Unable to parse token', error);
    return null;
  }
}

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('cp-token') : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: parseToken(initialToken),
  setSession: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp-token', token);
      localStorage.setItem('cp-user', JSON.stringify(user));
    }
    set({ token, user });
  },
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('cp-token', token);
      } else {
        localStorage.removeItem('cp-token');
        localStorage.removeItem('cp-user');
      }
    }
    set({ token, user: parseToken(token) });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cp-token');
      localStorage.removeItem('cp-user');
    }
    set({ token: null, user: null });
  }
}));
