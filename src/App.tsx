import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { DataIntakeTab } from './components/Tabs/DataIntakeTab';
import { WeeklyReportTab } from './components/Tabs/WeeklyReportTab';
import { StudentRosterTab } from './components/Tabs/StudentRosterTab';
import { TT22EvaluationTab } from './components/Tabs/TT22EvaluationTab';
import { GoogleDriveTab } from './components/Tabs/GoogleDriveTab';
import {
  initAuth,
  getAccessToken,
  setCachedAccessToken,
  getStoredAuthState,
  saveAuthState,
  clearStoredAuthState,
} from './services/firebaseAuth';
import {
  saveFileToDrive,
  syncClassDataToDrive,
  restoreClassDataFromDrive,
} from './services/googleDriveService';
import {
  formatClassId,
  fetchClassDataFromSupabase,
  saveClassDataToSupabase,
} from './services/supabaseClient';
import {
  DEFAULT_STUDENTS,
  DEFAULT_BAREM_RULES,
  INITIAL_BEHAVIOR_RECORDS,
  SAMPLE_WEEK_3_REPORT,
  DEFAULT_REPORTS,
  DEFAULT_SYSTEM_PROFILE,
} from './data/defaultData';
import { Student, BaremRule, BehaviorRecord, WeeklyReport, SystemProfile } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ResetDataModal } from './components/ResetDataModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { GeminiApiKeyModal } from './components/GeminiApiKeyModal';
import { hasGeminiApiKey } from './utils/geminiApiKey';
import { getWeekCycleInfo, TimeFilterMode } from './utils/timeCycle';

export const CLASS_DATA_STORAGE_KEY = 'edumaster_class_data';

export interface ClassDataStorage {
  profile: SystemProfile;
  students: Student[];
  baremRules: BaremRule[];
  records: BehaviorRecord[];
  reports: WeeklyReport[];
  activeWeek: number;
  currentMonth: number;
  currentSemester: 1 | 2;
  lastUpdated?: string;
}

const loadSavedClassData = (): ClassDataStorage | null => {
  try {
    const raw = localStorage.getItem(CLASS_DATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    console.warn('Lỗi khi đọc dữ liệu lưu trữ từ localStorage:', err);
  }
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');

  // Khôi phục dữ liệu đã lưu trữ từ localStorage trước tiên (nếu có)
  const initialClassData = loadSavedClassData();
  const initialAuth = getStoredAuthState();

  // Auth States (Khôi phục ngay lập tức từ edumaster_auth_state khi F5)
  const [user, setUser] = useState<User | any | null>(() => initialAuth?.user || null);
  const [accessToken, setAccessToken] = useState<string | null>(() => initialAuth?.accessToken || null);

  // System Profile State
  const [profile, setProfile] = useState<SystemProfile>(
    () => initialClassData?.profile || DEFAULT_SYSTEM_PROFILE
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Application Data States (Bảo lưu 100% khi tải lại trang F5)
  const [students, setStudents] = useState<Student[]>(() =>
    initialClassData?.students && initialClassData.students.length > 0
      ? initialClassData.students
      : DEFAULT_STUDENTS
  );
  const [baremRules, setBaremRules] = useState<BaremRule[]>(() =>
    initialClassData?.baremRules && initialClassData.baremRules.length > 0
      ? initialClassData.baremRules
      : DEFAULT_BAREM_RULES
  );
  const [records, setRecords] = useState<BehaviorRecord[]>(() =>
    initialClassData?.records !== undefined ? initialClassData.records : INITIAL_BEHAVIOR_RECORDS
  );
  const [reports, setReports] = useState<WeeklyReport[]>(() =>
    initialClassData?.reports && initialClassData.reports.length > 0
      ? initialClassData.reports
      : DEFAULT_REPORTS
  );
  const [activeWeek, setActiveWeek] = useState<number>(() => initialClassData?.activeWeek ?? 3);
  const [currentMonth, setCurrentMonth] = useState<number>(() => initialClassData?.currentMonth ?? 9);
  const [currentSemester, setCurrentSemester] = useState<1 | 2>(() => initialClassData?.currentSemester ?? 1);
  const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('week');
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(9);
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<1 | 2>(1);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasUserApiKey, setHasUserApiKey] = useState<boolean>(() => hasGeminiApiKey());

  // Chuỗi đại diện mốc thời gian đang được chọn trên Header
  const currentTimeScope = React.useMemo(() => {
    if (timeFilterMode === 'week') return `week-${activeWeek}`;
    if (timeFilterMode === 'month') return `month-${selectedMonthNum}`;
    if (timeFilterMode === 'semester') return `semester-${selectedSemesterNum}`;
    return 'year';
  }, [timeFilterMode, activeWeek, selectedMonthNum, selectedSemesterNum]);

  // Bộ điều khiển đồng bộ thời gian từ dropdown Header
  const handleChangeTimeScope = (val: string) => {
    if (val.startsWith('week-')) {
      const w = parseInt(val.replace('week-', ''), 10);
      setTimeFilterMode('week');
      setActiveWeek(w);
      const info = getWeekCycleInfo(w);
      setCurrentMonth(info.monthNumber);
      setCurrentSemester(info.semester);
    } else if (val.startsWith('month-')) {
      const m = parseInt(val.replace('month-', ''), 10);
      setTimeFilterMode('month');
      setSelectedMonthNum(m);
      setCurrentMonth(m);
      if (activeTab !== 'report') {
        setActiveTab('report');
      }
    } else if (val === 'semester-1') {
      setTimeFilterMode('semester');
      setSelectedSemesterNum(1);
      setCurrentSemester(1);
      if (activeTab !== 'report') {
        setActiveTab('report');
      }
    } else if (val === 'semester-2') {
      setTimeFilterMode('semester');
      setSelectedSemesterNum(2);
      setCurrentSemester(2);
      if (activeTab !== 'report') {
        setActiveTab('report');
      }
    } else if (val === 'year') {
      setTimeFilterMode('year');
      if (activeTab !== 'report') {
        setActiveTab('report');
      }
    }
  };

  // Operation States & Supabase Cloud Sync
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'idle' | 'error'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. TỰ ĐỘNG LƯU NGẦM VÀO LOCALSTORAGE:
  // Bất kỳ khi nào có sự thay đổi về hồ sơ lớp, danh sách học sinh, barem điểm, số liệu các tuần, nhật ký SCN
  // -> Ghi đè ngay vào localStorage dưới key: 'edumaster_class_data'
  useEffect(() => {
    try {
      const dataToSave: ClassDataStorage = {
        profile,
        students,
        baremRules,
        records,
        reports,
        activeWeek,
        currentMonth,
        currentSemester,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(CLASS_DATA_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('Lỗi khi tự động lưu dữ liệu vào localStorage:', err);
    }
  }, [profile, students, baremRules, records, reports, activeWeek, currentMonth, currentSemester]);

  // 2. KHỞI ĐỘNG: TỰ ĐỘNG TRUY VẤN SUPABASE CLOUD (LẤY DỮ LIỆU BẢNG 'class_records')
  useEffect(() => {
    let isMounted = true;
    const syncFromSupabaseOnMount = async () => {
      try {
        const classId = formatClassId(profile.className);
        setSyncStatus('syncing');
        const cloudData = await fetchClassDataFromSupabase(classId);
        if (!isMounted) return;

        if (cloudData && typeof cloudData === 'object') {
          if (cloudData.profile) setProfile(cloudData.profile);
          if (Array.isArray(cloudData.students) && cloudData.students.length > 0) setStudents(cloudData.students);
          if (Array.isArray(cloudData.baremRules) && cloudData.baremRules.length > 0) setBaremRules(cloudData.baremRules);
          if (Array.isArray(cloudData.records)) setRecords(cloudData.records);
          if (Array.isArray(cloudData.reports) && cloudData.reports.length > 0) setReports(cloudData.reports);
          if (typeof cloudData.activeWeek === 'number') setActiveWeek(cloudData.activeWeek);
          if (typeof cloudData.currentMonth === 'number') setCurrentMonth(cloudData.currentMonth);
          if (cloudData.currentSemester === 1 || cloudData.currentSemester === 2) setCurrentSemester(cloudData.currentSemester);

          // Đồng thời lưu dự phòng vào LocalStorage
          localStorage.setItem(CLASS_DATA_STORAGE_KEY, JSON.stringify({
            profile: cloudData.profile || profile,
            students: cloudData.students || students,
            baremRules: cloudData.baremRules || baremRules,
            records: cloudData.records || records,
            reports: cloudData.reports || reports,
            activeWeek: cloudData.activeWeek ?? activeWeek,
            currentMonth: cloudData.currentMonth ?? currentMonth,
            currentSemester: cloudData.currentSemester ?? currentSemester,
            lastUpdated: new Date().toISOString(),
          }));
        }
        setSyncStatus('synced');
        const now = new Date();
        setLastSyncedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      } catch (err) {
        console.warn('Lỗi kết nối Supabase Cloud khi mở trang:', err);
        setSyncStatus('error');
      }
    };

    syncFromSupabaseOnMount();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. TỰ ĐỘNG ĐỒNG BỘ ĐÁM MÂY SUPABASE KHI CÓ BẤT KỲ THAY ĐỔI NÀO (DEBOUNCED UPSERT)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const classId = formatClassId(profile.className);
        const dataPackage: ClassDataStorage = {
          profile,
          students,
          baremRules,
          records,
          reports,
          activeWeek,
          currentMonth,
          currentSemester,
          lastUpdated: new Date().toISOString(),
        };
        await saveClassDataToSupabase(classId, dataPackage);
        setSyncStatus('synced');
        const now = new Date();
        setLastSyncedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      } catch (err) {
        console.warn('Lỗi tự động sao lưu lên Supabase Cloud:', err);
        setSyncStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [profile, students, baremRules, records, reports, activeWeek, currentMonth, currentSemester]);

  // DUY TRÌ TRẠNG THÁI KẾT NỐI AUTH
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setCachedAccessToken(token);
        saveAuthState(currentUser, token);
      },
      () => {
        const stored = getStoredAuthState();
        if (stored?.accessToken && stored?.user) {
          setUser(stored.user);
          setAccessToken(stored.accessToken);
          setCachedAccessToken(stored.accessToken);
        } else {
          setUser(null);
          setAccessToken(null);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleDriveAuthChange = (newUser: User | null, token: string | null) => {
    setUser(newUser);
    setAccessToken(token);
    setCachedAccessToken(token);
    saveAuthState(newUser, token);
    if (newUser && token) {
      showToast('Đã kết nối thành công với Google Drive!');
    } else {
      showToast('Đã đăng xuất tài khoản Google Drive.', 'info');
    }
  };

  // Đồng bộ thủ công ngay lập tức lên Supabase Cloud
  const handleManualSyncToSupabase = async () => {
    try {
      setSyncStatus('syncing');
      showToast('🔄 Đang lưu lên Supabase Cloud...', 'info');
      const classId = formatClassId(profile.className);
      const dataPackage: ClassDataStorage = {
        profile,
        students,
        baremRules,
        records,
        reports,
        activeWeek,
        currentMonth,
        currentSemester,
        lastUpdated: new Date().toISOString(),
      };
      await saveClassDataToSupabase(classId, dataPackage);
      setSyncStatus('synced');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastSyncedTime(timeStr);
      showToast(`🟢 Supabase Cloud: Đã đồng bộ [${timeStr}]`);
    } catch (err) {
      setSyncStatus('error');
      showToast('⚠️ Lỗi kết nối Supabase Cloud. Dữ liệu đã lưu an toàn vào LocalStorage.', 'info');
    }
  };

  // Tải lại toàn bộ dữ liệu từ Supabase Cloud
  const handleRestoreFromSupabase = async () => {
    try {
      setSyncStatus('syncing');
      showToast('🔄 Đang tải lại dữ liệu từ Supabase Cloud...', 'info');
      const classId = formatClassId(profile.className);
      const cloudData = await fetchClassDataFromSupabase(classId);

      if (!cloudData) {
        showToast(`Chưa có dữ liệu lớp ${profile.className} trên Cloud. Đang khởi tạo bản sao lưu...`, 'info');
        await handleManualSyncToSupabase();
        return;
      }

      if (cloudData.profile) setProfile(cloudData.profile);
      if (Array.isArray(cloudData.students) && cloudData.students.length > 0) setStudents(cloudData.students);
      if (Array.isArray(cloudData.baremRules) && cloudData.baremRules.length > 0) setBaremRules(cloudData.baremRules);
      if (Array.isArray(cloudData.records)) setRecords(cloudData.records);
      if (Array.isArray(cloudData.reports) && cloudData.reports.length > 0) setReports(cloudData.reports);
      if (typeof cloudData.activeWeek === 'number') setActiveWeek(cloudData.activeWeek);
      if (typeof cloudData.currentMonth === 'number') setCurrentMonth(cloudData.currentMonth);
      if (cloudData.currentSemester === 1 || cloudData.currentSemester === 2) setCurrentSemester(cloudData.currentSemester);

      localStorage.setItem(CLASS_DATA_STORAGE_KEY, JSON.stringify(cloudData));
      setSyncStatus('synced');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastSyncedTime(timeStr);
      showToast(`🟢 Khôi phục thành công toàn bộ dữ liệu từ Supabase Cloud [${timeStr}]!`);
    } catch (err: any) {
      setSyncStatus('error');
      showToast('Không thể kết nối Supabase Cloud. Đã giữ nguyên dữ liệu hiện tại.', 'info');
    }
  };

  const handleApplyWeekData = (newReport: WeeklyReport, newRecords: BehaviorRecord[]) => {
    setReports((prev) => {
      const filtered = prev.filter((r) => r.weekNumber !== newReport.weekNumber);
      return [newReport, ...filtered];
    });

    setRecords((prev) => [...newRecords, ...prev]);
    setActiveWeek(newReport.weekNumber);
    showToast(`Đã tổng hợp & tạo báo cáo Tuần ${newReport.weekNumber} thành công!`);
  };

  const handleAddRecord = (newRec: BehaviorRecord) => {
    setRecords((prev) => [newRec, ...prev]);
    showToast(`Đã thêm biểu hiện cho ${newRec.studentName} vào Nhật ký SCN!`);
  };

  const handleUpdateRecord = (updatedRec: BehaviorRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updatedRec.id ? updatedRec : r)));
    showToast(`Đã cập nhật biểu hiện cho ${updatedRec.studentName}!`);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    showToast('Đã xóa biểu hiện khỏi Nhật ký SCN!');
  };

  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    showToast(`Đã thêm học sinh ${newStudent.name} vào danh sách lớp ${profile.className}!`);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    showToast(`Đã cập nhật thông tin học sinh ${updatedStudent.name}!`);
  };

  // =========================================================================
  // RESET DATA OPERATIONAL HANDLERS (4 CHẾ ĐỘ ĐIỀU HÀNH)
  // =========================================================================
  const handleExecuteMonthReset = (fromM: number, toM: number) => {
    setCurrentMonth(toM);
    const nextWeekNum = activeWeek < 5 ? 5 : activeWeek + 1;
    setActiveWeek(nextWeekNum);

    const newMonthReport: WeeklyReport = {
      id: `rep_w${String(nextWeekNum).padStart(2, '0')}`,
      weekNumber: nextWeekNum,
      monthNumber: toM,
      monthName: `Tháng ${toM}/2026`,
      academicYear: '2026-2027',
      semester: currentSemester,
      dateRange: `Tuần ${nextWeekNum} (Tháng ${toM}/2026)`,
      collectiveCompetition: {
        startingPoints: 100,
        periodDeductions: 0,
        periodDetails: 'Chưa có tiết học bị trừ điểm',
        saoDoDeductions: 0,
        saoDoDetails: 'Nề nếp đầu tháng đảm bảo 100%',
        finalScore: 100,
        estimatedRank: 'Hạng 1 / 12 lớp',
      },
      studentWeeklyIndicators: [],
      monthlyParentAlerts: [],
      monthlyAlerts: [],
      parentAlerts: [],
      monthStatusNote: `Tháng ${toM} nề nếp học sinh đang được duy trì tốt, chưa có học sinh nào chạm ngưỡng cảnh báo cần báo phụ huynh.`,
      scnJournalEntries: [],
      tt22Forecast: {
        atRiskStudents: [],
        exemplaryStudents: [],
        homeroomFocusPoints: [
          `Khởi động phong trào thi đua nền nếp đầu Tháng ${toM}.`,
          'Kiểm tra rà soát dụng cụ học tập và đồng phục đầu tháng.',
          'Động viên toàn thể học sinh thi đua giữ vững hoa điểm tốt.',
        ],
      },
    };

    setReports((prev) => [newMonthReport, ...prev]);
    showToast(`[LỆNH ĐIỀU HÀNH THÀNH CÔNG] Đã khóa số liệu Tháng ${fromM} và reset bộ đếm lỗi tháng về 0 cho Tháng ${toM}!`);
  };

  const handleExecuteSemesterReset = () => {
    setCurrentSemester(2);
    setCurrentMonth(1);
    setActiveWeek(19);

    const sem2Report: WeeklyReport = {
      id: 'rep_w19',
      weekNumber: 19,
      monthNumber: 1,
      monthName: 'Tháng 1/2027',
      academicYear: '2026-2027',
      semester: 2,
      dateRange: 'Tuần 19 (Tuần đầu tiên Học kỳ II)',
      collectiveCompetition: {
        startingPoints: 100,
        periodDeductions: 0,
        periodDetails: 'Chưa có tiết học bị trừ điểm',
        saoDoDeductions: 0,
        saoDoDetails: 'Đầu HK2 nề nếp ổn định',
        finalScore: 100,
        estimatedRank: 'Hạng 1 / 12 lớp',
      },
      studentWeeklyIndicators: [],
      monthlyParentAlerts: [],
      monthlyAlerts: [],
      parentAlerts: [],
      monthStatusNote: 'Khởi đầu Học kỳ II, nề nếp học sinh trong ngưỡng an toàn.',
      scnJournalEntries: [],
      tt22Forecast: {
        atRiskStudents: [],
        exemplaryStudents: [],
        homeroomFocusPoints: [
          'Quán triệt mục tiêu học tập và rèn luyện Học kỳ 2 theo Thông tư 22.',
          'Ổn định ban cán sự lớp và phân công đôi bạn cùng tiến.',
          'Quyết tâm nâng cao kết quả học tập và phong trào thi đua tập thể.',
        ],
      },
    };

    setReports((prev) => [sem2Report, ...prev]);
    showToast('[LỆNH ĐIỀU HÀNH THÀNH CÔNG] Đã khóa dữ liệu HK1, chuyển sang Học kỳ II (Bắt đầu từ Tuần 19)!');
  };

  const handleExecuteCorrection = (recordId: string, reason: string) => {
    const targetRecord = records.find((r) => r.id === recordId);
    if (!targetRecord) return;

    // Remove the record from behavior records
    setRecords((prev) => prev.filter((r) => r.id !== recordId));

    // Update reports to remove SCN entry and decrement alerts if applicable
    setReports((prev) =>
      prev.map((rep) => {
        const filteredScn = rep.scnJournalEntries.filter(
          (e) => !(e.studentName === targetRecord.studentName && e.date === targetRecord.date && e.details.includes(targetRecord.subject))
        );

        const updatedAlerts = (rep.monthlyParentAlerts || rep.parentAlerts || []).map((al) => {
          if (al.studentName === targetRecord.studentName) {
            const remainingViolations = al.violations.filter(
              (v) => !(v.date === targetRecord.date && v.subject === targetRecord.subject && v.period === targetRecord.period)
            );
            return {
              ...al,
              violations: remainingViolations,
              cumulativeErrorsCount: Math.max(0, (al.cumulativeErrorsCount || 3) - 1),
              totalMonthlyErrors: Math.max(0, (al.totalMonthlyErrors || 3) - 1),
            };
          }
          return al;
        }).filter((al) => (al.cumulativeErrorsCount || al.totalMonthlyErrors || al.violations.length) >= 3);

        return {
          ...rep,
          scnJournalEntries: filteredScn,
          monthlyParentAlerts: updatedAlerts,
          monthlyAlerts: updatedAlerts,
          parentAlerts: updatedAlerts,
        };
      })
    );

    showToast(`[ĐÍNH CHÍNH THÀNH CÔNG] Đã xóa lỗi cho ${targetRecord.studentName} (${reason}). Dữ liệu đã cập nhật!`);
  };

  const handleExecuteHardReset = () => {
    setRecords([]);
    setCurrentMonth(9);
    setCurrentSemester(1);
    setActiveWeek(1);

    const cleanWeek1Report: WeeklyReport = {
      id: 'rep_w01',
      weekNumber: 1,
      monthNumber: 9,
      monthName: 'Tháng 9/2026',
      academicYear: '2026-2027',
      semester: 1,
      dateRange: 'Tuần 1 (Khai giảng & Đầu năm học mới)',
      collectiveCompetition: {
        startingPoints: 100,
        periodDeductions: 0,
        periodDetails: 'Chưa có vi phạm tiết học',
        saoDoDeductions: 0,
        saoDoDetails: 'Nề nếp đầu năm hoàn hảo',
        finalScore: 100,
        estimatedRank: 'Hạng 1 / 12 lớp',
      },
      studentWeeklyIndicators: [],
      monthlyParentAlerts: [],
      monthlyAlerts: [],
      parentAlerts: [],
      monthStatusNote: 'Tháng 9 nề nếp học sinh đạt chuẩn 100%, chưa có học sinh nào bị nhắc nhở.',
      scnJournalEntries: [],
      tt22Forecast: {
        atRiskStudents: [],
        exemplaryStudents: [],
        homeroomFocusPoints: [
          'Chào đón năm học mới 2026-2027 và sinh hoạt nội quy trường lớp.',
          'Bầu ban cán sự lớp và phân công nhiệm vụ 4 tổ.',
          'Phổ biến quy chế rèn luyện học tập theo Thông tư 22/2021/TT-BGDĐT.',
        ],
      },
    };

    setReports([cleanWeek1Report]);
    showToast('[HARD RESET THÀNH CÔNG] Đã làm sạch toàn bộ dữ liệu năm học, bảo lưu danh sách 40 học sinh!');
  };

  const handleQuickSaveToDrive = async () => {
    const activeReport = reports.find((r) => r.weekNumber === activeWeek) || reports[0];
    if (!activeReport) return;

    if (!accessToken) {
      setActiveTab('drive');
      showToast('Vui lòng kết nối tài khoản Google Drive trước!', 'info');
      return;
    }

    setIsExportingToDrive(true);
    try {
      const cleanClass = profile.className.replace(/[^a-zA-Z0-9]/g, '') || '95';
      const displayClass = profile.className.startsWith('Lớp') ? profile.className : `Lớp ${profile.className}`;
      const fileName = `EduMaster_BaoCao_Tuan_${activeReport.weekNumber}_${cleanClass}.txt`;
      let content = `# BÁO CÁO CÔNG TÁC CHỦ NHIỆM - TUẦN ${activeReport.weekNumber}\n`;
      content += `${displayClass} • Năm học ${activeReport.academicYear} • Học kỳ ${activeReport.semester}\nThời gian: ${activeReport.dateRange}\n\n`;
      const indicators = activeReport.studentProblemsSummary?.indicators13 || activeReport.indicators || [];
      content += `## MỤC 1: TỔNG HỢP NỀ NẾP & THEO DÕI HỌC SINH (13 CHỈ SỐ)\n`;
      indicators.forEach((i) => {
        content += `${i.index}. ${i.title}: ${i.count} (${i.details})\n`;
      });
      content += `\n`;
      content += `## MỤC 2: CẢNH BÁO & TIN NHẮN ZALO PHỤ HUYNH\n`;
      const alerts = activeReport.monthlyAlerts || activeReport.parentAlerts || [];
      alerts.forEach((pa) => {
        content += `* ${pa.studentName} (STT ${pa.stt}): ${pa.cumulativeErrorsCount ?? pa.weeklyErrorsCount ?? 0} lỗi | Xếp loại dự kiến: ${pa.predictedRank}\n`;
        content += `  Tin nhắn Zalo:\n  "${pa.messageZalo}"\n\n`;
      });
      content += `## MỤC 3: NHẬT KÝ SỔ CHỦ NHIỆM (MỤC IV)\n`;
      activeReport.scnJournalEntries.forEach((e) => {
        content += `${e.date} | ${e.studentName} | ${e.details} | ${e.educationalMeasure}\n`;
      });
      content += `\n## MỤC 4: DỰ PHÓNG XẾP LOẠI THÔNG TƯ 22\n`;
      content += `Trọng tâm sinh hoạt lớp:\n`;
      activeReport.tt22Forecast.homeroomFocusPoints.forEach((pt, i) => {
        content += `${i + 1}. ${pt}\n`;
      });

      const saved = await saveFileToDrive(accessToken, fileName, content, 'text/plain');
      showToast(`Đã xuất báo cáo "${saved.name}" lên Google Drive!`);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi lưu lên Drive');
    } finally {
      setIsExportingToDrive(false);
    }
  };

  const activeReport = reports.find((r) => r.weekNumber === activeWeek) || reports[0];
  const pendingAlertsCount = activeReport?.parentAlerts?.length || 0;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* App Header with Supabase Cloud Status & Gemini API Key BYOK */}
      <Header
        currentMonth={currentMonth}
        currentSemester={currentSemester}
        activeWeek={activeWeek}
        timeScopeValue={currentTimeScope}
        onChangeTimeScope={handleChangeTimeScope}
        onSelectWeek={(w) => handleChangeTimeScope(`week-${w}`)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        profile={profile}
        onOpenProfileSettings={() => setIsProfileModalOpen(true)}
        syncStatus={syncStatus}
        lastSyncedTime={lastSyncedTime}
        onManualSync={handleManualSyncToSupabase}
        hasApiKey={hasUserApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'ocr' && (
          <DataIntakeTab
            students={students}
            baremRules={baremRules}
            currentWeek={activeWeek}
            records={records}
            reports={reports}
            onUpdateRecords={(newRecs) => {
              setRecords(newRecs);
              showToast('Đã cập nhật nhật ký nề nếp!');
            }}
            onApplyWeekData={handleApplyWeekData}
            onNavigateToReport={() => setActiveTab('report')}
            className={profile.className}
            onRequireApiKey={() => setIsApiKeyModalOpen(true)}
          />
        )}

        {activeTab === 'report' && (
          <WeeklyReportTab
            reports={reports}
            currentWeek={activeWeek}
            onSelectWeek={(w) => handleChangeTimeScope(`week-${w}`)}
            onSaveToDrive={handleQuickSaveToDrive}
            hasDriveToken={!!accessToken}
            isSavingToDrive={isExportingToDrive}
            profile={profile}
            onOpenProfileSettings={() => setIsProfileModalOpen(true)}
            students={students}
            records={records}
            filterMode={timeFilterMode}
            selectedMonthNum={selectedMonthNum}
            selectedSemesterNum={selectedSemesterNum}
            onChangeTimeScope={handleChangeTimeScope}
          />
        )}

        {activeTab === 'roster' && (
          <StudentRosterTab
            students={students}
            records={records}
            onAddRecord={handleAddRecord}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'tt22' && (
          <TT22EvaluationTab students={students} records={records} />
        )}

        {activeTab === 'drive' && (
          <GoogleDriveTab
            activeReport={activeReport}
            allReports={reports}
            students={students}
            className={profile.className}
            syncStatus={syncStatus}
            lastSyncedTime={lastSyncedTime}
            onRestoreFromCloud={handleRestoreFromSupabase}
            onManualSync={handleManualSyncToSupabase}
          />
        )}
      </main>

      {/* Gemini API Key BYOK Configuration Modal */}
      <GeminiApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          setHasUserApiKey(hasGeminiApiKey());
        }}
        onSaveSuccess={() => {
          setHasUserApiKey(hasGeminiApiKey());
          showToast('🟢 Đã kích hoạt thành công Gemini API Key cá nhân!');
        }}
      />

      {/* Reset Data Operational Modal */}
      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        students={students}
        records={records}
        reports={reports}
        currentWeek={activeWeek}
        currentMonth={currentMonth}
        currentSemester={currentSemester}
        className={profile.className}
        onExecuteMonthReset={handleExecuteMonthReset}
        onExecuteSemesterReset={handleExecuteSemesterReset}
        onExecuteCorrection={handleExecuteCorrection}
        onExecuteHardReset={handleExecuteHardReset}
      />

      {/* System Profile & Templates Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        students={students}
        onUpdateStudents={(newStudents) => {
          setStudents(newStudents);
          showToast(`Đã cập nhật danh sách ${newStudents.length} học sinh cho Lớp ${profile.className}!`);
        }}
        onSaveProfile={(newProf) => {
          setProfile(newProf);
          showToast(`Đã lưu cấu hình hồ sơ và mẫu tin nhắn cho Lớp ${newProf.className}!`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
