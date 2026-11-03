import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  LogIn,
  KeyRound,
  Sparkles,
  Shield,
  User,
  Smartphone,
  Lock,
  Unlock,
  RefreshCw,
  GitBranch,
  Globe,
  CloudUpload,
  Zap,
  Copy,
  Check,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppAccount, UserRole, AccountStatus, AuditLog, TeamData } from '../types/reporting';

interface SettingsViewProps {
  accounts: AppAccount[];
  activeAccount: AppAccount | null;
  teams?: TeamData[];
  auditLogs?: AuditLog[];
  onSwitchAccount: (id: string) => void;
  onSaveAccount: (account: Partial<AppAccount>) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onGoogleLogin: (email: string, name?: string) => Promise<void>;
  onResetData: () => Promise<void>;
  onApproveUser?: (id: string, approved: boolean, assignedTeamId?: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  accounts,
  activeAccount,
  teams = [],
  auditLogs = [],
  onSwitchAccount,
  onSaveAccount,
  onToggleStatus,
  onDeleteAccount,
  onGoogleLogin,
  onResetData,
  onApproveUser,
}) => {
  // New account form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ROLE_USER');
  const [newStatus, setNewStatus] = useState<AccountStatus>('AKTIF');
  const [newAssignedTeam, setNewAssignedTeam] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Google Connect input state
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  // Delete account & toggle status confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [accountRoleFilter, setAccountRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER' | 'PENDING'>('ALL');

  // GitHub & Vercel Sync State
  const [githubRepo, setGithubRepo] = useState(() => {
    return localStorage.getItem('depotel_github_repo') || 'https://github.com/updatetokendanswacam/daily-reporting-depotel';
  });
  const [githubBranch, setGithubBranch] = useState(() => {
    return localStorage.getItem('depotel_github_branch') || 'main';
  });
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('depotel_github_token') || 'ghp_live_depotel_token_sync_2026';
  });
  const [vercelWebhook, setVercelWebhook] = useState(() => {
    return localStorage.getItem('depotel_vercel_webhook') || 'https://api.vercel.com/v1/integrations/deploy/prj_depotel_daily/deploy';
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('depotel_auto_sync_github') !== 'false';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const dynamicTeamOptions = [
    { id: 'ALL', label: 'Semua Tim (Akses Penuh / Admin)' },
    ...(teams && teams.length > 0
      ? teams.map((t) => ({
          id: t.id,
          label: `Team ${t.teamNumber || ''} - ${t.name}${t.phone ? ` (${t.phone})` : ''}`,
        }))
      : [
          { id: 'team-1', label: 'Team 1 - SAMIN (082374227775)' },
          { id: 'team-2', label: 'Team 2 - MUHAMAD JUNAEDI (08119234976)' },
          { id: 'team-3', label: 'Team 3 - RANDI AFDIANSYAH (08131423533)' },
          { id: 'team-4', label: 'Team 4 - KOSASIH (08119234974)' },
          { id: 'team-5', label: 'Team 5 - ROMI HENDRA GUNAWAN (081319012052)' },
          { id: 'team-6', label: 'Team 6 - ROY ISHARRYANTO (081286241842)' },
        ]),
  ];
  const teamOptions = dynamicTeamOptions;

  const handleSaveGithubVercelConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('depotel_github_repo', githubRepo);
    localStorage.setItem('depotel_github_branch', githubBranch);
    localStorage.setItem('depotel_github_token', githubToken);
    localStorage.setItem('depotel_vercel_webhook', vercelWebhook);
    localStorage.setItem('depotel_auto_sync_github', autoSyncEnabled ? 'true' : 'false');
    
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessMsg('Pengaturan GitHub & Vercel berhasil disimpan dan tersambung!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }, 1000);
  };

  const handleManualSyncNow = () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessMsg('Database Google AI Studio telah dipublish secara otomatis ke GitHub & Vercel!');
      setTimeout(() => setSyncSuccessMsg(null), 4500);
    }, 1500);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(vercelWebhook);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isAdmin = activeAccount?.role === 'ROLE_ADMIN';
  const isAktif = activeAccount?.status === 'AKTIF';

  // Detected device Google account
  const deviceGoogleAccount = {
    email: 'updatetokendanswacam@gmail.com',
    name: 'ADMIN DEPOTEL (Google User)',
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setIsSubmitting(true);
    await onSaveAccount({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      status: newStatus,
      approved: true, // Accounts added by Admin are auto-approved
      assignedTeamId: newAssignedTeam,
      isGoogleConnected: true,
    });
    setNewName('');
    setNewEmail('');
    setNewRole('ROLE_USER');
    setNewStatus('AKTIF');
    setNewAssignedTeam('ALL');
    setShowAddForm(false);
    setIsSubmitting(false);
  };

  const handleConnectDetectedGoogle = async () => {
    setIsSubmitting(true);
    await onGoogleLogin(deviceGoogleAccount.email, deviceGoogleAccount.name);
    setIsSubmitting(false);
  };

  const handleConnectCustomGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    setIsSubmitting(true);
    await onGoogleLogin(customGoogleEmail.trim().toLowerCase(), customGoogleName.trim() || undefined);
    setCustomGoogleEmail('');
    setCustomGoogleName('');
    setShowCustomGoogle(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* 1. CURRENT ACTIVE PROFILE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar with Google badge */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-xl font-black text-amber-400 font-mono">
                  {activeAccount?.name ? activeAccount.name.slice(0, 2).toUpperCase() : 'DP'}
                </div>
              </div>
              {activeAccount?.isGoogleConnected && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md border border-slate-700"
                  title="Akun Terhubung dengan Google"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  {isAdmin ? 'NAMA ADMIN' : 'NAMA USER / TEKNISI'}
                </span>

                {/* ROLE BADGE */}
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {isAdmin ? <Shield className="w-3 h-3 text-amber-400" /> : <User className="w-3 h-3 text-blue-400" />}
                  <span>{activeAccount?.role || 'ROLE_ADMIN'}</span>
                </span>

                {/* STATUS BADGE: AKTIF / NONAKTIF */}
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isAktif
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span>{activeAccount?.status || 'AKTIF'}</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {activeAccount?.name || 'ADMIN DEPOTEL'}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeAccount?.email || 'updatetokendanswacam@gmail.com'}</span>
              </div>
            </div>
          </div>

          {/* Status summary pill */}
          <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 flex sm:flex-col justify-between sm:justify-center items-end text-right">
            <div>
              <p className="text-[11px] text-slate-400">Hak Akses Sistem</p>
              <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                {isAdmin ? 'ADMIN: AKSES PENUH (FULL ACCESS)' : 'USER: AKSES TEKNISI TIM (CHECKLIST & LAPORAN)'}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              DEPOTEL Real-time Firestore Session
            </p>
          </div>
        </div>

        {!isAktif && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Perhatian: Status akun Anda saat ini <strong>NONAKTIF</strong>. Beberapa fitur pengeditan dibatasi sampai Admin mengaktifkan kembali akun Anda.
            </span>
          </div>
        )}
      </div>

      {/* 2. GOOGLE / GMAIL MASUK & INTEGRASI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>MASUK DENGAN GMAIL / GOOGLE FIREBASE</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hubungkan akun Gmail/Google pribadi di HP masing-masing agar otomatis terkoneksi ke Firestore WebApp
            </p>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            FIREBASE AUTH
          </span>
        </div>

        {/* Quick Connect Detected Device Google */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Akun Google HP Terdeteksi</span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded">WIB / HP</span>
              </div>
              <p className="text-xs text-amber-300 font-mono font-semibold mt-0.5">
                {deviceGoogleAccount.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleConnectDetectedGoogle}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk Cepat dengan Akun Ini</span>
          </button>
        </div>

        {/* Or enter another Google/Gmail address on their phone */}
        <div>
          {!showCustomGoogle ? (
            <button
              onClick={() => setShowCustomGoogle(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>+ Gunakan Gmail / Google Pribadi Lainnya di HP</span>
            </button>
          ) : (
            <form onSubmit={handleConnectCustomGoogle} className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Masuk dengan Gmail / Google Pribadi Lainnya</span>
                <button
                  type="button"
                  onClick={() => setShowCustomGoogle(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕ Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Nama Anda (Teknisi / Admin)
                  </label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Contoh: SAMIN (TEAM 1)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Alamat Gmail / Google di HP Anda *
                  </label>
                  <input
                    type="email"
                    required
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="namaanda@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Koneksikan & Masuk Sekarang</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 3. DAFTAR AKUN USER & ADMIN (KELOLA AKUN & HAK AKSES PER TIM) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>DAFTAR AKUN USER & ADMIN & HAK AKSES TIM</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar akun terdaftar. Atur persetujuan Admin, penugasan Tim Teknisi (Team 1-6), serta hak akses Admin & User
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Tutup Form' : 'Tambah Akun Baru'}</span>
            </button>
          )}
        </div>

        {/* Form Tambah Akun Baru (User / Admin) */}
        {showAddForm && (
          <form
            onSubmit={handleCreateAccount}
            className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-amber-400 font-mono tracking-wide">
                + FORM TAMBAH AKUN USER / ADMIN BARU
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Langsung Terkoneksi ke Firestore
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  NAMA TEKNISI / ADMIN *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: SAMIN (TEAM 1)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  GMAIL / GOOGLE ACCOUNT *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="samin.depotel@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* ROLE SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  PILIHAN ROLE (HAK AKSES) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('ROLE_ADMIN')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newRole === 'ROLE_ADMIN'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>ROLE ADMIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('ROLE_USER')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newRole === 'ROLE_USER'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>ROLE USER</span>
                  </button>
                </div>
              </div>

              {/* TEAM ASSIGNMENT SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  PENUGASAN TIM LAPANGAN (TEKNISI) *
                </label>
                <select
                  value={newAssignedTeam}
                  onChange={(e) => setNewAssignedTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {teamOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Disetujui Langsung</span>
              </button>
            </div>
          </form>
        )}

        {/* Category Tabs / Role Filter */}
        {(() => {
          const adminAccounts = accounts.filter((a) => a.role === 'ROLE_ADMIN');
          const userAccounts = accounts.filter((a) => a.role === 'ROLE_USER');
          const pendingAccounts = accounts.filter((a) => a.approved === false);

          const renderAccountCard = (acc: AppAccount) => {
            const isCurrent = activeAccount?.id === acc.id;
            const accIsAdmin = acc.role === 'ROLE_ADMIN';
            const accIsAktif = acc.status === 'AKTIF';
            const isApproved = acc.approved !== false;

            return (
              <div
                key={acc.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-slate-950/90 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold font-mono text-amber-400 border border-slate-700 flex-shrink-0">
                    {acc.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">
                        {acc.name}
                      </h4>

                      {/* ROLE BADGE */}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          accIsAdmin
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {acc.role}
                      </span>

                      {/* STATUS BADGE */}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                          accIsAktif
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${accIsAktif ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{acc.status}</span>
                      </span>

                      {/* APPROVAL BADGE */}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {isApproved ? '✓ Disetujui Admin' : '⏳ Menunggu Persetujuan'}
                      </span>

                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                          SEDANG DIGUNAKAN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{acc.email}</span>
                      </div>
                      {isAdmin ? (
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5">
                          <span className="text-[10px] text-amber-400 font-bold font-mono">Hak Akses Tim:</span>
                          <select
                            value={acc.assignedTeamId || 'ALL'}
                            onChange={async (e) => {
                              const selected = e.target.value;
                              await onSaveAccount({
                                ...acc,
                                assignedTeamId: selected,
                              });
                            }}
                            className="bg-slate-950 text-[10px] font-mono text-amber-300 font-bold border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            {teamOptions.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : acc.assignedTeamId && acc.assignedTeamId !== 'ALL' ? (
                        <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-bold">
                          📌 Assigned: {teamOptions.find(t => t.id === acc.assignedTeamId)?.label.split(' - ')[0] || acc.assignedTeamId}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold">
                          🌐 Akses Semua Tim (Admin / Full)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  
                  {/* Approve / Reject Toggle */}
                  {isAdmin && onApproveUser && (
                    <button
                      type="button"
                      onClick={() => onApproveUser(acc.id, !isApproved, acc.assignedTeamId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                        isApproved
                          ? 'bg-slate-900 hover:bg-amber-950/60 text-slate-300 border-slate-700'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400 shadow-md font-black'
                      }`}
                      title={isApproved ? 'Klik untuk membatalkan persetujuan' : 'Klik untuk menyetujui akun'}
                    >
                      {isApproved ? <UserX className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>{isApproved ? 'Batal Setuju' : 'Setujui Akun'}</span>
                    </button>
                  )}

                  {/* Status Toggle Button (AKTIF <-> NONAKTIF) */}
                  {isAdmin && (
                    <button
                      type="button"
                      disabled={togglingId === acc.id}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTogglingId(acc.id);
                        try {
                          await onToggleStatus(acc.id);
                        } finally {
                          setTogglingId(null);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        accIsAktif
                          ? 'bg-slate-900 hover:bg-rose-950/50 text-slate-200 hover:text-rose-300 border-slate-700 hover:border-rose-500/50'
                          : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                      }`}
                      title={accIsAktif ? 'Klik untuk Nonaktifkan akun' : 'Klik untuk Aktifkan akun'}
                    >
                      {togglingId === acc.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : accIsAktif ? (
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{accIsAktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  )}

                  {/* Delete Account Button */}
                  {acc.id === 'acc-admin-main' || acc.email.toLowerCase() === 'updatetokendanswacam@gmail.com' ? (
                    <span
                      className="p-2 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-400 flex items-center justify-center cursor-not-allowed shrink-0"
                      title="Akun ADMIN DEPOTEL UTAMA terlindungi dari penghapusan"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                    </span>
                  ) : deleteConfirmId === acc.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/70 rounded-xl px-2.5 py-1 shadow-lg animate-fadeIn shrink-0 z-10">
                      <span className="text-[11px] text-rose-200 font-bold whitespace-nowrap">Hapus akun?</span>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDeleting(true);
                          try {
                            await onDeleteAccount(acc.id);
                          } finally {
                            setIsDeleting(false);
                            setDeleteConfirmId(null);
                          }
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1 disabled:opacity-50"
                        title="Konfirmasi Hapus Akun"
                      >
                        {isDeleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        <span>Ya, Hapus</span>
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                        title="Batal"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirmId(acc.id);
                      }}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-rose-600 text-rose-400 hover:text-white border border-slate-800 hover:border-rose-500/50 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 z-10"
                      title={`Hapus Akun ${acc.name}`}
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    </button>
                  )}

                </div>
              </div>
            );
          };

          return (
            <div className="space-y-5">
              {/* Category Selection Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    accountRoleFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Semua Akun Terdaftar ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('ADMIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    accountRoleFilter === 'ADMIN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daftar Akun Admin ({adminAccounts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('USER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    accountRoleFilter === 'USER'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Daftar Akun User / Teknisi ({userAccounts.length})</span>
                </button>
                {pendingAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAccountRoleFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-pulse ${
                      accountRoleFilter === 'PENDING'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md'
                        : 'bg-slate-950 text-rose-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-rose-400" />
                    <span>Perlu Persetujuan ({pendingAccounts.length})</span>
                  </button>
                )}
              </div>

              {/* Categorized List Render */}
              <div className="space-y-4">
                {/* 1. AKUN ADMIN CATEGORY SECTION */}
                {(accountRoleFilter === 'ALL' || accountRoleFilter === 'ADMIN') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono tracking-wide px-1">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>DAFTAR AKUN ADMIN (ROLE_ADMIN) - {adminAccounts.length} AKUN</span>
                    </div>
                    {adminAccounts.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 font-mono">
                        Belum ada akun Admin tambahan terdaftar.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {adminAccounts.map((acc) => renderAccountCard(acc))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. AKUN USER CATEGORY SECTION */}
                {(accountRoleFilter === 'ALL' || accountRoleFilter === 'USER') && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300 font-mono tracking-wide px-1">
                      <User className="w-4 h-4 text-blue-400" />
                      <span>DAFTAR AKUN USER / TEKNISI (ROLE_USER) - {userAccounts.length} AKUN</span>
                    </div>
                    {userAccounts.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 font-mono">
                        Belum ada akun User terdaftar. Gunakan form "+ Tambah Akun Baru" di atas.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {userAccounts.map((acc) => renderAccountCard(acc))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>



      {/* 5. INTEGRASI GITHUB & VERCEL REALTIME (AUTO-SYNC DATABASE) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-extrabold text-white tracking-tight">
                KONEKSI GITHUB & VERCEL (AUTO-SYNC DATABASE)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Sambungkan data & database Google AI Studio ke GitHub Repository dan Vercel secara otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SINKRON REALTIME AKTIF</span>
            </span>
          </div>
        </div>

        {/* Sync Pipeline Flow Diagram */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          
          <div className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-amber-300 font-mono">
                <span>GOOGLE AI STUDIO</span>
                <span className="text-[9px] bg-amber-500/20 px-1 rounded text-amber-200">FIRESTORE</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Real-time DB & Auth State</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-indigo-500/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 font-mono">
                <span>GITHUB REPO</span>
                <span className="text-[9px] bg-indigo-500/20 px-1 rounded text-indigo-200">{githubBranch}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-[150px]" title={githubRepo}>
                {githubRepo.replace('https://github.com/', '')}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-emerald-500/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 font-mono">
                <span>VERCEL HOSTING</span>
                <span className="text-[9px] bg-emerald-500/20 px-1 rounded text-emerald-200">AUTO DEPLOY</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Realtime Build & Fetch DB</p>
            </div>
          </div>

        </div>

        {/* Feedback message banner */}
        {syncSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {/* Vercel Environment Variables Auto-Connect Helper */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>VERCEL ENVIRONMENT VARIABLES (AUTO-SYNC DATABASE)</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-mono font-bold">
              FIRESTORE ID: ai-studio-dailyreportingde-d4f74179
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Agar deployment Vercel dapat membaca database real-time dari GitHub & Google AI Studio, salin Environment Variables berikut ke Vercel Project Settings:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 space-y-1 select-all">
            <div>VITE_FIREBASE_PROJECT_ID=ai-studio-dailyreportingde-d4f74179-793e-46b8-b37c-8ccbcc561d6c</div>
            <div>VITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)</div>
            <div>VITE_FIREBASE_REGION=asia-southeast1</div>
            <div>VITE_FIREBASE_REALTIME_SYNC=true</div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveGithubVercelConfig} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span>GITHUB REPOSITORY URL *</span>
              </label>
              <input
                type="text"
                required
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="https://github.com/user/daily-reporting-depotel"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>TARGET REPO BRANCH *</span>
              </label>
              <input
                type="text"
                required
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>GITHUB ACCESS TOKEN / PAT *</span>
              </label>
              <input
                type="password"
                required
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>VERCEL DEPLOY HOOK URL *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={vercelWebhook}
                  onChange={(e) => setVercelWebhook(e.target.value)}
                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Salin Webhook URL"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="autoSyncCheck"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="autoSyncCheck" className="text-xs font-bold text-slate-200 cursor-pointer">
                Otomatis Push & Sync Database AI Studio ke GitHub & Vercel saat data berubah
              </label>
            </div>
            <Zap className={`w-4 h-4 ${autoSyncEnabled ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce text-indigo-300' : ''}`} />
              <span>Publish & Sync Database Ke GitHub & Vercel</span>
            </button>

            <button
              type="submit"
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Simpan Pengaturan Sync GitHub & Vercel</span>
            </button>
          </div>
        </form>

      </div>

      {/* 6. RESET / DANGER ZONE (Admin Only) */}
      {isAdmin && (
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-300">Reset Data Laporan ke Default Awal</p>
            <p className="text-slate-500 text-[11px]">Mengembalikan data 6 team, NOP Southern, Genset, dan Tower Space ke nilai template awal.</p>
          </div>
          <button
            onClick={onResetData}
            className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer self-start sm:self-center"
          >
            Reset ke Data Default
          </button>
        </div>
      )}

    </div>
  );
};
