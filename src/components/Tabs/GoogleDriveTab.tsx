import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  FileText,
  Trash2,
  Download,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  UploadCloud,
  FolderArchive,
  Eye,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DriveSavedFile, WeeklyReport } from '../../types';
import { listFilesFromDrive, deleteFileFromDrive, getFileContent, saveFileToDrive } from '../../services/googleDriveService';
import { googleSignIn, logout } from '../../services/firebaseAuth';

interface GoogleDriveTabProps {
  user: User | null;
  hasDriveToken: boolean;
  accessToken: string | null;
  onDriveAuthChange: (user: User | null, token: string | null) => void;
  activeReport: WeeklyReport;
  allReports: WeeklyReport[];
  students: any[];
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({
  user,
  hasDriveToken,
  accessToken,
  onDriveAuthChange,
  activeReport,
  allReports,
  students,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveSavedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Destructive Action Confirmation Modal State (MANDATORY User Confirmation)
  const [fileToDelete, setFileToDelete] = useState<DriveSavedFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // File Preview Modal State
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fetchDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setStatusMsg(null);
    try {
      const files = await listFilesFromDrive(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err?.message || 'Không thể tải danh sách tệp từ Google Drive' });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles();
    }
  }, [accessToken]);

  const handleExportCurrentReport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const fileName = `EduMaster_BaoCao_Tuan_${activeReport.weekNumber}_Lop7A1.txt`;
      let content = `BÁO CÁO CÔNG TÁC CHỦ NHIỆM - TUẦN ${activeReport.weekNumber}\n`;
      content += `Thời gian: ${activeReport.dateRange}\nLớp: 7A1 - Năm học ${activeReport.academicYear}\n\n`;
      const finalScore = activeReport.finalScore ?? activeReport.collectiveCompetition?.finalScore ?? 100;
      const rank = activeReport.estimatedRank ?? activeReport.collectiveCompetition?.estimatedRank ?? 'Hạng 1';
      content += `1. KẾT QUẢ THI ĐUA TUẦN:\n- Tổng điểm: ${finalScore}/100đ (${rank})\n\n`;
      content += `2. CẢNH BÁO HỌC SINH:\n`;
      const alerts = activeReport.monthlyAlerts || activeReport.parentAlerts || [];
      alerts.forEach((pa) => {
        content += `- ${pa.studentName} (STT ${pa.stt}): ${pa.cumulativeErrorsCount ?? pa.weeklyErrorsCount ?? 0} lỗi | Xếp loại dự kiến: ${pa.predictedRank}\n`;
      });
      content += `\n3. DỰ PHÓNG XẾP LOẠI TT22:\n- Trọng tâm sinh hoạt lớp:\n`;
      activeReport.tt22Forecast.homeroomFocusPoints.forEach((pt, i) => {
        content += `  ${i + 1}. ${pt}\n`;
      });

      const saved = await saveFileToDrive(accessToken, fileName, content, 'text/plain');
      setStatusMsg({ type: 'success', text: `Đã lưu báo cáo "${saved.name}" thành công lên Google Drive!` });
      await fetchDriveFiles();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Lỗi khi xuất báo cáo lên Drive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupFullClassData = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const fileName = `EduMaster_Backup_Lop7A1_${new Date().toISOString().split('T')[0]}.json`;
      const fullData = {
        className: 'Lớp 7A1',
        academicYear: '2026-2027',
        backupDate: new Date().toISOString(),
        students,
        allReports,
      };

      const saved = await saveFileToDrive(accessToken, fileName, JSON.stringify(fullData, null, 2), 'application/json');
      setStatusMsg({ type: 'success', text: `Đã sao lưu toàn bộ cơ sở dữ liệu "${saved.name}" lên Google Drive!` });
      await fetchDriveFiles();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Lỗi khi sao lưu dữ liệu lên Drive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewFile = async (file: DriveSavedFile) => {
    if (!accessToken) return;
    setIsLoadingPreview(true);
    try {
      const content = await getFileContent(accessToken, file.id);
      setPreviewContent({ name: file.name, content });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Không thể xem nội dung tệp' });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Explicit confirmation dialog handler for file deletion
  const confirmDeleteFile = async () => {
    if (!fileToDelete || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteFileFromDrive(accessToken, fileToDelete.id);
      setStatusMsg({ type: 'success', text: `Đã xóa tệp "${fileToDelete.name}" khỏi Google Drive.` });
      setFileToDelete(null);
      await fetchDriveFiles();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Lỗi khi xóa tệp' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-cyan-200 border border-blue-400/30 mb-2">
              <Cloud className="w-3.5 h-3.5 text-cyan-300" />
              <span>Google Workspace Integration (Google Drive)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Đồng Bộ &amp; Lưu Trữ Đám Mây Google Drive
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Lưu trữ an toàn các báo cáo tuần SCN, nhật ký biểu hiện cá nhân và toàn bộ hồ sơ lớp học trực tiếp vào tài khoản Google Drive của giáo viên.
            </p>
          </div>

          {!accessToken && (
            <button
              onClick={async () => {
                const res = await googleSignIn();
                if (res) onDriveAuthChange(res.user, res.accessToken);
              }}
              className="px-4 py-2.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-semibold shadow-md transition"
            >
              Đăng nhập Google Drive
            </button>
          )}
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

      {/* Cloud Actions Panel */}
      {accessToken ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                <UploadCloud className="w-5 h-5" />
                <span>Xuất Báo Cáo Tuần Hiện Tại</span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu tệp báo cáo Tuần {activeReport.weekNumber} (đủ 4 mục: Thi đua 13 chỉ số, Cảnh báo Zalo, Bảng SCN, Thông tư 22) lên Google Drive.
              </p>
            </div>
            <button
              onClick={handleExportCurrentReport}
              disabled={isExporting}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              <Cloud className="w-4 h-4" />
              <span>{isExporting ? 'Đang lưu lên Drive...' : 'Lưu Báo Cáo Tuần Lên Drive'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1">
                <FolderArchive className="w-5 h-5" />
                <span>Sao Lưu Toàn Bộ Cơ Sở Dữ Liệu Lớp</span>
              </div>
              <p className="text-xs text-slate-500">
                Tạo bản sao lưu đầy đủ 36 học sinh Lớp 7A1, lịch sử các tuần và barem điểm (định dạng JSON an toàn) lên Google Drive.
              </p>
            </div>
            <button
              onClick={handleBackupFullClassData}
              disabled={isExporting}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isExporting ? 'Đang sao lưu...' : 'Sao Lưu Toàn Bộ Dữ Liệu Lên Drive'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cloud className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Kết Nối Với Google Drive Để Đồng Bộ</h3>
            <p className="text-xs text-slate-500 mt-1">
              Đăng nhập bằng tài khoản Google để tự động đồng bộ báo cáo tuần và nhật ký chủ nhiệm trực tiếp lên Google Drive.
            </p>
          </div>
          <button
            onClick={async () => {
              const res = await googleSignIn();
              if (res) onDriveAuthChange(res.user, res.accessToken);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
          >
            Đăng nhập tài khoản Google
          </button>
        </div>
      )}

      {/* List of Files on Google Drive */}
      {accessToken && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Tệp EduMaster AI Trên Google Drive</h3>
              <span className="text-xs text-slate-500">({driveFiles.length} tệp)</span>
            </div>

            <button
              onClick={fetchDriveFiles}
              disabled={isLoadingFiles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Đang tải danh sách tệp từ Google Drive...</span>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 italic">
              Chưa có tệp báo cáo nào của EduMaster AI trên Google Drive. Hãy nhấn "Lưu Báo Cáo Tuần Lên Drive" ở trên!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{file.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {file.mimeType} • Ngày tạo:{' '}
                        {file.createdTime ? new Date(file.createdTime).toLocaleString('vi-VN') : 'Gần đây'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreviewFile(file)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                      title="Xem nội dung tệp"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>

                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition"
                        title="Mở trên Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở Drive</span>
                      </a>
                    )}

                    {/* Button that triggers explicit confirmation dialog */}
                    <button
                      onClick={() => setFileToDelete(file)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Xóa tệp khỏi Google Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">{previewContent.name}</h3>
              <button
                onClick={() => setPreviewContent(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed">
              {previewContent.content}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewContent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE ACTION (DELETE FILE) */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Tệp Google Drive?</h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ xóa vĩnh viễn tệp trên tài khoản Google Drive của bạn.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="text-slate-500">Tên tệp:</p>
              <p className="font-semibold text-slate-900 break-all">{fileToDelete.name}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tệp này không? Hành động này không thể hoàn tác sau khi thực hiện.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
