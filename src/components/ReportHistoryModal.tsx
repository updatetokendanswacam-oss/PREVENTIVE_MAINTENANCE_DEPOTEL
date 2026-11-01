import React, { useState, useEffect } from 'react';
import { X, History, Calendar, Trash2, Send, RotateCcw, Copy, Check, Search } from 'lucide-react';
import { DailyReportData } from '../types/reporting';
import { fetchReportHistory, deleteReportHistory } from '../services/api';
import { generateWhatsAppReport } from '../utils/reportGenerator';

interface ReportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReport: (report: DailyReportData) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadReport,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [historyList, setHistoryList] = useState<DailyReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchReportHistory();
    setHistoryList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [isOpen]);

  const handleDelete = async (id: string, dateStr: string) => {
    if (confirm(`Hapus laporan riwayat tanggal ${dateStr}?`)) {
      await deleteReportHistory(id);
      onShowToast(`Laporan ${dateStr} berhasil dihapus dari riwayat`, 'success');
      loadHistory();
      if (selectedReport?.id === id) setSelectedReport(null);
    }
  };

  const handleCopyHistoryWA = (report: DailyReportData) => {
    const text = report.customWhatsAppReport || generateWhatsAppReport(report);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(report.id);
      onShowToast('Laporan tersalin ke clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSendHistoryWA = (report: DailyReportData) => {
    const text = report.customWhatsAppReport || generateWhatsAppReport(report);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const filteredList = historyList.filter(
    (item) =>
      item.dateInfo.formatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dateInfo.isoDate.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Riwayat Laporan Harian</h3>
              <p className="text-xs text-slate-400">Arsip laporan DEPOTEL berdasarkan tanggal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari berdasarkan tanggal (misal: 31/10/2026 atau SAT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Memuat riwayat laporan...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Belum ada riwayat laporan tersimpan. Laporan baru akan otomatis masuk ke riwayat saat dikirim atau disimpan.
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white font-mono">
                      {item.dateInfo.formatted}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3 font-mono">
                    <span>Teams: {item.teams.length}</span>
                    <span>•</span>
                    <span>Genset Fix: {item.gensetFixSites.length} site</span>
                    <span>•</span>
                    <span className="text-slate-500">
                      Disimpan: {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      onLoadReport(item);
                      onClose();
                      onShowToast(`Laporan ${item.dateInfo.formatted} dimuat ke Dashboard!`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1 transition-all"
                    title="Buka di Dashboard"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Buka</span>
                  </button>

                  <button
                    onClick={() => handleCopyHistoryWA(item)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                    title="Salin WA"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  </button>

                  <button
                    onClick={() => handleSendHistoryWA(item)}
                    className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-all"
                    title="Kirim Ke WA"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.dateInfo.formatted)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-all"
                    title="Hapus dari Riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
