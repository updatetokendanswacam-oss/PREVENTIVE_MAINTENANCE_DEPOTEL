import React from 'react';
import { Target, CheckCircle, Clock, AlertTriangle, Users, Layers, Award, Pencil, CheckCircle2, XCircle } from 'lucide-react';
import { JobCategory, TeamData } from '../types/reporting';

interface SummaryCardsProps {
  categories: JobCategory[];
  teams: TeamData[];
  isAdmin: boolean;
  onEditCategory: (category: JobCategory) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  categories,
  teams,
  isAdmin,
  onEditCategory,
}) => {
  // Aggregate Metrics
  const totalTarget = categories.reduce((sum, c) => sum + c.target, 0);
  const totalAchievement = categories.reduce((sum, c) => sum + c.achievement, 0);
  const totalRemaining = categories.reduce((sum, c) => sum + c.remaining, 0);
  const totalPercentage =
    totalTarget > 0 ? Math.round((totalAchievement / totalTarget) * 100) : 100;

  // Site Status Metrics
  let doneCount = 0;
  let nokCount = 0;
  let progressCount = 0;
  let uncheckedCount = 0;

  teams.forEach((t) => {
    t.sites.forEach((s) => {
      if (s.isClosed || s.status === 'DONE' || s.text.includes('✅')) doneCount++;
      else if (s.status === 'NOK' || s.text.includes('❌')) nokCount++;
      else if (s.status === 'PROGRESS' || s.text.includes('⏳')) progressCount++;
      else uncheckedCount++;
    });
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Global Overview Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Target Card */}
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Target</span>
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalTarget}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Semua Pekerjaan</div>
          </div>
        </div>

        {/* Total Achievement Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pencapaian</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">{totalAchievement}</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Tercapai Selesai</div>
          </div>
        </div>

        {/* Total Remaining Card */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sisa Pekerjaan</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono">{totalRemaining}</div>
            <div className="text-[11px] text-rose-400/80 mt-0.5">Belum Selesai</div>
          </div>
        </div>

        {/* Total Percentage Card */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-yellow-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Persentase</span>
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">{totalPercentage}%</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, totalPercentage))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Teams Card */}
        <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Bertugas</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-300 font-mono">{teams.length}</div>
            <div className="text-[11px] text-blue-400/80 mt-0.5">Tim Lapangan</div>
          </div>
        </div>

        {/* Site Status Counter */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Site</span>
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done:
              </span>
              <span className="font-bold text-white">{doneCount}</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> NOK:
              </span>
              <span className="font-bold text-white">{nokCount}</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Progress:
              </span>
              <span className="font-bold text-white">{progressCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Main Job Categories Section (A, B, C) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            DATA LAPORAN UTAMA
          </h2>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span>Tekan ikon edit</span>
            <Pencil className="w-3 h-3 text-amber-400 inline" />
            <span>untuk mengubah target</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C
            return (
              <div
                key={cat.id}
                className="relative bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-amber-500/40 transition-all group overflow-hidden"
              >
                {/* Header title */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <span className="text-xs font-extrabold text-amber-400 font-mono tracking-wider">
                      BAGIAN {letter}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5 tracking-tight">
                      {cat.title}
                    </h3>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-all shadow"
                      title={`Edit ${cat.title}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Values Display */}
                <div className="grid grid-cols-4 gap-2 pt-4 text-center">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[11px] font-semibold text-slate-400">Target</span>
                    <span className="text-lg font-bold text-white font-mono">{cat.target}</span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-950/50">
                    <span className="block text-[11px] font-semibold text-emerald-400">Achieve</span>
                    <span className="text-lg font-bold text-emerald-300 font-mono">{cat.achievement}</span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-rose-950/50">
                    <span className="block text-[11px] font-semibold text-rose-400">Remain</span>
                    <span className="text-lg font-bold text-rose-300 font-mono">{cat.remaining}</span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-950/50">
                    <span className="block text-[11px] font-semibold text-amber-400">%</span>
                    <span className="text-lg font-bold text-amber-300 font-mono">{cat.percentage}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress Pencapaian</span>
                    <span className="font-mono text-amber-400 font-semibold">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
