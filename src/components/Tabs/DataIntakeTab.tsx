import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
  HelpCircle,
  Calendar,
  Send,
  RotateCcw,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Student, BaremRule, BehaviorRecord, WeeklyReport } from '../../types';
import { SAMPLE_OCR_SDB_TEXT } from '../../data/defaultData';
import { detectWeekFromScannedContent, getWeekCycleInfo, SCHOOL_YEAR_WEEKS } from '../../utils/timeCycle';

interface DataIntakeTabProps {
  students: Student[];
  baremRules: BaremRule[];
  currentWeek: number;
  onApplyWeekData: (report: WeeklyReport, newRecords: BehaviorRecord[]) => void;
  onNavigateToReport: () => void;
}

export type IntakeWorkflowStage = 'idle' | 'step1_confirmation' | 'step2_confirmed';

export const DataIntakeTab: React.FC<DataIntakeTabProps> = ({
  students,
  baremRules,
  currentWeek,
  onApplyWeekData,
  onNavigateToReport,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'text'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek + 1 <= 35 ? currentWeek + 1 : currentWeek);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAmbiguities, setResolvedAmbiguities] = useState<Record<string, string>>({});

  // PHẦN 1: QUY TRÌNH NẠP DỮ LIỆU & BẮT BUỘC HỎI XÁC NHẬN TUẦN
  const [workflowStage, setWorkflowStage] = useState<IntakeWorkflowStage>('idle');
  const [detectedTime, setDetectedTime] = useState<{
    detectedWeek: number;
    detectedMonth: number;
    detectedSemester: 1 | 2;
    startDateStr: string;
    endDateStr: string;
    dateRange: string;
  } | null>(null);
  const [assignedWeek, setAssignedWeek] = useState<number>(currentWeek + 1 <= 35 ? currentWeek + 1 : currentWeek);
  const [commandQuery, setCommandQuery] = useState<string>('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [finalReportSaved, setFinalReportSaved] = useState<WeeklyReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setImageMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setError(null);
      setWorkflowStage('idle');
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFileName(file.name);
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setError(null);
        setWorkflowStage('idle');
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSample = () => {
    setActiveMode('text');
    setTextInput(SAMPLE_OCR_SDB_TEXT);
    setSelectedWeek(4);
    setError(null);
    setWorkflowStage('idle');
    setAnalysisResult(null);
  };

  // BƯỚC 1: QUÉT & PHÂN TÍCH NHẬP MÔN
  const handleAnalyze = async () => {
    if (activeMode === 'upload' && !selectedImage) {
      setError('Vui lòng chọn hoặc kéo thả ảnh chụp Sổ đầu bài / Sổ trực cờ đỏ');
      return;
    }
    if (activeMode === 'text' && !textInput.trim()) {
      setError('Vui lòng nhập nội dung văn bản ghi nhận từ sổ');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCommandFeedback(null);
    setLoadingStep('Đang gửi dữ liệu đến Gemini 3.1 Pro...');

    try {
      setTimeout(() => setLoadingStep('Đang bóc tách 4 trường chuẩn SCN & đối chiếu Roster...'), 1200);
      setTimeout(() => setLoadingStep('Đang áp dụng Barem điểm & phân tích thời gian theo 35 tuần học...'), 2600);

      const payload = {
        imageBase64: activeMode === 'upload' ? selectedImage : undefined,
        mimeType: imageMimeType,
        textInput: activeMode === 'text' ? textInput : undefined,
        roster: students,
        baremRules: baremRules,
        weekNumber: selectedWeek,
        academicYear: '2026-2027',
        semester: selectedWeek <= 18 ? 1 : 2,
      };

      const response = await fetch('/api/analyze-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${response.status})`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        const rawText = (activeMode === 'text' ? textInput : '') + ' ' + (resData.data.dateRange || '');
        const detected = detectWeekFromScannedContent(rawText, resData.data.events || []);

        setAnalysisResult(resData.data);
        setDetectedTime({
          detectedWeek: detected.detectedWeek,
          detectedMonth: detected.detectedMonth,
          detectedSemester: detected.detectedSemester,
          startDateStr: detected.startDateStr,
          endDateStr: detected.endDateStr,
          dateRange: detected.detectedDateRange,
        });
        setAssignedWeek(detected.detectedWeek);
        setWorkflowStage('step1_confirmation');
      } else {
        throw new Error('Dữ liệu trả về không đúng định dạng');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Có lỗi xảy ra trong quá trình phân tích');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleConfirmAmbiguity = (rawName: string, chosenStudentName: string) => {
    const student = students.find((s) => s.name === chosenStudentName);
    setResolvedAmbiguities((prev) => ({
      ...prev,
      [rawName]: chosenStudentName,
    }));

    if (analysisResult && student) {
      const updatedEvents = analysisResult.events.map((ev: any) => {
        if (ev.studentName === rawName) {
          return {
            ...ev,
            studentName: student.name,
            studentId: student.id,
            stt: student.stt,
          };
        }
        return ev;
      });
      setAnalysisResult({
        ...analysisResult,
        events: updatedEvents,
      });
    }
  };

  // Command input submission for Step 1
  const handleCommandSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = commandQuery.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === 'xác nhận' || cmd === 'xac nhan' || cmd === 'đồng ý' || cmd === 'dong y' || cmd === 'ok') {
      executeOfficialRecording(assignedWeek);
      setCommandFeedback(`Đã xác nhận lưu chính thức vào Tuần ${assignedWeek}!`);
      return;
    }

    // Match "Đổi thành Tuần [Z]" or "Tuần [Z]"
    const changeMatch = cmd.match(/(?:đổi\s*thành\s*tuần|doi\s*thanh\s*tuan|tuần|tuan)\s*(\d{1,2})/i);
    if (changeMatch) {
      const newW = parseInt(changeMatch[1], 10);
      if (newW >= 1 && newW <= 35) {
        setAssignedWeek(newW);
        setCommandFeedback(`Đã đổi tuần học thành: Tuần ${newW}. Bấm "Xác nhận" để lưu chính thức.`);
        return;
      }
    }

    setCommandFeedback('Lệnh không nhận dạng. Thầy/Cô gõ "Xác nhận" hoặc "Đổi thành Tuần [Z]" (từ 1 đến 35).');
  };

  // BƯỚC 2: GHI NHẬN CHÍNH THỨC
  const executeOfficialRecording = (targetWeek: number) => {
    if (!analysisResult) return;

    const weekInfo = getWeekCycleInfo(targetWeek);

    // Convert events to BehaviorRecord array
    const newRecords: BehaviorRecord[] = (analysisResult.events || []).map((ev: any, index: number) => {
      const matched = students.find((s) => s.name === ev.studentName) || students.find((s) => s.stt === ev.stt);
      return {
        id: `rec_ai_${Date.now()}_${index}`,
        studentId: matched?.id || `hs_${index + 1}`,
        studentName: matched?.name || ev.studentName,
        dayOfWeek: ev.dayOfWeek || 'Thứ Hai',
        date: ev.date || `${detectedTime?.startDateStr || '21/09'}/2026`,
        period: Number(ev.period) || 1,
        subject: ev.subject || 'Chung',
        behavior: ev.behavior || '',
        category: ev.category || 'khac',
        pointsImpact: Number(ev.pointsImpact) || 0,
        educationalMeasure: ev.educationalMeasure || 'Nhắc nhở, rút kinh nghiệm',
        severity: ev.severity || 'nhe',
        weekNumber: targetWeek,
        semester: weekInfo.semester,
        month: weekInfo.monthNumber,
        timestamp: new Date().toISOString(),
      };
    });

    const collData = analysisResult.collectiveCompetition || {
      startingPoints: analysisResult.startingPoints || 100,
      periodDeductions: analysisResult.periodDeductions || 0,
      redStarDeductions: analysisResult.redStarDeductions || (analysisResult.totalDeductions || 0),
      bonusPoints: analysisResult.bonusPoints || (analysisResult.totalBonuses || 0),
      finalScore: analysisResult.finalScore || 100,
      estimatedRank: analysisResult.estimatedRank || 'Hạng 1',
      periodDeductionDetails: analysisResult.periodDeductionDetails || [],
      redStarDeductionDetails: analysisResult.redStarDeductionDetails || [],
      bonusDetails: analysisResult.bonusDetails || [],
    };

    const monthlyAlertsList = (analysisResult.monthlyAlerts || analysisResult.parentAlerts || []).map((pa: any) => {
      const studentObj = students.find((s) => s.name === pa.studentName);
      return {
        ...pa,
        studentId: studentObj?.id || 'hs_unknown',
        stt: studentObj?.stt || pa.stt || 0,
        group: studentObj?.group || pa.group || 'Tổ 1',
        phone: studentObj?.parentPhone || '09123456xx',
        parentName: studentObj?.parentName || 'Phụ huynh',
        monthNumber: weekInfo.monthNumber,
        monthName: weekInfo.monthName,
        cumulativeErrorsCount: pa.cumulativeErrorsCount || pa.weeklyErrorsCount || 3,
      };
    });

    const generatedReport: WeeklyReport = {
      id: `rep_w${String(targetWeek).padStart(2, '0')}`,
      weekNumber: targetWeek,
      monthNumber: weekInfo.monthNumber,
      monthName: weekInfo.monthName,
      academicYear: '2026-2027',
      semester: weekInfo.semester,
      dateRange: detectedTime ? `Từ ${detectedTime.startDateStr}/2026 đến ${detectedTime.endDateStr}/2026` : weekInfo.dateRange,
      startingPoints: collData.startingPoints,
      totalDeductions: analysisResult.totalDeductions || collData.redStarDeductions + collData.periodDeductions,
      totalBonuses: collData.bonusPoints,
      finalScore: collData.finalScore,
      estimatedRank: collData.estimatedRank,
      collectiveCompetition: collData,
      studentProblemsSummary: analysisResult.studentProblemsSummary || {
        indicators13: analysisResult.indicators || [],
        personalViolations: analysisResult.events || [],
      },
      monthlyAlerts: monthlyAlertsList,
      indicators: analysisResult.indicators || [],
      parentAlerts: monthlyAlertsList,
      scnJournalEntries: analysisResult.scnJournalEntries || [],
      tt22Forecast: analysisResult.tt22Forecast || {
        atRiskStudents: [],
        exemplaryStudents: [],
        homeroomFocusPoints: [],
      },
      createdAt: new Date().toISOString(),
    };

    onApplyWeekData(generatedReport, newRecords);
    setFinalReportSaved(generatedReport);
    setWorkflowStage('step2_confirmed');
  };

  const handleResetIntake = () => {
    setWorkflowStage('idle');
    setAnalysisResult(null);
    setDetectedTime(null);
    setSelectedImage(null);
    setImageFileName('');
    setCommandFeedback(null);
    setCommandQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-cyan-200 border border-blue-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Mô hình Gemini 3.1 Pro • Quy trình 2 Bước Kiểm soát Thời gian Chuẩn SCN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            Bóc tách Dữ liệu Sổ Đầu Bài &amp; Sổ Trực Cờ Đỏ
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hệ thống tự động quét nhận diện ngày tháng, đối chiếu danh sách lớp 7A1, bóc tách chuẩn 4 trường{' '}
            <strong className="text-white bg-blue-800/60 px-1.5 py-0.5 rounded font-mono text-xs">
              [Ngày/Thứ] - [Tiết] - [Môn] - [Hành vi cụ thể]
            </strong>
            . AI tuân thủ nguyên tắc <strong>bắt buộc xác nhận tuần học trước khi lưu</strong> để bảo đảm tính toàn vẹn của 35 tuần học.
          </p>
        </div>
      </div>

      {/* Input Selection & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                activeMode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Ảnh chụp sổ (Upload/Chụp ảnh)</span>
            </button>
            <button
              onClick={() => setActiveMode('text')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                activeMode === 'text' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Văn bản / Nhập tay sổ</span>
            </button>
          </div>

          {/* Quick Sample loader */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nạp dữ liệu mẫu Sổ Tuần 4</span>
            </button>
          </div>
        </div>

        {/* Upload Mode UI */}
        {activeMode === 'upload' && (
          <div className="mt-5 space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[190px]"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {selectedImage ? (
                <div className="relative group max-w-md w-full">
                  <img
                    src={selectedImage}
                    alt="Sổ preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md border border-slate-200 object-contain"
                  />
                  <div className="mt-2 text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{imageFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setImageFileName('');
                        setWorkflowStage('idle');
                        setAnalysisResult(null);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Nhấp vào để đổi ảnh khác</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Tải lên ảnh chụp Sổ đầu bài hoặc Sổ cờ đỏ
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Kéo thả ảnh vào đây, hoặc chụp trực tiếp từ điện thoại / máy tính (PNG, JPG, HEIC)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-500 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Chọn tệp ảnh</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Input Mode UI */}
        {activeMode === 'text' && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Dán nội dung trích xuất hoặc ghi chú từ Sổ đầu bài / Sổ sao đỏ:</span>
              <span>{textInput.length} ký tự</span>
            </div>
            <textarea
              rows={8}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setWorkflowStage('idle');
                setAnalysisResult(null);
              }}
              placeholder={`Ví dụ định dạng sổ:
Thứ Hai (21/09/2026):
- Tiết 1, Toán (Cô Hương): Lê Hoàng Nam nói chuyện riêng bị nhắc nhở. Trần Bảo Châu điểm 10 miệng.
- Tiết 4, Tiếng Anh (Cô Lan): Bùi Gia Huy đi học muộn 15 phút, quên vở ghi...`}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Đối chiếu thực thể với danh sách chính thức 36 học sinh</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{loadingStep || 'Đang xử lý...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Bắt đầu Bóc tách Dữ liệu (Gemini 3.1 Pro)</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          BƯỚC 1: QUÉT & PHÂN TÍCH NHẬP MÔN & BẮT BUỘC HỎI XÁC NHẬN TUẦN
          ========================================================================= */}
      {workflowStage === 'step1_confirmation' && analysisResult && detectedTime && (
        <div className="bg-white rounded-2xl border-2 border-blue-400 p-6 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Header step marker */}
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>BƯỚC 1 / 2: QUÉT &amp; PHÂN TÍCH NHẬP MÔN • BẮT BUỘC XÁC NHẬN TUẦN</span>
            </div>
            <span className="text-xs text-slate-500">
              (Hệ thống chưa lưu đè, đang đợi GVCN xác nhận)
            </span>
          </div>

          {/* Mandatory Dialogue Card as requested */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border-l-4 border-blue-600 rounded-r-xl p-5 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  "EduMaster AI đã phân tích xong dữ liệu từ ngày{' '}
                  <span className="text-blue-700 underline underline-offset-2">
                    {detectedTime.startDateStr}
                  </span>{' '}
                  đến{' '}
                  <span className="text-blue-700 underline underline-offset-2">
                    {detectedTime.endDateStr}
                  </span>
                  . Dữ liệu này được xác định thuộc:{' '}
                  <span className="text-indigo-800 font-black px-2 py-0.5 bg-indigo-100 rounded-md">
                    TUẦN {assignedWeek} (THÁNG {getWeekCycleInfo(assignedWeek).monthNumber})
                  </span>
                  ."
                </h4>
                <p className="text-sm font-semibold text-blue-900">
                  👉 Thầy/Cô có xác nhận lưu chính thức vào TUẦN {assignedWeek} không?
                </p>
                <p className="text-xs text-slate-600 italic">
                  (Gõ 'Xác nhận' để lưu, hoặc gõ 'Đổi thành Tuần [Z]' nếu muốn chỉ định tuần khác. Thầy/Cô cũng có thể bấm các nút thao tác nhanh bên dưới).
                </p>
              </div>
            </div>

            {/* Command Interaction Box */}
            <form onSubmit={handleCommandSubmit} className="pt-2">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={commandQuery}
                    onChange={(e) => setCommandQuery(e.target.value)}
                    placeholder="Gõ lệnh: 'Xác nhận' hoặc 'Đổi thành Tuần 5'..."
                    className="w-full bg-white border-2 border-blue-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi lệnh</span>
                </button>
              </div>
              {commandFeedback && (
                <p className="text-xs font-semibold text-blue-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{commandFeedback}</span>
                </p>
              )}
            </form>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-200/60">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeOfficialRecording(assignedWeek)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận lưu chính thức vào TUẦN {assignedWeek}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-slate-600 font-medium">Đổi sang tuần khác:</span>
                  <select
                    value={assignedWeek}
                    onChange={(e) => {
                      const newW = Number(e.target.value);
                      setAssignedWeek(newW);
                      setCommandFeedback(`Đã chuyển chọn sang Tuần ${newW}`);
                    }}
                    className="bg-transparent text-xs font-bold text-blue-700 focus:outline-hidden"
                  >
                    {SCHOOL_YEAR_WEEKS.map((w) => (
                      <option key={w.weekNumber} value={w.weekNumber}>
                        Tuần {w.weekNumber} ({w.monthName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetIntake}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hủy &amp; Quét lại</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Ngày Quét Được
              </span>
              <p className="text-sm font-black text-slate-800 mt-1">
                {detectedTime.startDateStr} → {detectedTime.endDateStr}
              </p>
              <span className="text-[10px] text-slate-400">
                Thuộc Tháng {detectedTime.detectedMonth} (HK {detectedTime.detectedSemester})
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Số Sự Kiện Bóc Tách
              </span>
              <p className="text-sm font-black text-blue-700 mt-1">
                {analysisResult.events?.length || 0} bản ghi
              </p>
              <span className="text-[10px] text-slate-400">Đủ 4 trường SCN chuẩn</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Điểm Thi Đua Tuần
              </span>
              <p className="text-sm font-black text-emerald-700 mt-1">
                {analysisResult.finalScore || analysisResult.collectiveCompetition?.finalScore || 100}/100đ
              </p>
              <span className="text-[10px] text-slate-400">
                {analysisResult.estimatedRank || 'Hạng 1 / 12 lớp'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cảnh Báo Tháng 9
              </span>
              <p className="text-sm font-black text-amber-700 mt-1">
                {(analysisResult.monthlyAlerts || analysisResult.parentAlerts || []).length} học sinh
              </p>
              <span className="text-[10px] text-slate-400">Đạt ngưỡng ≥ 3 lỗi/tháng</span>
            </div>
          </div>

          {/* Ambiguity Resolution if any exists */}
          {analysisResult.ambiguousNames && analysisResult.ambiguousNames.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Phát hiện tên học sinh có thể trùng hoặc viết tắt – Vui lòng xác nhận:</span>
              </div>
              <div className="space-y-2">
                {analysisResult.ambiguousNames.map((amb: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Tên trong sổ: "{amb.rawName}"</span>
                      <span className="text-slate-500 ml-2">({amb.context})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className="text-slate-600">Chọn đúng học sinh:</span>
                      <select
                        value={resolvedAmbiguities[amb.rawName] || ''}
                        onChange={(e) => handleConfirmAmbiguity(amb.rawName, e.target.value)}
                        className="bg-amber-50 border border-amber-300 rounded px-2 py-1 font-medium text-amber-900"
                      >
                        <option value="">-- Chọn học sinh --</option>
                        {(amb.possibleCandidates || []).map((candName: string, cIdx: number) => (
                          <option key={cIdx} value={candName}>
                            {candName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted 4-Field Events Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Chi Tiết Bóc Tách 4 Trường Bắt Buộc (Sẽ Lưu Vào Tuần {assignedWeek})</span>
                <span className="text-xs text-slate-500 font-normal">
                  ({analysisResult.events?.length || 0} sự kiện)
                </span>
              </h4>
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                [Ngày/Thứ] - [Tiết] - [Môn] - [Hành vi cụ thể]
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Thời gian (Ngày/Thứ)</th>
                    <th className="py-2.5 px-3">Tiết</th>
                    <th className="py-2.5 px-3">Môn học</th>
                    <th className="py-2.5 px-3">Họ và tên HS</th>
                    <th className="py-2.5 px-3">Hành vi cụ thể (Chi tiết)</th>
                    <th className="py-2.5 px-3">Tác động Barem</th>
                    <th className="py-2.5 px-3">Biện pháp giáo dục sư phạm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analysisResult.events || []).map((ev: any, idx: number) => {
                    const isReward = ev.pointsImpact > 0;
                    return (
                      <tr key={idx} className={isReward ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {ev.dayOfWeek} ({ev.date})
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">Tiết {ev.period}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{ev.subject}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {ev.studentName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{ev.behavior}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              isReward
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ev.pointsImpact > 0 ? `+${ev.pointsImpact}đ` : `${ev.pointsImpact}đ`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic">{ev.educationalMeasure}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 2: GHI NHẬN CHÍNH THỨC THÀNH CÔNG
          ========================================================================= */}
      {workflowStage === 'step2_confirmed' && finalReportSaved && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>BƯỚC 2: GHI NHẬN CHÍNH THỨC THÀNH CÔNG</span>
              </div>
              <h3 className="text-lg font-black text-emerald-950">
                Dữ Liệu Đã Được Lưu Chính Thức Vào TUẦN {finalReportSaved.weekNumber}!
              </h3>
              <p className="text-sm text-emerald-800 leading-relaxed">
                EduMaster AI đã nạp toàn bộ số liệu vào cơ sở dữ liệu của{' '}
                <strong>TUẦN {finalReportSaved.weekNumber} ({finalReportSaved.monthName})</strong>. Hệ thống đã tự động cập nhật lũy kế vào{' '}
                <strong>{finalReportSaved.monthName}</strong> và{' '}
                <strong>Học kỳ {finalReportSaved.semester}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-emerald-200">
            <button
              onClick={onNavigateToReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition"
            >
              <span>Xem Báo Cáo Tuần {finalReportSaved.weekNumber} Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetIntake}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold transition"
            >
              Nạp tiếp sổ tuần khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
