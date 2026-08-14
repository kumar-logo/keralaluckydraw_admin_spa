import { create } from 'zustand';

export interface AdminInfo {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  role: string;
  permissions: string[];
}

interface AdminStore {
  admin: AdminInfo | null;
  token: string | null;
  setAuth: (admin: AdminInfo, token: string) => void;
  logout: () => void;
}

const readStoredAdmin = (): AdminInfo | null => {
  const raw = localStorage.getItem('admin_info');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminInfo;
    return {
      ...parsed,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    };
  } catch {
    return null;
  }
};

export const useAdminStore = create<AdminStore>((set) => ({
  admin: readStoredAdmin(),
  token: localStorage.getItem('admin_token'),
  setAuth: (admin, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_info', JSON.stringify(admin));
    set({ admin, token });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    set({ admin: null, token: null });
  },
}));
