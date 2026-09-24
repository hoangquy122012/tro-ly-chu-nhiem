import React, { useState } from 'react';
import {
  RotateCcw,
  Calendar,
  Layers,
  Eraser,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Student, BehaviorRecord, WeeklyReport } from '../types';

export type ResetMode = 'month' | 'semester' | 'correction' | 'hard';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  records: BehaviorRecord[];
  reports: WeeklyReport[];
  currentWeek: number;
  currentMonth: number;
  currentSemester: 1 | 2;
  onExecuteMonthReset: (fromMonth: number, toMonth: number) => void;
  onExecuteSemesterReset: () => void;
  onExecuteCorrection: (recordId: string, reason: string) => void;
  onExecuteHardReset: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  students,
  records,
  reports,
  currentWeek,
  currentMonth,
  currentSemester,
  onExecuteMonthReset,
  onExecuteSemesterReset,
  onExecuteCorrection,
  onExecuteHardReset,
}) => {
  const [selectedMode, setSelectedMode] = useState<ResetMode>('month');

  // Mode 1 state
  const [fromMonth, setFromMonth] = useState<number>(currentMonth);
  const [toMonth, setToMonth] = useState<number>(currentMonth === 12 ? 1 : currentMonth + 1);

  // Mode 3 state (Correction)
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('Ghi nhầm tên học sinh');
  const [customReasonNote, setCustomReasonNote] = useState<string>('');

  // Mode 4 state (Hard reset confirmation)
  const [hardResetConfirmText, setHardResetConfirmText] = useState<string>('');

  if (!isOpen) return null;

  // Filter records for selected student in Mode 3
  const studentRecords = records.filter(
    (r) => r.studentId === selectedStudentId && r.pointsImpact < 0
  );

  const handleApplyMonthReset = () => {
    onExecuteMonthReset(fromMonth, toMonth);
    onClose();
  };

  const handleApplySemesterReset = () => {
    onExecuteSemesterReset();
    onClose();
  };

  const handleApplyCorrection = () => {
    if (!selectedRecordId) return;
    const finalReason = customReasonNote
      ? `${correctionReason}: ${customReasonNote}`
      : correctionReason;
    onExecuteCorrection(selectedRecordId, finalReason);
    setSelectedRecordId('');
    onClose();
  };

  const handleApplyHardReset = () => {
    if (hardResetConfirmText !== 'RESET 7A1') return;
    onExecuteHardReset();
    setHardResetConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>[LỆNH ĐIỀU HÀNH] QUẢN TRỊ &amp; RESET DỮ LIỆU</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400/40">
                  EduMaster System
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Quy trình chuẩn hóa chu kỳ tháng, học kỳ và đính chính hồ sơ Sổ Chủ Nhiệm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setSelectedMode('month')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              selectedMode === 'month'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Chế độ 1: Sang Tháng Mới</span>
          </button>

          <button
            onClick={() => setSelectedMode('semester')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              selectedMode === 'semester'
                ? 'bg-white text-indigo-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chế độ 2: Chuyển Học Kỳ 2</span>
          </button>

          <button
            onClick={() => setSelectedMode('correction')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              selectedMode === 'correction'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Eraser className="w-3.5 h-3.5 text-amber-600" />
            <span>Chế độ 3: Đính Chính / Xóa Lỗi</span>
          </button>

          <button
            onClick={() => setSelectedMode('hard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              selectedMode === 'hard'
                ? 'bg-rose-50 text-rose-800 shadow-xs border border-rose-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Chế độ 4: Hard Reset</span>
          </button>
        </div>

        {/* Body content based on selected mode */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* CHẾ ĐỘ 1: RESET SANG THÁNG MỚI */}
          {/* ========================================================================= */}
          {selectedMode === 'month' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>CHẾ ĐỘ 1: RESET SANG THÁNG MỚI (Khuyên dùng vào đầu mỗi tháng)</span>
                </div>
                <p className="text-xs text-blue-800/90 leading-relaxed">
                  <strong>Mục đích:</strong> Khép lại tháng cũ, đặt lại bộ đếm lỗi tháng của toàn bộ học sinh về 0 để tính lại mốc cảnh báo phụ huynh (ngưỡng 3 lỗi/tháng) từ đầu.
                </p>
              </div>

              {/* Action checklist */}
              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block">
                  Các thao tác hệ thống sẽ tự động thực thi:
                </span>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1. Khóa số liệu và lưu lại kết quả xếp loại rèn luyện của <strong>Tháng {fromMonth}</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>2. Đặt số lỗi tích lũy trong tháng của toàn bộ {students.length} học sinh về 0.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>3. Xóa cờ cảnh báo phụ huynh của tháng cũ.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    4. <strong>GIỮ NGUYÊN:</strong> Toàn bộ lịch sử nhật ký biểu hiện chi tiết (Mục IV SCN) và tổng lỗi lũy kế Học kỳ / Cả năm.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>5. Sẵn sàng tiếp nhận tuần đầu tiên của <strong>Tháng {toMonth}</strong>.</span>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tháng vừa kết thúc (Khóa số liệu):
                  </label>
                  <select
                    value={fromMonth}
                    onChange={(e) => setFromMonth(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  >
                    {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}/2026-2027
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tháng mới bắt đầu (Khởi tạo chu kỳ):
                  </label>
                  <select
                    value={toMonth}
                    onChange={(e) => setToMonth(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  >
                    {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}/2026-2027
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApplyMonthReset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Kích Hoạt Reset Sang Tháng {toMonth}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CHẾ ĐỘ 2: RESET CHUYỂN HỌC KỲ */}
          {/* ========================================================================= */}
          {selectedMode === 'semester' && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>CHẾ ĐỘ 2: RESET CHUYỂN HỌC KỲ (Dùng khi kết thúc Học kỳ 1 sang Học kỳ 2)</span>
                </div>
                <p className="text-xs text-indigo-800/90 leading-relaxed">
                  <strong>Mục đích:</strong> Kết thúc đánh giá định kỳ Học kỳ 1, khởi động tuần học đầu tiên của Học kỳ 2 (bắt đầu từ Tuần 19 theo khung năm học THCS).
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block">
                  Các thao tác hệ thống sẽ tự động thực thi:
                </span>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1. Khóa toàn bộ dữ liệu Học kỳ 1 (điểm thi đua các tuần 1 - 18, kết quả xếp loại rèn luyện HK1).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>2. Đặt lại chỉ số thi đua tuần, tháng và điểm vi phạm HK2 về 0.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    3. <strong>GIỮ NGUYÊN:</strong> Danh sách lớp, thông tin học sinh đặc biệt và nhật ký biểu hiện đã ghi nhận ở HK1.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>4. Bắt đầu tính chu kỳ mới từ <strong>Tuần 19</strong> (Tuần đầu tiên của Học kỳ 2).</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Hệ thống sẽ lưu trữ bản sao dữ liệu HK1 phục vụ tổng kết cả năm theo Thông tư 22.
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApplySemesterReset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Layers className="w-4 h-4" />
                  <span>Kích Hoạt Chuyển Sang Học Kỳ 2 (Bắt đầu Tuần 19)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CHẾ ĐỘ 3: ĐÍNH CHÍNH / XÓA LỖI CHO MỘT HỌC SINH CỤ THỂ */}
          {/* ========================================================================= */}
          {selectedMode === 'correction' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>CHẾ ĐỘ 3: ĐÍNH CHÍNH / XÓA LỖI CHO MỘT HỌC SINH CỤ THỂ</span>
                </div>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  <strong>Mục đích:</strong> Xóa lỗi do ghi nhầm sổ hoặc học sinh đã khắc phục, được giáo viên bộ môn xóa lỗi. Tự động trừ bớt 1 lỗi trong tuần, tháng và cập nhật SCN.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Student */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn học sinh cần đính chính:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setSelectedRecordId('');
                    }}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        STT {s.stt}: {s.name} (Tổ {s.group})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lý do đính chính / xóa lỗi:
                  </label>
                  <select
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  >
                    <option value="Ghi nhầm tên học sinh">Ghi nhầm tên học sinh</option>
                    <option value="Giáo viên bộ môn đính chính">Giáo viên bộ môn đính chính</option>
                    <option value="Học sinh đã khắc phục khuyết điểm">Học sinh đã khắc phục khuyết điểm</option>
                    <option value="Khác">Lý do khác (ghi chú thêm)</option>
                  </select>
                </div>
              </div>

              {/* Select violation to remove */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn lỗi cần xóa của học sinh này:
                </label>
                {studentRecords.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-center">
                    Học sinh này hiện không có lỗi vi phạm nào trong hệ thống.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {studentRecords.map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                          selectedRecordId === r.id
                            ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="recordToFix"
                          checked={selectedRecordId === r.id}
                          onChange={() => setSelectedRecordId(r.id)}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold block">
                            [{r.dayOfWeek}, Ngày {r.date}] - Tiết {r.period} môn {r.subject} ({r.pointsImpact}đ)
                          </span>
                          <span className="text-slate-600 font-sans block">{r.behavior}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú chi tiết đính chính (tùy chọn):
                </label>
                <input
                  type="text"
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  placeholder="Ví dụ: GVBM Toán xác nhận bạn Nguyễn An Khang đã nộp bù vở..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApplyCorrection}
                  disabled={!selectedRecordId}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition"
                >
                  <Eraser className="w-4 h-4" />
                  <span>Xác Nhận Đính Chính / Xóa Lỗi</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CHẾ ĐỘ 4: HARD RESET - LÀM SẠCH HOÀN TOÀN */}
          {/* ========================================================================= */}
          {selectedMode === 'hard' && (
            <div className="space-y-5">
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>CHẾ ĐỘ 4: HARD RESET - LÀM SẠCH HOÀN TOÀN (BẮT ĐẦU NĂM HỌC MỚI)</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  <strong>CẢNH BÁO QUAN TRỌNG:</strong> Thao tác này sẽ xóa toàn bộ lịch sử vi phạm, điểm số, nhật ký của năm học cũ để chuẩn bị cho năm học mới.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block">
                  Phạm vi thực thi:
                </span>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>1. Đặt tất cả chỉ số (Tuần, Tháng, HK1, HK2, Cả năm) của 40 học sinh về 0.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>2. Xóa toàn bộ nội dung trong bảng Nhật ký theo dõi biểu hiện (Mục IV SCN).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    3. <strong>CHỈ GIỮ LẠI:</strong> Bảng danh sách họ tên 40 học sinh và cấu hình phân tổ ban đầu.
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2">
                <label className="block text-xs font-bold text-rose-900">
                  Xác nhận bảo mật: Nhập chính xác dòng chữ <code className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded">RESET 7A1</code> để mở khóa:
                </label>
                <input
                  type="text"
                  value={hardResetConfirmText}
                  onChange={(e) => setHardResetConfirmText(e.target.value)}
                  placeholder="Nhập: RESET 7A1"
                  className="w-full text-xs font-mono font-bold bg-rose-50/50 border border-rose-300 rounded-lg p-2.5 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApplyHardReset}
                  disabled={hardResetConfirmText !== 'RESET 7A1'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xác Nhận Hard Reset Toàn Bộ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
