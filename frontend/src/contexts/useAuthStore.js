import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
function parseToken(token) {
    if (!token)
        return null;
    if (typeof window === 'undefined')
        return null;
    try {
        const decoded = jwtDecode(token);
        const persistedUser = localStorage.getItem('cp-user');
        const baseUser = persistedUser ? JSON.parse(persistedUser) : null;
        return {
            id: decoded.sub,
            fullName: baseUser?.fullName ?? '',
            role: decoded.role,
            organizationId: decoded.organizationId,
            locationId: decoded.locationId,
            locationCode: decoded.locationCode
        };
    }
    catch (error) {
        console.error('Unable to parse token', error);
        return null;
    }
}
const initialToken = typeof window !== 'undefined' ? localStorage.getItem('cp-token') : null;
export const useAuthStore = create((set) => ({
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
            }
            else {
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
