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
  ArrowRight,
  Shield,
  User,
  Smartphone,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { AppAccount, UserRole, AccountStatus } from '../types/reporting';

interface SettingsViewProps {
  accounts: AppAccount[];
  activeAccount: AppAccount | null;
  onSwitchAccount: (id: string) => void;
  onSaveAccount: (account: Partial<AppAccount>) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onGoogleLogin: (email: string, name?: string) => Promise<void>;
  onResetData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  accounts,
  activeAccount,
  onSwitchAccount,
  onSaveAccount,
  onToggleStatus,
  onDeleteAccount,
  onGoogleLogin,
  onResetData,
}) => {
  // New account form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ROLE_USER');
  const [newStatus, setNewStatus] = useState<AccountStatus>('AKTIF');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Google Connect input state
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  // Delete account confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      isGoogleConnected: true,
    });
    setNewName('');
    setNewEmail('');
    setNewRole('ROLE_USER');
    setNewStatus('AKTIF');
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
                  {isAdmin ? 'NAMA ADMIN' : 'NAMA USER'}
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
                {isAdmin ? 'ADMIN: AKSES PENUH (FULL ACCESS)' : 'USER: AKSES OPERASIONAL (CHECKLIST & LAPORAN)'}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              DEPOTEL Real-time Session
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
              <span>MASUK DENGAN GMAIL / GOOGLE</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hubungkan akun Gmail/Google pribadi di HP masing-masing agar otomatis terkoneksi ke WebApp
            </p>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            AUTO-SYNC
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
                    Nama Anda (User / Admin)
                  </label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Contoh: BUDI SANTOSO"
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

      {/* 3. DAFTAR AKUN USER & ADMIN (KELOLA AKUN & HAK AKSES) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>DAFTAR AKUN USER & ADMIN</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar akun terdaftar. Atur hak akses ROLE ADMIN / ROLE USER, serta kelola status AKTIF / NONAKTIF (Akses aman per user & login Google HP)
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
                Langsung Aktif & Terkoneksi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  NAMA USER / ADMIN *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: KOSASIH (TEAM 4)"
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
                  placeholder="email.petugas@gmail.com"
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

              {/* STATUS SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  STATUS AKUN *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('AKTIF')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newStatus === 'AKTIF'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>AKTIF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('NONAKTIF')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newStatus === 'NONAKTIF'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>NONAKTIF</span>
                  </button>
                </div>
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
                <span>Simpan & Aktifkan Langsung</span>
              </button>
            </div>
          </form>
        )}

        {/* List of Accounts */}
        <div className="space-y-3">
          {accounts.map((acc) => {
            const isCurrent = activeAccount?.id === acc.id;
            const accIsAdmin = acc.role === 'ROLE_ADMIN';
            const accIsAktif = acc.status === 'AKTIF';

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

                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                          SEDANG DIGUNAKAN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{acc.email}</span>
                      {acc.isGoogleConnected && (
                        <span className="text-[10px] text-emerald-400">✓ Google</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  
                  {/* Status Toggle Button (AKTIF <-> NONAKTIF) */}
                  {isAdmin && (
                    <button
                      onClick={() => onToggleStatus(acc.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                        accIsAktif
                          ? 'bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-500/40'
                          : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-500/30'
                      }`}
                      title={accIsAktif ? 'Klik untuk Nonaktifkan akun' : 'Klik untuk Aktifkan akun'}
                    >
                      {accIsAktif ? <Lock className="w-3 h-3 text-rose-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
                      <span>{accIsAktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  )}

                  {/* Delete Account Button & Inline Confirmation */}
                  {deleteConfirmId === acc.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/70 rounded-xl px-2.5 py-1 shadow-lg animate-fadeIn">
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
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1"
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
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
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
                        if (accounts.length > 1) {
                          setDeleteConfirmId(acc.id);
                        }
                      }}
                      disabled={accounts.length <= 1}
                      className={`p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
                        accounts.length <= 1
                          ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                          : 'bg-slate-900/90 hover:bg-rose-600 text-rose-400 hover:text-white border-slate-800 hover:border-rose-500/50 shadow-sm active:scale-95'
                      }`}
                      title={accounts.length <= 1 ? 'Minimal harus ada 1 akun di sistem' : `Hapus Akun ${acc.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PANDUAN IJIN HAK AKSES SISTEM (ROLE MATRIX) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <span>MATRIKS HAK AKSES (ROLE PERMISSIONS)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* ROLE ADMIN BOX */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="font-extrabold text-amber-300 font-mono">ROLE ADMIN (Akses Penuh)</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit Target & Pencapaian Utama (NOP, Genset, Tower)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tambah, Edit, & Hapus Team Lapangan</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tambah, Edit, Hapus & Closed Paket Site Tim</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kelola Akun Pengguna (Role Admin & User, Aktif/Nonaktif)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ubah Tanggal Laporan & Reset Data</span>
              </li>
            </ul>
          </div>

          {/* ROLE USER BOX */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <User className="w-4 h-4 text-blue-400" />
              <span className="font-extrabold text-blue-300 font-mono">ROLE USER (Akses Lapangan)</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Melihat Seluruh Dashboard Laporan Real-time</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Update Status Checklist Site (OK, NOK, PROGRESS, BLM)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salin & Kirim Laporan ke WhatsApp Team</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Tidak dapat mengubah Target Master Laporan</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Tidak dapat menghapus Team atau mengubah Akun Admin</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 5. RESET / DANGER ZONE (Admin Only) */}
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
