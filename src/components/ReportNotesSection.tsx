import React, { useState } from 'react';
import { FileText, Check } from 'lucide-react';

interface ReportNotesSectionProps {
  note: string;
  isAdmin: boolean;
  onSaveNote: (newNote: string) => void;
}

export const ReportNotesSection: React.FC<ReportNotesSectionProps> = ({
  note,
  isAdmin,
  onSaveNote,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteInput, setNoteInput] = useState(note);

  const handleStartEdit = () => {
    setNoteInput(note);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(noteInput);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
      
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-extrabold text-white tracking-tight">
            CATATAN LAPORAN (NOTE)
          </h3>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-all text-xs font-bold flex items-center gap-1 shadow"
            title="Edit Catatan Laporan"
          >
            <span>✎</span>
            <span className="hidden sm:inline">Edit Catatan</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Tuliskan catatan tambahan laporan di sini..."
            rows={3}
            className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-400 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>SIMPAN CATATAN</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 min-h-[50px] text-xs text-slate-300 font-mono whitespace-pre-wrap">
          {note && note.trim().length > 0 ? (
            note
          ) : (
            <span className="text-slate-500 italic">
              Tidak ada catatan tambahan. Klik ikon edit (✎) untuk menambahkan catatan.
            </span>
          )}
        </div>
      )}

    </div>
  );
};
