import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
  UploadCloud,
  ShieldCheck,
  Server,
  Layers,
  ArrowDownToLine,
  FolderArchive,
} from 'lucide-react';
import { WeeklyReport } from '../../types';
import { SUPABASE_URL, formatClassId } from '../../services/supabaseClient';

interface GoogleDriveTabProps {
  activeReport: WeeklyReport;
  allReports: WeeklyReport[];
  students: any[];
  className?: string;
  syncStatus?: 'syncing' | 'synced' | 'error' | 'idle';
  lastSyncedTime?: string | null;
  onRestoreFromCloud?: () => void;
  onManualSync?: () => void;
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({
  activeReport,
  allReports,
  students,
  className = '9.5',
  syncStatus = 'synced',
  lastSyncedTime,
  onRestoreFromCloud,
  onManualSync,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const classId = formatClassId(className);

  // Tải tệp JSON sao lưu dự phòng trực tiếp về máy tính
  const handleDownloadBackupJson = () => {
    try {
      const backupData = {
        className: className.startsWith('Lớp') ? className : `Lớp ${className}`,
        classId,
        backupDate: new Date().toISOString(),
        students,
        allReports,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `EduMaster_Backup_${classId}_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMsg({
        type: 'success',
        text: 'Đã tải tệp JSON sao lưu toàn bộ dữ liệu lớp học về máy tính thành công!',
      });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Không thể tạo tệp sao lưu' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cơ sở Dữ liệu Đám mây Supabase PostgreSQL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Đồng Bộ &amp; Lưu Trữ Dữ Liệu Cloud Trực Tuyến
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Hệ thống tự động lưu trữ 100% hồ sơ, bảng barem, danh sách học sinh và nhật ký SCN lên Supabase Cloud với mã lớp <strong>{classId}</strong>. Bạn có thể mở ở bất kỳ máy tính nào mà không sợ mất dữ liệu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus === 'syncing' ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-bold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang đồng bộ Cloud...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Supabase Cloud: Đã đồng bộ {lastSyncedTime ? `[${lastSyncedTime}]` : ''}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Thông số kết nối Cloud */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Máy chủ Supabase</span>
          </div>
          <p className="font-mono font-bold text-xs text-slate-800 truncate" title={SUPABASE_URL}>
            {SUPABASE_URL.replace('https://', '')}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">● Trạng thái: Kết nối tốt (Realtime)</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Mã Lớp Học (Class ID)</span>
          </div>
          <p className="font-mono font-black text-sm text-indigo-900">{classId}</p>
          <p className="text-[11px] text-slate-500 mt-1">Khóa định danh riêng cho Lớp {className}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Bảo Lưu Trình Duyệt</span>
          </div>
          <p className="font-bold text-xs text-slate-800">LocalStorage: edumaster_class_data</p>
          <p className="text-[11px] text-slate-500 mt-1">Tự động sao lưu kép (Cloud + Local)</p>
        </div>
      </div>

      {/* Thao tác Điều hành & Đồng bộ Cloud */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nút 1: Tải lại từ Cloud */}
        <div className="bg-white rounded-xl border-2 border-emerald-200 p-5 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/40">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              <span>Tải Lại Dữ Liệu Từ Supabase</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Truy vấn ngay bản ghi mới nhất của mã lớp <strong>{classId}</strong> từ Supabase Cloud để khôi phục lại toàn bộ dữ liệu trên máy tính này.
            </p>
          </div>
          <button
            onClick={onRestoreFromCloud}
            disabled={syncStatus === 'syncing'}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>[🔄 Tải lại dữ liệu từ Cloud (Supabase)]</span>
          </button>
        </div>

        {/* Nút 2: Đẩy dữ liệu lên Cloud */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Đẩy Lên Cloud Ngay Bây Giờ</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thực thi ngay lệnh upsert toàn bộ danh sách {students.length} học sinh, {allReports.length} tuần báo cáo và barem điểm lên bảng <strong>class_records</strong>.
            </p>
          </div>
          <button
            onClick={onManualSync}
            disabled={syncStatus === 'syncing'}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>[☁️ Đẩy toàn bộ dữ liệu lên Cloud]</span>
          </button>
        </div>

        {/* Nút 3: Tải file JSON sao lưu offline */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
              <FolderArchive className="w-5 h-5 text-slate-600" />
              <span>Sao Lưu Tệp JSON Về Máy</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tải một bản sao lưu toàn diện định dạng JSON chứa đủ dữ liệu của lớp về lưu trữ an toàn trong ổ cứng máy tính cá nhân.
            </p>
          </div>
          <button
            onClick={handleDownloadBackupJson}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>[💾 Tải tệp JSON sao lưu dự phòng]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
