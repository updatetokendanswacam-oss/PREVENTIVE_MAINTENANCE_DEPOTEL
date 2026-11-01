import React, { useState } from 'react';
import { Phone, Plus, Trash2, CheckCircle2, Archive, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { TeamData, SiteStatus, SitePackage } from '../types/reporting';
import { groupSitesIntoPackages } from '../utils/packageUtils';

interface TeamCardProps {
  team: TeamData;
  isAdmin: boolean;
  onEditTeam: (team: TeamData) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddSitePackage: (teamId: string) => void;
  onEditPackage: (teamId: string, pkg: SitePackage) => void;
  onDeletePackage: (teamId: string, packageId: string) => void;
  onStatusChange: (teamId: string, siteId: string, newStatus: SiteStatus) => void;
  onClosedPackage: (teamId: string, pkg: SitePackage) => void;
  onDeleteClosedPackage: (teamId: string, packageId: string) => void;
  onUpdateNote?: (teamId: string, packageId: string, noteText: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isAdmin,
  onEditTeam,
  onDeleteTeam,
  onAddSitePackage,
  onEditPackage,
  onDeletePackage,
  onStatusChange,
  onClosedPackage,
  onDeleteClosedPackage,
  onUpdateNote,
}) => {
  const [showClosedSection, setShowClosedSection] = useState(false);
  const [editingNotePkgId, setEditingNotePkgId] = useState<string | null>(null);
  const [noteInputValue, setNoteInputValue] = useState('');

  const handleSaveInlineNote = (pkgId: string) => {
    if (onUpdateNote) {
      onUpdateNote(team.id, pkgId, noteInputValue.trim());
    }
    setEditingNotePkgId(null);
  };

  const statusOptions: { value: SiteStatus; label: string; shortLabel: string; icon: string; badgeClass: string }[] = [
    { value: 'DONE', label: 'SELESAI', shortLabel: 'OK', icon: '✅', badgeClass: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60' },
    { value: 'NOK', label: 'NOK', shortLabel: 'NOK', icon: '❌', badgeClass: 'bg-rose-500/25 text-rose-300 border-rose-500/60' },
    { value: 'PROGRESS', label: 'PROGRESS', shortLabel: 'PRG', icon: '⏳', badgeClass: 'bg-amber-500/25 text-amber-300 border-amber-500/60' },
    { value: 'NA', label: 'N/A', shortLabel: 'N/A', icon: '⊘', badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600' },
    { value: 'UNCHECKED', label: 'BELUM', shortLabel: 'BLM', icon: '⚪', badgeClass: 'bg-blue-950/50 text-blue-300 border-blue-800/60' },
  ];

  // Group team sites into unified packages (Site + Tower Space + EAS)
  const { activePackages, closedPackages } = groupSitesIntoPackages(team.sites);

  // User request:
  // "ketika admin meng klik Closed list site tim nya akan tetap sama pada Preview Laporan WhatsApp nya secara otomatis dan permanen, jangan merubah lagi jika setelah admin meng klik closed data list tim akan tetap sama pada Paket Site Aktif: dan FORMAT PESAN WHATSAPP"
  // Keep the latest package visible in "Paket Site Aktif:" even after closed!
  const displayedPackages =
    activePackages.length > 0
      ? activePackages
      : closedPackages.length > 0
      ? [closedPackages[closedPackages.length - 1]]
      : [];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-amber-500/30 transition-all flex flex-col justify-between group">
      
      <div>
        {/* Team Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 font-mono tracking-wider uppercase">
                Team {team.teamNumber}
              </span>
              {closedPackages.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {closedPackages.length} Closed
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5 tracking-tight flex items-center gap-2">
              {team.name}
            </h3>
            <a
              href={`tel:${team.phone}`}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 mt-1 font-mono transition-colors group/phone cursor-pointer"
              title={`Telepon ${team.name} (${team.phone})`}
            >
              <Phone className="w-3.5 h-3.5 text-amber-400/80 group-hover/phone:text-amber-300 group-hover/phone:scale-110 transition-all" />
              <span className="underline decoration-slate-700 underline-offset-2">{team.phone}</span>
            </a>
          </div>

          {/* Edit Team Header Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditTeam(team)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-all shadow"
                title="Edit Team"
              >
                ✎
              </button>
              <button
                onClick={() => onDeleteTeam(team.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-all shadow"
                title="Hapus Team"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Unified Site Packages List */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <span>Paket Site Aktif:</span>
              <span className="text-amber-400 font-bold font-mono">({displayedPackages.length})</span>
            </span>
            {isAdmin && (
              <button
                onClick={() => onAddSitePackage(team.id)}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Site</span>
              </button>
            )}
          </div>

          {displayedPackages.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-4 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1.5">
              <p>Belum ada paket site ditambahkan</p>
            </div>
          ) : (
            displayedPackages.map((pkg, index) => (
              <div
                key={pkg.packageId}
                className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/40 transition-all space-y-2.5 shadow-md"
              >
                {/* Header: Site Name + SINGLE CLOSED BUTTON */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                        PAKET #{index + 1}
                      </span>
                      {pkg.isClosed && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          CLOSED ✅
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-white font-mono break-all sm:break-normal truncate max-w-full">
                        {pkg.siteItem.text}
                      </span>
                    </div>
                    {pkg.siteItem.siteId && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                        Site ID: <strong className="text-amber-300">{pkg.siteItem.siteId}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* SINGLE CLOSED BUTTON (OR CLOSED BADGE IF ALREADY CLOSED) */}
                    {pkg.isClosed ? (
                      <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>CLOSED ✅</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onClosedPackage(team.id, pkg)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/50 text-[11px] sm:text-xs font-black flex items-center gap-1 transition-all shadow-md active:scale-95 group/btn cursor-pointer"
                        title="Klik Closed: Selesaikan Site, Tower Space & EAS sekaligus (PM SITE +1 & SPACE TOWER +1)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:text-slate-950 transition-colors" />
                        <span>CLOSED</span>
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onEditPackage(team.id, pkg)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors border border-slate-800"
                          title="Edit Paket Site"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDeletePackage(team.id, pkg.packageId)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-slate-500 transition-colors border border-slate-800"
                          title="Hapus Paket Site"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 3 Unified Rows: 1. SITE, 2. TOWER SPACE, 3. CEK EAS */}
                <div className="space-y-2 pt-0.5 text-xs font-mono">
                  
                  {/* 1. PM SITE ROW */}
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-amber-400 font-bold shrink-0">1. SITE:</span>
                        <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-none">
                          {pkg.siteItem.text}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 w-full">
                      {statusOptions.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => onStatusChange(team.id, pkg.siteItem.id, st.value)}
                          className={`h-7 sm:h-6 text-[10px] font-bold px-1 rounded flex items-center justify-center gap-1 border transition-all active:scale-95 ${
                            pkg.siteItem.status === st.value
                              ? `${st.badgeClass} ring-1 ring-amber-400/50 shadow-sm font-extrabold`
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                          }`}
                          title={st.label}
                        >
                          <span className="text-xs">{st.icon}</span>
                          <span className="text-[9px]">{st.shortLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. TOWER SPACE ROW */}
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-amber-400 font-bold shrink-0">2. TOWER SPACE:</span>
                        <span className="font-semibold truncate max-w-[200px] sm:max-w-none">{pkg.towerItem.text}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 w-full">
                      {statusOptions.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => onStatusChange(team.id, pkg.towerItem.id, st.value)}
                          className={`h-7 sm:h-6 text-[10px] font-bold px-1 rounded flex items-center justify-center gap-1 border transition-all active:scale-95 ${
                            pkg.towerItem.status === st.value
                              ? `${st.badgeClass} ring-1 ring-amber-400/50 shadow-sm font-extrabold`
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                          }`}
                          title={st.label}
                        >
                          <span className="text-xs">{st.icon}</span>
                          <span className="text-[9px]">{st.shortLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. CEK EAS ROW */}
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-amber-400 font-bold shrink-0">3. CEK EAS:</span>
                        <span className="font-semibold truncate max-w-[200px] sm:max-w-none">{pkg.easItem.text}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 w-full">
                      {statusOptions.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => onStatusChange(team.id, pkg.easItem.id, st.value)}
                          className={`h-7 sm:h-6 text-[10px] font-bold px-1 rounded flex items-center justify-center gap-1 border transition-all active:scale-95 ${
                            pkg.easItem.status === st.value
                              ? `${st.badgeClass} ring-1 ring-amber-400/50 shadow-sm font-extrabold`
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                          }`}
                          title={st.label}
                        >
                          <span className="text-xs">{st.icon}</span>
                          <span className="text-[9px]">{st.shortLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NOTE ROW UNDER 3. CEK EAS */}
                  <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/90 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span className="text-amber-400 font-extrabold font-mono shrink-0">
                          *NOTE :*
                        </span>
                        {editingNotePkgId === pkg.packageId ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              value={noteInputValue}
                              onChange={(e) => setNoteInputValue(e.target.value)}
                              placeholder="Keterangan site (opsional)..."
                              className="w-full bg-slate-950 border border-amber-500/60 rounded px-2 py-1 text-xs text-white focus:outline-none font-mono"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveInlineNote(pkg.packageId);
                                } else if (e.key === 'Escape') {
                                  setEditingNotePkgId(null);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineNote(pkg.packageId)}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer"
                              title="Simpan Keterangan Note"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNotePkgId(null)}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] cursor-pointer"
                              title="Batal"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingNotePkgId(pkg.packageId);
                              setNoteInputValue(pkg.siteItem.note || pkg.note || '');
                            }}
                            className="font-mono text-xs text-slate-300 truncate cursor-pointer hover:text-amber-300 transition-colors"
                            title="Klik untuk mengisi/mengubah keterangan site"
                          >
                            {pkg.siteItem.note || pkg.note ? (
                              pkg.siteItem.note || pkg.note
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">- (klik untuk isi keterangan)</span>
                            )}
                          </span>
                        )}
                      </div>

                      {editingNotePkgId !== pkg.packageId && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotePkgId(pkg.packageId);
                              setNoteInputValue(pkg.siteItem.note || pkg.note || '');
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                            title="Edit Keterangan Site"
                          >
                            ✎ Note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ))
          )}
        </div>

        {/* Collapsible Closed Site Packages History */}
        {closedPackages.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <button
              onClick={() => setShowClosedSection(!showClosedSection)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Archive className="w-3.5 h-3.5" />
                <span>Paket Site Closed Hari Ini ({closedPackages.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span>{showClosedSection ? 'Tutup' : 'Lihat'}</span>
                {showClosedSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showClosedSection && (
              <div className="mt-2 space-y-2 pl-1">
                {closedPackages.map((cPkg, cIdx) => (
                  <div
                    key={cPkg.packageId}
                    className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="font-mono text-slate-200 line-through text-[11px] flex items-center gap-1">
                        <span className="text-slate-500">#{cIdx + 1}.</span>
                        <span className="font-bold">{cPkg.siteItem.text}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                        ✓ PM Site & Space Tower Closed
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteClosedPackage(team.id, cPkg.packageId)}
                      className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      title="Hapus Paket Site Closed ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Quick Add button at bottom */}
      <div className="mt-3 pt-2 border-t border-slate-800/60">
        <button
          onClick={() => onAddSitePackage(team.id)}
          className="w-full py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Tambah Site Baru (Site + Tower + EAS)</span>
        </button>
      </div>

    </div>
  );
};
