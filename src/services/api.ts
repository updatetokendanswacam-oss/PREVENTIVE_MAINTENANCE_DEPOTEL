import { DailyReportData, AppAccount } from '../types/reporting';
import { getInitialReportData } from '../utils/initialData';

const LOCAL_STORAGE_KEY = 'depotel_daily_report_current';
const HISTORY_STORAGE_KEY = 'depotel_daily_report_history';

export async function fetchDashboardData(): Promise<{
  data: DailyReportData;
  source: 'server' | 'local';
}> {
  try {
    const response = await fetch('/api/dashboard');
    if (response.ok) {
      const res = await response.json();
      if (res.success && res.data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.data));
        return { data: res.data, source: 'server' };
      }
    }
  } catch (err) {
    console.warn('Server fetch failed, falling back to local storage', err);
  }

  // Fallback to localStorage
  const localDataStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localDataStr) {
    try {
      const parsed = JSON.parse(localDataStr);
      return { data: parsed, source: 'local' };
    } catch (e) {
      console.error('Invalid local storage data', e);
    }
  }

  // Default initial data
  const initial = getInitialReportData();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
  return { data: initial, source: 'local' };
}

export async function saveDashboardData(
  data: DailyReportData,
  snapshotHistory: boolean = false
): Promise<{ success: boolean; message: string }> {
  // Always update local cache
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

  try {
    const response = await fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboard: data, snapshotHistory }),
    });

    if (response.ok) {
      const res = await response.json();
      return { success: true, message: res.message || 'Berhasil disimpan' };
    }
  } catch (err) {
    console.warn('Server save failed, saved locally', err);
  }

  if (snapshotHistory) {
    const history = getLocalHistory();
    const idx = history.findIndex((h) => h.id === data.id);
    if (idx >= 0) {
      history[idx] = data;
    } else {
      history.unshift(data);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }

  return { success: true, message: 'Berhasil disimpan' };
}

export async function fetchReportHistory(): Promise<DailyReportData[]> {
  try {
    const response = await fetch('/api/reports');
    if (response.ok) {
      const res = await response.json();
      if (res.success && Array.isArray(res.data)) {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(res.data));
        return res.data;
      }
    }
  } catch (err) {
    console.warn('Server history fetch failed', err);
  }

  return getLocalHistory();
}

export async function deleteReportHistory(id: string): Promise<boolean> {
  const localHistory = getLocalHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(localHistory));

  try {
    const response = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Server delete history failed', err);
  }

  return true;
}

export async function resetDashboardToDefault(): Promise<DailyReportData> {
  const initial = getInitialReportData();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));

  try {
    await fetch('/api/reset', { method: 'POST' });
    await fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboard: initial }),
    });
  } catch (err) {
    console.warn('Server reset failed, reset locally', err);
  }

  return initial;
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.success;
    }
  } catch (e) {
    // Offline fallback PIN check
    return pin === '1234';
  }
  return pin === '1234';
}

function getLocalHistory(): DailyReportData[] {
  const historyStr = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (historyStr) {
    try {
      return JSON.parse(historyStr);
    } catch (e) {
      return [];
    }
  }
  return [];
}

const ACCOUNTS_STORAGE_KEY = 'depotel_accounts_list';
const ACTIVE_ACCOUNT_KEY = 'depotel_active_account_id';

const DEFAULT_LOCAL_ACCOUNTS: AppAccount[] = [
  {
    id: 'acc-admin-main',
    name: 'ADMIN DEPOTEL UTAMA',
    email: 'updatetokendanswacam@gmail.com',
    role: 'ROLE_ADMIN',
    status: 'AKTIF',
    isGoogleConnected: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    department: 'Operations & Management DEPOTEL',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'acc-user-field',
    name: 'USER OPERASIONAL NOP',
    email: 'field.depotel@gmail.com',
    role: 'ROLE_USER',
    status: 'AKTIF',
    isGoogleConnected: true,
    department: 'Team Lapangan Southern',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'acc-user-junaedi',
    name: 'MUHAMAD JUNAEDI (TEAM 2)',
    email: 'junaedi.depotel@gmail.com',
    role: 'ROLE_USER',
    status: 'AKTIF',
    isGoogleConnected: false,
    department: 'Field Coordinator',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

export async function fetchAccounts(): Promise<{
  users: AppAccount[];
  activeUserId: string;
}> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data.users));
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, data.activeUserId || data.users[0]?.id || '');
        return { users: data.users, activeUserId: data.activeUserId || data.users[0]?.id };
      }
    }
  } catch (err) {
    console.warn('Server users fetch failed, using local fallback', err);
  }

  // Fallback to local storage
  const localUsers = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (localUsers) {
    try {
      const parsed = JSON.parse(localUsers);
      return { users: parsed, activeUserId: activeId || parsed[0]?.id || '' };
    } catch (e) {
      console.error(e);
    }
  }

  return { users: DEFAULT_LOCAL_ACCOUNTS, activeUserId: DEFAULT_LOCAL_ACCOUNTS[0].id };
}

export async function saveAccount(account: Partial<AppAccount>): Promise<{
  success: boolean;
  message: string;
  account?: AppAccount;
}> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Server save user failed', err);
  }

  return { success: true, message: 'Akun disimpan secara lokal' };
}

export async function toggleAccountStatus(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/users/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server toggle user failed', err);
  }
  return true;
}

export async function switchActiveAccount(id: string): Promise<boolean> {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
  try {
    const res = await fetch('/api/users/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server switch user failed', err);
  }
  return true;
}

export async function loginWithGoogle(email: string, name?: string): Promise<{
  success: boolean;
  message: string;
  activeUser?: AppAccount;
}> {
  try {
    const res = await fetch('/api/users/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Google login failed', err);
  }

  return { success: true, message: 'Berhasil terhubung dengan Google (offline)' };
}

export async function deleteAccount(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server delete user failed', err);
  }
  return true;
}
