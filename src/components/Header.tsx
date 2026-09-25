import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  BookMarked,
  RotateCcw,
  Sliders,
  RefreshCw,
  Key,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { SystemProfile } from '../types';

interface HeaderProps {
  currentMonth: number;
  currentSemester: 1 | 2;
  activeWeek?: number;
  timeScopeValue?: string;
  onChangeTimeScope?: (scope: string) => void;
  onSelectWeek?: (week: number) => void;
  onOpenResetModal: () => void;
  profile: SystemProfile;
  onOpenProfileSettings: () => void;
  syncStatus?: 'syncing' | 'synced' | 'error' | 'idle';
  lastSyncedTime?: string | null;
  onManualSync?: () => void;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  currentSemester,
  activeWeek = 3,
  timeScopeValue,
  onChangeTimeScope,
  onSelectWeek,
  onOpenResetModal,
  profile,
  onOpenProfileSettings,
  syncStatus = 'synced',
  lastSyncedTime,
  onManualSync,
  hasApiKey = false,
  onOpenApiKeyModal,
}) => {
  const currentScope = timeScopeValue || `week-${activeWeek}`;

  const parseCurrentWeekNumber = (): number => {
    if (currentScope.startsWith('week-')) {
      return parseInt(currentScope.replace('week-', ''), 10) || activeWeek;
    }
    return activeWeek;
  };

  const currentWeekNum = parseCurrentWeekNumber();

  const handlePrevWeek = () => {
    if (currentScope.startsWith('week-')) {
      if (currentWeekNum > 1) {
        const nextW = currentWeekNum - 1;
        if (onChangeTimeScope) {
          onChangeTimeScope(`week-${nextW}`);
        } else if (onSelectWeek) {
          onSelectWeek(nextW);
        }
      }
    } else {
      // If currently in month/semester/year, jump back to week mode at activeWeek or week 1
      const targetW = Math.max(1, currentWeekNum - 1);
      if (onChangeTimeScope) {
        onChangeTimeScope(`week-${targetW}`);
      } else if (onSelectWeek) {
        onSelectWeek(targetW);
      }
    }
  };

  const handleNextWeek = () => {
    if (currentScope.startsWith('week-')) {
      if (currentWeekNum < 35) {
        const nextW = currentWeekNum + 1;
        if (onChangeTimeScope) {
          onChangeTimeScope(`week-${nextW}`);
        } else if (onSelectWeek) {
          onSelectWeek(nextW);
        }
      }
    } else {
      const targetW = Math.min(35, currentWeekNum + 1);
      if (onChangeTimeScope) {
        onChangeTimeScope(`week-${targetW}`);
      } else if (onSelectWeek) {
        onSelectWeek(targetW);
      }
    }
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* =========================================================================
            GÓC TRÁI: LOGO & HUY HIỆU PHIÊN BẢN TRỢ LÝ CHỦ NHIỆM THCS
            ========================================================================= */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                EduMaster AI
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3 h-3 mr-1 text-cyan-300" /> Trợ Lý Chủ Nhiệm THCS
              </span>
            </div>
            <p className="hidden sm:flex text-[11px] text-slate-400 items-center gap-1.5 mt-0.5">
              <span>Sổ Công Tác Chủ Nhiệm</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Thông tư 22/2021
              </span>
            </p>
          </div>
        </div>

        {/* =========================================================================
            TRUNG TÂM: BỘ CHỌN NHANH TRỰC QUAN (LỚP & TUẦN HỌC 1-35)
            ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-800/80 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
          {/* Huy hiệu Lớp Chủ Nhiệm Cố Định */}
          <button
            type="button"
            onClick={onOpenProfileSettings}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-700/80 hover:border-cyan-500/50 text-xs transition cursor-pointer group shadow-xs"
            title="Lớp chủ nhiệm (Bấm vào đây để mở nhanh Hồ Sơ &amp; Cấu Hình Lớp)"
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
            <span className="text-slate-300 font-semibold hidden md:inline">Lớp:</span>
            <span className="text-cyan-300 font-extrabold tracking-wide">
              {profile.className.startsWith('Lớp') ? profile.className.replace(/^Lớp\s*/, '') : profile.className}
            </span>
          </button>

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block"></div>

          {/* Thanh chọn nhanh Thời gian (Tuần, Tháng, Học kỳ, Cả năm) với 1-chạm < và > */}
          <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-1 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              disabled={currentWeekNum <= 1 && currentScope.startsWith('week-')}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <select
              value={currentScope}
              onChange={(e) => {
                if (onChangeTimeScope) {
                  onChangeTimeScope(e.target.value);
                } else if (onSelectWeek && e.target.value.startsWith('week-')) {
                  onSelectWeek(Number(e.target.value.replace('week-', '')));
                }
              }}
              className="bg-transparent text-indigo-200 font-bold text-xs px-1 focus:outline-hidden cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
              title="Chọn nhanh mốc thời gian báo cáo"
            >
              <optgroup label="--- THEO TUẦN HỌC ---" className="bg-slate-900 text-slate-400 font-bold">
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={`week-${w}`} value={`week-${w}`} className="bg-slate-900 text-white font-medium">
                    Tuần {w} (HK1)
                  </option>
                ))}
                {Array.from({ length: 17 }, (_, i) => i + 19).map((w) => (
                  <option key={`week-${w}`} value={`week-${w}`} className="bg-slate-900 text-white font-medium">
                    Tuần {w} (HK2)
                  </option>
                ))}
              </optgroup>

              <optgroup label="--- BÁO CÁO THEO THÁNG ---" className="bg-slate-900 text-slate-400 font-bold">
                <option value="month-9" className="bg-slate-900 text-white font-medium">Tháng 9 (Tuần 1-4)</option>
                <option value="month-10" className="bg-slate-900 text-white font-medium">Tháng 10 (Tuần 5-9)</option>
                <option value="month-11" className="bg-slate-900 text-white font-medium">Tháng 11 (Tuần 10-13)</option>
                <option value="month-12" className="bg-slate-900 text-white font-medium">Tháng 12 (Tuần 14-17)</option>
                <option value="month-1" className="bg-slate-900 text-white font-medium">Tháng 1 (Tuần 18-20)</option>
                <option value="month-2" className="bg-slate-900 text-white font-medium">Tháng 2 (Tuần 21-22)</option>
                <option value="month-3" className="bg-slate-900 text-white font-medium">Tháng 3 (Tuần 23-26)</option>
                <option value="month-4" className="bg-slate-900 text-white font-medium">Tháng 4 (Tuần 27-30)</option>
                <option value="month-5" className="bg-slate-900 text-white font-medium">Tháng 5 (Tuần 31-35)</option>
              </optgroup>

              <optgroup label="--- TỔNG KẾT KỲ &amp; CẢ NĂM ---" className="bg-slate-900 text-slate-400 font-bold">
                <option value="semester-1" className="bg-slate-900 text-white font-medium">Học kỳ 1 (Tuần 1 - 18)</option>
                <option value="semester-2" className="bg-slate-900 text-white font-medium">Học kỳ 2 (Tuần 19 - 35)</option>
                <option value="year" className="bg-slate-900 text-white font-medium">Cả năm học (35 Tuần)</option>
              </optgroup>
            </select>

            <button
              type="button"
              onClick={handleNextWeek}
              disabled={currentWeekNum >= 35 && currentScope.startsWith('week-')}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            GÓC PHẢI: HUY HIỆU SUPABASE & NÚT CẤU HÌNH API KEY BO TRÒN
            ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Huy hiệu Supabase nhỏ gọn: 🟢 Đã đồng bộ */}
          {syncStatus === 'syncing' ? (
            <div
              className="flex items-center gap-1.5 bg-blue-950/80 border border-blue-400/50 rounded-full px-2.5 py-1 text-xs text-blue-200 shadow-xs animate-pulse"
              title="Đang đồng bộ dữ liệu lên Supabase Cloud..."
            >
              <RefreshCw className="w-3 h-3 text-cyan-300 animate-spin" />
              <span className="font-semibold text-cyan-300 text-[11px] hidden sm:inline">Đang lưu...</span>
            </div>
          ) : syncStatus === 'error' ? (
            <div
              onClick={onManualSync}
              className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 rounded-full px-2.5 py-1 text-xs text-amber-200 shadow-xs cursor-pointer hover:bg-amber-900/60 transition"
              title="Đã lưu cục bộ (Local). Bấm để đồng bộ lại lên Supabase Cloud."
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="font-medium text-amber-300 text-[11px]">⚠️ Lưu Local</span>
            </div>
          ) : (
            <div
              onClick={onManualSync}
              className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-full px-2.5 py-1 text-xs text-emerald-200 shadow-xs cursor-pointer hover:bg-emerald-900/60 transition group"
              title={`Cơ sở dữ liệu Supabase Cloud đã đồng bộ ${lastSyncedTime ? `lúc ${lastSyncedTime}` : ''}. Bấm để đồng bộ thủ công.`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-emerald-300 text-[11px]">
                🟢 Đã đồng bộ {lastSyncedTime ? `(${lastSyncedTime})` : ''}
              </span>
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition duration-300 hidden sm:inline" />
            </div>
          )}

          {/* Nút cấu hình: "🔑 API Key" thiết kế tinh gọn dạng nút bo tròn */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-xs transition cursor-pointer ${
              hasApiKey
                ? 'bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white animate-pulse'
            }`}
            title={hasApiKey ? 'Gemini API Key đã sẵn sàng. Bấm để đổi key.' : 'Chưa nhập API Key. Bấm để cài đặt.'}
          >
            <Key className="w-3 h-3 text-cyan-300" />
            <span className="text-[11px]">{hasApiKey ? 'API Key' : '🔑 Nhập Key'}</span>
          </button>

          {/* Hồ sơ settings compact button */}
          <button
            onClick={onOpenProfileSettings}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Cấu hình hồ sơ lớp & GVCN"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {/* Reset command compact button */}
          <button
            onClick={onOpenResetModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition"
            title="Lệnh điều hành / Reset tháng"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
