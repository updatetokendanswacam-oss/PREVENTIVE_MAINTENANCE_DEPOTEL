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
  users?: AppAccount[];
}> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data.users));
      }
      return data;
    }
  } catch (err) {
    console.warn('Server save user failed, using local fallback', err);
  }

  // Fallback: update local storage directly
  const cleanEmail = String(account.email || '').trim().toLowerCase();
  const localStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  let users: AppAccount[] = DEFAULT_LOCAL_ACCOUNTS;
  if (localStr) {
    try { users = JSON.parse(localStr); } catch (e) {}
  }

  const existingIdx = users.findIndex((u) => u.id === account.id || u.email.toLowerCase() === cleanEmail);
  let targetAcc: AppAccount;

  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      name: account.name ? account.name.trim() : users[existingIdx].name,
      email: cleanEmail || users[existingIdx].email,
      role: account.role || users[existingIdx].role,
      status: account.status || users[existingIdx].status,
      isGoogleConnected: account.isGoogleConnected !== undefined ? account.isGoogleConnected : users[existingIdx].isGoogleConnected,
      lastLoginAt: new Date().toISOString(),
    };
    targetAcc = users[existingIdx];
  } else {
    targetAcc = {
      id: account.id || `acc-${Date.now()}`,
      name: (account.name || 'USER').trim(),
      email: cleanEmail,
      role: account.role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER',
      status: account.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF',
      isGoogleConnected: account.isGoogleConnected !== undefined ? Boolean(account.isGoogleConnected) : true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    users.push(targetAcc);
  }

  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users));

  return { success: true, message: `Akun ${targetAcc.name} berhasil disimpan`, account: targetAcc, users };
}

export async function toggleAccountStatus(id: string): Promise<{
  success: boolean;
  users?: AppAccount[];
  message?: string;
}> {
  try {
    const res = await fetch('/api/users/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data.users));
        return { success: true, users: data.users, message: data.message };
      }
    }
  } catch (err) {
    console.warn('Server toggle user failed, using local fallback', err);
  }

  // Fallback: update local storage directly
  const cleanId = String(id).trim().toLowerCase();
  const localStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  let users: AppAccount[] = DEFAULT_LOCAL_ACCOUNTS;
  if (localStr) {
    try { users = JSON.parse(localStr); } catch (e) {}
  }

  const target = users.find((u) => u.id === id || u.id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);
  if (target) {
    target.status = target.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users));
    return { success: true, users, message: `Status akun ${target.name} diubah menjadi ${target.status}` };
  }

  return { success: true, users, message: 'Status akun berhasil diubah' };
}

export async function switchActiveAccount(id: string): Promise<boolean> {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
  try {
    const res = await fetch('/api/users/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data.users));
      }
      return true;
    }
  } catch (err) {
    console.warn('Server switch user failed', err);
  }
  return true;
}

export async function loginWithGoogle(email: string, name?: string): Promise<{
  success: boolean;
  message: string;
  activeUser?: AppAccount;
  users?: AppAccount[];
}> {
  try {
    const res = await fetch('/api/users/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data.users));
      }
      return data;
    }
  } catch (err) {
    console.warn('Google login failed, using local fallback', err);
  }

  // Fallback: update local storage directly
  const cleanEmail = String(email).trim().toLowerCase();
  const localStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  let users: AppAccount[] = DEFAULT_LOCAL_ACCOUNTS;
  if (localStr) {
    try { users = JSON.parse(localStr); } catch (e) {}
  }

  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (user) {
    user.isGoogleConnected = true;
    user.status = 'AKTIF';
    if (name) user.name = name.trim();
  } else {
    user = {
      id: `acc-google-${Date.now()}`,
      name: name ? name.trim() : cleanEmail.split('@')[0].toUpperCase(),
      email: cleanEmail,
      role: 'ROLE_USER',
      status: 'AKTIF',
      isGoogleConnected: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    users.push(user);
  }
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, user.id);

  return { success: true, message: `Berhasil terhubung dengan Google (${user.email})`, activeUser: user, users };
}

export async function deleteAccount(id: string): Promise<{
  success: boolean;
  users?: AppAccount[];
  message?: string;
}> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.users)) {
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data.users));
          if (data.activeUserId) {
            localStorage.setItem(ACTIVE_ACCOUNT_KEY, data.activeUserId);
          }
        }
        return { success: true, users: data.users, message: data.message };
      }
    }
  } catch (err) {
    console.warn('Server delete user failed, using local fallback', err);
  }

  // Fallback: update local storage directly
  const cleanId = String(id).trim().toLowerCase();
  const localStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  let users: AppAccount[] = DEFAULT_LOCAL_ACCOUNTS;
  if (localStr) {
    try { users = JSON.parse(localStr); } catch (e) {}
  }

  const target = users.find((u) => u.id === id || u.id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);
  const updated = users.filter((u) => u.id !== id && u.id.toLowerCase() !== cleanId && u.email.toLowerCase() !== cleanId);
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));

  return { success: true, users: updated, message: `Akun ${target ? target.name : ''} berhasil dihapus` };
}
