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
  ReportDateInfo,
  ToastMessage,
  AppAccount,
} from './types/reporting';

import { groupSitesIntoPackages } from './utils/packageUtils';

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

import { Plus, Send, ShieldAlert, Sparkles, CheckCircle, RefreshCw, Copy, Users } from 'lucide-react';
import { generateWhatsAppReport } from './utils/reportGenerator';

export default function App() {
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // Admin state derived from activeAccount
  const [syncStatus, setSyncStatus] = useState<'server' | 'local' | 'saving'>('server');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  // Navigation tab: BERANDA vs PENGATURAN
  const [activeTab, setActiveTab] = useState<'beranda' | 'pengaturan'>('beranda');

  // User Accounts & Authentication state
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<AppAccount | null>(null);

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

  // Initial Load: Dashboard Data & Accounts
  useEffect(() => {
    async function initData() {
      const { data, source } = await fetchDashboardData();
      setReportData(data);
      setSyncStatus(source);

      // Fetch accounts and ensure user stays as ADMIN DEPOTEL UTAMA
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
    }
    initData();
  }, []);

  // Realtime Sync Listener (BroadcastChannel for multi-tab + 2s Polling for multi-device)
  const reportDataRef = useRef(reportData);
  useEffect(() => {
    reportDataRef.current = reportData;
  }, [reportData]);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    let accountsBc: BroadcastChannel | null = null;

    try {
      if (window.BroadcastChannel) {
        bc = new BroadcastChannel('depotel_realtime_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'DASHBOARD_UPDATE' && event.data.data) {
            if (event.data.data.updatedAt !== reportDataRef.current?.updatedAt) {
              setReportData(event.data.data);
            }
          }
        };

        accountsBc = new BroadcastChannel('depotel_accounts_channel');
        accountsBc.onmessage = (event) => {
          if (event.data && event.data.type === 'ACCOUNTS_UPDATE' && Array.isArray(event.data.users)) {
            setAccounts(event.data.users);
          }
        };
      }
    } catch (e) {}

    const syncInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data } = await fetchDashboardData();
          if (
            data &&
            data.updatedAt &&
            data.updatedAt !== reportDataRef.current?.updatedAt
          ) {
            setReportData(data);
          }

          const { users } = await fetchAccounts();
          if (users && users.length > 0) {
            setAccounts(users);
          }
        } catch (e) {
          // ignore transient poll error
        }
      }
    }, 2000);

    return () => {
      if (bc) bc.close();
      if (accountsBc) accountsBc.close();
      clearInterval(syncInterval);
    };
  }, []);

  // Save changes to API & storage asynchronously without blocking UI
  const persistChanges = (newData: DailyReportData, snapshotHistory = false) => {
    setReportData(newData);
    setSyncStatus('saving');
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
    const res = await saveAccount(accountData);
    const { users } = await fetchAccounts();
    setAccounts(users);
    
    // User request: "saya tetep menggunakan akun ADMIN DEPOTEL UTAMA yang memegang hak akses , ketika saya menambahkan akun user dan admin tidak beralih ke akun user dan admin , hanya menambahkan saja"
    setActiveAccount((prev) => {
      const adminMain = users.find((u) => u.id === 'acc-admin-main') || 
                        users.find((u) => u.email === 'updatetokendanswacam@gmail.com') ||
                        users.find((u) => u.role === 'ROLE_ADMIN' && u.status === 'AKTIF');
      if (prev?.id === 'acc-admin-main') return prev;
      return adminMain || prev || users[0];
    });
    setIsAdmin(true);
    showToast(res.message || 'Akun berhasil ditambahkan', 'success');
  };

  const handleToggleStatus = async (id: string) => {
    await toggleAccountStatus(id);
    const { users } = await fetchAccounts();
    setAccounts(users);
    if (activeAccount?.id === id) {
      const updated = users.find((u) => u.id === id);
      if (updated) {
        setActiveAccount(updated);
        setIsAdmin(updated.role === 'ROLE_ADMIN' && updated.status === 'AKTIF');
      }
    }
    showToast('Status akun berhasil diubah', 'success');
  };

  const handleDeleteAccount = async (id: string) => {
    const targetAcc = accounts.find((a) => a.id === id);
    if (!targetAcc) return;

    if (targetAcc.id === 'acc-admin-main' || targetAcc.email.toLowerCase() === 'updatetokendanswacam@gmail.com') {
      showToast('Akun ADMIN DEPOTEL UTAMA terlindungi dan tidak dapat dihapus', 'error');
      return;
    }

    try {
      const success = await deleteAccount(id);
      if (success) {
        const { users } = await fetchAccounts();
        setAccounts(users);
        setActiveAccount((prev) => {
          const adminMain = users.find((u) => u.id === 'acc-admin-main') || 
                            users.find((u) => u.email === 'updatetokendanswacam@gmail.com');
          if (prev && prev.id !== id && prev.id === 'acc-admin-main') return prev;
          return adminMain || users[0] || null;
        });
        setIsAdmin(true);

        // Broadcast account deletion in real-time across open tabs/windows
        try {
          if (window.BroadcastChannel) {
            const bc = new BroadcastChannel('depotel_accounts_channel');
            bc.postMessage({ type: 'ACCOUNTS_UPDATE', users });
            bc.close();
          }
        } catch (e) {}

        showToast(`Akun '${targetAcc.name}' berhasil dihapus permanen!`, 'success');
      } else {
        showToast(`Gagal menghapus akun '${targetAcc.name}'.`, 'error');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      showToast('Terjadi kesalahan saat menghapus akun', 'error');
    }
  };

  const handleGoogleLogin = async (email: string, name?: string) => {
    const res = await loginWithGoogle(email, name);
    const { users, activeUserId } = await fetchAccounts();
    setAccounts(users);
    const current = users.find((u) => u.id === activeUserId) || users[0] || null;
    setActiveAccount(current);
    if (current) {
      setIsAdmin(current.role === 'ROLE_ADMIN' && current.status === 'AKTIF');
    }
    showToast(res.message || 'Berhasil masuk dengan Google!', 'success');
  };

  if (!reportData) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-amber-300 font-mono">
            Memuat Dashboard Daily Reporting DEPOTEL...
          </p>
        </div>
      </div>
    );
  }

  // Helper to ensure any operational update (sites, packages, genset, categories, etc.)
  // updates the dashboard data instantly in realtime and handles WhatsApp report updates properly
  const applyDashboardUpdate = (
    dataUpdater: (prev: DailyReportData) => DailyReportData,
    toastMsg?: { message: string; type?: 'success' | 'error' | 'info' },
    regenerateWhatsApp: boolean = false
  ) => {
    const updated = dataUpdater(reportData);
    const lockKey = `depotel_custom_wa_is_edited_${reportData.id}`;

    let newWhatsAppText: string;
    let isCustomLocked = false;

    if (regenerateWhatsApp) {
      // User request: "ketika di tambahkan site di Preview Laporan WhatsApp akan tertambah sesuai list site"
      // When explicitly regenerating (e.g. adding a new site), clear custom lock so newly added site appears in WhatsApp preview!
      try {
        localStorage.removeItem(lockKey);
        localStorage.removeItem('depotel_custom_wa_permanent_latest');
      } catch (e) {
        console.warn('Storage clear lock error', e);
      }
      newWhatsAppText = generateWhatsAppReport(updated);
      isCustomLocked = false;
    } else {
      // User request: "ketika di closed list site akan tersimpan dan tidak merubah otomatis lagi ke Preview Laporan WhatsApp"
      isCustomLocked =
        reportData.isCustomWhatsAppEdited === true ||
        localStorage.getItem(lockKey) === 'true';

      const savedCustomReport =
        reportData.customWhatsAppReport ||
        localStorage.getItem(`depotel_custom_wa_${reportData.id}`);

      newWhatsAppText = (savedCustomReport && savedCustomReport.trim().length > 0)
        ? savedCustomReport
        : (reportData.customWhatsAppReport || generateWhatsAppReport(updated));
    }

    try {
      localStorage.setItem(`depotel_custom_wa_${reportData.id}`, newWhatsAppText);
    } catch (e) {
      console.warn('Storage save error', e);
    }

    const cleanUpdated: DailyReportData = {
      ...updated,
      customWhatsAppReport: newWhatsAppText,
      isCustomWhatsAppEdited: isCustomLocked,
      updatedAt: new Date().toISOString(),
    };

    // Realtime state update: Immediate React re-render without blocking UI thread (0ms)
    setReportData(cleanUpdated);

    // Broadcast update across open tabs/windows in realtime (0ms)
    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('depotel_realtime_channel');
        bc.postMessage({ type: 'DASHBOARD_UPDATE', data: cleanUpdated });
        bc.close();
      }
    } catch (e) {}

    // Save in background to server & storage
    persistChanges(cleanUpdated);

    if (toastMsg) {
      showToast(toastMsg.message, toastMsg.type || 'success');
    }
  };

  // Handlers
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
      // Edit existing
      newTeams = newTeams.map((t) =>
        t.id === teamInfo.id
          ? {
              ...t,
              name: teamInfo.name || t.name,
              phone: teamInfo.phone || t.phone,
              teamNumber: teamInfo.teamNumber || t.teamNumber,
            }
          : t
      );
    } else {
      // Create new team
      const newTeam: TeamData = {
        id: `team-${Date.now()}`,
        teamNumber: teamInfo.teamNumber || newTeams.length + 1,
        name: teamInfo.name || 'NEW TEAM',
        phone: teamInfo.phone || '',
        sites: [],
      };
      newTeams.push(newTeam);
    }

    // Sort by teamNumber
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

  // Package Handlers (Site + Tower Space + EAS)
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
        // Exclude old items belonging to this package when editing
        const oldIds = new Set([
          sitePackage.siteItem?.id,
          sitePackage.towerItem?.id,
          sitePackage.easItem?.id,
        ].filter(Boolean));

        newSites = newSites.filter((s) => !oldIds.has(s.id) && s.packageId !== pkgId);
        newSites.push(siteItem, towerItem, easItem);
      } else {
        // Adding new site package to team: preserve all existing active & closed sites and append new package!
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

  // Handler for Closed Unified Package (Calculates PM SITE & SPACE TOWER together)
  const handleClosedPackage = async (teamId: string, pkg: SitePackage) => {
    const closedDateStr = new Date().toISOString();
    const pkgName = pkg.siteItem?.siteName || pkg.siteItem?.text || 'Paket Site';

    // 1. Update DATA LAPORAN UTAMA:
    // Both PM SITE NOP SOUTHERN and SPACE TOWER get achievement +1 directly together!
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

    // 2. Mark package items as isClosed: true and status: 'DONE'
    const newTeams = reportData.teams.map((t) => {
      if (t.id !== teamId) return t;

      const updatedSiteItem: SiteItem = {
        ...pkg.siteItem,
        packageId: pkg.packageId,
        isClosed: true,
        status: 'DONE',
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
        status: 'DONE',
        closedAt: closedDateStr,
      };

      const updatedEasItem: SiteItem = {
        ...pkg.easItem,
        id: pkg.easItem?.id || `${pkg.packageId}-eas`,
        packageId: pkg.packageId,
        packageRole: 'eas',
        text: pkg.easItem?.text || 'EAS',
        isClosed: true,
        status: 'DONE',
        closedAt: closedDateStr,
      };

      // Remove any previous versions of this package's items
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
      false // REQUIREMENT #5: DO NOT auto-regenerate or alter Preview Laporan WhatsApp on closed!
    );
  };

  // Handler to REOPEN a closed package from Paket Site Closed Hari Ini back to Paket Site Aktif
  const handleReopenPackage = (teamId: string, packageId: string) => {
    // 1. Decrement achievement for PM SITE NOP SOUTHERN and SPACE TOWER
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

    // 2. Mark package items as isClosed: false and status: 'PROGRESS'
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
      false // REQUIREMENT #5: DO NOT touch Preview Laporan WhatsApp on reopen
    );
  };

  // Handler to delete a closed package from the closed list (updates Data Laporan Utama)
  const handleDeleteClosedPackage = (teamId: string, packageId: string) => {
    // 1. Decrement achievement for PM SITE NOP SOUTHERN and SPACE TOWER
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

    // 2. Remove items belonging to this closed package from team.sites
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
      false // REQUIREMENT #5: DO NOT touch Preview Laporan WhatsApp
    );
  };

  // Genset Fix Handlers
  const handleAddGensetSite = async (siteName: string, status: SiteStatus) => {
    const newSites = [
      ...reportData.gensetFixSites,
      {
        id: `genset-${Date.now()}`,
        siteName,
        status,
      },
    ];
    await applyDashboardUpdate(
      (prev) => ({ ...prev, gensetFixSites: newSites }),
      { message: 'Site Genset Fix berhasil ditambahkan' },
      true
    );
  };

  const handleEditGensetSite = async (siteId: string, siteName: string, status: SiteStatus) => {
    const newSites = reportData.gensetFixSites.map((g) =>
      g.id === siteId ? { ...g, siteName, status } : g
    );
    await applyDashboardUpdate(
      (prev) => ({ ...prev, gensetFixSites: newSites }),
      { message: 'Site Genset Fix berhasil diperbarui' },
      true
    );
  };

  const handleDeleteGensetSite = async (siteId: string) => {
    const newSites = reportData.gensetFixSites.filter((g) => g.id !== siteId);
    await applyDashboardUpdate(
      (prev) => ({ ...prev, gensetFixSites: newSites }),
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
        onGenerateReport={() => setPreviewModalOpen(true)}
        onOpenHistory={() => setHistoryModalOpen(true)}
        onResetData={handleReset}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeAccount={activeAccount}
      />

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
            onSwitchAccount={handleSwitchAccount}
            onSaveAccount={handleSaveAccount}
            onToggleStatus={handleToggleStatus}
            onDeleteAccount={handleDeleteAccount}
            onGoogleLogin={handleGoogleLogin}
            onResetData={handleReset}
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
                  <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    BAGIAN D. PM SITE - DAFTAR TEAM ({reportData.teams.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola status site untuk masing-masing team operasional
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAddTeam}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
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
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border font-semibold flex items-center gap-1.5 shrink-0 ${
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
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border font-mono shrink-0 flex items-center gap-1.5 ${
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
                className="underline font-bold text-white hover:text-amber-200"
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
            <span className="font-bold text-amber-400/90">DAILY REPORTING DEPOTEL</span>
            <span>•</span>
            <span>Sistem Operasional Real-time</span>
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
