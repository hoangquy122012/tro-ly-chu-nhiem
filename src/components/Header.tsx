import React, { useState } from 'react';
import { Cloud, Check, LogOut, ShieldCheck, Sparkles, BookMarked, User as UserIcon, RotateCcw, Sliders } from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/firebaseAuth';
import { SystemProfile } from '../types';

interface HeaderProps {
  user: User | null;
  hasDriveToken: boolean;
  onDriveAuthChange: (user: User | null, token: string | null) => void;
  onExportToDrive: () => void;
  isExporting: boolean;
  currentMonth: number;
  currentSemester: 1 | 2;
  onOpenResetModal: () => void;
  profile: SystemProfile;
  onOpenProfileSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasDriveToken,
  onDriveAuthChange,
  onExportToDrive,
  isExporting,
  currentMonth,
  currentSemester,
  onOpenResetModal,
  profile,
  onOpenProfileSettings,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onDriveAuthChange(result.user, result.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập không thành công');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onDriveAuthChange(null, null);
  };

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

        {/* Google Workspace Drive Integration & Actions */}
        <div className="flex items-center gap-3">
          {hasDriveToken && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onExportToDrive}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
                title="Lưu báo cáo tuần lên Google Drive"
              >
                <Cloud className="w-3.5 h-3.5" />
                {isExporting ? 'Đang lưu...' : 'Lưu lên Drive'}
              </button>

              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'GV'} className="w-5 h-5 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-slate-200 max-w-[120px] truncate hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Check className="w-2.5 h-2.5 mr-0.5" /> Drive
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-red-400 ml-1 p-1 rounded hover:bg-slate-700 transition"
                  title="Đăng xuất Google Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Official Google Material Sign-In Button */}
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button text-xs transition transform active:scale-95 disabled:opacity-60"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1f1f1f',
                  border: '1px solid #747775',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  fontFamily: '"Roboto", arial, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  height: '36px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block', width: '18px', height: '18px' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
                <span>{isSigningIn ? 'Đang kết nối...' : 'Kết nối Google Drive'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {errorMsg && (
        <div className="bg-red-500/20 border-b border-red-500/40 text-red-200 text-xs px-4 py-1.5 text-center">
          {errorMsg}
        </div>
      )}
    </header>
  );
};
