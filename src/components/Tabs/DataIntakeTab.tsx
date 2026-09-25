import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  RefreshCw,
  Search,
  Copy,
  Download,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  AlertCircle,
  Clock,
  UserCheck,
  ChevronRight,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Student, BehaviorRecord, WeeklyReport, ViolationCategory } from '../../types';
import { SAMPLE_OCR_SDB_TEXT } from '../../data/defaultData';
import { detectWeekFromScannedContent, getWeekCycleInfo, SCHOOL_YEAR_WEEKS } from '../../utils/timeCycle';
import { hasGeminiApiKey } from '../../utils/geminiApiKey';
import { analyzeRecordWithGemini } from '../../services/geminiService';

interface DataIntakeTabProps {
  students: Student[];
  currentWeek: number;
  records?: BehaviorRecord[];
  reports?: WeeklyReport[];
  onUpdateRecords?: (newRecords: BehaviorRecord[]) => void;
  onApplyWeekData: (report: WeeklyReport, newRecords: BehaviorRecord[]) => void;
  onNavigateToReport: () => void;
  className?: string;
  onRequireApiKey?: () => void;
  baremRules?: any[];
}

type CategoryFilter = 'all' | 'hoc_tap' | 'dong_phuc' | 'di_muon' | 've_sinh' | 'mat_trat_tu';

export const DataIntakeTab: React.FC<DataIntakeTabProps> = ({
  students,
  currentWeek,
  records = [],
  reports = [],
  onUpdateRecords,
  onApplyWeekData,
  onNavigateToReport,
  className = '9.5',
  onRequireApiKey,
}) => {
  // Input Modes
  const [activeMode, setActiveMode] = useState<'upload' | 'text'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Loading & Dynamic Progress Stages
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<number>(0);
  const [loadingStepText, setLoadingStepText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Bảng Đối Soát Sau Khi Quét (Review Modal)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [assignedWeek, setAssignedWeek] = useState<number>(currentWeek);
  const [detectedDateRange, setDetectedDateRange] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [rawAnalysisData, setRawAnalysisData] = useState<any>(null);

  // Table Filters & Search in Khối 3
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>('all');

  // Manual Add / Edit Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<BehaviorRecord | null>(null);
  const [manualStudentName, setManualStudentName] = useState<string>('');
  const [manualDay, setManualDay] = useState<string>('Thứ Hai');
  const [manualPeriod, setManualPeriod] = useState<number>(1);
  const [manualSubject, setManualSubject] = useState<string>('Toán');
  const [manualBehavior, setManualBehavior] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<ViolationCategory>('hoc_tap');
  const [manualTeacherNote, setManualTeacherNote] = useState<string>('');

  const displayClassName = className ? (className.startsWith('Lớp') ? className : `Lớp ${className}`) : 'Lớp 9.5';

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // =========================================================================
  // XỬ LÝ KÉO THẢ & CHỌN TỆP ẢNH
  // =========================================================================
  const processImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh (JPG, PNG, HEIC)');
      return;
    }

    setError(null);
    setImageMimeType(file.type);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setActiveMode('text');
    setTextInput(SAMPLE_OCR_SDB_TEXT);
    setError(null);
    showToast('Đã nạp văn bản mẫu Sổ Đầu Bài Tuần 4!');
  };

  // =========================================================================
  // BẮT ĐẦU BÓC TÁCH GEMINI 3.8 FLASH (KHÔNG TÍNH ĐIỂM SỐ)
  // =========================================================================
  const handleStartScan = async () => {
    if (!hasGeminiApiKey()) {
      setError('⚠️ Bạn chưa cài đặt Gemini API Key. Vui lòng bấm vào nút [🔑 API Key] trên thanh tiêu đề.');
      if (onRequireApiKey) onRequireApiKey();
      return;
    }

    if (activeMode === 'upload' && !selectedImage) {
      setError('Vui lòng chọn hoặc kéo thả ảnh Sổ Đầu Bài trước khi quét.');
      return;
    }

    if (activeMode === 'text' && !textInput.trim()) {
      setError('Vui lòng nhập văn bản ghi nhận từ Sổ Đầu Bài trước khi quét.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgressStage(1);
    setLoadingStepText('Đang tải ảnh & kết nối Gemini 3.8 Flash...');

    const timer1 = setTimeout(() => {
      setProgressStage(2);
      setLoadingStepText('Đang nhận diện chữ viết tay & bóc tách các trường: Ngày, Tiết/Môn, Học sinh, Lỗi vi phạm, Nhận xét GVBM...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setProgressStage(3);
      setLoadingStepText('Đang đối chiếu danh sách lớp & phân loại nề nếp...');
    }, 2800);

    try {
      const payload = {
        imageBase64: activeMode === 'upload' ? selectedImage || undefined : undefined,
        mimeType: imageMimeType,
        textInput: activeMode === 'text' ? textInput : undefined,
        roster: students,
        weekNumber: currentWeek,
        academicYear: '2026-2027',
        semester: currentWeek <= 18 ? 1 : 2,
      };

      const result = await analyzeRecordWithGemini(payload, (statusMsg) => {
        setLoadingStepText(statusMsg);
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      setProgressStage(3);

      if (result) {
        const rawText = (activeMode === 'text' ? textInput : '') + ' ' + (result.dateRange || '');
        const detected = detectWeekFromScannedContent(rawText, result.events || []);

        setRawAnalysisData(result);
        setAssignedWeek(detected.detectedWeek || currentWeek);
        setDetectedDateRange(result.dateRange || detected.detectedDateRange || `Tuần ${detected.detectedWeek}`);

        // Chuẩn bị danh sách sự kiện trích xuất KHÔNG GÁN ĐIỂM SỐ
        const initialEvents = (result.events || []).map((ev: any, idx: number) => {
          const matched = students.find((s) => s.name.toLowerCase() === (ev.studentName || '').toLowerCase());
          return {
            id: `temp_ev_${idx}_${Date.now()}`,
            dayOfWeek: ev.dayOfWeek || 'Thứ Hai',
            date: ev.date || detected.startDateStr || '21/09/2026',
            period: Number(ev.period) || 1,
            subject: ev.subject || 'Toán',
            studentName: matched ? matched.name : (ev.studentName || 'Cả lớp'),
            behavior: ev.behavior || '',
            teacherNote: ev.teacherNote || ev.educationalMeasure || '',
            category: ev.category || 'hoc_tap',
            isHandled: false,
          };
        });

        setExtractedItems(initialEvents);
        // Mở popup Bảng Ghi Nhận Nề Nếp & Vi Phạm Trong Tuần
        setIsReviewModalOpen(true);
      } else {
        throw new Error('Không nhận được dữ liệu phản hồi hợp lệ từ AI');
      }
    } catch (err: any) {
      console.error(err);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (err?.isKeyError || err?.message === 'NO_API_KEY' || err?.status === 401) {
        if (onRequireApiKey) onRequireApiKey();
        setError('❌ API Key không hợp lệ hoặc đã hết hạn mức. Vui lòng bấm vào nút [🔑 API Key] để cập nhật.');
      } else {
        setError(err?.message || 'Có lỗi xảy ra trong quá trình quét. Thử lại với ảnh rõ nét hơn.');
      }
    } finally {
      setIsLoading(false);
      setProgressStage(0);
      setLoadingStepText('');
    }
  };

  // =========================================================================
  // XÁC NHẬN LƯU VÀO TUẦN (TỪ BẢNG ĐỐI SOÁT MODAL)
  // =========================================================================
  const handleConfirmSaveExtracted = () => {
    if (!rawAnalysisData) return;

    const weekInfo = getWeekCycleInfo(assignedWeek);
    const newRecords: BehaviorRecord[] = extractedItems.map((item, index) => {
      const studentObj = students.find((s) => s.name === item.studentName);
      return {
        id: `rec_${Date.now()}_${index}`,
        studentId: studentObj?.id || `hs_${index + 1}`,
        studentName: studentObj?.name || item.studentName,
        dayOfWeek: item.dayOfWeek,
        date: item.date,
        period: Number(item.period) || 1,
        subject: item.subject,
        behavior: item.behavior,
        category: (item.category || 'hoc_tap') as ViolationCategory,
        pointsImpact: 0, // Không gán điểm số
        educationalMeasure: item.teacherNote || 'Nhắc nhở nề nếp',
        severity: 'nhe',
        weekNumber: assignedWeek,
        semester: weekInfo.semester,
        month: weekInfo.monthNumber,
        timestamp: new Date().toISOString(),
        isReminded: !!item.isHandled,
        isParentContacted: false,
      };
    });

    const newReport: WeeklyReport = {
      id: `rep_w${String(assignedWeek).padStart(2, '0')}`,
      weekNumber: assignedWeek,
      monthNumber: weekInfo.monthNumber,
      monthName: weekInfo.monthName,
      academicYear: '2026-2027',
      semester: weekInfo.semester,
      dateRange: detectedDateRange || weekInfo.dateRange,
      startingPoints: 100,
      totalDeductions: 0,
      totalBonuses: 0,
      finalScore: 100,
      estimatedRank: 'Hoàn thành',
      collectiveCompetition: {
        startingPoints: 100,
        periodDeductions: 0,
        saoDoDeductions: 0,
        finalScore: 100,
        estimatedRank: 'Đạt nề nếp',
      },
      studentProblemsSummary: {
        indicators13: [],
        personalViolations: newRecords,
      },
      indicators: [],
      monthlyAlerts: rawAnalysisData.monthlyParentAlerts || [],
      parentAlerts: rawAnalysisData.monthlyParentAlerts || [],
      scnJournalEntries: rawAnalysisData.scnJournalEntries || [],
      tt22Forecast: rawAnalysisData.tt22Forecast || {
        atRiskStudents: [],
        exemplaryStudents: [],
        homeroomFocusPoints: [],
      },
      createdAt: new Date().toISOString(),
    };

    onApplyWeekData(newReport, newRecords);
    setIsReviewModalOpen(false);
    showToast(`✅ Đã lưu thành công ${newRecords.length} lượt ghi nhận nề nếp vào Tuần ${assignedWeek}!`);
  };

  // =========================================================================
  // KHỐI 2: THỐNG KÊ PHỤC VỤ GIÁO VIÊN CHỦ NHIỆM (ĐÁNH GIÁ THEO TT22)
  // =========================================================================
  const weekRecords = useMemo(() => {
    return records.filter((r) => r.weekNumber === currentWeek);
  }, [records, currentWeek]);

  // 1. Tổng số lượt vi phạm trong tuần phân theo loại
  const violationsByType = useMemo(() => {
    const stats = {
      hocTap: 0,
      dongPhuc: 0,
      diTre: 0,
      veSinh: 0,
      matTratTu: 0,
    };

    weekRecords.forEach((r) => {
      const cat = r.category as string;
      const bText = (r.behavior || '').toLowerCase();

      if (cat === 'quen_bai' || cat === 'diem_duoi_5' || cat === 'hoc_tap' || bText.includes('bài tập') || bText.includes('vở ghi')) {
        stats.hocTap += 1;
      } else if (cat === 'khong_dong_phuc' || cat === 'dong_phuc' || bText.includes('đồng phục') || bText.includes('khăn quàng')) {
        stats.dongPhuc += 1;
      } else if (cat === 'di_muon' || cat === 'nghi_hoc' || cat === 'bo_tiet' || bText.includes('muộn') || bText.includes('trễ')) {
        stats.diTre += 1;
      } else if (cat === 've_sinh' || bText.includes('vệ sinh') || bText.includes('rác')) {
        stats.veSinh += 1;
      } else {
        stats.matTratTu += 1;
      }
    });

    return stats;
  }, [weekRecords]);

  // 2. Top học sinh vi phạm nhiều lần trong tuần (để GVCN nhắc nhở, liên hệ phụ huynh)
  const topViolators = useMemo(() => {
    const counts: { [name: string]: { count: number; issues: string[]; studentObj?: Student } } = {};
    weekRecords.forEach((r) => {
      if (r.studentName === 'Cả lớp') return;
      if (!counts[r.studentName]) {
        const studentObj = students.find((s) => s.name === r.studentName);
        counts[r.studentName] = { count: 0, issues: [], studentObj };
      }
      counts[r.studentName].count += 1;
      if (counts[r.studentName].issues.length < 2) {
        counts[r.studentName].issues.push(r.behavior);
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        issues: data.issues.join('; '),
        group: data.studentObj?.group || 1,
        phone: data.studentObj?.parentPhone,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [weekRecords, students]);

  // 3. Tỷ lệ rèn luyện học sinh tốt trong tuần
  const conductOverview = useMemo(() => {
    const totalStudents = students.length || 36;
    const violatorsCount = new Set(weekRecords.filter((r) => r.studentName !== 'Cả lớp').map((r) => r.studentName)).size;
    const goodStudentsCount = Math.max(0, totalStudents - violatorsCount);
    const goodPercentage = Math.round((goodStudentsCount / totalStudents) * 100);

    return {
      goodStudentsCount,
      violatorsCount,
      goodPercentage,
    };
  }, [weekRecords, students]);

  // =========================================================================
  // KHỐI 3: BỘ LỌC VÀ TÌM KIẾM NHẬT KÝ TUẦN
  // =========================================================================
  const filteredRecords = useMemo(() => {
    return weekRecords.filter((r) => {
      // 1. Lọc theo tên học sinh / từ khóa
      if (searchStudent.trim()) {
        const query = searchStudent.toLowerCase().trim();
        const matchName = r.studentName.toLowerCase().includes(query);
        const matchBehavior = r.behavior.toLowerCase().includes(query);
        const matchSubject = r.subject.toLowerCase().includes(query);
        if (!matchName && !matchBehavior && !matchSubject) return false;
      }

      // 2. Lọc theo nhóm phân loại
      const cat = r.category as string;
      const bText = (r.behavior || '').toLowerCase();

      if (selectedCategoryFilter === 'hoc_tap') {
        return cat === 'quen_bai' || cat === 'diem_duoi_5' || cat === 'hoc_tap' || bText.includes('bài tập');
      }
      if (selectedCategoryFilter === 'dong_phuc') {
        return cat === 'khong_dong_phuc' || bText.includes('đồng phục') || bText.includes('khăn quàng');
      }
      if (selectedCategoryFilter === 'di_muon') {
        return cat === 'di_muon' || cat === 'nghi_hoc' || cat === 'bo_tiet' || bText.includes('muộn');
      }
      if (selectedCategoryFilter === 've_sinh') {
        return cat === 've_sinh' || bText.includes('vệ sinh');
      }
      if (selectedCategoryFilter === 'mat_trat_tu') {
        return cat === 'mat_trat_tu' || bText.includes('nói chuyện') || bText.includes('trật tự');
      }

      return true;
    });
  }, [weekRecords, searchStudent, selectedCategoryFilter]);

  // Toggle trạng thái Đã xử lý / Nhắc nhở (checkbox)
  const handleToggleHandled = (recordId: string) => {
    if (!onUpdateRecords) return;
    const updated = records.map((r) => {
      if (r.id === recordId) {
        return { ...r, isReminded: !r.isReminded };
      }
      return r;
    });
    onUpdateRecords(updated);
  };

  // Xóa một lượt ghi nhận
  const handleDeleteRecord = (recordId: string) => {
    if (!onUpdateRecords) return;
    if (window.confirm('Thầy/Cô có chắc chắn muốn xóa lượt ghi nhận này?')) {
      const updated = records.filter((r) => r.id !== recordId);
      onUpdateRecords(updated);
      showToast('Đã xóa ghi nhận nề nếp!');
    }
  };

  // Mở modal sửa nhanh
  const handleOpenEditRecord = (record: BehaviorRecord) => {
    setEditingRecord(record);
    setManualStudentName(record.studentName);
    setManualDay(record.dayOfWeek);
    setManualPeriod(record.period);
    setManualSubject(record.subject);
    setManualBehavior(record.behavior);
    setManualCategory(record.category);
    setManualTeacherNote(record.educationalMeasure || '');
    setIsManualModalOpen(true);
  };

  // Lưu chỉnh sửa hoặc thêm mới thủ công
  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentName.trim() || !manualBehavior.trim()) return;
    if (!onUpdateRecords) return;

    const matched = students.find((s) => s.name === manualStudentName);

    if (editingRecord) {
      const updated = records.map((r) => {
        if (r.id === editingRecord.id) {
          return {
            ...r,
            studentName: manualStudentName,
            studentId: matched?.id || r.studentId,
            dayOfWeek: manualDay,
            period: Number(manualPeriod),
            subject: manualSubject,
            behavior: manualBehavior,
            category: manualCategory,
            educationalMeasure: manualTeacherNote,
          };
        }
        return r;
      });
      onUpdateRecords(updated);
      showToast('Đã cập nhật thông tin ghi nhận!');
    } else {
      const weekInfo = getWeekCycleInfo(currentWeek);
      const newRec: BehaviorRecord = {
        id: `rec_manual_${Date.now()}`,
        studentId: matched?.id || `hs_${Date.now()}`,
        studentName: manualStudentName,
        dayOfWeek: manualDay,
        date: `${new Date().getDate()}/${new Date().getMonth() + 1}/2026`,
        period: Number(manualPeriod),
        subject: manualSubject,
        behavior: manualBehavior,
        category: manualCategory,
        pointsImpact: 0,
        educationalMeasure: manualTeacherNote || 'Nhắc nhở nề nếp',
        severity: 'nhe',
        weekNumber: currentWeek,
        semester: weekInfo.semester,
        month: weekInfo.monthNumber,
        timestamp: new Date().toISOString(),
        isReminded: false,
      };
      onUpdateRecords([...records, newRec]);
      showToast(`Đã thêm ghi nhận cho em ${manualStudentName}!`);
    }

    setIsManualModalOpen(false);
    setEditingRecord(null);
  };

  // Sao chép báo cáo Zalo gửi phụ huynh
  const handleCopyZaloReport = () => {
    let msg = `📢 BÁO CÁO NỀ NẾP & HỌC TẬP - LỚP ${displayClassName} (TUẦN ${currentWeek})\n`;
    msg += `Kính gửi Quý phụ huynh tình hình học tập và sinh hoạt của lớp tuần qua:\n\n`;

    if (weekRecords.length === 0) {
      msg += `Tuần này các em duy trì nề nếp rất tốt, không có trường hợp vi phạm cần lưu ý. Cảm ơn sự đồng hành của gia đình ạ!\n`;
    } else {
      msg += `Danh sách các em cần gia đình phối hợp nhắc nhở thêm tại nhà:\n`;
      weekRecords.forEach((r, idx) => {
        msg += `${idx + 1}. Em ${r.studentName} (${r.dayOfWeek}, Tiết ${r.period} môn ${r.subject}): ${r.behavior}\n`;
      });
      msg += `\nThầy/Cô kính mong quý phụ huynh dành thời gian trò chuyện để các em chấn chỉnh nề nếp, đảm bảo kết quả rèn luyện tốt trong tuần tới ạ.`;
    }

    navigator.clipboard.writeText(msg);
    showToast('📋 Đã sao chép nội dung báo cáo Zalo vào Clipboard!');
  };

  // Xuất file CSV / Excel
  const handleExportCsv = () => {
    let csv = `STT,Thu,Ngay,Tiet,Mon,Hoc_Sinh,Noi_Dung_Vi_Pham,Nhan_Xet_GVBM,Trang_Thai_Xu_Ly\n`;
    weekRecords.forEach((r, idx) => {
      csv += `${idx + 1},"${r.dayOfWeek}","${r.date}","Tiết ${r.period}","${r.subject}","${r.studentName}","${r.behavior}","${r.educationalMeasure || ''}","${r.isReminded ? 'Đã xử lý' : 'Chưa'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nhat_ky_ne_nep_Lop_${className}_Tuan_${currentWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Đã tải xuống tệp dữ liệu CSV!');
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          KHỐI 1: TẢI & BÓC TÁCH SỔ ĐẦU BÀI 1-CHẠM (DRAG & DROP)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Header Khối 1 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>⚡ Engine: Gemini 3.8 Flash • Nhật Ký Nề Nếp &amp; Rèn Luyện</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
              Bóc Tách Nhật Ký Nề Nếp &amp; Sổ Đầu Bài Lớp {displayClassName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tự động nhận diện chữ viết tay từ ảnh sổ: <strong>[Ngày/Thứ] - [Tiết/Môn] - [Tên học sinh] - [Lỗi vi phạm] - [Nhận xét GVBM]</strong>. Tuyệt đối không gán điểm số trừ.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeMode === 'upload' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ảnh chụp sổ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeMode === 'text' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Nhập tay sổ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mẫu Tuần 4</span>
            </button>
          </div>
        </div>

        {/* Khung Kéo Thả Ảnh Rộng Rãi */}
        {activeMode === 'upload' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[190px] group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {selectedImage ? (
              <div className="relative group max-w-sm w-full">
                <img
                  src={selectedImage}
                  alt="Sổ preview"
                  className="max-h-56 mx-auto rounded-xl shadow-md border border-slate-200 object-contain"
                />
                <div className="mt-2 text-xs text-slate-700 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="truncate max-w-[200px]">{imageFileName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setImageFileName('');
                    }}
                    className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Nhấn để chọn ảnh khác</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-slate-800">
                    Kéo thả ảnh Sổ Đầu Bài / Sổ Ghi Nhận hoặc bấm để chọn ảnh
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ ảnh chụp điện thoại (PNG, JPG, HEIC) – bóc tách sạch sẽ các lượt vi phạm
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Camera className="w-4 h-4" />
                  <span>Chọn tệp ảnh từ máy</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Mode */}
        {activeMode === 'text' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Nội dung ghi nhận Sổ Đầu Bài:</span>
              <span>{textInput.length} ký tự</span>
            </div>
            <textarea
              rows={6}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Thứ Hai (21/09/2026):
- Tiết 1, Toán (Cô Hương): Lê Hoàng Nam nói chuyện riêng bị nhắc nhở. Trần Bảo Châu điểm 10 miệng.
- Tiết 4, Tiếng Anh (Cô Lan): Bùi Gia Huy đi học muộn 15 phút, quên vở ghi...`}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* Dynamic Progress Bar */}
        {isLoading && (
          <div className="space-y-2 bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 animate-in fade-in">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{loadingStepText || 'Đang xử lý bóc tách...'}</span>
              </span>
              <span className="font-bold text-indigo-600">
                {progressStage === 1 ? '33%' : progressStage === 2 ? '66%' : '100%'}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: progressStage === 1 ? '33%' : progressStage === 2 ? '66%' : '100%',
                }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 text-center pt-1 font-medium">
              <span className={progressStage >= 1 ? 'text-indigo-700 font-bold' : ''}>
                1. Đang tải ảnh
              </span>
              <span className={progressStage >= 2 ? 'text-indigo-700 font-bold' : ''}>
                2. Nhận diện chữ viết tay
              </span>
              <span className={progressStage >= 3 ? 'text-indigo-700 font-bold' : ''}>
                3. Hoàn tất &amp; Đối soát
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Đối chiếu danh sách {students.length} học sinh • Không tự ý trừ điểm</span>
          </div>

          <button
            type="button"
            onClick={handleStartScan}
            disabled={isLoading || (activeMode === 'upload' && !selectedImage) || (activeMode === 'text' && !textInput.trim())}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Bóc Tách...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>[⚡ AI Quét Sổ (Gemini 3.8 Flash)]</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          KHỐI 2: THỐNG KÊ PHỤC VỤ GIÁO VIÊN CHỦ NHIỆM (ĐÁNH GIÁ RÈN LUYỆN TT22)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thẻ 1: Tổng số lượt vi phạm trong tuần phân theo loại */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tuần {currentWeek}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-600 font-semibold">📋 Tổng số lượt vi phạm tuần</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{weekRecords.length}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px] text-slate-600">
            <span>Học tập: <strong className="text-slate-900">{violationsByType.hocTap}</strong></span>
            <span>Đồng phục: <strong className="text-slate-900">{violationsByType.dongPhuc}</strong></span>
            <span>Đi trễ: <strong className="text-slate-900">{violationsByType.diTre}</strong></span>
            <span>Vệ sinh / Khác: <strong className="text-slate-900">{violationsByType.veSinh + violationsByType.matTratTu}</strong></span>
          </div>
        </div>

        {/* Thẻ 2: Top học sinh vi phạm nhiều lần trong tuần */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Cần Lưu Ý / Báo PH
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-600 font-semibold">⚠️ Top học sinh nhắc nhở nhiều lần</p>
            {topViolators.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {topViolators.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => setSearchStudent(s.name)}
                      className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold hover:bg-amber-200 transition text-[11px] cursor-pointer"
                      title="Lọc xem chi tiết"
                    >
                      {s.count} lần • Chi tiết
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold mt-3">
                🎉 Tuần này không có học sinh nào vi phạm nhiều lần.
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dành cho GVCN phối hợp PH</span>
            <button
              onClick={handleCopyZaloReport}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Gửi tin Zalo
            </button>
          </div>
        </div>

        {/* Thẻ 3: Tình hình rèn luyện chung lớp (TT22) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Đánh Giá Rèn Luyện
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-600 font-semibold">🌟 Học sinh nề nếp tốt (0 lỗi)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-emerald-600">{conductOverview.goodStudentsCount}</p>
              <span className="text-xs text-slate-400">/ {students.length || 36} học sinh ({conductOverview.goodPercentage}%)</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">
              Chuẩn Thông tư 22/2021
            </span>
            <button
              onClick={onNavigateToReport}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-0.5 cursor-pointer"
            >
              <span>Xem Sơ Kết</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KHỐI 3: NHẬT KÝ NỀ NẾP CHI TIẾT & BỘ LỌC THÔNG MINH
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Nhật Ký Nề Nếp &amp; Theo Dõi Học Sinh — Tuần {currentWeek}
            </h3>
            <p className="text-xs text-slate-500">
              Có {filteredRecords.length} / {weekRecords.length} lượt ghi nhận nề nếp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyZaloReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>[📋 Sao chép báo cáo Zalo gửi PH]</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>[📥 Xuất Excel]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setManualStudentName(students[0]?.name || '');
                setManualDay('Thứ Hai');
                setManualPeriod(1);
                setManualSubject('Toán');
                setManualBehavior('');
                setManualCategory('hoc_tap');
                setManualTeacherNote('');
                setIsManualModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm ghi nhận</span>
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Gõ tên học sinh để lọc nhanh..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchStudent && (
              <button
                type="button"
                onClick={() => setSearchStudent('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'hoc_tap', label: 'Học tập' },
                { id: 'dong_phuc', label: 'Đồng phục' },
                { id: 'di_muon', label: 'Đi trễ' },
                { id: 've_sinh', label: 'Vệ sinh' },
                { id: 'mat_trat_tu', label: 'Mất trật tự' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategoryFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Table without Score Columns */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3">Cột 1: Thứ / Ngày</th>
                <th className="py-3 px-3">Cột 2: Tiết / Môn học</th>
                <th className="py-3 px-3">Cột 3: Học sinh liên quan</th>
                <th className="py-3 px-4">Cột 4: Nội dung ghi nhận / Lỗi vi phạm</th>
                <th className="py-3 px-3 text-center">Cột 5: Đã xử lý / Nhắc nhở</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const initials = r.studentName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition">
                      {/* Cột 1: Thứ / Ngày */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {r.dayOfWeek} ({r.date})
                        </span>
                      </td>

                      {/* Cột 2: Tiết / Môn học */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Tiết {r.period} • {r.subject}
                        </span>
                      </td>

                      {/* Cột 3: Học sinh liên quan */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                            {initials || 'HS'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {r.studentName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {students.find((s) => s.name === r.studentName)?.role || 'Học sinh'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Nội dung ghi nhận / Lỗi vi phạm */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-800 font-semibold leading-relaxed">
                            {r.behavior}
                          </p>
                          {r.educationalMeasure && (
                            <p className="text-[11px] text-slate-500 italic">
                              GVBM: {r.educationalMeasure}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Ghi chú / Đã xử lý (checkbox) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleHandled(r.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            r.isReminded
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Bấm để đánh dấu Đã xử lý / Chưa xử lý"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                              r.isReminded
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-400'
                            }`}
                          >
                            {r.isReminded && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span>{r.isReminded ? 'Đã nhắc nhở' : 'Chưa xử lý'}</span>
                        </button>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRecord(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Sửa ghi nhận"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa ghi nhận"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <p className="text-sm font-medium">Chưa có ghi nhận nề nếp nào trong tuần này.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Bấm <strong>[⚡ AI Quét Sổ]</strong> ở trên hoặc nút <strong>[+ Thêm ghi nhận]</strong> để nạp nhật ký.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          BẢNG ĐỐI SOÁT SAU KHI QUÉT: "BẢNG GHI NHẬN NỀ NẾP & VI PHẠM TRONG TUẦN"
          ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Gemini 3.8 Flash • {extractedItems.length} lượt ghi nhận</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold mt-1 text-white">
                  Bảng Ghi Nhận Nề Nếp &amp; Vi Phạm Trong Tuần
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Kiểm tra hoặc sửa nhanh thông tin Thứ, Tiết, Tên học sinh, Lỗi vi phạm và Nhận xét trước khi lưu chính thức.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Week Confirmation Banner */}
            <div className="bg-indigo-50/80 px-6 py-3 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700">Dữ liệu được xác định thuộc:</span>
                <span className="font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                  TUẦN {assignedWeek} ({getWeekCycleInfo(assignedWeek).monthName})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Lưu vào tuần khác:</span>
                <select
                  value={assignedWeek}
                  onChange={(e) => setAssignedWeek(Number(e.target.value))}
                  className="bg-white border border-indigo-300 text-indigo-900 font-bold px-2 py-1 rounded-lg text-xs focus:outline-hidden"
                >
                  {SCHOOL_YEAR_WEEKS.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      Tuần {w.weekNumber} ({w.monthName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Review Cards List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {extractedItems.length > 0 ? (
                extractedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Cột 1: Thứ / Ngày */}
                        <select
                          value={item.dayOfWeek}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtractedItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, dayOfWeek: val } : it))
                            );
                          }}
                          className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-blue-700"
                        >
                          {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>

                        {/* Cột 2: Tiết / Môn học */}
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <span>Tiết:</span>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={item.period}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setExtractedItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, period: val } : it))
                              );
                            }}
                            className="w-12 bg-white border border-slate-300 rounded-md px-1.5 py-1 text-xs font-bold text-center"
                          />
                        </div>

                        <input
                          type="text"
                          value={item.subject}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtractedItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, subject: val } : it))
                            );
                          }}
                          placeholder="Môn học..."
                          className="w-28 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-purple-700"
                        />
                      </div>

                      {/* Cột 5: Ghi chú / Đã xử lý (checkbox) & Nút xóa */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!item.isHandled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setExtractedItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, isHandled: checked } : it))
                              );
                            }}
                            className="w-4 h-4 rounded-full text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>Đã xử lý</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setExtractedItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa mục trích xuất này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Cột 3 & Cột 4 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] text-slate-500 font-medium block mb-0.5">
                          Cột 3: Học sinh liên quan:
                        </label>
                        <select
                          value={item.studentName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtractedItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, studentName: val } : it))
                            );
                          }}
                          className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs font-bold text-slate-900"
                        >
                          <option value="Cả lớp">Cả lớp</option>
                          <option value={item.studentName}>{item.studentName}</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.name}>
                              STT {s.stt}: {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] text-slate-500 font-medium block mb-0.5">
                          Cột 4: Nội dung ghi nhận / Lỗi vi phạm:
                        </label>
                        <input
                          type="text"
                          value={item.behavior}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtractedItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, behavior: val } : it))
                            );
                          }}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          value={item.teacherNote || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtractedItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, teacherNote: val } : it))
                            );
                          }}
                          placeholder="Nhận xét của GV bộ môn / Biện pháp đề xuất..."
                          className="w-full bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-600 italic"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-sm font-medium">Không có mục vi phạm nào được bóc tách.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmSaveExtracted}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>[✅ Xác Nhận Lưu Vào Tuần {assignedWeek}]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Ghi Nhận Thủ Công */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                {editingRecord ? 'Chỉnh Sửa Ghi Nhận Nề Nếp' : 'Thêm Mới Ghi Nhận Nề Nếp'}
              </h4>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRecord} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Học sinh liên quan:
                </label>
                <select
                  value={manualStudentName}
                  onChange={(e) => setManualStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900"
                >
                  <option value="Cả lớp">Cả lớp</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.name}>
                      STT {s.stt}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Thứ:</label>
                  <select
                    value={manualDay}
                    onChange={(e) => setManualDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium"
                  >
                    {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tiết:</label>
                  <select
                    value={manualPeriod}
                    onChange={(e) => setManualPeriod(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium"
                  >
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>
                        Tiết {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Môn học:</label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nội dung ghi nhận / Lỗi vi phạm:
                </label>
                <textarea
                  rows={2}
                  value={manualBehavior}
                  onChange={(e) => setManualBehavior(e.target.value)}
                  placeholder="Ví dụ: Nói chuyện riêng nhiều lần, quên mang vở bài tập..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nhận xét của GV bộ môn / Biện pháp đề xuất:
                </label>
                <input
                  type="text"
                  value={manualTeacherNote}
                  onChange={(e) => setManualTeacherNote(e.target.value)}
                  placeholder="Ví dụ: Đã nhắc nhở, yêu cầu chép bù bài..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phân loại:</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as ViolationCategory)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                >
                  <option value="hoc_tap">Học tập / Quên bài</option>
                  <option value="dong_phuc">Đồng phục / Khăn quàng</option>
                  <option value="di_muon">Đi muộn / Chuyên cần</option>
                  <option value="ve_sinh">Vệ sinh lớp học</option>
                  <option value="mat_trat_tu">Mất trật tự trong giờ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition"
                >
                  {editingRecord ? 'Lưu thay đổi' : 'Thêm ghi nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}
    </div>
  );
};
