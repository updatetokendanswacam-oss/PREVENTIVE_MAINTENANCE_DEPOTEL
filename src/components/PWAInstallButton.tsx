import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer ${className}`}
          title="Install Aplikasi DEPOTEL ke Layar Utama HP"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Aplikasi</span>
        </button>
      );
    }

    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-blue-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg ${className}`}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DEPOTEL Emblem" className="w-12 h-12 rounded-xl object-contain shadow-md" />
          <div>
            <h4 className="text-sm font-extrabold text-white">Pasang Aplikasi DEPOTEL</h4>
            <p className="text-xs text-slate-300">Akses cepat tanpa browser langsung dari layar utama HP Anda</p>
          </div>
        </div>
        <button
          onClick={install}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Download className="w-4 h-4" />
          <span>INSTALL SEKARANG</span>
        </button>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-sm transition-all cursor-pointer ${className}`}
          title="Panduan Install di iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain shadow" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Install di iPhone / iPad</h3>
                    <p className="text-[11px] text-slate-400">Tambahkan ke Layar Utama</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono shrink-0">
                    1
                  </span>
                  <div>
                    <span>Ketuk tombol <strong>Bagikan (Share)</strong></span>
                    <Share className="w-4 h-4 inline-block ml-1.5 text-blue-400" />
                    <span className="text-slate-400 block text-[11px] mt-0.5">Pada menu bar bawah browser Safari.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono shrink-0">
                    2
                  </span>
                  <div>
                    <span>Gulir ke bawah dan pilih:</span>
                    <div className="flex items-center gap-1.5 font-bold text-white mt-1">
                      <PlusSquare className="w-4 h-4 text-emerald-400" />
                      <span>Tambahkan ke Layar Utama</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow transition-all"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Ambient install button for standard browsers if not triggered yet
  return (
    <button
      onClick={() => {
        // If trigger not yet caught by browser, give helpful instructions
        alert('Untuk memasang aplikasi ke Layar Utama HP: Buka menu browser (titik tiga ⋮ di Chrome) lalu pilih "Tambahkan ke Layar Utama" / "Install Aplikasi".');
      }}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 font-bold text-xs transition-all cursor-pointer ${className}`}
      title="Pasang aplikasi ke HP Anda"
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span className="hidden xs:inline sm:inline">Install PWA</span>
    </button>
  );
};
