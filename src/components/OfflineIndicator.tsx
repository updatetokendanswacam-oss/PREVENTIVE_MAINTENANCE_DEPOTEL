import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 px-3 py-1.5 text-xs font-extrabold shadow-xl border border-amber-400 animate-pulse">
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>Mode Offline — Menggunakan Data Tersimpan</span>
    </div>
  );
};
