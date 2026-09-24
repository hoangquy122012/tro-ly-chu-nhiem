import React from 'react';
import { ShieldCheck, Sparkles, BookMarked, RotateCcw, Sliders, RefreshCw, Database } from 'lucide-react';
import { SystemProfile } from '../types';

interface HeaderProps {
  currentMonth: number;
  currentSemester: 1 | 2;
  onOpenResetModal: () => void;
  profile: SystemProfile;
  onOpenProfileSettings: () => void;
  syncStatus?: 'syncing' | 'synced' | 'error' | 'idle';
  lastSyncedTime?: string | null;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  currentSemester,
  onOpenResetModal,
  profile,
  onOpenProfileSettings,
  syncStatus = 'synced',
  lastSyncedTime,
  onManualSync,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                EduMaster AI
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Sparkles className="w-3 h-3 mr-1 text-cyan-300" /> THCS Pro
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Sổ Chủ Nhiệm THCS</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Thông tư 22/2021/TT-BGDĐT
              </span>
            </p>
          </div>
        </div>

        {/* Current Class Context & Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-cyan-300">Lớp {profile.className}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">Tháng {currentMonth}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">Học kỳ {currentSemester}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-300 truncate max-w-[130px]">{profile.teacherName}</span>
          </div>

          <button
            onClick={onOpenProfileSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold transition"
            title="Cấu hình hồ sơ trường, lớp, GVCN và mẫu soạn thảo tin nhắn Zalo"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Hồ Sơ &amp; Mẫu Tin</span>
          </button>

          <button
            onClick={onOpenResetModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
            title="Kích hoạt lệnh điều hành: Reset tháng mới, chuyển học kỳ, đính chính lỗi hoặc làm sạch năm học"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Lệnh Điều Hành / Reset</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>

        {/* Supabase Cloud Auto-Sync Status Badge */}
        <div className="flex items-center gap-2">
          {syncStatus === 'syncing' ? (
            <div
              className="flex items-center gap-2 bg-blue-950/80 border border-blue-400/50 rounded-lg px-3 py-1.5 text-xs text-blue-200 shadow-sm animate-pulse"
              title="Đang đồng bộ dữ liệu lớp học lên Supabase Cloud..."
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
              <span className="font-semibold text-cyan-300">🔄 Đang lưu lên Cloud...</span>
            </div>
          ) : syncStatus === 'error' ? (
            <div
              className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-200 shadow-sm"
              title="Lưu vào LocalStorage thành công. Lỗi kết nối Supabase Cloud."
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="font-medium text-amber-300">⚠️ Đã lưu Local</span>
              {onManualSync && (
                <button
                  onClick={onManualSync}
                  className="ml-1 text-[11px] underline text-amber-200 hover:text-white cursor-pointer"
                >
                  Thử lại
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={onManualSync}
              className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-xs text-emerald-200 shadow-sm cursor-pointer hover:bg-emerald-900/60 transition group"
              title="Cơ sở dữ liệu đám mây Supabase đã đồng bộ hoàn tất. Nhấn để đồng bộ thủ công."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-emerald-300">
                🟢 Supabase Cloud: Đã đồng bộ {lastSyncedTime ? `[${lastSyncedTime}]` : ''}
              </span>
              <RefreshCw className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition duration-300" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
