import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  FileText,
  Calendar,
  Users,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { SystemProfile } from '../types';
import {
  WeeklySummaryStatsData,
  exportWeeklySummaryReportDoc,
} from '../utils/wordExport';

interface WeeklySummaryMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WeeklySummaryStatsData;
  profile: SystemProfile;
}

export const WeeklySummaryMinutesModal: React.FC<WeeklySummaryMinutesModalProps> = ({
  isOpen,
  onClose,
  data,
  profile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const prevComparisonText =
    data.prevWeekViolations === null
      ? 'Chưa có số liệu tuần trước'
      : data.totalViolations > data.prevWeekViolations
      ? `↑ Tăng ${data.totalViolations - data.prevWeekViolations} lượt so với Tuần ${data.weekNumber - 1}`
      : data.totalViolations < data.prevWeekViolations
      ? `↓ Giảm ${data.prevWeekViolations - data.totalViolations} lượt so với Tuần ${data.weekNumber - 1}`
      : `→ Tương đương so với Tuần ${data.weekNumber - 1}`;

  const handleCopyText = () => {
    let text = `UBND TP. HỒ CHÍ MINH - ${profile.schoolName.toUpperCase()}\n`;
    text += `LỚP: ${profile.className} • NĂM HỌC: ${profile.academicYear}\n`;
    text += `------------------------------------------------------\n`;
    text += `BIÊN BẢN SƠ KẾT CÔNG TÁC CHỦ NHIỆM & NỀ NẾP LỚP - TUẦN ${data.weekNumber}\n`;
    text += `Thời gian: ${data.dateRange} • GVCN: ${profile.teacherName}\n\n`;

    text += `I. TỔNG QUAN CHỈ SỐ NỀ NẾP TRONG TUẦN:\n`;
    text += `1. Tổng số lượt vi phạm: ${data.totalViolations} lượt (${prevComparisonText})\n`;
    text += `2. Số học sinh có vi phạm: ${data.violatorsCount} / ${data.totalStudents} học sinh (chiếm ${data.violatorPercent}%)\n`;
    text += `3. Số học sinh nề nếp tốt (0 lỗi): ${data.goodStudentsCount} / ${data.totalStudents} học sinh (đạt ${data.goodPercent}%)\n`;
    text += `4. Thời điểm / Tiết học trọng điểm cần lưu ý: ${data.topPeriodDayText || 'Không có thời điểm nổi cộm'}\n\n`;

    text += `II. DANH SÁCH HỌC SINH CẦN LƯU Ý (TỪ 2 LẦN VI PHẠM TRỞ LÊN):\n`;
    if (data.topAttentionStudents.length === 0) {
      text += `- Tuần này lớp không có học sinh vi phạm từ 2 lần trở lên. Nề nếp rất tốt!\n`;
    } else {
      data.topAttentionStudents.forEach((s, idx) => {
        text += `${idx + 1}. Em ${s.name} (STT ${s.stt}): ${s.count} lượt vi phạm. Lỗi chủ yếu: ${s.mainBehaviors}. Cảnh báo: ${s.severityLabel}. (${s.isParentContacted ? 'Đã liên hệ PH' : 'Đã nhắc nhở trực tiếp'})\n`;
      });
    }

    text += `\nIII. TOP MÔN HỌC & NGÀY TRONG TUẦN:\n`;
    text += `- Top môn học phát sinh vi phạm: ${data.topSubjects.slice(0, 3).map((s) => `${s.subject} (${s.count} lượt)`).join(', ') || 'Không có'}\n`;
    text += `- Phân bổ ngày: ${data.dayDistribution.map((d) => `${d.day}: ${d.count} lượt`).join(' | ')}\n\n`;

    text += `IV. ĐÁNH GIÁ CHUNG VÀ PHƯƠNG HƯỚNG TUẦN TIẾP THEO:\n`;
    text += `• Ưu điểm: Đa số học sinh duy trì nghiêm túc nội quy, tác phong đồng phục đúng quy định.\n`;
    text += `• Tồn tại: Vẫn còn học sinh chưa chuẩn bị bài kỹ và mất trật tự trong giờ bộ môn.\n`;
    text += `• Biện pháp: GVCN phối hợp Ban cán sự lớp đôn đốc 15 phút đầu giờ, liên hệ gia đình học sinh vi phạm nhiều lần để cùng phối hợp.\n\n`;
    text += `GIÁO VIÊN CHỦ NHIỆM: ${profile.teacherName}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Biên Bản Sơ Kết Công Tác Chủ Nhiệm – Tuần {data.weekNumber}
              </h3>
              <p className="text-xs text-slate-300">
                Lớp {profile.className} • Năm học {profile.academicYear} • Mẫu hành chính chuẩn hồ sơ SCN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition"
              title="Sao chép nội dung biên bản"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
            </button>

            <button
              onClick={() => exportWeeklySummaryReportDoc(data, profile)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-xs"
              title="Tải văn bản Word .doc"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Word (.doc)</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition hidden sm:inline-flex"
              title="In biên bản"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (A4 styled layout) */}
        <div className="p-6 sm:p-8 overflow-y-auto font-serif text-slate-800 text-sm leading-relaxed space-y-6 bg-slate-50/50">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
            {/* Header Table */}
            <div className="flex justify-between items-start border-b pb-4 border-slate-200 text-xs sm:text-sm">
              <div className="text-center font-sans space-y-0.5">
                <p className="text-[11px] uppercase text-slate-500 font-semibold">UBND TP. HỒ CHÍ MINH</p>
                <p className="font-bold uppercase text-slate-900">{profile.schoolName}</p>
                <p className="font-semibold text-blue-700">LỚP: {profile.className}</p>
              </div>

              <div className="text-center font-sans space-y-0.5">
                <p className="font-bold uppercase text-slate-900 text-xs sm:text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-xs underline text-slate-700">Độc lập - Tự do - Hạnh phúc</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1 py-2">
              <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 font-sans tracking-wide">
                BIÊN BẢN SƠ KẾT CÔNG TÁC CHỦ NHIỆM &amp; NỀ NẾP LỚP
              </h2>
              <p className="text-blue-800 font-bold font-sans text-sm">
                TUẦN {data.weekNumber} ({data.dateRange})
              </p>
              <p className="text-xs text-slate-500 italic font-sans">
                Năm học: {profile.academicYear} • GVCN: {profile.teacherName}
              </p>
            </div>

            {/* I. TỔNG QUAN CHỈ SỐ */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase font-sans text-xs sm:text-sm flex items-center gap-1.5 border-b pb-1 border-slate-200">
                <span className="w-2 h-4 bg-blue-600 rounded-xs inline-block"></span>
                I. TỔNG QUAN CHỈ SỐ NỀ NẾP TRONG TUẦN
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-600 block">1. Tổng số lượt vi phạm:</span>
                  <span className="text-base font-black text-slate-900">{data.totalViolations} lượt</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">({prevComparisonText})</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-600 block">2. Số học sinh có vi phạm:</span>
                  <span className="text-base font-black text-rose-600">
                    {data.violatorsCount} / {data.totalStudents} HS
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">(Chiếm {data.violatorPercent}% sĩ số lớp)</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-600 block">3. Học sinh nề nếp tốt (0 lỗi):</span>
                  <span className="text-base font-black text-emerald-600">
                    {data.goodStudentsCount} / {data.totalStudents} HS
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">(Đạt tỷ lệ {data.goodPercent}%)</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-600 block">4. Thời điểm / Tiết học trọng điểm:</span>
                  <span className="text-sm font-bold text-amber-700 block mt-0.5">
                    {data.topPeriodDayText || 'Không có thời điểm nổi cộm'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Cần nhắc nhở trước giờ học</span>
                </div>
              </div>
            </div>

            {/* II. DANH SÁCH HỌC SINH CẦN LƯU Ý */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase font-sans text-xs sm:text-sm flex items-center gap-1.5 border-b pb-1 border-slate-200">
                <span className="w-2 h-4 bg-amber-500 rounded-xs inline-block"></span>
                II. DANH SÁCH HỌC SINH CẦN LƯU Ý &amp; NHẮC NHỞ (TỪ 2 LẦN VI PHẠM TRỞ LÊN)
              </h3>

              {data.topAttentionStudents.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-800 text-center italic">
                  Tuần này lớp không có học sinh nào vi phạm từ 2 lần trở lên. Nề nếp toàn lớp được duy trì rất tốt!
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">STT</th>
                        <th className="py-2 px-3 w-36">Học sinh</th>
                        <th className="py-2 px-2 w-20 text-center">Số lượt</th>
                        <th className="py-2 px-3">Lỗi vi phạm chủ yếu</th>
                        <th className="py-2 px-3 w-28 text-center">Mức cảnh báo</th>
                        <th className="py-2 px-3 w-28 text-center">Tương tác PH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.topAttentionStudents.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-bold text-slate-500">{s.stt || idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{s.name}</td>
                          <td className="py-2 px-2 text-center font-black text-rose-600">{s.count} lượt</td>
                          <td className="py-2 px-3 text-slate-700">{s.mainBehaviors}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                s.count >= 3
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {s.severityLabel}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-medium text-slate-600">
                            {s.isParentContacted ? '✓ Đã liên hệ' : 'Đã nhắc nhở'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* III. THỐNG KÊ THEO MÔN & NGÀY */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase font-sans text-xs sm:text-sm flex items-center gap-1.5 border-b pb-1 border-slate-200">
                <span className="w-2 h-4 bg-indigo-600 rounded-xs inline-block"></span>
                III. PHÂN BỔ VI PHẠM THEO MÔN HỌC &amp; THỜI ĐIỂM
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <span className="font-bold text-slate-800 block mb-2">1. Top môn học phát sinh vi phạm:</span>
                  {data.topSubjects.length === 0 ? (
                    <p className="text-slate-400 italic">Không có vi phạm trong tuần.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.topSubjects.slice(0, 5).map((subj, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-700 font-medium">{idx + 1}. Môn {subj.subject}</span>
                          <span className="font-bold text-indigo-700">{subj.count} lượt</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <span className="font-bold text-slate-800 block mb-2">2. Phân bổ theo ngày trong tuần:</span>
                  <div className="space-y-1.5">
                    {data.dayDistribution.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700">{d.day}</span>
                        <span className="font-semibold text-slate-900">{d.count} lượt</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* IV. ĐÁNH GIÁ CHUNG */}
            <div className="space-y-2 font-sans">
              <h3 className="font-bold text-slate-900 uppercase text-xs sm:text-sm flex items-center gap-1.5 border-b pb-1 border-slate-200">
                <span className="w-2 h-4 bg-emerald-600 rounded-xs inline-block"></span>
                IV. ĐÁNH GIÁ CHUNG VÀ PHƯƠNG HƯỚNG TUẦN TIẾP THEO
              </h3>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <p>
                  • <strong>Ưu điểm:</strong> Đại đa số học sinh trong lớp duy trì ý thức nề nếp tốt, đi học đúng giờ, mặc đồng phục đầy đủ và tích cực tham gia các tiết học.
                </p>
                <p>
                  • <strong>Tồn tại cần chấn chỉnh:</strong> Một số trường hợp còn chưa chuẩn bị bài kỹ trước khi đến lớp, còn hiện tượng nói chuyện riêng trong giờ học bộ môn.
                </p>
                <p>
                  • <strong>Phương hướng tuần tới:</strong> Tiếp tục đôn đốc 15 phút đầu giờ; phối hợp cùng gia đình các em có nhiều lượt vi phạm để chấn chỉnh kịp thời, tránh ảnh hưởng xếp loại định kỳ TT22.
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-4 grid grid-cols-2 gap-4 text-center font-sans text-xs">
              <div>
                <p className="font-bold uppercase text-slate-800">ĐẠI DIỆN BAN CÁN SỰ LỚP</p>
                <p className="text-[11px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
              </div>

              <div>
                <p className="italic text-slate-500 text-[11px] mb-0.5">Ngày ..... tháng ..... năm 202...</p>
                <p className="font-bold uppercase text-slate-800">GIÁO VIÊN CHỦ NHIỆM</p>
                <p className="text-[11px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
                <p className="font-bold text-slate-900">{profile.teacherName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Biên bản được tự động trích xuất từ dữ liệu sổ ghi nhận nề nếp Tuần {data.weekNumber}.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
