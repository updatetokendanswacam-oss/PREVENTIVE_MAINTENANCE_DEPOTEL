import React, { useState, useEffect } from 'react';
import { X, Check, Calculator } from 'lucide-react';
import { JobCategory } from '../types/reporting';

interface CategoryEditModalProps {
  category: JobCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCategory: JobCategory) => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  category,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !category) return null;

  const [title, setTitle] = useState(category.title);
  const [target, setTarget] = useState(category.target);
  const [achievement, setAchievement] = useState(category.achievement);
  const [remaining, setRemaining] = useState(category.remaining);
  const [percentage, setPercentage] = useState(category.percentage);
  const [autoCalc, setAutoCalc] = useState(true);

  useEffect(() => {
    setTitle(category.title);
    setTarget(category.target);
    setAchievement(category.achievement);
    setRemaining(category.remaining);
    setPercentage(category.percentage);
    setAutoCalc(true);
  }, [category]);

  const handleTargetChange = (val: number) => {
    const newTarget = Math.max(0, val);
    setTarget(newTarget);

    if (autoCalc) {
      const newRem = Math.max(0, newTarget - achievement);
      setRemaining(newRem);
      const newPct =
        newTarget === 0 ? 100 : Math.round((achievement / newTarget) * 100);
      setPercentage(newPct);
    }
  };

  const handleAchievementChange = (val: number) => {
    const newAch = Math.max(0, val);
    setAchievement(newAch);

    if (autoCalc) {
      const newRem = Math.max(0, target - newAch);
      setRemaining(newRem);
      const newPct =
        target === 0 ? 100 : Math.round((newAch / target) * 100);
      setPercentage(newPct);
    }
  };

  const handleRecalculate = () => {
    const newRem = Math.max(0, target - achievement);
    setRemaining(newRem);
    const newPct = target === 0 ? 100 : Math.round((achievement / target) * 100);
    setPercentage(newPct);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...category,
      title,
      target,
      achievement,
      remaining,
      percentage,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg">✎</span>
            <h3 className="text-lg font-bold text-white">Edit Data Laporan Utama</h3>
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
              Nama Kelompok Pekerjaan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-400" />
              Hitung Otomatis (Remaining & %):
            </span>
            <button
              type="button"
              onClick={() => {
                setAutoCalc(!autoCalc);
                if (!autoCalc) handleRecalculate();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                autoCalc
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              {autoCalc ? 'ON' : 'OFF (Manual)'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Pekerjaan
              </label>
              <input
                type="number"
                min="0"
                value={target}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Achievement (Pencapaian)
              </label>
              <input
                type="number"
                min="0"
                value={achievement}
                onChange={(e) => handleAchievementChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-emerald-900 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Remaining (Sisa)
              </label>
              <input
                type="number"
                min="0"
                value={remaining}
                onChange={(e) => {
                  setRemaining(Number(e.target.value));
                  setAutoCalc(false);
                }}
                className="w-full bg-slate-950 border border-rose-900 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-rose-300 font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Persentase (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => {
                  setPercentage(Number(e.target.value));
                  setAutoCalc(false);
                }}
                className="w-full bg-slate-950 border border-amber-900 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
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
