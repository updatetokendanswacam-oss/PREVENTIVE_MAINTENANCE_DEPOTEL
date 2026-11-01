import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Send,
  BookmarkCheck,
  Check,
  Share2,
  Eye,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { DailyReportData } from '../types/reporting';
import { generateWhatsAppReport } from '../utils/reportGenerator';

interface ReportPreviewModalProps {
  reportData: DailyReportData;
  isOpen: boolean;
  onClose: () => void;
  onSaveToHistory: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveCustomReport?: (customText: string) => Promise<void> | void;
  onResetCustomReport?: () => Promise<void> | void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  reportData,
  isOpen,
  onClose,
  onSaveToHistory,
  onShowToast,
  onSaveCustomReport,
  onResetCustomReport,
}) => {
  if (!isOpen) return null;

  const storageKey = `depotel_custom_wa_${reportData.id}`;

  // Helper to determine initial text
  const getInitialText = () => {
    if (reportData.customWhatsAppReport && reportData.customWhatsAppReport.trim().length > 0) {
      return reportData.customWhatsAppReport;
    }
    const savedLocal = localStorage.getItem(storageKey);
    if (savedLocal && savedLocal.trim().length > 0) {
      return savedLocal;
    }
    return generateWhatsAppReport(reportData);
  };

  const isInitiallyCustom = Boolean(
    (reportData.customWhatsAppReport && reportData.customWhatsAppReport.trim().length > 0) ||
      localStorage.getItem(storageKey)
  );

  const [currentText, setCurrentText] = useState<string>(getInitialText);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftText, setDraftText] = useState<string>(getInitialText);
  const [hasCustomSaved, setHasCustomSaved] = useState<boolean>(isInitiallyCustom);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state whenever modal opens or reportData changes
  useEffect(() => {
    const text = getInitialText();
    setCurrentText(text);
    setDraftText(text);
    setHasCustomSaved(
      Boolean(
        (reportData.customWhatsAppReport && reportData.customWhatsAppReport.trim().length > 0) ||
          localStorage.getItem(storageKey)
      )
    );
    setIsEditing(false);
  }, [isOpen, reportData.id, reportData.customWhatsAppReport]);

  const handleStartEdit = () => {
    setDraftText(currentText);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftText(currentText);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const textToSave = draftText.trim();
    if (!textToSave) {
      onShowToast('Teks laporan tidak boleh kosong!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save to localStorage permanently
      localStorage.setItem(storageKey, textToSave);

      // 2. Update state
      setCurrentText(textToSave);
      setHasCustomSaved(true);
      setIsEditing(false);

      // 3. Persist to server / app state
      if (onSaveCustomReport) {
        await onSaveCustomReport(textToSave);
      }

      onShowToast('Teks laporan WhatsApp berhasil disimpan permanen!', 'success');
    } catch (err) {
      console.error('Failed to save custom report text', err);
      onShowToast('Gagal menyimpan teks, tersimpan secara lokal di perangkat.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToAuto = async () => {
    try {
      localStorage.removeItem(storageKey);
      const generated = generateWhatsAppReport(reportData);
      setCurrentText(generated);
      setDraftText(generated);
      setHasCustomSaved(false);
      setIsEditing(false);

      if (onResetCustomReport) {
        await onResetCustomReport();
      }

      onShowToast('Format dikembalikan ke hasil otomatis data terbaru!', 'info');
    } catch (err) {
      console.error(err);
      onShowToast('Format otomatis dimuat ulang.', 'info');
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? draftText : currentText;
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setCopied(true);
        onShowToast('Laporan berhasil disalin ke clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        onShowToast('Gagal menyalin laporan, silakan coba lagi', 'error');
      }
    );
  };

  const handleSaveSnapshot = () => {
    onSaveToHistory();
    onShowToast('Laporan berhasil disimpan ke Riwayat!', 'success');
  };

  const activeText = isEditing ? draftText : currentText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  Preview Laporan WhatsApp
                </h3>
                {hasCustomSaved ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Kustom (Tersimpan Permanen)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Format Otomatis
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {isEditing
                  ? 'Mode Edit: Ubah isi laporan langsung & simpan secara permanen'
                  : 'Siap dikirim ke grup WhatsApp DEPOTEL'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                title="Edit teks laporan WhatsApp"
                aria-label="Edit teks laporan WhatsApp"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Edit Laporan</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar when in Edit Mode or when Custom text is active */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs gap-2 flex-wrap">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <Pencil className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Sedang mengedit teks laporan</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {draftText.length} karakter ({draftText.split('\n').length} baris)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Permanen'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-300">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">FORMAT PESAN WHATSAPP</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {currentText.length} karakter ({currentText.split('\n').length} baris)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasCustomSaved && (
                  <button
                    type="button"
                    onClick={handleResetToAuto}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                    title="Reset teks kustom kembali ke format otomatis dari data live"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Reset ke Otomatis</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-amber-500/30"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Teks</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* WhatsApp Chat-like Monospace Container / Editable Area */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-[#0a101d]">
          {isEditing ? (
            <div className="flex flex-col h-full space-y-2">
              <div className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Tips:</strong> Anda dapat mengedit baris mana saja sesuai kebutuhan. Setelah disimpan, laporan ini akan <strong>tersimpan permanen</strong> dan tidak akan kembali ke semula saat dibuka lagi.
                </span>
              </div>

              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Tuliskan isi laporan WhatsApp di sini..."
                rows={16}
                className="w-full h-full min-h-[320px] bg-[#070e1a] text-slate-100 font-mono text-xs sm:text-sm p-3.5 sm:p-4 rounded-xl border-2 border-amber-500/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 outline-none leading-relaxed tracking-wide resize-y shadow-inner selection:bg-amber-500/30"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="bg-[#0f1d2a] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-inner relative group">
              <button
                type="button"
                onClick={handleStartEdit}
                className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-opacity opacity-70 group-hover:opacity-100 border border-slate-700 cursor-pointer"
                title="Klik untuk mengedit laporan"
              >
                <Pencil className="w-3 h-3 text-amber-400" />
                <span>Edit</span>
              </button>

              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-slate-100 leading-relaxed tracking-wide select-all overflow-x-auto pr-16">
                {currentText}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          <button
            type="button"
            onClick={handleSaveSnapshot}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>Simpan ke Riwayat</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* SALIN LAPORAN */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">TERSALIN!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>SALIN LAPORAN</span>
                </>
              )}
            </button>

            {/* KIRIM KE WHATSAPP */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(activeText)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShowToast('Membuka WhatsApp...', 'info')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>KIRIM KE WHATSAPP</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
