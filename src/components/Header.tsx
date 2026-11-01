import React, { useState } from 'react';
import {
  Calendar,
  Shield,
  ShieldCheck,
  RefreshCw,
  History,
  Send,
  Sparkles,
  Pencil,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ReportDateInfo, AppAccount } from '../types/reporting';
import { createReportDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  dateInfo: ReportDateInfo;
  onDateChange: (newDateInfo: ReportDateInfo) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  syncStatus: 'server' | 'local' | 'saving';
  onGenerateReport: () => void;
  onOpenHistory: () => void;
  onResetData: () => void;
  activeTab: 'beranda' | 'pengaturan';
  onChangeTab: (tab: 'beranda' | 'pengaturan') => void;
  activeAccount: AppAccount | null;
}

export const Header: React.FC<HeaderProps> = ({
  dateInfo,
  onDateChange,
  isAdmin,
  onToggleAdmin,
  syncStatus,
  onGenerateReport,
  onOpenHistory,
  onResetData,
  activeTab,
  onChangeTab,
  activeAccount,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // App Title & Subtitle customizable state with localStorage persistence
  const [appTitle, setAppTitle] = useState(() => {
    return localStorage.getItem('depotel_app_title') || 'DAILY REPORTING DEPOTEL';
  });
  const [appSubtitle, setAppSubtitle] = useState(() => {
    return localStorage.getItem('depotel_app_subtitle') || 'Sistem Pemantauan & Laporan Operational';
  });

  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(appTitle);
  const [tempSubtitle, setTempSubtitle] = useState(appSubtitle);

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const newDateInfo = createReportDateInfo(val);
      onDateChange(newDateInfo);
      setShowDatePicker(false);
    }
  };

  const handleOpenEditModal = (targetField?: 'title' | 'subtitle') => {
    setTempTitle(appTitle);
    setTempSubtitle(appSubtitle);
    setIsEditingModalOpen(true);
  };

  const handleSaveTitles = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = tempTitle.trim() || 'DAILY REPORTING DEPOTEL';
    const finalSubtitle = tempSubtitle.trim() || 'Sistem Pemantauan & Laporan Operational';
    setAppTitle(finalTitle);
    setAppSubtitle(finalSubtitle);
    localStorage.setItem('depotel_app_title', finalTitle);
    localStorage.setItem('depotel_app_subtitle', finalSubtitle);
    setIsEditingModalOpen(false);
  };

  const handleResetTitles = () => {
    setTempTitle('DAILY REPORTING DEPOTEL');
    setTempSubtitle('Sistem Pemantauan & Laporan Operational');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b132b]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Brand Title with Edit Icons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <button
                type="button"
                onClick={() => onChangeTab('beranda')}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform flex-shrink-0 cursor-pointer"
                title="Kembali ke Beranda"
              >
                <div className="w-full h-full bg-[#0b132b] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </button>

              <div>
                {/* Judul: DAILY REPORTING DEPOTEL + Edit Icon */}
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    {appTitle}
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal('title')}
                    className="p-1 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
                    title="Edit Nama DAILY REPORTING DEPOTEL"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Subtitle: Sistem Pemantauan & Laporan Operational + Edit Icon */}
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>{appSubtitle}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal('subtitle')}
                    className="p-0.5 rounded text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
                    title="Edit Subtitle Sistem Pemantauan & Laporan Operational"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span className="text-amber-300 font-semibold text-[11px]">WIB (Asia/Jakarta)</span>
                </div>
              </div>
            </div>

            {/* Mobile Admin & Status badges */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={onToggleAdmin}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
                  isAdmin
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
                title={isAdmin ? 'Mode Admin Aktif' : 'Mode Anggota (Klik untuk Masuk Admin)'}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <Shield className="w-4 h-4" />}
                <span>{isAdmin ? 'ADMIN' : 'USER'}</span>
              </button>
            </div>
          </div>

          {/* Date Picker & Controls (BERANDA and PENGATURAN buttons removed from here; exclusively in FOOTER) */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            
            {/* Auto Date Calendar Picker */}
            <div className="relative flex items-center">
              <div
                onClick={() => isAdmin && setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 shadow-inner transition-colors ${
                  isAdmin ? 'cursor-pointer hover:border-amber-400' : ''
                }`}
                title={isAdmin ? 'Klik untuk memilih/mengubah tanggal laporan' : `Tanggal Laporan Real-time (${dateInfo.formatted})`}
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-400">Day/Date:</span>
                <span className="text-sm font-bold text-amber-300 font-mono tracking-wide">
                  {dateInfo.formatted}
                </span>
                
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDatePicker(!showDatePicker);
                    }}
                    className="ml-1 p-1 hover:bg-amber-500/20 rounded-md text-amber-400 transition-colors cursor-pointer"
                    title="Ubah Tanggal Laporan"
                  >
                    ✎
                  </button>
                )}
              </div>

              {/* Native Calendar Overlay when editing date */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-slate-900 border border-amber-500/40 p-3 rounded-xl shadow-2xl">
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Pilih Tanggal Laporan:
                  </label>
                  <input
                    type="date"
                    value={dateInfo.isoDate}
                    onChange={handleCalendarChange}
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2 w-full focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Account Pill */}
            {activeAccount && (
              <button
                onClick={() => onChangeTab('pengaturan')}
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-left transition-colors cursor-pointer"
                title="Klik untuk membuka Pengaturan Akun"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-amber-500/40">
                  {activeAccount.name.slice(0, 1)}
                </div>
                <div className="text-[11px] font-mono leading-tight">
                  <div className="text-white font-bold truncate max-w-[120px]">{activeAccount.name}</div>
                  <div className="text-emerald-400 text-[9px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{activeAccount.status}</span>
                  </div>
                </div>
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenHistory}
                className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Riwayat Laporan"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Riwayat</span>
              </button>

              {isAdmin && (
                <button
                  onClick={onResetData}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs transition-all"
                  title="Reset Data ke Default"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Generate WA Button */}
              <button
                onClick={onGenerateReport}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>GENERATE DAILY REPORT</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL EDIT NAMA & SUBTITLE APLIKASI */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Edit Nama & Deskripsi</h3>
                  <p className="text-[11px] text-slate-400">Sesuaikan judul header dan sub-judul operasional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTitles} className="space-y-4">
              {/* Field 1: Nama / Judul Aplikasi */}
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Pencil className="w-3 h-3 text-amber-400" />
                  <span>Nama Header (Judul Utama)</span>
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  placeholder="DAILY REPORTING DEPOTEL"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold tracking-wide focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1">Default: DAILY REPORTING DEPOTEL</p>
              </div>

              {/* Field 2: Subtitle Laporan */}
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Pencil className="w-3 h-3 text-amber-400" />
                  <span>Sub-Judul (Deskripsi Sistem)</span>
                </label>
                <input
                  type="text"
                  value={tempSubtitle}
                  onChange={(e) => setTempSubtitle(e.target.value)}
                  placeholder="Sistem Pemantauan & Laporan Operational"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Default: Sistem Pemantauan & Laporan Operational</p>
              </div>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetTitles}
                  className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Kembalikan nama ke format bawaan"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition-transform active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
