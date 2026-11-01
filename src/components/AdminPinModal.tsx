import React, { useState } from 'react';
import { ShieldCheck, X, KeyRound } from 'lucide-react';
import { verifyAdminPin } from '../services/api';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isValid = await verifyAdminPin(pin);
    setLoading(false);

    if (isValid) {
      onSuccess();
      onShowToast('Mode Admin Berhasil Diaktifkan!', 'success');
      onClose();
    } else {
      onShowToast('PIN Admin salah! Gunakan PIN default 1234', 'error');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Akses Admin DEPOTEL</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-400">
            Masukkan PIN Admin untuk mengaktifkan fitur edit penuh dashboard.
            <span className="block mt-1 text-amber-400/80 font-mono">PIN Default: 1234</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              PIN Keamanan Admin
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                maxLength={6}
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-lg text-white font-mono tracking-widest focus:border-amber-500 focus:outline-none"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20"
            >
              {loading ? 'Memeriksa...' : 'MASUK ADMIN'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
