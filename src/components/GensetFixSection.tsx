import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  Circle,
  Search,
  MapPin,
  Tag,
  UserCheck,
  FileText,
  Database,
  Sparkles,
  Phone,
  CheckSquare,
  RotateCcw,
} from 'lucide-react';
import { GensetFixSite, SiteStatus, TeamData } from '../types/reporting';
import { groupSitesIntoPackages } from '../utils/packageUtils';
import { searchDepotelSites, DEPOTEL_2380_SITES_DATABASE } from '../data/depotelDatabase';

interface GensetFixSectionProps {
  sites: GensetFixSite[];
  teams?: TeamData[];
  isAdmin: boolean;
  onAddSite: (
    siteName: string,
    status: SiteStatus,
    siteId?: string,
    teamName?: string,
    technicianName?: string,
    note?: string,
    technicianPhone?: string,
    isClosed?: boolean
  ) => void;
  onEditSite: (
    siteIdKey: string,
    siteName: string,
    status: SiteStatus,
    siteId?: string,
    teamName?: string,
    technicianName?: string,
    note?: string,
    technicianPhone?: string,
    isClosed?: boolean
  ) => void;
  onDeleteSite: (siteId: string) => void;
}

interface CombinedSiteSuggestion {
  technicianName: string;
  technicianPhone?: string;
  siteId: string;
  siteName: string;
  fullText: string;
  region?: string;
  isFromLiveTeam?: boolean;
}

const KNOWN_TECH_PHONES: Record<string, string> = {
  SAMIN: '082374227775',
  'MUHAMAD JUNAEDI': '08119234976',
  'RANDI AFDIANSYAH': '08131423533',
  KOSASIH: '08119234974',
  'ROMI HENDRA GUNAWAN': '081319012052',
  'ROY ISHARRYANTO': '081286241842',
  DODI: '081283606526',
};

export const GensetFixSection: React.FC<GensetFixSectionProps> = ({
  sites,
  teams = [],
  isAdmin,
  onAddSite,
  onEditSite,
  onDeleteSite,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');

  // Form Inputs (Team Name input has been removed per user requirement)
  const [siteIdInput, setSiteIdInput] = useState('');
  const [siteNameInput, setSiteNameInput] = useState('');
  const [technicianNameInput, setTechnicianNameInput] = useState('');
  const [technicianPhoneInput, setTechnicianPhoneInput] = useState('');
  const [statusInput, setStatusInput] = useState<SiteStatus>('UNCHECKED');
  const [noteInput, setNoteInput] = useState('');

  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const statusOptions: { value: SiteStatus; label: string; icon: React.ReactNode; badgeClass: string }[] = [
    {
      value: 'DONE',
      label: 'SELESAI (CLOSED)',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      value: 'NOK',
      label: 'NOK',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400 inline mr-1" />,
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      value: 'PROGRESS',
      label: 'PROGRESS',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400 inline mr-1" />,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      value: 'NA',
      label: 'N/A',
      icon: <MinusCircle className="w-3.5 h-3.5 text-slate-400 inline mr-1" />,
      badgeClass: 'bg-slate-700/50 text-slate-300 border-slate-600',
    },
    {
      value: 'UNCHECKED',
      label: 'BELUM',
      icon: <Circle className="w-3.5 h-3.5 text-blue-400 inline mr-1" />,
      badgeClass: 'bg-blue-950/40 text-blue-300 border-blue-800/50',
    },
  ];

  // High performance site search: combines 2,380+ DEPOTEL sites DB with active report team sites
  const filteredSuggestions = useMemo(() => {
    const list: CombinedSiteSuggestion[] = [];
    const seenSiteIds = new Set<string>();

    // 1. Add active team sites first
    teams.forEach((t) => {
      const { activePackages, closedPackages } = groupSitesIntoPackages(t.sites);
      const allPackages = [...activePackages, ...closedPackages];

      allPackages.forEach((pkg) => {
        const siteItem = pkg.siteItem;
        if (!siteItem) return;
        const text = (siteItem.text || siteItem.siteName || '').trim();
        if (!text) return;

        let sId = siteItem.siteId || '';
        let sName = siteItem.siteName || text;

        if (!sId && text.includes('_')) {
          const parts = text.split('_');
          sId = parts[0];
          sName = parts.slice(1).join('_');
        } else if (!sId) {
          const match = text.match(/^([A-Z0-9]+)/i);
          if (match) sId = match[1];
        }

        const idKey = (sId || text).toUpperCase();
        seenSiteIds.add(idKey);
        list.push({
          technicianName: t.name,
          technicianPhone: t.phone,
          siteId: sId || text,
          siteName: sName || text,
          fullText: text,
          isFromLiveTeam: true,
        });
      });
    });

    // 2. Add search matches from 2,380+ Sites Database
    const dbMatches = searchDepotelSites(searchQuery, 70);
    dbMatches.forEach((entry) => {
      if (!seenSiteIds.has(entry.siteId.toUpperCase())) {
        list.push({
          technicianName: entry.technicianName || '',
          technicianPhone: entry.technicianName ? KNOWN_TECH_PHONES[entry.technicianName.toUpperCase()] : undefined,
          siteId: entry.siteId,
          siteName: entry.siteName,
          fullText: entry.fullText,
          region: entry.region,
          isFromLiveTeam: false,
        });
      }
    });

    if (!searchQuery.trim()) {
      return list.slice(0, 60);
    }

    const q = searchQuery.toLowerCase().trim();
    return list
      .filter(
        (s) =>
          s.siteId.toLowerCase().includes(q) ||
          s.siteName.toLowerCase().includes(q) ||
          s.fullText.toLowerCase().includes(q) ||
          s.technicianName.toLowerCase().includes(q) ||
          (s.region && s.region.toLowerCase().includes(q))
      )
      .slice(0, 60);
  }, [teams, searchQuery]);

  // Handle outside click to close auto-suggest dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartAdd = () => {
    setSiteIdInput('');
    setSiteNameInput('');
    setTechnicianNameInput('');
    setTechnicianPhoneInput('');
    setStatusInput('UNCHECKED');
    setNoteInput('');
    setSearchQuery('');
    setIsAdding(true);
    setEditingSiteId(null);
  };

  const handleStartEdit = (site: GensetFixSite) => {
    setSiteIdInput(site.siteId || '');
    setSiteNameInput(site.siteName || '');
    setTechnicianNameInput(site.technicianName || '');
    setTechnicianPhoneInput(
      site.technicianPhone ||
        (site.technicianName ? KNOWN_TECH_PHONES[site.technicianName.toUpperCase()] : '') ||
        ''
    );
    setStatusInput(site.status);
    setNoteInput(site.note || '');
    setSearchQuery(site.siteName || '');
    setEditingSiteId(site.id);
    setIsAdding(false);
  };

  const handleSelectSuggestion = (suggestion: CombinedSiteSuggestion) => {
    if (suggestion.technicianName) {
      setTechnicianNameInput(suggestion.technicianName);
      const matchedPhone =
        suggestion.technicianPhone || KNOWN_TECH_PHONES[suggestion.technicianName.toUpperCase()] || '';
      if (matchedPhone) setTechnicianPhoneInput(matchedPhone);
    }
    setSiteIdInput(suggestion.siteId);
    setSiteNameInput(suggestion.fullText);
    setSearchQuery(suggestion.fullText);
    setShowSuggestions(false);
  };

  const handleTechNameChange = (val: string) => {
    setTechnicianNameInput(val);
    const upper = val.toUpperCase().trim();
    if (KNOWN_TECH_PHONES[upper]) {
      setTechnicianPhoneInput(KNOWN_TECH_PHONES[upper]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSiteName = siteNameInput.trim() || searchQuery.trim();
    if (!finalSiteName) return;

    const isClosed = statusInput === 'DONE';

    if (isAdding) {
      onAddSite(
        finalSiteName,
        statusInput,
        siteIdInput.trim() || undefined,
        undefined, // teamName removed
        technicianNameInput.trim() || undefined,
        noteInput.trim() || undefined,
        technicianPhoneInput.trim() || undefined,
        isClosed
      );
    } else if (editingSiteId) {
      onEditSite(
        editingSiteId,
        finalSiteName,
        statusInput,
        siteIdInput.trim() || undefined,
        undefined, // teamName removed
        technicianNameInput.trim() || undefined,
        noteInput.trim() || undefined,
        technicianPhoneInput.trim() || undefined,
        isClosed
      );
    }

    setIsAdding(false);
    setEditingSiteId(null);
    setSearchQuery('');
    setSiteIdInput('');
    setSiteNameInput('');
    setTechnicianNameInput('');
    setTechnicianPhoneInput('');
    setNoteInput('');
  };

  // Group sites into Active vs Closed Sites
  const activeGensetSites = useMemo(() => {
    return sites.filter((s) => s.status !== 'DONE' && !s.isClosed);
  }, [sites]);

  const closedGensetSites = useMemo(() => {
    return sites.filter((s) => s.status === 'DONE' || s.isClosed);
  }, [sites]);

  const handleToggleCloseSite = (site: GensetFixSite) => {
    const nextClosed = !(site.status === 'DONE' || site.isClosed);
    const nextStatus: SiteStatus = nextClosed ? 'DONE' : 'PROGRESS';
    onEditSite(
      site.id,
      site.siteName,
      nextStatus,
      site.siteId,
      site.teamName,
      site.technicianName,
      site.note,
      site.technicianPhone,
      nextClosed
    );
  };

  const displayList = activeTab === 'ACTIVE' ? activeGensetSites : closedGensetSites;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span>BAGIAN E</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[10px] text-amber-300 border border-amber-500/40 font-mono">
                2.380+ Sites Auto-Search
              </span>
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight">PM GENSET FIX</h3>
          </div>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Site Genset</span>
        </button>
      </div>

      {/* Active vs Closed Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Site Genset Aktif ({activeGensetSites.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CLOSED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'CLOSED'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Closed / Selesai ({closedGensetSites.length})</span>
        </button>
      </div>

      {/* Form Adding/Editing with Interactive Auto-Suggest */}
      {(isAdding || editingSiteId) && (
        <form
          onSubmit={handleSave}
          className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              {isAdding ? 'Tambah Site Genset Fix Baru' : 'Edit Site Genset Fix'}
            </span>
            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              <Database className="w-3 h-3 text-amber-400" />
              <span>Database Terintegrasi (2.380+ Site DEPOTEL)</span>
            </span>
          </div>

          {/* Site Auto-Suggest Search Input */}
          <div ref={searchRef} className="relative">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Ketik Site ID / Nama Site (Pencarian Otomatis 2.380+ Sites)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Instant Auto-Suggest</span>
              </span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="Ketik Site ID (contoh: JKT333, JKS048, EPE103, DODI)..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSiteNameInput(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 font-mono focus:outline-none pl-9 shadow-inner"
              />
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
            </div>

            {/* Auto-suggest dropdown menu */}
            {showSuggestions && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-slate-900 border border-amber-500/60 rounded-xl shadow-2xl divide-y divide-slate-800 text-xs">
                <div className="p-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                  <span className="text-[10px] font-bold text-amber-300 font-mono flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-400" />
                    <span>Daftar Site DEPOTEL ({DEPOTEL_2380_SITES_DATABASE.length.toLocaleString('id-ID')} Total Sites)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Menampilkan {filteredSuggestions.length} site cocok
                  </span>
                </div>

                {filteredSuggestions.length === 0 ? (
                  <div className="p-4 text-slate-400 italic text-center text-[11px]">
                    Tidak ada Site ID / Nama Site yang cocok. Anda dapat mengisinya secara manual di bawah.
                  </div>
                ) : (
                  filteredSuggestions.map((s, idx) => (
                    <button
                      key={`${s.siteId}-${idx}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-3.5 py-2 text-left hover:bg-amber-500/20 text-slate-200 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white group-hover:text-amber-200">
                          {s.fullText}
                        </span>
                        {s.region && (
                          <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {s.region}
                          </span>
                        )}
                      </div>
                      {s.technicianName && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.technicianName}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Detailed Editable Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Site ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Site ID</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: JKT333"
                value={siteIdInput}
                onChange={(e) => setSiteIdInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 font-mono focus:outline-none"
              />
            </div>

            {/* Site Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Nama Site (Lengkap) *</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: JKT333_GANGBAING"
                value={siteNameInput}
                onChange={(e) => setSiteNameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 font-mono focus:outline-none"
                required
              />
            </div>

            {/* Nama Teknisi */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-400" />
                <span>Nama Teknisi (DODI, SAMIN, dll) *</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: DODI"
                value={technicianNameInput}
                onChange={(e) => handleTechNameChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 font-mono focus:outline-none"
                required
              />
            </div>

            {/* Nomor HP Teknisi */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Nomor HP Teknisi (Muncul di WhatsApp)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 081283606526"
                value={technicianPhoneInput}
                onChange={(e) => setTechnicianPhoneInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Status Pekerjaan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Status Pekerjaan Genset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((st) => (
                <button
                  type="button"
                  key={st.value}
                  onClick={() => setStatusInput(st.value)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 cursor-pointer ${
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

          {/* Keterangan / Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>Keterangan :</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Perbaikan modul ATS Genset selesai"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 font-mono focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingSiteId(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-400 shadow-lg cursor-pointer"
            >
              SIMPAN
            </button>
          </div>
        </form>
      )}

      {/* Genset Fix Sites List Display */}
      <div className="space-y-2.5">
        {displayList.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/60">
            {activeTab === 'ACTIVE'
              ? 'Belum ada site PM Genset Fix yang aktif. Klik "Tambah Site Genset" di atas.'
              : 'Belum ada site PM Genset Fix yang Closed/Selesai.'}
          </div>
        ) : (
          displayList.map((site, index) => {
            const currentStatus = statusOptions.find((s) => s.value === site.status) || statusOptions[4];
            const techPhone =
              site.technicianPhone ||
              (site.technicianName ? KNOWN_TECH_PHONES[site.technicianName.toUpperCase()] : '');
            const isClosed = site.status === 'DONE' || site.isClosed;

            return (
              <div
                key={site.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  isClosed
                    ? 'bg-slate-950/50 border-emerald-500/30'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {/* Technician Name & Phone Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-amber-300 font-mono flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {index + 1}. {(site.technicianName || 'TEKNISI').toUpperCase()}{' '}
                          {techPhone ? `(${techPhone})` : ''}
                        </span>
                      </span>

                      {site.siteId && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                          ID: {site.siteId}
                        </span>
                      )}

                      {isClosed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                          ✓ CLOSED
                        </span>
                      )}
                    </div>

                    {/* Site Line */}
                    <div className="text-xs font-bold text-white font-mono tracking-wide pl-2 border-l-2 border-amber-500/50 my-1">
                      • {site.siteName} {currentStatus.icon}
                    </div>

                    {/* Keterangan Line */}
                    <div className="text-[11px] text-slate-300 font-mono pl-2">
                      <span className="font-semibold text-slate-400">Keterangan :</span>{' '}
                      <span className="text-amber-200">{site.note || '-'}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Close / Reopen Toggle */}
                    <button
                      onClick={() => handleToggleCloseSite(site)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                        isClosed
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      }`}
                      title={isClosed ? 'Buka Kembali Site ke Aktif' : 'Tutup Site Ini (Closed)'}
                    >
                      {isClosed ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Reopen</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Closed</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleStartEdit(site)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-colors cursor-pointer"
                      title="Edit Site Genset"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteSite(site.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors cursor-pointer"
                      title="Hapus Site Genset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
