import React, { useState } from 'react';
import { Award, ShieldCheck, Filter, Download, Info, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import { Student, BehaviorRecord, TT22Rank } from '../../types';

interface TT22EvaluationTabProps {
  students: Student[];
  records: BehaviorRecord[];
  className?: string;
}

export const TT22EvaluationTab: React.FC<TT22EvaluationTabProps> = ({
  students,
  records,
  className = '9.5',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Tháng 9/2026');
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({});
  const [overriddenRanks, setOverriddenRanks] = useState<Record<string, TT22Rank>>({});
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Compute stats for each student
  const evaluatedStudents = students.map((student) => {
    const studentRecords = records.filter((r) => r.studentId === student.id);
    const bonuses = studentRecords.filter(
      (r) =>
        r.category === 'khen_thuong' ||
        r.category === 'diem_tot' ||
        r.category === 'viec_tot' ||
        (r.pointsImpact !== undefined && r.pointsImpact > 0)
    );
    const violations = studentRecords.filter(
      (r) =>
        (r.pointsImpact !== undefined && r.pointsImpact < 0) ||
        (r.category !== 'khen_thuong' && r.category !== 'diem_tot' && r.category !== 'viec_tot')
    );

    // TT22 Rule engine
    let autoRank: TT22Rank = 'Tốt';
    if (violations.length > 6) {
      autoRank = 'Chưa đạt';
    } else if (violations.length >= 5) {
      autoRank = 'Đạt';
    } else if (violations.length >= 3) {
      autoRank = 'Khá';
    } else {
      autoRank = 'Tốt';
    }

    const finalRank = overriddenRanks[student.id] || autoRank;

    return {
      student,
      totalViolations: violations.length,
      totalBonuses: bonuses.length,
      autoRank,
      finalRank,
      note: overrideNotes[student.id] || (finalRank === 'Tốt' ? 'Ý thức nề nếp tốt, tích cực trong học tập' : ''),
    };
  });

  const countByRank = {
    tot: evaluatedStudents.filter((s) => s.finalRank === 'Tốt').length,
    kha: evaluatedStudents.filter((s) => s.finalRank === 'Khá').length,
    dat: evaluatedStudents.filter((s) => s.finalRank === 'Đạt').length,
    chuaDat: evaluatedStudents.filter((s) => s.finalRank === 'Chưa đạt').length,
  };

  const totalCount = evaluatedStudents.length || 1;

  return (
    <div className="space-y-6">
      {/* Banner on TT22 */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Quy chế đánh giá theo Thông tư 22/2021/TT-BGDĐT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            Đánh Giá &amp; Xếp Loại Kết Quả Rèn Luyện (Hạnh Kiểm)
          </h2>
          <p className="text-sm text-emerald-100 leading-relaxed">
            Hệ thống tự động chấm điểm rèn luyện định kỳ theo 4 mức chuẩn:{' '}
            <strong className="text-emerald-300">Tốt</strong> (0-2 lỗi),{' '}
            <strong className="text-blue-300">Khá</strong> (3-4 lỗi),{' '}
            <strong className="text-amber-300">Đạt</strong> (5-6 lỗi), và{' '}
            <strong className="text-rose-300">Chưa đạt</strong> (&gt;6 lỗi hoặc vi phạm nghiêm trọng). GVCN có quyền can thiệp điều chỉnh kèm căn cứ sư phạm.
          </p>
        </div>
      </div>

      {/* Filter and Overview Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ Đánh Giá:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="Tháng 9/2026">Tháng 9 / Năm học 2026-2027</option>
              <option value="Tháng 10/2026">Tháng 10 / Năm học 2026-2027</option>
              <option value="Tháng 11/2026">Tháng 11 / Năm học 2026-2027</option>
              <option value="Tháng 12/2026">Tháng 12 / Năm học 2026-2027</option>
              <option value="Học kỳ I">Tổng kết Học kỳ I</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Sĩ số đánh giá: <strong>{students.length} học sinh</strong>
          </div>
        </div>

        {/* 4 Rank Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Mức Tốt</span>
              <span className="text-xs font-semibold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full">
                {((countByRank.tot / totalCount) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-900">{countByRank.tot}</span>
              <span className="text-xs text-emerald-700">học sinh</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">0 - 2 lỗi nhẹ, tích cực nề nếp</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Mức Khá</span>
              <span className="text-xs font-semibold bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full">
                {((countByRank.kha / totalCount) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-900">{countByRank.kha}</span>
              <span className="text-xs text-blue-700">học sinh</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">3 - 4 lỗi, có tiếp thu nhắc nhở</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Mức Đạt</span>
              <span className="text-xs font-semibold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                {((countByRank.dat / totalCount) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-900">{countByRank.dat}</span>
              <span className="text-xs text-amber-700">học sinh</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">5 - 6 lỗi, tái phạm nhiều lần</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Mức Chưa Đạt</span>
              <span className="text-xs font-semibold bg-rose-200/60 text-rose-900 px-2 py-0.5 rounded-full">
                {((countByRank.chuaDat / totalCount) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-900">{countByRank.chuaDat}</span>
              <span className="text-xs text-rose-700">học sinh</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">&gt; 6 lỗi hoặc vi phạm nghiêm trọng</p>
          </div>
        </div>
      </div>

      {/* Detailed Evaluation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bảng Đánh Giá Kết Quả Rèn Luyện {className ? (className.startsWith('Lớp') ? className : `Lớp ${className}`) : 'Lớp 9.5'} – {selectedPeriod}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuẩn danh mục hồ sơ Sổ Chủ Nhiệm và cơ sở dữ liệu ngành Giáo Dục
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-44">Họ và tên học sinh</th>
                <th className="py-3 px-3 w-24 text-center">Số lỗi tháng</th>
                <th className="py-3 px-3 w-24 text-center">Điểm tốt</th>
                <th className="py-3 px-4 w-32 text-center">Đề xuất TT22</th>
                <th className="py-3 px-4 w-36 text-center">Xếp loại chính thức</th>
                <th className="py-3 px-4">Nhận xét sư phạm của GVCN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluatedStudents.map(({ student, totalViolations, totalBonuses, autoRank, finalRank, note }) => {
                const isOverridden = overriddenRanks[student.id] && overriddenRanks[student.id] !== autoRank;

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{student.stt}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {student.name}
                      {student.role !== 'Học sinh' && (
                        <span className="block text-[10px] text-blue-600 font-normal">{student.role}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      <span className={totalViolations > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {totalViolations}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      <span className={totalBonuses > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                        +{totalBonuses}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-xs text-slate-500 font-medium">{autoRank}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <select
                        value={finalRank}
                        onChange={(e) => {
                          const newRank = e.target.value as TT22Rank;
                          setOverriddenRanks((prev) => ({
                            ...prev,
                            [student.id]: newRank,
                          }));
                        }}
                        className={`text-xs font-bold rounded-md px-2 py-1 border transition ${
                          finalRank === 'Tốt'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : finalRank === 'Khá'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : finalRank === 'Đạt'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <option value="Tốt">Tốt</option>
                        <option value="Khá">Khá</option>
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                      {isOverridden && (
                        <span className="block text-[9px] text-amber-600 font-semibold mt-0.5">
                          * GVCN điều chỉnh
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {editingStudentId === student.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={overrideNotes[student.id] !== undefined ? overrideNotes[student.id] : note}
                            onChange={(e) =>
                              setOverrideNotes((prev) => ({
                                ...prev,
                                [student.id]: e.target.value,
                              }))
                            }
                            placeholder="Ghi chú nhận xét của GVCN..."
                            className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                          />
                          <button
                            onClick={() => setEditingStudentId(null)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                          >
                            Xong
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingStudentId(student.id)}
                          className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:text-blue-700 group py-1"
                        >
                          <span className="italic">{note || 'Nhấp để thêm nhận xét...'}</span>
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
