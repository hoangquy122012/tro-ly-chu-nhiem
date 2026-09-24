import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { DataIntakeTab } from './components/Tabs/DataIntakeTab';
import { WeeklyReportTab } from './components/Tabs/WeeklyReportTab';
import { StudentRosterTab } from './components/Tabs/StudentRosterTab';
import { TT22EvaluationTab } from './components/Tabs/TT22EvaluationTab';
import { FlexibleBaremTab } from './components/Tabs/FlexibleBaremTab';
import { GoogleDriveTab } from './components/Tabs/GoogleDriveTab';
import { initAuth, getAccessToken, setCachedAccessToken } from './services/firebaseAuth';
import { saveFileToDrive } from './services/googleDriveService';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // System Profile State
  const [profile, setProfile] = useState<SystemProfile>(DEFAULT_SYSTEM_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Application Data States
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [baremRules, setBaremRules] = useState<BaremRule[]>(DEFAULT_BAREM_RULES);
  const [records, setRecords] = useState<BehaviorRecord[]>(INITIAL_BEHAVIOR_RECORDS);
  const [reports, setReports] = useState<WeeklyReport[]>(DEFAULT_REPORTS);
  const [activeWeek, setActiveWeek] = useState<number>(3);
  const [currentMonth, setCurrentMonth] = useState<number>(9);
  const [currentSemester, setCurrentSemester] = useState<1 | 2>(1);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Operation States
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
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
    if (newUser && token) {
      showToast('Đã kết nối thành công với Google Drive!');
    } else {
      showToast('Đã đăng xuất tài khoản Google Drive.', 'info');
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

  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    showToast(`Đã thêm học sinh ${newStudent.name} vào danh sách lớp 7A1!`);
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
          'Động viên các tổ thi đua giữ vững hoa điểm tốt.',
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
      const fileName = `EduMaster_BaoCao_Tuan_${activeReport.weekNumber}_Lop7A1.txt`;
      let content = `# BÁO CÁO CÔNG TÁC CHỦ NHIỆM - TUẦN ${activeReport.weekNumber}\n`;
      content += `Lớp 7A1 • Năm học ${activeReport.academicYear} • Học kỳ ${activeReport.semester}\nThời gian: ${activeReport.dateRange}\n\n`;
      const indicators = activeReport.studentProblemsSummary?.indicators13 || activeReport.indicators || [];
      content += `## MỤC 1: BẢNG SƠ KẾT THI ĐUA TUẦN (13 CHỈ SỐ)\n`;
      indicators.forEach((i) => {
        content += `${i.index}. ${i.title}: ${i.count} (${i.details}) -> ${i.pointsFormula || i.totalPoints || ''}\n`;
      });
      content += `\nTỔNG ĐIỂM THI ĐUA: ${activeReport.finalScore ?? activeReport.collectiveCompetition?.finalScore ?? 100}/100đ (${activeReport.estimatedRank ?? activeReport.collectiveCompetition?.estimatedRank ?? ''})\n\n`;
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
      {/* App Header */}
      <Header
        user={user}
        hasDriveToken={!!accessToken}
        onDriveAuthChange={handleDriveAuthChange}
        onExportToDrive={handleQuickSaveToDrive}
        isExporting={isExportingToDrive}
        currentMonth={currentMonth}
        currentSemester={currentSemester}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        profile={profile}
        onOpenProfileSettings={() => setIsProfileModalOpen(true)}
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
            onApplyWeekData={handleApplyWeekData}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && (
          <WeeklyReportTab
            reports={reports}
            currentWeek={activeWeek}
            onSelectWeek={setActiveWeek}
            onSaveToDrive={handleQuickSaveToDrive}
            hasDriveToken={!!accessToken}
            isSavingToDrive={isExportingToDrive}
            profile={profile}
            onOpenProfileSettings={() => setIsProfileModalOpen(true)}
            students={students}
            records={records}
          />
        )}

        {activeTab === 'roster' && (
          <StudentRosterTab
            students={students}
            records={records}
            onAddRecord={handleAddRecord}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        )}

        {activeTab === 'tt22' && (
          <TT22EvaluationTab students={students} records={records} />
        )}

        {activeTab === 'barem' && (
          <FlexibleBaremTab
            baremRules={baremRules}
            onUpdateBarem={(newRules) => {
              setBaremRules(newRules);
              showToast('Đã lưu quy tắc Barem điểm thi đua mới!');
            }}
            onResetToDefault={() => setBaremRules(DEFAULT_BAREM_RULES)}
          />
        )}

        {activeTab === 'drive' && (
          <GoogleDriveTab
            user={user}
            hasDriveToken={!!accessToken}
            accessToken={accessToken}
            onDriveAuthChange={handleDriveAuthChange}
            activeReport={activeReport}
            allReports={reports}
            students={students}
          />
        )}
      </main>

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
