import React from 'react';
import { Home, Settings, ShieldCheck, UserCheck, Send } from 'lucide-react';
import { AppAccount } from '../types/reporting';

interface FooterNavProps {
  activeTab: 'beranda' | 'pengaturan';
  onChangeTab: (tab: 'beranda' | 'pengaturan') => void;
  activeAccount: AppAccount | null;
  onOpenWhatsAppPreview: () => void;
}

export const FooterNav: React.FC<FooterNavProps> = ({
  activeTab,
  onChangeTab,
  activeAccount,
  onOpenWhatsAppPreview,
}) => {
  const isAdmin = activeAccount?.role === 'ROLE_ADMIN';
  const isAktif = activeAccount?.status === 'AKTIF';

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-lg mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between">
        
        {/* BERANDA TAB BUTTON */}
        <button
          onClick={() => onChangeTab('beranda')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'beranda'
              ? 'text-amber-400 bg-amber-500/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'beranda' ? 'stroke-[2.5px] scale-105' : 'stroke-[1.75px]'}`} />
            {activeTab === 'beranda' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs tracking-wider uppercase mt-1">
            BERANDA
          </span>
        </button>

        {/* CENTER QUICK ACTION: KIRIM WA */}
        <div className="px-2">
          <button
            onClick={onOpenWhatsAppPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            title="Kirim Laporan ke WhatsApp"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span className="hidden xs:inline">Kirim WA</span>
          </button>
        </div>

        {/* PENGATURAN TAB BUTTON */}
        <button
          onClick={() => onChangeTab('pengaturan')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'pengaturan'
              ? 'text-amber-400 bg-amber-500/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <div className="relative">
            <Settings className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'pengaturan' ? 'stroke-[2.5px] scale-105 animate-[spin_6s_linear_infinite]' : 'stroke-[1.75px]'}`} />
            
            {/* Account Role / Status mini indicator */}
            <span
              className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                isAktif ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              title={isAktif ? 'Akun Aktif' : 'Akun Nonaktif'}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] sm:text-xs tracking-wider uppercase">
              PENGATURAN
            </span>
            {activeAccount && (
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {isAdmin ? 'ADMIN' : 'USER'}
              </span>
            )}
          </div>
        </button>

      </div>
    </footer>
  );
};
