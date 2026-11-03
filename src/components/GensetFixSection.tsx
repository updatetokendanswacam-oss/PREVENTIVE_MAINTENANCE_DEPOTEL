import React, { useState } from 'react';
import { Wrench, Plus, Trash2, Edit2, CheckCircle2, XCircle, Clock, MinusCircle, Circle } from 'lucide-react';
import { GensetFixSite, SiteStatus } from '../types/reporting';

interface GensetFixSectionProps {
  sites: GensetFixSite[];
  isAdmin: boolean;
  onAddSite: (siteName: string, status: SiteStatus) => void;
  onEditSite: (siteId: string, siteName: string, status: SiteStatus) => void;
  onDeleteSite: (siteId: string) => void;
}

export const GensetFixSection: React.FC<GensetFixSectionProps> = ({
  sites,
  isAdmin,
  onAddSite,
  onEditSite,
  onDeleteSite,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteNameInput, setSiteNameInput] = useState('');
  const [statusInput, setStatusInput] = useState<SiteStatus>('UNCHECKED');

  const statusOptions: { value: SiteStatus; label: string; icon: React.ReactNode; badgeClass: string }[] = [
    { value: 'DONE', label: 'SELESAI', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />, badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { value: 'NOK', label: 'NOK', icon: <XCircle className="w-3.5 h-3.5 text-rose-400 inline mr-1" />, badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { value: 'PROGRESS', label: 'PROGRESS', icon: <Clock className="w-3.5 h-3.5 text-amber-400 inline mr-1" />, badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { value: 'NA', label: 'N/A', icon: <MinusCircle className="w-3.5 h-3.5 text-slate-400 inline mr-1" />, badgeClass: 'bg-slate-700/50 text-slate-300 border-slate-600' },
    { value: 'UNCHECKED', label: 'BELUM', icon: <Circle className="w-3.5 h-3.5 text-blue-400 inline mr-1" />, badgeClass: 'bg-blue-950/40 text-blue-300 border-blue-800/50' },
  ];

  const handleStartAdd = () => {
    setSiteNameInput('');
    setStatusInput('UNCHECKED');
    setIsAdding(true);
    setEditingSiteId(null);
  };

  const handleStartEdit = (site: GensetFixSite) => {
    setSiteNameInput(site.siteName);
    setStatusInput(site.status);
    setEditingSiteId(site.id);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteNameInput.trim()) return;

    if (isAdding) {
      onAddSite(siteNameInput.trim(), statusInput);
    } else if (editingSiteId) {
      onEditSite(editingSiteId, siteNameInput.trim(), statusInput);
    }

    setIsAdding(false);
    setEditingSiteId(null);
    setSiteNameInput('');
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
              BAGIAN E
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              PM GENSET FIX
            </h3>
          </div>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Site Genset</span>
        </button>
      </div>

      {/* Inline Form when Adding or Editing */}
      {(isAdding || editingSiteId) && (
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
          <div className="text-xs font-bold text-amber-300">
            {isAdding ? 'Tambah Site Genset Fix' : 'Edit Site Genset Fix'}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nama Site
            </label>
            <input
              type="text"
              placeholder="Contoh: Site Genset JKT001"
              value={siteNameInput}
              onChange={(e) => setSiteNameInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 font-mono focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Status Pekerjaan
            </label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((st) => (
                <button
                  type="button"
                  key={st.value}
                  onClick={() => setStatusInput(st.value)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 ${
                    statusInput === st.value
                      ? `${st.badgeClass} ring-1 ring-amber-400`
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{st.icon}</span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingSiteId(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-400"
            >
              SIMPAN
            </button>
          </div>
        </form>
      )}

      {/* Sites List */}
      <div className="space-y-2">
        {sites.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/60">
            Belum ada site PM Genset Fix. Klik "Tambah Site Genset" di atas.
          </div>
        ) : (
          sites.map((site, index) => {
            const currentStatus = statusOptions.find((s) => s.value === site.status) || statusOptions[4];

            return (
              <div
                key={site.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-slate-500">
                    {index + 1}.
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white font-mono">
                      {site.siteName}
                    </span>
                    <div className="mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentStatus.badgeClass}`}>
                        {currentStatus.icon} {currentStatus.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(site)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-colors"
                    title="Edit Site Genset"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteSite(site.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors"
                    title="Hapus Site Genset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
