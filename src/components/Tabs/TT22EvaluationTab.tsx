import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Edit3,
  Sparkles,
  Zap,
  FileText,
  Save,
  Check,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Student, BehaviorRecord, TT22Rank, SystemProfile } from '../../types';
import {
  CommentDetailLevel,
  StudentPedagogicalInput,
  generatePedagogicalComments,
} from '../../services/geminiService';
import { cleanExpressionText } from '../../utils/wordExport';

interface TT22EvaluationTabProps {
  students: Student[];
  records: BehaviorRecord[];
  className?: string;
  profile?: SystemProfile;
  savedEvaluations?: Record<string, { notes: Record<string, string>; ranks: Record<string, TT22Rank> }>;
  onSaveEvaluations?: (period: string, notes: Record<string, string>, ranks: Record<string, TT22Rank>) => void;
  onRequireApiKey?: () => void;
}

export const TT22EvaluationTab: React.FC<TT22EvaluationTabProps> = ({
  students,
  records,
  className = '9.5',
  savedEvaluations = {},
  onSaveEvaluations,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Tháng 9/2026');

  // Bộ chọn độ chi tiết toàn cục & từng học sinh
  const [globalDetailLevel, setGlobalDetailLevel] = useState<CommentDetailLevel>('ngan_gon');
  const [studentDetailLevels, setStudentDetailLevels] = useState<Record<string, CommentDetailLevel>>({});

  // Dữ liệu đánh giá (ghi chú nhận xét & xếp loại điều chỉnh)
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>(() => {
    return savedEvaluations[selectedPeriod]?.notes || {};
  });
  const [overriddenRanks, setOverriddenRanks] = useState<Record<string, TT22Rank>>(() => {
    return savedEvaluations[selectedPeriod]?.ranks || {};
  });

  // State chỉnh sửa trực tiếp từng học sinh
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  // State sinh AI
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Đồng bộ state khi đổi kỳ đánh giá hoặc khi savedEvaluations từ Supabase cập nhật
  useEffect(() => {
    if (savedEvaluations[selectedPeriod]) {
      setOverrideNotes(savedEvaluations[selectedPeriod].notes || {});
      setOverriddenRanks(savedEvaluations[selectedPeriod].ranks || {});
    } else {
      setOverrideNotes({});
      setOverriddenRanks({});
    }
    setEditingStudentId(null);
  }, [selectedPeriod, savedEvaluations]);

  // Tính toán số liệu thống kê cho từng học sinh theo TT22
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

    // Lời nhận xét mặc định ban đầu nếu chưa có nhận xét AI hoặc GVCN
    const defaultNote =
      finalRank === 'Tốt'
        ? 'Ý thức nề nếp tốt, chăm ngoan và tích cực trong các hoạt động học tập.'
        : finalRank === 'Khá'
        ? 'Ngoan ngoãn, lễ phép, cần chú ý chuẩn bị bài đầy đủ và giữ trật tự hơn.'
        : finalRank === 'Đạt'
        ? 'Cần cố gắng chấn chỉnh nề nếp, đi học đúng giờ và tích cực học bài.'
        : 'Cần nghiêm túc rèn luyện kỷ luật, chấp hành tốt nội quy lớp học.';

    const note = overrideNotes[student.id] !== undefined ? overrideNotes[student.id] : defaultNote;

    return {
      student,
      totalViolations: violations.length,
      totalBonuses: bonuses.length,
      autoRank,
      finalRank,
      note,
      records: studentRecords,
    };
  });

  const countByRank = {
    tot: evaluatedStudents.filter((s) => s.finalRank === 'Tốt').length,
    kha: evaluatedStudents.filter((s) => s.finalRank === 'Khá').length,
    dat: evaluatedStudents.filter((s) => s.finalRank === 'Đạt').length,
    chuaDat: evaluatedStudents.filter((s) => s.finalRank === 'Chưa đạt').length,
  };

  const totalCount = evaluatedStudents.length || 1;

  // Chuẩn bị dữ liệu đầu vào chuẩn hóa để truyền sang Gemini 3.8 Flash (phân tích chi tiết từng dòng nhật ký)
  const buildStudentPedagogicalInputs = (): StudentPedagogicalInput[] => {
    return evaluatedStudents.map(({ student, totalViolations, totalBonuses, finalRank, note, records: studentRecs }) => {
      const violationRecs = studentRecs.filter(
        (r) =>
          (r.pointsImpact !== undefined && r.pointsImpact < 0) ||
          (r.category !== 'khen_thuong' && r.category !== 'diem_tot' && r.category !== 'viec_tot')
      );

      const bonusRecs = studentRecs.filter(
        (r) =>
          (r.pointsImpact !== undefined && r.pointsImpact > 0) ||
          r.category === 'khen_thuong' ||
          r.category === 'diem_tot' ||
          r.category === 'viec_tot'
      );

      const formatEvent = (r: BehaviorRecord) => {
        const timeParts: string[] = [];
        if (r.dayOfWeek) timeParts.push(r.dayOfWeek);
        if (r.period) timeParts.push(`Tiết ${r.period}`);
        const timeStr = timeParts.join(' - ');
        const subjStr = r.subject ? ` môn ${r.subject}` : '';
        const behaviorClean = cleanExpressionText(r.behavior);
        if (timeStr) {
          return `${timeStr}${subjStr}: ${behaviorClean}`;
        }
        return r.subject ? `Môn ${r.subject}: ${behaviorClean}` : behaviorClean;
      };

      const violationDetails = violationRecs.map(formatEvent);
      const bonusDetails = bonusRecs.map(formatEvent);

      return {
        id: student.id,
        stt: student.stt,
        name: student.name,
        role: student.role,
        rank: finalRank,
        violationsCount: totalViolations,
        bonusesCount: totalBonuses,
        violationDetails,
        bonusDetails,
        violationBehaviors: violationRecs.map((r) => cleanExpressionText(r.behavior)),
        bonusBehaviors: bonusRecs.map((r) => cleanExpressionText(r.behavior)),
        currentNote: note,
      };
    });
  };

  // 1. SINH NHẬN XÉT HÀNG LOẠT BẰNG AI (GEMINI 3.8 FLASH) CHO TOÀN BỘ LỚP
  const handleGenerateAllWithAI = async () => {
    setIsGeneratingAll(true);
    setAiStatusMessage(`Đang phân tích dữ liệu nề nếp lớp ${className}...`);

    try {
      const inputs = buildStudentPedagogicalInputs();
      const results = await generatePedagogicalComments({
        students: inputs,
        period: selectedPeriod,
        className,
        detailLevel: globalDetailLevel,
        onStatusChange: (msg) => setAiStatusMessage(msg),
      });

      const updatedNotes = { ...overrideNotes, ...results };
      setOverrideNotes(updatedNotes);

      // Lưu trữ và đồng bộ tức thì lên Supabase
      if (onSaveEvaluations) {
        onSaveEvaluations(selectedPeriod, updatedNotes, overriddenRanks);
      }

      setSaveSuccessMsg(`✨ Đã tạo nhận xét AI (${globalDetailLevel === 'ngan_gon' ? 'Ngắn gọn' : 'Chi tiết'}) cho ${inputs.length} học sinh & đồng bộ lên Supabase!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Lỗi khi sinh nhận xét AI:', err);
    } finally {
      setIsGeneratingAll(false);
      setAiStatusMessage('');
    }
  };

  // 2. SINH NHẬN XÉT AI RIÊNG CHO TỪNG HỌC SINH
  const handleGenerateStudentComment = async (
    studentId: string,
    levelOverride?: CommentDetailLevel
  ) => {
    const targetLevel = levelOverride || studentDetailLevels[studentId] || globalDetailLevel;
    setGeneratingStudentId(studentId);

    try {
      const inputs = buildStudentPedagogicalInputs();
      const targetInput = inputs.find((s) => s.id === studentId);
      if (!targetInput) return;

      const results = await generatePedagogicalComments({
        students: [targetInput],
        period: selectedPeriod,
        className,
        detailLevel: targetLevel,
      });

      if (results[studentId]) {
        const generated = results[studentId];
        const updatedNotes = {
          ...overrideNotes,
          [studentId]: generated,
        };
        setOverrideNotes(updatedNotes);

        if (editingStudentId === studentId) {
          setEditingNoteText(generated);
        }

        // Cập nhật độ chi tiết riêng cho học sinh này
        setStudentDetailLevels((prev) => ({
          ...prev,
          [studentId]: targetLevel,
        }));

        // Đồng bộ tức thì lên Supabase
        if (onSaveEvaluations) {
          onSaveEvaluations(selectedPeriod, updatedNotes, overriddenRanks);
        }

        setSaveSuccessMsg(`Đã tạo nhận xét cho ${targetInput.name} & đồng bộ lên Supabase!`);
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Lỗi khi sinh nhận xét riêng cho học sinh:', err);
    } finally {
      setGeneratingStudentId(null);
    }
  };

  // 3. LƯU KHI CHỈNH SỬA TRỰC TIẾP TỪNG HỌC SINH (BẤM [XONG])
  const handleSaveStudentNote = (studentId: string) => {
    const textToSave = editingNoteText.trim();
    const updatedNotes = {
      ...overrideNotes,
      [studentId]: textToSave,
    };
    setOverrideNotes(updatedNotes);
    setEditingStudentId(null);

    // Đồng bộ tức thì lên Supabase khi bấm nút [Xong]
    if (onSaveEvaluations) {
      onSaveEvaluations(selectedPeriod, updatedNotes, overriddenRanks);
    }

    setSaveSuccessMsg(`Đã lưu nhận xét và đồng bộ lên Supabase Cloud!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // 4. LƯU TOÀN BỘ BẢNG ĐÁNH GIÁ LÊN SUPABASE
  const handleSaveAll = () => {
    if (onSaveEvaluations) {
      onSaveEvaluations(selectedPeriod, overrideNotes, overriddenRanks);
      setSaveSuccessMsg(`🟢 Đã lưu toàn bộ kết quả đánh giá & đồng bộ Supabase Cloud!`);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    }
  };

  const handleStartEdit = (studentId: string, currentNote: string) => {
    setEditingStudentId(studentId);
    setEditingNoteText(currentNote);
  };

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
            Hệ thống tự động xếp loại định kỳ theo 4 mức chuẩn:{' '}
            <strong className="text-emerald-300">Tốt</strong> (0-2 lỗi),{' '}
            <strong className="text-blue-300">Khá</strong> (3-4 lỗi),{' '}
            <strong className="text-amber-300">Đạt</strong> (5-6 lỗi), và{' '}
            <strong className="text-rose-300">Chưa đạt</strong> (&gt;6 lỗi hoặc vi phạm nghiêm trọng). GVCN có quyền can thiệp điều chỉnh và dùng AI hỗ trợ viết nhận xét sư phạm.
          </p>
        </div>
      </div>

      {/* Filter, AI Controls and Overview Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        {/* THANH CÔNG CỤ ĐÁNH GIÁ (EVALUATION TOOLBAR) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ Đánh Giá:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Tháng 9/2026">Tháng 9 / Năm học 2026-2027</option>
                <option value="Tháng 10/2026">Tháng 10 / Năm học 2026-2027</option>
                <option value="Tháng 11/2026">Tháng 11 / Năm học 2026-2027</option>
                <option value="Tháng 12/2026">Tháng 12 / Năm học 2026-2027</option>
                <option value="Học kỳ I">Tổng kết Học kỳ I</option>
              </select>
            </div>

            {/* BỘ CHỌN ĐỘ CHI TIẾT (TOGGLE / SEGMENTED CONTROL) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setGlobalDetailLevel('ngan_gon')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  globalDetailLevel === 'ngan_gon'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1 câu súc tích (phù hợp xuất Học bạ / CSDL ngành)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ Ngắn gọn</span>
                <span className="hidden sm:inline text-[10px] font-normal text-slate-500">(1 câu - Học bạ)</span>
              </button>

              <button
                type="button"
                onClick={() => setGlobalDetailLevel('chi_tiet')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  globalDetailLevel === 'chi_tiet'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="2 - 3 câu đầy đủ (phù hợp gửi trao đổi với Phụ huynh)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>📝 Chi tiết</span>
                <span className="hidden sm:inline text-[10px] font-normal text-slate-500">(2-3 câu - Gửi PH)</span>
              </button>
            </div>
          </div>

          {/* Cụm nút hành động AI & Lưu Supabase */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isGeneratingAll}
              onClick={handleGenerateAllWithAI}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              title="Tự động bóc tách lỗi nề nếp và sinh lời nhận xét toàn bộ lớp theo độ chi tiết đã chọn"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Đang viết nhận xét...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>✨ AI Tự động nhận xét ({globalDetailLevel === 'ngan_gon' ? 'Ngắn gọn' : 'Chi tiết'})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="Lưu toàn bộ nhận xét và đồng bộ lên Supabase Cloud"
            >
              <Save className="w-3.5 h-3.5" />
              <span>💾 Lưu toàn bộ</span>
            </button>
          </div>
        </div>

        {/* Thông báo trạng thái AI / Lưu trữ */}
        {(aiStatusMessage || saveSuccessMsg) && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              {aiStatusMessage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span className="font-semibold">{aiStatusMessage}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-800">{saveSuccessMsg}</span>
                </>
              )}
            </div>
            {saveSuccessMsg && (
              <button
                type="button"
                onClick={() => setSaveSuccessMsg('')}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

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
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bảng Đánh Giá Kết Quả Rèn Luyện {className ? (className.startsWith('Lớp') ? className : `Lớp ${className}`) : 'Lớp 9.5'} – {selectedPeriod}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động hóa nhận xét sư phạm bằng Gemini 3.8 Flash • Giáo viên có thể nhấp vào để chỉnh sửa trực tiếp từng từ ngữ
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Tổng sĩ số: <strong>{students.length} học sinh</strong>
          </span>
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
              {evaluatedStudents.map(({ student, totalViolations, totalBonuses, autoRank, finalRank, note, records: studentRecs }) => {
                const isOverridden = overriddenRanks[student.id] && overriddenRanks[student.id] !== autoRank;
                const isEditing = editingStudentId === student.id;
                const isGeneratingCurrent = generatingStudentId === student.id;
                const studentLevel = studentDetailLevels[student.id] || globalDetailLevel;

                // Đánh giá xem nhận xét hiện tại là 1 câu hay 2-3 câu
                const sentenceCount = note ? note.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 1;
                const isNoteDetailed = sentenceCount >= 2;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">{student.stt}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {student.name}
                      {student.role !== 'Học sinh' && (
                        <span className="block text-[10px] text-blue-600 font-normal">{student.role}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        totalViolations > 0 ? 'bg-rose-100 text-rose-700' : 'text-slate-400'
                      }`}>
                        {totalViolations}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        totalBonuses > 0 ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
                      }`}>
                        +{totalBonuses}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-slate-500 font-medium">{autoRank}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={finalRank}
                        onChange={(e) => {
                          const newRank = e.target.value as TT22Rank;
                          const newRanks = {
                            ...overriddenRanks,
                            [student.id]: newRank,
                          };
                          setOverriddenRanks(newRanks);
                          if (onSaveEvaluations) {
                            onSaveEvaluations(selectedPeriod, overrideNotes, newRanks);
                          }
                        }}
                        className={`text-xs font-bold rounded-lg px-2 py-1 border transition cursor-pointer ${
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

                    {/* Ô NHẬN XÉT SƯ PHẠM CỦA GVCN */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        /* GIAO DIỆN CHỈNH SỬA TRỰC TIẾP (INLINE EDITOR) */
                        <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-blue-300 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                            {/* Toggle độ chi tiết cho riêng học sinh này */}
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-500 font-medium">Độ chi tiết:</span>
                              <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStudentDetailLevels((prev) => ({ ...prev, [student.id]: 'ngan_gon' }));
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    studentLevel === 'ngan_gon' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  ⚡ Ngắn (1 câu)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStudentDetailLevels((prev) => ({ ...prev, [student.id]: 'chi_tiet' }));
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    studentLevel === 'chi_tiet' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  📝 Chi tiết (2-3 câu)
                                </button>
                              </div>
                            </div>

                            {/* Nút Viết lại bằng AI */}
                            <button
                              type="button"
                              disabled={isGeneratingCurrent}
                              onClick={() => handleGenerateStudentComment(student.id, studentLevel)}
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition"
                            >
                              {isGeneratingCurrent ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                              )}
                              <span>✨ Viết lại bằng AI ({studentLevel === 'ngan_gon' ? 'Ngắn' : 'Chi tiết'})</span>
                            </button>
                          </div>

                          {/* Căn cứ dữ liệu thực tế nhật ký để GVCN dễ đối chiếu & kiểm chứng */}
                          <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-indigo-900">
                              <span>📋 Căn cứ nhật ký thực tế ({totalViolations} vi phạm{totalBonuses > 0 ? `, +${totalBonuses} việc tốt` : ''}):</span>
                              <span className="text-[10px] text-slate-500 font-normal">Dữ liệu bóc tách</span>
                            </div>
                            {totalViolations === 0 ? (
                              <p className="text-emerald-700 italic">✓ Không có vi phạm trong kỳ, nề nếp học tập tốt.</p>
                            ) : (
                              <div className="max-h-20 overflow-y-auto space-y-0.5 text-slate-700">
                                {studentRecs
                                  .filter(
                                    (r) =>
                                      (r.pointsImpact !== undefined && r.pointsImpact < 0) ||
                                      (r.category !== 'khen_thuong' && r.category !== 'diem_tot' && r.category !== 'viec_tot')
                                  )
                                  .map((r, rIdx) => (
                                    <div key={r.id || rIdx} className="flex items-start gap-1">
                                      <span className="text-rose-500 font-bold">•</span>
                                      <span>
                                        <strong>{r.dayOfWeek ? `${r.dayOfWeek} ` : ''}(T{r.period} môn {r.subject}):</strong>{' '}
                                        {cleanExpressionText(r.behavior)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Textarea chỉnh sửa bất kỳ từ ngữ nào */}
                          <textarea
                            rows={3}
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            placeholder="Nhập hoặc chỉnh sửa lời nhận xét của GVCN..."
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium leading-relaxed"
                          />

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">
                              Bấm [Xong] để lưu và đồng bộ tức thì lên Supabase Cloud
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingStudentId(null)}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveStudentNote(student.id)}
                                className="flex items-center gap-1 px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Xong</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* GIAO DIỆN HIỂN THỊ THÔNG THƯỜNG */
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => handleStartEdit(student.id, note)}
                            className="flex-1 cursor-pointer hover:bg-blue-50/50 p-1.5 rounded-lg transition"
                            title="Nhấp vào để chỉnh sửa trực tiếp từng từ ngữ"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isNoteDetailed
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {isNoteDetailed ? <FileText className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                                <span>{isNoteDetailed ? 'Chi tiết' : 'Ngắn gọn'}</span>
                              </span>
                            </div>

                            <p className="text-xs text-slate-800 leading-relaxed font-normal">
                              {note}
                            </p>
                          </div>

                          {/* Nhóm thao tác nhanh */}
                          <div className="flex items-center gap-1 shrink-0 pt-1">
                            {/* Nút sinh AI nhanh cho riêng học sinh này */}
                            <button
                              type="button"
                              disabled={isGeneratingCurrent}
                              onClick={() => handleGenerateStudentComment(student.id, studentLevel)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                              title={`Tự động viết lại nhận xét cho ${student.name} (${studentLevel === 'ngan_gon' ? 'Ngắn gọn' : 'Chi tiết'})`}
                            >
                              {isGeneratingCurrent ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Nút chỉnh sửa bút chì */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(student.id, note)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                              title="Chỉnh sửa nội dung nhận xét"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
