import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { CategoryEditModal } from './components/CategoryEditModal';
import { TeamCard } from './components/TeamCard';
import { TeamEditModal } from './components/TeamEditModal';
import { SiteEditModal } from './components/SiteEditModal';
import { GensetFixSection } from './components/GensetFixSection';
import { ReportNotesSection } from './components/ReportNotesSection';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { ReportHistoryModal } from './components/ReportHistoryModal';
import { AdminPinModal } from './components/AdminPinModal';
import { ToastContainer } from './components/Toast';
import { FooterNav } from './components/FooterNav';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';

import {
  DailyReportData,
  JobCategory,
  TeamData,
  SiteItem,
  SitePackage,
  SiteStatus,
  GensetFixSite,
  ReportDateInfo,
  ToastMessage,
  AppAccount,
  AuditLog,
  LiveConnectionStatus,
} from './types/reporting';

import { groupSitesIntoPackages } from './utils/packageUtils';
import { createReportDateInfo } from './utils/dateUtils';

import {
  fetchDashboardData,
  saveDashboardData,
  resetDashboardToDefault,
  fetchAccounts,
  saveAccount,
  toggleAccountStatus,
  switchActiveAccount,
  loginWithGoogle,
  deleteAccount,
} from './services/api';

import {
  auth,
  testConnection,
  subscribeToDailyReport,
  subscribeToUsers,
  subscribeToAuditLogs,
  saveDailyReportToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  logAuditActivity,
  isEmailAdmin,
  signInWithGooglePopup,
} from './services/firebase';

import { onAuthStateChanged } from 'firebase/auth';

import { Plus, Users } from 'lucide-react';
import { generateWhatsAppReport } from './utils/reportGenerator';

export default function App() {
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [liveStatus, setLiveStatus] = useState<LiveConnectionStatus>('CONNECTING');
  const [syncStatus, setSyncStatus] = useState<'server' | 'local' | 'saving'>('server');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  // Navigation tab: BERANDA vs PENGATURAN
  const [activeTab, setActiveTab] = useState<'beranda' | 'pengaturan'>('beranda');

  // User Accounts & Authentication state
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<AppAccount | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [categoryToEdit, setCategoryToEdit] = useState<JobCategory | null>(null);
  
  const [teamEditModal, setTeamEditModal] = useState<{
    isOpen: boolean;
    team: TeamData | null;
  }>({ isOpen: false, team: null });

  const [siteEditModal, setSiteEditModal] = useState<{
    isOpen: boolean;
    teamId: string | null;
    sitePackage: SitePackage | null;
  }>({ isOpen: false, teamId: null, sitePackage: null });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load: Test Firestore connection & fetch base data
  useEffect(() => {
    async function initData() {
      setLiveStatus('CONNECTING');
      const isConnected = await testConnection();

      const { data, source } = await fetchDashboardData();
      setReportData(data);
      setSyncStatus(source);

      try {
        const { users } = await fetchAccounts();
        setAccounts(users);
        const adminAccount = users.find((u) => u.id === 'acc-admin-main') ||
                             users.find((u) => u.email === 'updatetokendanswacam@gmail.com') ||
                             users.find((u) => u.role === 'ROLE_ADMIN' && u.status === 'AKTIF') ||
                             users[0] || null;
        setActiveAccount(adminAccount);
        setIsAdmin(true);
      } catch (err) {
        console.warn('Could not load accounts:', err);
      }

      setLiveStatus(isConnected ? 'LIVE' : 'OFFLINE');
    }
    initData();
  }, []);

  // Firebase Auth Observer & Real-time Firestore Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const cleanEmail = fbUser.email.toLowerCase().trim();
        const isAdminUser = isEmailAdmin(cleanEmail);

        // Build account payload
        const userAcc: AppAccount = {
          id: `acc-fb-${fbUser.uid}`,
          uid: fbUser.uid,
          name: fbUser.displayName || cleanEmail.split('@')[0].toUpperCase(),
          email: cleanEmail,
          role: isAdminUser ? 'ROLE_ADMIN' : 'ROLE_USER',
          status: 'AKTIF',
          approved: true, // Auto-approved on Google Sign-In
          isGoogleConnected: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        // Save to Firestore
        await saveUserToFirestore(userAcc);
        await logAuditActivity('LOGIN_GOOGLE', `User ${userAcc.name} (${userAcc.email}) logged in via Firebase Google Auth`, userAcc.email, userAcc.name, userAcc.role);

        // Update local active state
        setActiveAccount(userAcc);
        setIsAdmin(userAcc.role === 'ROLE_ADMIN' && userAcc.status === 'AKTIF');
        showToast(`Selamat datang, ${userAcc.name}! (Firebase Auth Connected)`, 'success');
      }
    });

    return () => unsubscribeAuth();
  }, [showToast]);

  // Subscribe to real-time Firestore updates for active report date
  const reportId = reportData?.id || `report-${createReportDateInfo().isoDate}`;
  useEffect(() => {
    setLiveStatus('CONNECTING');
    const unsubReport = subscribeToDailyReport(
      reportId,
      (remoteData) => {
        if (remoteData) {
          setReportData((prev) => {
            if (remoteData.updatedAt !== prev?.updatedAt) {
              return remoteData;
            }
            return prev;
          });
          setLiveStatus('LIVE');
        }
      },
      () => setLiveStatus('OFFLINE')
    );

    const unsubUsers = subscribeToUsers((remoteUsers) => {
      if (Array.isArray(remoteUsers)) {
        setAccounts(remoteUsers);
      }
    });

    const unsubLogs = subscribeToAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    return () => {
      unsubReport();
      unsubUsers();
      unsubLogs();
    };
  }, [reportId]);

  // Save changes to API & Firestore asynchronously
  const persistChanges = (newData: DailyReportData, snapshotHistory = false) => {
    setReportData(newData);
    setSyncStatus('saving');
    setLiveStatus('SYNCING');

    // Save to Firestore
    saveDailyReportToFirestore(newData)
      .then(() => setLiveStatus('LIVE'))
      .catch(() => setLiveStatus('OFFLINE'));

    // Save to Express Backend / localStorage
    saveDashboardData(newData, snapshotHistory)
      .then((res) => {
        setSyncStatus('server');
        return res;
      })
      .catch((err) => {
        console.warn('Background save failed, saved in local cache', err);
        setSyncStatus('local');
      });
  };

  // Account Management Handlers
  const handleSwitchAccount = async (id: string) => {
    await switchActiveAccount(id);
    const target = accounts.find((a) => a.id === id);
    if (target) {
      setActiveAccount(target);
      const adminEnabled = target.role === 'ROLE_ADMIN' && target.status === 'AKTIF';
      setIsAdmin(adminEnabled);
      showToast(`Beralih ke akun ${target.name} (${target.role})`, 'info');
    }
  };

  const handleSaveAccount = async (accountData: Partial<AppAccount>) => {
    setLiveStatus('SYNCING');
    const res = await saveAccount(accountData);
    const updatedUsers = res.users || (await fetchAccounts()).users;

    setAccounts((prev) => {
      const map = new Map<string, AppAccount>();
      prev.forEach((u) => {
        const key = u.email ? u.email.toLowerCase().trim() : u.id;
        map.set(key, u);
      });
      updatedUsers.forEach((u) => {
        const key = u.email ? u.email.toLowerCase().trim() : u.id;
        const existing = map.get(key);
        map.set(key, existing ? { ...existing, ...u } : u);
      });
      return Array.from(map.values());
    });

    if (accountData.email && accountData.name) {
      const cleanEmail = accountData.email.toLowerCase().trim();
      const existingAcc = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
      const accToSave: AppAccount = {
        id: accountData.id || existingAcc?.id || `acc-${Date.now()}`,
        name: accountData.name,
        email: cleanEmail,
        role: accountData.role || 'ROLE_USER',
        status: accountData.status || 'AKTIF',
        approved: accountData.approved !== undefined ? accountData.approved : true,
        assignedTeamId: accountData.assignedTeamId || 'ALL',
        isGoogleConnected: true,
        createdAt: existingAcc?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await saveUserToFirestore(accToSave);
      await logAuditActivity('CREATE_ACCOUNT', `Admin added account ${accToSave.name} (${accToSave.email})`, activeAccount?.email, activeAccount?.name, activeAccount?.role);
    }
    setLiveStatus('LIVE');

    setActiveAccount((prev) => {
      if (prev?.id === 'acc-admin-main' || prev?.email === 'updatetokendanswacam@gmail.com') return prev;
      const adminMain = updatedUsers.find((u) => u.id === 'acc-admin-main') || 
                        updatedUsers.find((u) => u.email === 'updatetokendanswacam@gmail.com') ||
                        updatedUsers.find((u) => u.role === 'ROLE_ADMIN' && u.status === 'AKTIF');
      return prev || adminMain || updatedUsers[0];
    });
    setIsAdmin(true);
    showToast(res.message || 'Akun berhasil ditambahkan', 'success');
  };

  const handleApproveUser = async (id: string, approved: boolean, assignedTeamId?: string) => {
    setLiveStatus('SYNCING');
    const target = accounts.find((a) => a.id === id);
    if (target) {
      const updatedAcc: AppAccount = {
        ...target,
        approved,
        assignedTeamId: assignedTeamId || target.assignedTeamId || 'ALL',
      };
      await saveUserToFirestore(updatedAcc);
      await logAuditActivity('APPROVE_USER', `Admin ${approved ? 'approved' : 'pending'} user ${target.name} (${target.email})`, activeAccount?.email, activeAccount?.name, activeAccount?.role);
      showToast(`Status persetujuan akun ${target.name} diperbarui`, 'success');
    }
    setLiveStatus('LIVE');
  };

  const handleToggleStatus = async (id: string) => {
    setLiveStatus('SYNCING');
    const res = await toggleAccountStatus(id);
    if (res.success && res.users) {
      setAccounts(res.users);
      const target = res.users.find((u) => u.id === id);
      if (target) {
        await saveUserToFirestore(target);
        await logAuditActivity('TOGGLE_STATUS', `Admin changed account ${target.name} status to ${target.status}`, activeAccount?.email, activeAccount?.name, activeAccount?.role);
      }
      showToast(res.message || 'Status akun berhasil diubah', 'success');
    }
    setLiveStatus('LIVE');
  };

  const handleDeleteAccount = async (id: string) => {
    const targetAcc = accounts.find((a) => a.id === id || a.email.toLowerCase() === id.toLowerCase());
    if (!targetAcc) return;

    if (targetAcc.id === 'acc-admin-main' || targetAcc.email.toLowerCase() === 'updatetokendanswacam@gmail.com') {
      showToast('Akun ADMIN DEPOTEL UTAMA terlindungi dan tidak dapat dihapus', 'error');
      return;
    }

    try {
      setLiveStatus('SYNCING');

      // 1. Delete from Firestore collection 'users'
      await deleteUserFromFirestore(targetAcc.id);

      // 2. Delete from Express server & localStorage
      const res = await deleteAccount(id);

      // 3. Update React state immediately with deleted user filtered out
      const remainingUsers = (res.users || accounts).filter(
        (a) => a.id !== targetAcc.id && a.email.toLowerCase() !== targetAcc.email.toLowerCase()
      );
      setAccounts(remainingUsers);

      await logAuditActivity('DELETE_ACCOUNT', `Admin deleted account ${targetAcc.name} (${targetAcc.email})`, activeAccount?.email, activeAccount?.name, activeAccount?.role);
      showToast(`Akun '${targetAcc.name}' berhasil dihapus permanen!`, 'success');
    } catch (err) {
      console.error('Delete account error:', err);
      showToast('Gagal menghapus akun', 'error');
    } finally {
      setLiveStatus('LIVE');
    }
  };

  const handleGoogleLogin = async (email: string, name?: string) => {
    setLiveStatus('SYNCING');
    try {
      // Try Firebase Sign-In popup first
      await signInWithGooglePopup();
    } catch (e) {
      // Fallback to custom login
      await loginWithGoogle(email, name);
    } finally {
      setLiveStatus('LIVE');
    }
  };

  if (!reportData) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-amber-300 font-mono">
            Memuat Dashboard Daily Reporting DEPOTEL Firestore...
          </p>
        </div>
      </div>
    );
  }

  // Helper to apply dashboard updates & broadcast in real-time
  const applyDashboardUpdate = (
    dataUpdater: (prev: DailyReportData) => DailyReportData,
    toastMsg?: { message: string; type?: 'success' | 'error' | 'info' },
    regenerateWhatsApp: boolean = false
  ) => {
    const updated = dataUpdater(reportData);
    const lockKey = `depotel_custom_wa_is_edited_${reportData.id}`;

    let isCustomLocked =
      reportData.isCustomWhatsAppEdited === true ||
      localStorage.getItem(lockKey) === 'true';

    const savedCustomReport =
      reportData.customWhatsAppReport ||
      localStorage.getItem(`depotel_custom_wa_${reportData.id}`) ||
      localStorage.getItem('depotel_custom_wa_permanent_latest');

    let newWhatsAppText: string;

    if (regenerateWhatsApp) {
      try {
        localStorage.removeItem(lockKey);
        localStorage.removeItem(`depotel_custom_wa_${reportData.id}`);
        localStorage.removeItem('depotel_custom_wa_permanent_latest');
      } catch (e) {
        console.warn('Storage clear lock error', e);
      }
      newWhatsAppText = generateWhatsAppReport(updated);
      isCustomLocked = false;
    } else if (isCustomLocked && savedCustomReport && savedCustomReport.trim().length > 0) {
      newWhatsAppText = savedCustomReport;
    } else {
      newWhatsAppText = generateWhatsAppReport(updated);
    }

    const cleanUpdated: DailyReportData = {
      ...updated,
      customWhatsAppReport: newWhatsAppText,
      isCustomWhatsAppEdited: isCustomLocked,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: activeAccount?.email || 'Anonymous',
    };

    // Immediate React state update
    setReportData(cleanUpdated);

    // Save in background to Firestore & Express backend
    persistChanges(cleanUpdated);

    if (toastMsg) {
      showToast(toastMsg.message, toastMsg.type || 'success');
      logAuditActivity('UPDATE_DASHBOARD', toastMsg.message, activeAccount?.email, activeAccount?.name, activeAccount?.role);
    }
  };

  // Operational Handlers
  const handleDateChange = async (newDateInfo: ReportDateInfo) => {
    await applyDashboardUpdate(
      (prev) => ({
        ...prev,
        id: `report-${newDateInfo.isoDate}`,
        dateInfo: newDateInfo,
      }),
      { message: `Tanggal laporan diperbarui: ${newDateInfo.formatted}` }
    );
  };

  const handleSaveCategory = async (updatedCat: JobCategory) => {
    const newCategories = reportData.categories.map((c) =>
      c.id === updatedCat.id ? updatedCat : c
    );
    await applyDashboardUpdate(
      (prev) => ({
        ...prev,
        categories: newCategories,
      }),
      { message: 'Data laporan utama berhasil diperbarui' }
    );
  };

  // Team Handlers
  const handleOpenAddTeam = () => {
    setTeamEditModal({ isOpen: true, team: null });
  };

  const handleOpenEditTeam = (team: TeamData) => {
    setTeamEditModal({ isOpen: true, team });
  };

  const handleSaveTeam = async (teamInfo: Partial<TeamData>) => {
    let newTeams = [...reportData.teams];

    if (teamInfo.id) {
      newTeams = newTeams.map((t) => {
        if (t.id === teamInfo.id) {
          return {
            ...t,
            name: teamInfo.name || t.name,
            phone: teamInfo.phone || t.phone,
            teamNumber: teamInfo.teamNumber || t.teamNumber,
          };
        }
        return t;
      });
    } else {
      const newTeam: TeamData = {
        id: `team-${Date.now()}`,
        teamNumber: teamInfo.teamNumber || newTeams.length + 1,
        name: teamInfo.name || 'NEW TEAM',
        phone: teamInfo.phone || '',
        sites: [],
      };
      newTeams.push(newTeam);
    }

    newTeams.sort((a, b) => a.teamNumber - b.teamNumber);

    await applyDashboardUpdate(
      (prev) => ({ ...prev, teams: newTeams }),
      { message: teamInfo.id ? 'Data team berhasil diperbarui' : 'Team baru berhasil ditambahkan' },
      true
    );
  };

  const handleDeleteTeam = async (teamId: string) => {
    const targetTeam = reportData.teams.find((t) => t.id === teamId);
    if (confirm(`Apakah Anda yakin ingin menghapus Team ${targetTeam?.name || ''}?`)) {
      const newTeams = reportData.teams.filter((t) => t.id !== teamId);
      await applyDashboardUpdate(
        (prev) => ({ ...prev, teams: newTeams }),
        { message: 'Team berhasil dihapus' },
        true
      );
    }
  };

  // Package Handlers
  const handleOpenAddSitePackage = (teamId: string) => {
    setSiteEditModal({ isOpen: true, teamId, sitePackage: null });
  };

  const handleOpenEditPackage = (teamId: string, pkg: SitePackage) => {
    setSiteEditModal({ isOpen: true, teamId, sitePackage: pkg });
  };

  const handleSavePackage = async (packageData: {
    packageId?: string;
    siteId: string;
    siteName: string;
    siteText: string;
    siteStatus: SiteStatus;
    towerText: string;
    towerStatus: SiteStatus;
    easText: string;
    easStatus: SiteStatus;
    note?: string;
    photoUrl?: string;
    lat?: number;
    lng?: number;
  }) => {
    const { teamId, sitePackage } = siteEditModal;
    if (!teamId) return;

    const pkgId = packageData.packageId || sitePackage?.packageId || `pkg-${Date.now()}`;

    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;

      const isClosed = sitePackage ? sitePackage.isClosed : false;

      const siteItem: SiteItem = {
        id: sitePackage?.siteItem?.id || `site-${Date.now()}-1`,
        packageId: pkgId,
        packageRole: 'site',
        siteId: packageData.siteId,
        siteName: packageData.siteName,
        text: packageData.siteText,
        status: packageData.siteStatus,
        lat: packageData.lat,
        lng: packageData.lng,
        note: packageData.note,
        photoUrl: packageData.photoUrl || sitePackage?.siteItem?.photoUrl,
        isClosed,
      };

      const towerItem: SiteItem = {
        id: sitePackage?.towerItem?.id || `site-${Date.now()}-2`,
        packageId: pkgId,
        packageRole: 'tower',
        text: packageData.towerText,
        status: packageData.towerStatus,
        isClosed,
      };

      const easItem: SiteItem = {
        id: sitePackage?.easItem?.id || `site-${Date.now()}-3`,
        packageId: pkgId,
        packageRole: 'eas',
        text: packageData.easText,
        status: packageData.easStatus,
        isClosed,
      };

      let newSites = [...t.sites];
      if (sitePackage) {
        const oldIds = new Set([
          sitePackage.siteItem?.id,
          sitePackage.towerItem?.id,
          sitePackage.easItem?.id,
        ].filter(Boolean));

        newSites = newSites.filter((s) => !oldIds.has(s.id) && s.packageId !== pkgId);
        newSites.push(siteItem, towerItem, easItem);
      } else {
        newSites.push(siteItem, towerItem, easItem);
      }

      return { ...t, sites: newSites };
    });

    await applyDashboardUpdate(
      (prev) => ({ ...prev, teams: newTeams }),
      { message: sitePackage ? 'Paket Site berhasil diperbarui' : 'Paket Site baru berhasil ditambahkan' },
      true
    );
  };

  const handleDeletePackage = async (teamId: string, packageId: string) => {
    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;

      const { activePackages, closedPackages } = groupSitesIntoPackages(t.sites);
      const allPkgs = [...activePackages, ...closedPackages];
      const targetPkg = allPkgs.find((p) => p.packageId === packageId);
      const idsToRemove = new Set([
        targetPkg?.siteItem?.id,
        targetPkg?.towerItem?.id,
        targetPkg?.easItem?.id,
      ].filter(Boolean));

      return {
        ...t,
        sites: t.sites.filter((s) => s.packageId !== packageId && !idsToRemove.has(s.id)),
      };
    });

    await applyDashboardUpdate(
      (prev) => ({ ...prev, teams: newTeams }),
      { message: 'Paket Site berhasil dihapus' },
      true
    );
  };

  const handleStatusChange = async (teamId: string, siteId: string, newStatus: SiteStatus) => {
    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        sites: t.sites.map((s) => (s.id === siteId ? { ...s, status: newStatus } : s)),
      };
    });

    await applyDashboardUpdate(
      (prev) => ({ ...prev, teams: newTeams }),
      { message: 'Status item diperbarui' },
      true
    );
  };

  const handleUpdatePackageNote = async (teamId: string, packageId: string, noteText: string) => {
    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        sites: t.sites.map((s) => {
          if (s.packageId === packageId && (s.packageRole === 'site' || !s.packageRole)) {
            return { ...s, note: noteText };
          }
          return s;
        }),
      };
    });

    await applyDashboardUpdate(
      (prev) => ({ ...prev, teams: newTeams }),
      { message: 'Keterangan Note site diperbarui' },
      true
    );
  };

  // Handler for Closed Unified Package
  const handleClosedPackage = async (teamId: string, pkg: SitePackage) => {
    const closedDateStr = new Date().toISOString();
    const pkgName = pkg.siteItem?.siteName || pkg.siteItem?.text || 'Paket Site';

    const updatedCategories = reportData.categories.map((cat) => {
      if (cat.id === 'nop_southern' || cat.id === 'space_tower') {
        const newAchievement = cat.achievement + 1;
        const newTarget = cat.target < newAchievement ? newAchievement : cat.target;
        const newRemaining = Math.max(0, newTarget - newAchievement);
        const newPercentage =
          newTarget > 0 ? Math.round((newAchievement / newTarget) * 100) : 100;
        return {
          ...cat,
          target: newTarget,
          achievement: newAchievement,
          remaining: newRemaining,
          percentage: newPercentage,
        };
      }
      return cat;
    });

    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;

      const updatedSiteItem: SiteItem = {
        ...pkg.siteItem,
        packageId: pkg.packageId,
        isClosed: true,
        status: pkg.siteItem?.status || 'DONE',
        closedAt: closedDateStr,
        closedCategoryTitle: 'PM SITE NOP & SPACE TOWER',
      };

      const updatedTowerItem: SiteItem = {
        ...pkg.towerItem,
        id: pkg.towerItem?.id || `${pkg.packageId}-tower`,
        packageId: pkg.packageId,
        packageRole: 'tower',
        text: pkg.towerItem?.text || 'Tower space',
        isClosed: true,
        status: pkg.towerItem?.status || 'DONE',
        closedAt: closedDateStr,
      };

      const updatedEasItem: SiteItem = {
        ...pkg.easItem,
        id: pkg.easItem?.id || `${pkg.packageId}-eas`,
        packageId: pkg.packageId,
        packageRole: 'eas',
        text: pkg.easItem?.text || 'EAS',
        isClosed: true,
        status: pkg.easItem?.status || 'DONE',
        closedAt: closedDateStr,
      };

      const idsToRemove = new Set([
        pkg.siteItem?.id,
        pkg.towerItem?.id,
        pkg.easItem?.id,
      ].filter(Boolean));

      const filteredSites = t.sites.filter(
        (s) => s.packageId !== pkg.packageId && !idsToRemove.has(s.id)
      );

      return {
        ...t,
        sites: [...filteredSites, updatedSiteItem, updatedTowerItem, updatedEasItem],
      };
    });

    applyDashboardUpdate(
      (prev) => ({
        ...prev,
        categories: updatedCategories,
        teams: newTeams,
      }),
      { message: `Paket '${pkgName}' Closed! Data Laporan Utama (PM Site & Tower Space) bertambah +1` },
      true
    );
  };

  const handleReopenPackage = (teamId: string, packageId: string) => {
    const updatedCategories = reportData.categories.map((cat) => {
      if (cat.id === 'nop_southern' || cat.id === 'space_tower') {
        const newAchievement = Math.max(0, cat.achievement - 1);
        const newRemaining = Math.max(0, cat.target - newAchievement);
        const newPercentage =
          cat.target > 0 ? Math.round((newAchievement / cat.target) * 100) : 100;
        return {
          ...cat,
          achievement: newAchievement,
          remaining: newRemaining,
          percentage: newPercentage,
        };
      }
      return cat;
    });

    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;

      const newSites = t.sites.map((s) => {
        if (s.packageId === packageId) {
          return {
            ...s,
            isClosed: false,
            closedAt: undefined,
            status: s.packageRole === 'site' ? ('PROGRESS' as SiteStatus) : s.status,
          };
        }
        return s;
      });

      return { ...t, sites: newSites };
    });

    applyDashboardUpdate(
      (prev) => ({
        ...prev,
        categories: updatedCategories,
        teams: newTeams,
      }),
      { message: 'Paket site berhasil dibuka kembali (Reopened) ke Paket Site Aktif!' },
      false
    );
  };

  const handleDeleteClosedPackage = (teamId: string, packageId: string) => {
    const updatedCategories = reportData.categories.map((cat) => {
      if (cat.id === 'nop_southern' || cat.id === 'space_tower') {
        const newAchievement = Math.max(0, cat.achievement - 1);
        const newRemaining = Math.max(0, cat.target - newAchievement);
        const newPercentage =
          cat.target > 0 ? Math.round((newAchievement / cat.target) * 100) : 100;
        return {
          ...cat,
          achievement: newAchievement,
          remaining: newRemaining,
          percentage: newPercentage,
        };
      }
      return cat;
    });

    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;

      const { closedPackages } = groupSitesIntoPackages(t.sites);
      const targetPkg = closedPackages.find((p) => p.packageId === packageId);
      const targetItemIds = new Set([
        targetPkg?.siteItem?.id,
        targetPkg?.towerItem?.id,
        targetPkg?.easItem?.id,
      ].filter(Boolean));

      return {
        ...t,
        sites: t.sites.filter(
          (s) => s.packageId !== packageId && !targetItemIds.has(s.id)
        ),
      };
    });

    applyDashboardUpdate(
      (prev) => ({
        ...prev,
        categories: updatedCategories,
        teams: newTeams,
      }),
      { message: 'Paket Site Closed berhasil dihapus' },
      false
    );
  };

  // Genset Fix Handlers
  const recalculateGensetCategories = (categories: JobCategory[], gensetSites: GensetFixSite[]): JobCategory[] => {
    const closedCount = gensetSites.filter((g) => g.isClosed || g.status === 'DONE').length;
    const totalCount = gensetSites.length;

    return categories.map((cat) => {
      if (cat.id === 'pm_genset') {
        const newAchievement = closedCount;
        const newTarget = Math.max(cat.target, totalCount, newAchievement);
        const newRemaining = Math.max(0, newTarget - newAchievement);
        const newPercentage = newTarget > 0 ? Math.round((newAchievement / newTarget) * 100) : 100;
        return {
          ...cat,
          target: newTarget,
          achievement: newAchievement,
          remaining: newRemaining,
          percentage: newPercentage,
        };
      }
      return cat;
    });
  };

  const handleAddGensetSite = async (
    siteName: string,
    status: SiteStatus,
    siteId?: string,
    teamName?: string,
    technicianName?: string,
    note?: string,
    technicianPhone?: string,
    isClosed?: boolean
  ) => {
    const isClosedVal = isClosed !== undefined ? isClosed : status === 'DONE';
    const newSites: GensetFixSite[] = [
      ...reportData.gensetFixSites,
      {
        id: `genset-${Date.now()}`,
        siteId: siteId || '',
        siteName,
        teamName: teamName || '',
        status,
        technicianName: technicianName || activeAccount?.name || 'DODI',
        technicianPhone: technicianPhone || '',
        isClosed: isClosedVal,
        closedAt: isClosedVal ? new Date().toISOString() : undefined,
        note: note || '',
      },
    ];
    const newCategories = recalculateGensetCategories(reportData.categories, newSites);
    await applyDashboardUpdate(
      (prev) => ({ ...prev, gensetFixSites: newSites, categories: newCategories }),
      { message: 'Site Genset Fix berhasil ditambahkan (Hitungan BAGIAN B PM GENSET otomatis terupdate)' },
      true
    );
  };

  const handleEditGensetSite = async (
    siteIdKey: string,
    siteName: string,
    status: SiteStatus,
    siteId?: string,
    teamName?: string,
    technicianName?: string,
    note?: string,
    technicianPhone?: string,
    isClosed?: boolean
  ) => {
    const newSites: GensetFixSite[] = reportData.gensetFixSites.map((g) => {
      if (g.id === siteIdKey) {
        const closedVal = isClosed !== undefined ? isClosed : (status === 'DONE' ? true : g.isClosed);
        return {
          ...g,
          siteName,
          status,
          siteId: siteId !== undefined ? siteId : g.siteId,
          teamName: teamName !== undefined ? teamName : g.teamName,
          technicianName: technicianName !== undefined ? technicianName : g.technicianName,
          technicianPhone: technicianPhone !== undefined ? technicianPhone : g.technicianPhone,
          isClosed: closedVal,
          closedAt: closedVal ? (g.closedAt || new Date().toISOString()) : undefined,
          note: note !== undefined ? note : g.note,
        };
      }
      return g;
    });
    const newCategories = recalculateGensetCategories(reportData.categories, newSites);
    await applyDashboardUpdate(
      (prev) => ({ ...prev, gensetFixSites: newSites, categories: newCategories }),
      { message: 'Site Genset Fix & BAGIAN B PM GENSET berhasil diperbarui' },
      true
    );
  };

  const handleDeleteGensetSite = async (siteId: string) => {
    const newSites = reportData.gensetFixSites.filter((g) => g.id !== siteId);
    const newCategories = recalculateGensetCategories(reportData.categories, newSites);
    await applyDashboardUpdate(
      (prev) => ({ ...prev, gensetFixSites: newSites, categories: newCategories }),
      { message: 'Site Genset Fix berhasil dihapus' },
      true
    );
  };

  // Note Handler
  const handleSaveNote = async (newNote: string) => {
    await applyDashboardUpdate(
      (prev) => ({ ...prev, note: newNote }),
      { message: 'Catatan laporan berhasil diperbarui' },
      true
    );
  };

  // Reset Handler
  const handleReset = async () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data laporan ke data awal?')) {
      const resetData = await resetDashboardToDefault();
      setReportData(resetData);
      showToast('Data berhasil direset ke data awal!', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* PWA Offline Status Indicator */}
      <OfflineIndicator />

      {/* Main App Header */}
      <Header
        dateInfo={reportData.dateInfo}
        onDateChange={handleDateChange}
        isAdmin={isAdmin}
        onToggleAdmin={() => {
          if (!isAdmin) {
            setAdminPinModalOpen(true);
          } else {
            setIsAdmin(false);
            showToast('Beralih ke Mode Anggota (View-Only)', 'info');
          }
        }}
        syncStatus={syncStatus}
        liveStatus={liveStatus}
        onGenerateReport={() => setPreviewModalOpen(true)}
        onOpenHistory={() => setHistoryModalOpen(true)}
        onResetData={handleReset}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeAccount={activeAccount}
      />

      {/* Live Firestore Connection Status Header Banner */}
      <div className="bg-[#070d1a] border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Database Firestore:</span>
            {liveStatus === 'LIVE' && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE (Terhubung & Synchronized)</span>
              </span>
            )}
            {liveStatus === 'CONNECTING' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span>
                <span>CONNECTING (Menghubungkan Database)</span>
              </span>
            )}
            {liveStatus === 'SYNCING' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                <span>SYNCING (Sedang Menyimpan Perubahan)</span>
              </span>
            )}
            {liveStatus === 'OFFLINE' && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>OFFLINE (Koneksi Terputus)</span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400">
            <span>Project ID: <strong className="text-amber-300">gen-lang-client-0520026727</strong></span>
            <span>•</span>
            <span>Auth: <strong className="text-emerald-300">{activeAccount?.email || 'Connected'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 space-y-6 sm:space-y-8">
        
        {/* NONAKTIF WARNING BANNER */}
        {activeAccount && activeAccount.status === 'NONAKTIF' && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
              <span>
                Akun <strong>{activeAccount.name}</strong> saat ini berstatus <strong>NONAKTIF</strong>. Hak akses pengeditan dinonaktifkan sementara.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('pengaturan')}
              className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-white font-bold text-xs border border-rose-400/40 self-start sm:self-auto cursor-pointer"
            >
              Buka Pengaturan Akun →
            </button>
          </div>
        )}

        {/* TAB 1: PENGATURAN (Settings & User/Admin Account Management) */}
        {activeTab === 'pengaturan' ? (
          <SettingsView
            accounts={accounts}
            activeAccount={activeAccount}
            teams={reportData.teams}
            auditLogs={auditLogs}
            onSwitchAccount={handleSwitchAccount}
            onSaveAccount={handleSaveAccount}
            onToggleStatus={handleToggleStatus}
            onDeleteAccount={handleDeleteAccount}
            onGoogleLogin={handleGoogleLogin}
            onResetData={handleReset}
            onApproveUser={handleApproveUser}
          />
        ) : (
          /* TAB 2: BERANDA (Dashboard Operasional Daily Reporting) */
          <>
            {/* Section 1: Dashboard Summary & Core Metrics */}
            <SummaryCards
              categories={reportData.categories}
              teams={reportData.teams}
              isAdmin={isAdmin}
              onEditCategory={(cat) => setCategoryToEdit(cat)}
            />

            {/* Section 2: PM Site Team Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      BAGIAN D. PM SITE - DAFTAR TEAM ({reportData.teams.length})
                    </h2>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>FIRESTORE REALTIME SYNC</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola status site untuk masing-masing team operasional (Tersinkronisasi Realtime dengan Preview WhatsApp)
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleOpenAddTeam}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>TAMBAH TEAM BARU</span>
                  </button>
                )}
              </div>

              {/* Mobile & Tablet Quick Team Filter Tab Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-1 px-1">
                <button
                  onClick={() => setSelectedTeamFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    selectedTeamFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Semua Tim ({reportData.teams.length})</span>
                </button>
                {reportData.teams.map((t, idx) => {
                  const isSel = selectedTeamFilter === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeamFilter(t.id)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border font-mono shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        isSel
                          ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-amber-300">T{t.teamNumber || idx + 1}:</span>
                      <span className="font-sans font-semibold">{t.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedTeamFilter !== 'ALL' && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-mono">
                  <span>Menampilkan filter: Tim #{reportData.teams.find(t => t.id === selectedTeamFilter)?.teamNumber}</span>
                  <button
                    onClick={() => setSelectedTeamFilter('ALL')}
                    className="underline font-bold text-white hover:text-amber-200 cursor-pointer"
                  >
                    Lihat Semua Tim
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {(selectedTeamFilter === 'ALL'
                  ? reportData.teams
                  : reportData.teams.filter((t) => t.id === selectedTeamFilter)
                ).map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isAdmin={isAdmin}
                    onEditTeam={handleOpenEditTeam}
                    onDeleteTeam={handleDeleteTeam}
                    onAddSitePackage={handleOpenAddSitePackage}
                    onEditPackage={handleOpenEditPackage}
                    onDeletePackage={handleDeletePackage}
                    onStatusChange={handleStatusChange}
                    onClosedPackage={handleClosedPackage}
                    onDeleteClosedPackage={handleDeleteClosedPackage}
                    onReopenPackage={handleReopenPackage}
                    onUpdateNote={handleUpdatePackageNote}
                  />
                ))}
              </div>
            </div>

            {/* Section 3 & 4: PM Genset Fix & Report Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              <GensetFixSection
                sites={reportData.gensetFixSites}
                teams={reportData.teams}
                isAdmin={isAdmin}
                onAddSite={handleAddGensetSite}
                onEditSite={handleEditGensetSite}
                onDeleteSite={handleDeleteGensetSite}
              />

              <ReportNotesSection
                note={reportData.note}
                isAdmin={isAdmin}
                onSaveNote={handleSaveNote}
              />
            </div>
          </>
        )}

      </main>

      {/* Desktop Bottom Credits */}
      <footer className="bg-[#070b16] border-t border-slate-800/80 py-5 pb-24 sm:pb-6 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400/90">DAILY REPORTING DEPOTEL ONLINE</span>
            <span>•</span>
            <span>Firebase Firestore Real-time</span>
          </div>
          <div className="flex items-center gap-2">
            {activeAccount && (
              <span className="text-slate-400">
                Login: <strong className="text-amber-300">{activeAccount.name}</strong> ({activeAccount.role})
              </span>
            )}
            <span>•</span>
            <div>
              Status: <span className="text-emerald-400 font-bold">Synchronized</span>
            </div>
          </div>
        </div>
      </footer>

      {/* PERSISTENT MOBILE BOTTOM NAVIGATION (BERANDA & PENGATURAN) */}
      <FooterNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeAccount={activeAccount}
        onOpenWhatsAppPreview={() => setPreviewModalOpen(true)}
      />

      {/* Modals */}
      <CategoryEditModal
        category={categoryToEdit}
        isOpen={!!categoryToEdit}
        onClose={() => setCategoryToEdit(null)}
        onSave={handleSaveCategory}
      />

      <TeamEditModal
        team={teamEditModal.team}
        nextTeamNumber={reportData.teams.length + 1}
        isOpen={teamEditModal.isOpen}
        onClose={() => setTeamEditModal({ isOpen: false, team: null })}
        onSave={handleSaveTeam}
      />

      <SiteEditModal
        sitePackage={siteEditModal.sitePackage}
        isOpen={siteEditModal.isOpen}
        onClose={() => setSiteEditModal({ isOpen: false, teamId: null, sitePackage: null })}
        onSave={handleSavePackage}
      />

      <ReportPreviewModal
        reportData={reportData}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onSaveToHistory={() => persistChanges(reportData, true)}
        onShowToast={showToast}
        onSaveCustomReport={async (customText: string, isPermanentEdit: boolean = true) => {
          try {
            localStorage.setItem(`depotel_custom_wa_${reportData.id}`, customText);
            if (isPermanentEdit) {
              localStorage.setItem(`depotel_custom_wa_is_edited_${reportData.id}`, 'true');
              localStorage.setItem('depotel_custom_wa_permanent_latest', customText);
            }
          } catch (e) {
            console.warn('Storage save error', e);
          }
          const updated: DailyReportData = {
            ...reportData,
            customWhatsAppReport: customText,
            isCustomWhatsAppEdited: isPermanentEdit,
            updatedAt: new Date().toISOString(),
          };
          await persistChanges(updated);
        }}
        onResetCustomReport={async () => {
          try {
            localStorage.removeItem(`depotel_custom_wa_is_edited_${reportData.id}`);
            localStorage.removeItem(`depotel_custom_wa_${reportData.id}`);
          } catch (e) {
            console.warn('Storage remove error', e);
          }
          const newGenerated = generateWhatsAppReport(reportData);
          const updated: DailyReportData = {
            ...reportData,
            customWhatsAppReport: newGenerated,
            isCustomWhatsAppEdited: false,
            updatedAt: new Date().toISOString(),
          };
          await persistChanges(updated);
        }}
      />

      <ReportHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onLoadReport={(rep) => setReportData(rep)}
        onShowToast={showToast}
      />

      <AdminPinModal
        isOpen={adminPinModalOpen}
        onClose={() => setAdminPinModalOpen(false)}
        onSuccess={() => setIsAdmin(true)}
        onShowToast={showToast}
      />

    </div>
  );
}
