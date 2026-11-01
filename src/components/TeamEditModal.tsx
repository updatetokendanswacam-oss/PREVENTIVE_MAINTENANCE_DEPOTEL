import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, Users } from 'lucide-react';
import { TeamData } from '../types/reporting';

interface TeamEditModalProps {
  team: TeamData | null;
  nextTeamNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (teamData: Partial<TeamData>) => void;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  team,
  nextTeamNumber,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = !!team;
  const [name, setName] = useState(team?.name || '');
  const [phone, setPhone] = useState(team?.phone || '');
  const [teamNumber, setTeamNumber] = useState(team?.teamNumber || nextTeamNumber);

  useEffect(() => {
    setName(team?.name || '');
    setPhone(team?.phone || '');
    setTeamNumber(team?.teamNumber || nextTeamNumber);
  }, [team, nextTeamNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: team?.id,
      teamNumber,
      name: name.trim().toUpperCase(),
      phone: phone.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              {isEditing ? `Edit Team ${teamNumber}` : `Tambah Team ${nextTeamNumber}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nomor Team
            </label>
            <input
              type="number"
              min="1"
              value={teamNumber}
              onChange={(e) => setTeamNumber(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-mono font-bold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Anggota Team (Nama Personel)
            </label>
            <input
              type="text"
              placeholder="Contoh: SAMIN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nomor HP / WhatsApp
            </label>
            <input
              type="text"
              placeholder="Contoh: 082374227775"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>SIMPAN</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
