import React, { useState, useEffect } from 'react';
import { X, Check, Building2, Search, Sparkles, CheckCircle2, XCircle, Clock, MinusCircle, Circle } from 'lucide-react';
import { SitePackage, SiteStatus } from '../types/reporting';
import { searchMasterSites, MasterSite } from '../services/siteDatabase';

interface SiteEditModalProps {
  sitePackage: SitePackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (packageData: {
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
  }) => void;
}

export const SiteEditModal: React.FC<SiteEditModalProps> = ({
  sitePackage,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = !!sitePackage;
  const [siteIdInput, setSiteIdInput] = useState(sitePackage?.siteItem?.siteId || '');
  const [siteNameInput, setSiteNameInput] = useState(
    sitePackage?.siteItem?.siteName || sitePackage?.siteItem?.text || ''
  );
  const [siteStatus, setSiteStatus] = useState<SiteStatus>(
    sitePackage?.siteItem?.status || 'DONE'
  );
  const [towerText, setTowerText] = useState(
    sitePackage?.towerItem?.text || 'Tower space'
  );
  const [towerStatus, setTowerStatus] = useState<SiteStatus>(
    sitePackage?.towerItem?.status || 'DONE'
  );
  const [easText, setEasText] = useState(
    sitePackage?.easItem?.text || 'EAS OK'
  );
  const [easStatus, setEasStatus] = useState<SiteStatus>(
    sitePackage?.easItem?.status || 'DONE'
  );
  const [noteInput, setNoteInput] = useState(
    sitePackage?.siteItem?.note || sitePackage?.note || ''
  );
  const [lat, setLat] = useState<number | undefined>(sitePackage?.siteItem?.lat);
  const [lng, setLng] = useState<number | undefined>(sitePackage?.siteItem?.lng);

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<MasterSite[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let defaultSiteId = sitePackage?.siteItem?.siteId || '';
    let defaultSiteName = sitePackage?.siteItem?.siteName || sitePackage?.siteItem?.text || '';

    if (!defaultSiteId && sitePackage?.siteItem?.text) {
      if (sitePackage.siteItem.text.includes('_')) {
        const parts = sitePackage.siteItem.text.split('_');
        defaultSiteId = parts[0];
        defaultSiteName = parts.slice(1).join('_');
      } else if (sitePackage.siteItem.text.includes(' - ')) {
        const parts = sitePackage.siteItem.text.split(' - ');
        defaultSiteId = parts[0];
        defaultSiteName = parts.slice(1).join(' - ');
      }
    }

    setSiteIdInput(defaultSiteId);
    setSiteNameInput(defaultSiteName);
    setSiteStatus(sitePackage?.siteItem?.status || 'DONE');
    setTowerText(sitePackage?.towerItem?.text || 'Tower space');
    setTowerStatus(sitePackage?.towerItem?.status || 'DONE');
    setEasText(sitePackage?.easItem?.text || 'EAS OK');
    setEasStatus(sitePackage?.easItem?.status || 'DONE');
    setNoteInput(sitePackage?.siteItem?.note || sitePackage?.note || '');
    setLat(sitePackage?.siteItem?.lat);
    setLng(sitePackage?.siteItem?.lng);
  }, [sitePackage]);

  // Handle live search suggestions as user types
  const handleSiteIdChange = async (val: string) => {
    setSiteIdInput(val);
    if (val.trim().length >= 1) {
      const results = await searchMasterSites(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSiteNameChange = async (val: string) => {
    setSiteNameInput(val);
    if (val.trim().length >= 1) {
      const results = await searchMasterSites(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (master: MasterSite) => {
    setSiteIdInput(master.siteId);
    setSiteNameInput(master.siteName);
    setLat(master.lat);
    setLng(master.lng);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = siteIdInput.trim().toUpperCase();
    const cleanName = siteNameInput.trim().toUpperCase();

    if (!cleanId && !cleanName) return;

    let siteText = cleanName;
    if (cleanId && cleanName) {
      siteText = `${cleanId}_${cleanName}`;
    } else if (cleanId) {
      siteText = cleanId;
    }

    onSave({
      packageId: sitePackage?.packageId,
      siteId: cleanId,
      siteName: cleanName || cleanId,
      siteText,
      siteStatus,
      towerText: towerText.trim() || 'Tower space',
      towerStatus,
      easText: easText.trim() || 'EAS OK',
      easStatus,
      note: noteInput.trim(),
      lat,
      lng,
    });
    onClose();
  };

  const statusOptions: { value: SiteStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'DONE', label: 'SELESAI / DONE', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" /> },
    { value: 'NOK', label: 'NOK', icon: <XCircle className="w-3.5 h-3.5 text-rose-400 inline mr-1" /> },
    { value: 'PROGRESS', label: 'ON PROGRESS', icon: <Clock className="w-3.5 h-3.5 text-amber-400 inline mr-1" /> },
    { value: 'NA', label: 'N/A', icon: <MinusCircle className="w-3.5 h-3.5 text-slate-400 inline mr-1" /> },
    { value: 'UNCHECKED', label: 'Belum Diperiksa', icon: <Circle className="w-3.5 h-3.5 text-blue-400 inline mr-1" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isEditing ? 'Edit Paket Site (Site, Tower & EAS)' : 'Tambah Paket Site Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">1 Paket lengkap: Site, Tower Space, dan Cek EAS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* SECTION 1: SITE ID & SITE NAME */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider block">
              1. IDENTITAS SITE
            </span>

            {/* Site ID with Autocomplete */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Site ID
                </label>
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-search 2.380+ Sites
                </span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Contoh: JKT533, BKS010, JKS048"
                  value={siteIdInput}
                  onChange={(e) => handleSiteIdChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono uppercase focus:outline-none"
                />
              </div>
            </div>

            {/* Name Site */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Name Site
              </label>
              <input
                type="text"
                placeholder="Contoh: MSCBUARAN, JATIBENING"
                value={siteNameInput}
                onChange={(e) => handleSiteNameChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono uppercase focus:outline-none"
                required
              />
            </div>

            {/* Autocomplete Dropdown List */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl max-h-40 overflow-y-auto p-1 space-y-1 z-20">
                <div className="text-[10px] font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded">
                  Pilih Site dari Database:
                </div>
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={`${s.siteId}-${s.siteName}`}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-amber-300 font-mono">{s.siteId}</span>
                      <span className="text-white ml-2 font-mono">{s.siteName}</span>
                      {(s.nop || s.subdistrict || s.city) && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {s.nop || `${s.subdistrict || ''} ${s.city || ''}`}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      ✓ Google Sheet
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Site Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Status Pekerjaan Site (PM Site):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((st) => (
                  <button
                    type="button"
                    key={st.value}
                    onClick={() => setSiteStatus(st.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 ${
                      siteStatus === st.value
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION 2: TOWER SPACE */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider block">
                2. TOWER SPACE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Otomatis Space Tower</span>
            </div>

            <input
              type="text"
              value={towerText}
              onChange={(e) => setTowerText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {statusOptions.map((st) => (
                <button
                  type="button"
                  key={st.value}
                  onClick={() => setTowerStatus(st.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 ${
                    towerStatus === st.value
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{st.icon}</span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: CEK EAS */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider block">
              3. CEK EAS
            </span>

            <input
              type="text"
              value={easText}
              onChange={(e) => setEasText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {statusOptions.map((st) => (
                <button
                  type="button"
                  key={st.value}
                  onClick={() => setEasStatus(st.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 ${
                    easStatus === st.value
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{st.icon}</span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: NOTE / KETERANGAN SITE */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider block">
                *NOTE :* KETERANGAN SITE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tampil di update WhatsApp</span>
            </div>
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Contoh: Modul EAS diganti, tower aman, site normal (atau isi -)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>SIMPAN PAKET SITE</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
