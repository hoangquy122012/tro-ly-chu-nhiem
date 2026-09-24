import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  Cloud,
  FileText,
  AlertTriangle,
  Award,
  Calendar,
  MessageSquare,
  ShieldAlert,
  Users,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Sliders,
  ExternalLink,
  Search,
  Filter,
  ChevronRight,
  UserCheck,
  AlertOctagon,
  Printer,
  ChevronDown,
} from 'lucide-react';
import {
  WeeklyReport,
  StudentWeeklyIndicator,
  MonthlyParentAlert,
  SystemProfile,
  Student,
  BehaviorRecord,
  TT22Rank,
} from '../../types';
import {
  exportScnToWordDoc,
  exportStudentProfileToWordDoc,
  cleanExpressionText,
  cleanEducationalMeasureText,
  GroupedScnExportRow,
} from '../../utils/wordExport';
import { fillMessageTemplate } from '../../utils/templateFiller';
import {
  SCHOOL_YEAR_WEEKS,
  MONTH_LIST,
  getWeekCycleInfo,
  parseTimeQuery,
  TimeFilterMode,
} from '../../utils/timeCycle';

interface WeeklyReportTabProps {
  reports: WeeklyReport[];
  currentWeek: number;
  onSelectWeek: (weekNumber: number) => void;
  onSaveToDrive: (report: WeeklyReport) => void;
  hasDriveToken: boolean;
  isSavingToDrive: boolean;
  profile: SystemProfile;
  onOpenProfileSettings?: () => void;
  students?: Student[];
  records?: BehaviorRecord[];
}

export const WeeklyReportTab: React.FC<WeeklyReportTabProps> = ({
  reports,
  currentWeek,
  onSelectWeek,
  onSaveToDrive,
  hasDriveToken,
  isSavingToDrive,
  profile,
  onOpenProfileSettings,
  students = [],
  records = [],
}) => {
  // PHẦN 2: BỘ LỌC XEM DỮ LIỆU ĐA TẦNG
  const [filterMode, setFilterMode] = useState<TimeFilterMode>('week');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(currentWeek);
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(9);
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<1 | 2>(1);
  const [queryCommand, setQueryCommand] = useState<string>('');
  const [queryFeedback, setQueryFeedback] = useState<string | null>(null);

  // Profile lookup in Semester / Year mode
  const [inspectedStudentId, setInspectedStudentId] = useState<string>(students[0]?.id || 'hs_12');
  const [searchStudentTerm, setSearchStudentTerm] = useState<string>('');

  // UI state
  const [copiedZaloIndex, setCopiedZaloIndex] = useState<number | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copied13Table, setCopied13Table] = useState<boolean>(false);
  const [scnViewMode, setScnViewMode] = useState<'grouped' | 'individual'>('grouped');
  const [selectedTemplateMode, setSelectedTemplateMode] = useState<'template1' | 'template2' | 'template3'>('template1');

  // Active report for Week mode
  const activeReport = reports.find((r) => r.weekNumber === selectedWeekNum) || reports[0];

  // =========================================================================
  // QUERY COMMAND PARSER ("Xem Tuần [X]", "Xem Tháng [X]", "Xem Học kỳ 1", "Xem Cả năm")
  // =========================================================================
  const handleExecuteQuery = (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : queryCommand).trim();
    if (!text) return;

    const parsed = parseTimeQuery(text);
    if (!parsed) {
      setQueryFeedback('Không nhận diện được thời gian. Thử: "Xem Tuần 3", "Xem Tháng 9", "Xem Học kỳ 1", "Xem Cả năm"');
      return;
    }

    if (parsed.mode === 'week' && parsed.weekNumber) {
      setFilterMode('week');
      setSelectedWeekNum(parsed.weekNumber);
      onSelectWeek(parsed.weekNumber);
      setQueryFeedback(`Đã chuyển sang xem Báo cáo: TUẦN ${parsed.weekNumber}`);
    } else if (parsed.mode === 'month' && parsed.monthNumber) {
      setFilterMode('month');
      setSelectedMonthNum(parsed.monthNumber);
      setQueryFeedback(`Đã kích hoạt Bộ lọc Tổng kết: THÁNG ${parsed.monthNumber}`);
    } else if (parsed.mode === 'semester' && parsed.semester) {
      setFilterMode('semester');
      setSelectedSemesterNum(parsed.semester);
      setQueryFeedback(`Đã kích hoạt Bộ lọc: HỌC KỲ ${parsed.semester}`);
    } else if (parsed.mode === 'year') {
      setFilterMode('year');
      setQueryFeedback('Đã kích hoạt Tổng kết CẢ NĂM HỌC (35 tuần)');
    }
  };

  // =========================================================================
  // DATA CALCULATORS FOR MULTI-TIER CYCLES
  // =========================================================================

  // Helper to extract 13 standard indicators
  const get13Indicators = (report: WeeklyReport): StudentWeeklyIndicator[] => {
    const defaultTitles = [
      'Số học sinh nghỉ học',
      'Số đi muộn',
      'Số bỏ tiết',
      'Không chuẩn bị bài / Quên vở',
      'Điểm kiểm tra dưới 5.0',
      'Mắc thái độ sai',
      'Điểm tốt (8, 9, 10)',
      'Việc tốt / Tuyên dương',
      'Học sinh được khen',
      'Học sinh bị phê bình',
      'Tiết trống',
      'Tiết tự quản tốt',
      'Đánh giá chung nề nếp tuần',
    ];

    const rawList =
      report.studentWeeklyIndicators ||
      report.studentProblemsSummary?.indicators13 ||
      report.indicators ||
      [];

    return defaultTitles.map((title, idx) => {
      const found = rawList.find(
        (i) => i.index === idx + 1 || i.title.toLowerCase().includes(title.toLowerCase())
      );
      return {
        index: idx + 1,
        title,
        count: found ? found.count : 0,
        details: found?.details || 'Không ghi nhận',
      };
    });
  };

  // Helper to build grouped SCN rows with strict clean-up
  const getGroupedScnRowsFromEntries = (rawEntries: Array<{ date: string; studentName: string; details: string; educationalMeasure: string }>): GroupedScnExportRow[] => {
    const map = new Map<string, { dates: Set<string>; expressions: string[]; measures: Set<string> }>();

    rawEntries.forEach((entry) => {
      const name = entry.studentName.trim();
      if (!map.has(name)) {
        map.set(name, {
          dates: new Set(),
          expressions: [],
          measures: new Set(),
        });
      }
      const item = map.get(name)!;
      if (entry.date) item.dates.add(entry.date);

      // QUY TẮC 1 & 2: Làm sạch hoàn toàn điểm thi đua khỏi Cột 3
      const cleanedExp = cleanExpressionText(entry.details);
      const expLine = cleanedExp ? `- ${cleanedExp}` : '';
      if (expLine && !item.expressions.includes(expLine)) {
        item.expressions.push(expLine);
      }

      // QUY TẮC 3: Làm sạch biện pháp giáo dục
      const cleanedMea = cleanEducationalMeasureText(entry.educationalMeasure);
      if (cleanedMea) {
        const parts = cleanedMea.split(/[;\n]/).map((p) => p.trim()).filter(Boolean);
        parts.forEach((p) => {
          const mClean = cleanEducationalMeasureText(p);
          if (mClean) {
            item.measures.add(`- ${mClean}`);
          }
        });
      }
    });

    const result: GroupedScnExportRow[] = [];
    map.forEach((value, studentName) => {
      result.push({
        studentName,
        dates: Array.from(value.dates),
        expressions: value.expressions,
        measures: Array.from(value.measures),
      });
    });

    return result;
  };

  // MONTH AGGREGATION
  const monthData = useMemo(() => {
    const targetMonthObj = MONTH_LIST.find((m) => m.monthNumber === selectedMonthNum) || MONTH_LIST[0];
    const monthWeeks = targetMonthObj.weeks;
    const monthReports = reports.filter((r) => monthWeeks.includes(r.weekNumber));
    const monthRecords = records.filter((r) => r.month === selectedMonthNum || monthWeeks.includes(r.weekNumber));

    // Combine SCN entries from all weeks
    const allScnEntries: Array<{ date: string; studentName: string; details: string; educationalMeasure: string }> = [];
    monthReports.forEach((r) => {
      (r.scnJournalEntries || []).forEach((e) => allScnEntries.push(e));
    });

    // Also include behavior records
    monthRecords.forEach((r) => {
      allScnEntries.push({
        date: r.date,
        studentName: r.studentName,
        details: `Tiết ${r.period} môn ${r.subject}: ${r.behavior}`,
        educationalMeasure: r.educationalMeasure || 'Nhắc nhở, động viên',
      });
    });

    const groupedMonthScn = getGroupedScnRowsFromEntries(allScnEntries);

    // MONTHLY PARENT ALERTS (HS >= 3 lỗi hoặc vi phạm nghiêm trọng)
    const alertsMap = new Map<string, MonthlyParentAlert>();

    // From reports
    monthReports.forEach((rep) => {
      const repAlerts = rep.monthlyParentAlerts || rep.monthlyAlerts || rep.parentAlerts || [];
      repAlerts.forEach((al) => {
        if (!alertsMap.has(al.studentName)) {
          alertsMap.set(al.studentName, al);
        } else {
          // Merge violations
          const cur = alertsMap.get(al.studentName)!;
          const mergedViols = [...cur.violations];
          al.violations.forEach((v) => {
            if (!mergedViols.some((mv) => mv.date === v.date && mv.subject === v.subject && mv.period === v.period)) {
              mergedViols.push(v);
            }
          });
          alertsMap.set(al.studentName, {
            ...cur,
            violations: mergedViols,
            totalMonthlyErrors: mergedViols.length,
            cumulativeErrorsCount: mergedViols.length,
          });
        }
      });
    });

    // Check individual records in month for any student reaching >= 3 errors
    students.forEach((s) => {
      const sRecords = monthRecords.filter((r) => r.studentId === s.id && r.pointsImpact < 0);
      if (sRecords.length >= profile.alertThreshold && !alertsMap.has(s.name)) {
        const violations = sRecords.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          date: r.date,
          period: r.period,
          subject: r.subject,
          behavior: r.behavior,
        }));

        alertsMap.set(s.name, {
          studentId: s.id,
          studentName: s.name,
          stt: s.stt,
          group: `Tổ ${s.group}`,
          phone: s.parentPhone || '09123456xx',
          parentName: s.parentName || 'Phụ huynh',
          monthNumber: selectedMonthNum,
          monthName: `Tháng ${selectedMonthNum}/2026`,
          totalMonthlyErrors: violations.length,
          cumulativeErrorsCount: violations.length,
          predictedRank: violations.length >= 7 ? 'Chưa đạt' : violations.length >= 5 ? 'Đạt' : 'Khá',
          violations,
          messageZalo: '',
        });
      }
    });

    const monthlyAlertsList = Array.from(alertsMap.values());

    // TT22 Monthly Forecast
    const evaluatedMonthlyStudents = students.map((s) => {
      const sViolations = monthRecords.filter((r) => r.studentId === s.id && r.pointsImpact < 0);
      const sBonuses = monthRecords.filter((r) => r.studentId === s.id && r.pointsImpact > 0);

      let rank: TT22Rank = 'Tốt';
      if (sViolations.length >= 7) rank = 'Chưa đạt';
      else if (sViolations.length >= 5) rank = 'Đạt';
      else if (sViolations.length >= 3) rank = 'Khá';

      return {
        student: s,
        violationsCount: sViolations.length,
        bonusesCount: sBonuses.length,
        rank,
      };
    });

    const rankCounts = {
      tot: evaluatedMonthlyStudents.filter((s) => s.rank === 'Tốt').length,
      kha: evaluatedMonthlyStudents.filter((s) => s.rank === 'Khá').length,
      dat: evaluatedMonthlyStudents.filter((s) => s.rank === 'Đạt').length,
      chuaDat: evaluatedMonthlyStudents.filter((s) => s.rank === 'Chưa đạt').length,
    };

    return {
      targetMonthObj,
      monthWeeks,
      monthReports,
      monthRecords,
      groupedMonthScn,
      monthlyAlertsList,
      evaluatedMonthlyStudents,
      rankCounts,
    };
  }, [selectedMonthNum, reports, records, students, profile.alertThreshold]);

  // FULL YEAR & SEMESTER AGGREGATION
  const cycleEvaluation = useMemo(() => {
    const isSem1 = filterMode === 'semester' && selectedSemesterNum === 1;
    const isSem2 = filterMode === 'semester' && selectedSemesterNum === 2;

    const filteredRecords = records.filter((r) => {
      if (filterMode === 'year') return true;
      if (isSem1) return r.semester === 1 || r.weekNumber <= 18;
      if (isSem2) return r.semester === 2 || r.weekNumber >= 19;
      return true;
    });

    const evaluated = students.map((s) => {
      const sRecords = filteredRecords.filter((r) => r.studentId === s.id);
      const violations = sRecords.filter((r) => r.pointsImpact < 0);
      const bonuses = sRecords.filter((r) => r.pointsImpact > 0);

      let rank: TT22Rank = 'Tốt';
      if (filterMode === 'year') {
        if (violations.length >= 12) rank = 'Chưa đạt';
        else if (violations.length >= 8) rank = 'Đạt';
        else if (violations.length >= 5) rank = 'Khá';
        else rank = 'Tốt';
      } else {
        if (violations.length >= 7) rank = 'Chưa đạt';
        else if (violations.length >= 5) rank = 'Đạt';
        else if (violations.length >= 3) rank = 'Khá';
        else rank = 'Tốt';
      }

      return {
        student: s,
        violations,
        bonuses,
        rank,
        records: sRecords,
      };
    });

    const exemplaryList = evaluated.filter((e) => e.rank === 'Tốt');
    const atRiskList = evaluated.filter((e) => e.rank === 'Chưa đạt');
    const satisfactoryList = evaluated.filter((e) => e.rank === 'Khá' || e.rank === 'Đạt');

    return {
      evaluated,
      exemplaryList,
      atRiskList,
      satisfactoryList,
      totalStudents: students.length || 1,
    };
  }, [filterMode, selectedSemesterNum, records, students]);

  // Selected student for Profile inspector
  const inspectedStudentObj = students.find((s) => s.id === inspectedStudentId) || students[0];
  const inspectedStudentRecords = records.filter((r) => r.studentId === inspectedStudentObj?.id);

  // Generate dynamic Zalo message for student
  const getRenderedZaloMessage = (alert: MonthlyParentAlert) => {
    const errorCount =
      alert.totalMonthlyErrors ||
      alert.cumulativeErrorsCount ||
      alert.weeklyErrorsCount ||
      alert.violations.length;

    const violationLines = alert.violations
      .map(
        (v) =>
          `- Ngày ${v.date}, Tiết ${v.period} môn ${v.subject}: ${cleanExpressionText(v.behavior)}`
      )
      .join('\n');

    let templateToUse = profile.template1Monthly;
    if (selectedTemplateMode === 'template2') templateToUse = profile.template2Urgent;
    if (selectedTemplateMode === 'template3') templateToUse = profile.template3Praise;

    const latestViolation = alert.violations[alert.violations.length - 1];

    return fillMessageTemplate(templateToUse, {
      profile,
      studentName: alert.studentName,
      errorCount,
      violationListText: violationLines,
      dateTimeStr: latestViolation ? `Ngày ${latestViolation.date}` : 'Gần đây',
      period: latestViolation ? latestViolation.period : 1,
      subject: latestViolation ? latestViolation.subject : 'Chung',
      behavior: latestViolation ? cleanExpressionText(latestViolation.behavior) : 'Vi phạm nội quy',
      achievement: 'Có ý thức phấn đấu và đạt điểm 10 kiểm tra miệng',
    });
  };

  const handleCopyZalo = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedZaloIndex(index);
    setTimeout(() => setCopiedZaloIndex(null), 2500);
  };

  const handleCopyAllZaloMonth = () => {
    const alerts = monthData.monthlyAlertsList;
    if (alerts.length === 0) return;

    let content = `DANH SÁCH TIN NHẮN PHỤ HUYNH THÁNG ${selectedMonthNum} - LỚP ${profile.className}\n\n`;
    alerts.forEach((al, i) => {
      content += `=== [HỌC SINH ${i + 1}]: ${al.studentName} (STT ${al.stt}) - ${al.phone} ===\n`;
      content += getRenderedZaloMessage(al) + '\n\n';
    });

    navigator.clipboard.writeText(content);
    setCopiedSection('all_zalo');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleCopySCNTable = (rows: GroupedScnExportRow[]) => {
    let tsv = `Ngày, tháng, năm\tHọ, tên học sinh\tCác biểu hiện cụ thể đáng chú ý (Tìm hiểu hoàn cảnh, theo dõi, biểu dương, khen ngợi hoặc nhắc nhở, phê bình)\tBiện pháp giáo dục\n`;

    const htmlRows = rows
      .map((row) => {
        const datesHtml = row.dates.join('<br/>');
        const expHtml = row.expressions.map((e) => cleanExpressionText(e)).join('<br/>');
        const measureHtml = row.measures.map((m) => cleanEducationalMeasureText(m)).join('<br/>');
        const datesTsv = row.dates.join('; ');
        const expTsv = row.expressions.map((e) => cleanExpressionText(e)).join('; ');
        const measureTsv = row.measures.map((m) => cleanEducationalMeasureText(m)).join('; ');

        tsv += `"${datesTsv}"\t"${row.studentName}"\t"${expTsv}"\t"${measureTsv}"\n`;

        return `<tr>
          <td style="padding: 6px 10px; border: 1px solid #333333; text-align: center;">${datesHtml}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333; font-weight: bold;">${row.studentName}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333;">${expHtml}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333; font-style: italic;">${measureHtml}</td>
        </tr>`;
      })
      .join('\n');

    const htmlContent = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 12pt; width: 100%;">
      <thead>
        <tr style="background-color: #f1f5f9; font-weight: bold; text-align: center;">
          <th style="padding: 8px 10px; border: 1px solid #333333; width: 120px;">Ngày tháng</th>
          <th style="padding: 8px 10px; border: 1px solid #333333; width: 180px;">Họ và tên học sinh</th>
          <th style="padding: 8px 10px; border: 1px solid #333333;">Biểu hiện cụ thể</th>
          <th style="padding: 8px 10px; border: 1px solid #333333; width: 220px;">Biện pháp giáo dục</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>`;

    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([tsv], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      navigator.clipboard.write([item]).catch(() => {
        navigator.clipboard.writeText(tsv);
      });
    } catch {
      navigator.clipboard.writeText(tsv);
    }

    setCopiedSection('scn');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getIndicatorDeduction = (ind: StudentWeeklyIndicator) => {
    if (ind.pointsFormula) return ind.pointsFormula;
    if ([7, 8, 9, 12].includes(ind.index)) {
      return ind.count > 0 ? `+${ind.count * 1}đ` : '0đ';
    }
    if (ind.index === 13 || ind.index === 11) {
      return '0đ';
    }
    return ind.count > 0 ? `-${ind.count * 2}đ` : '0đ';
  };

  const handleCopy13Indicators = (indicators: StudentWeeklyIndicator[]) => {
    // HTML format for rich-text paste into Excel and Word preserving borders and styles
    const htmlRows = indicators
      .map((ind) => {
        const points = getIndicatorDeduction(ind);
        const detailsClean = ind.details || 'Không ghi nhận';
        return `<tr>
          <td style="padding: 6px 10px; border: 1px solid #333333; text-align: center; font-weight: bold;">${ind.index}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333; font-weight: 600;">${ind.title}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333;">${detailsClean}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333; text-align: center; font-weight: bold;">${ind.count}</td>
          <td style="padding: 6px 10px; border: 1px solid #333333; text-align: center; font-weight: bold;">${points}</td>
        </tr>`;
      })
      .join('\n');

    const htmlContent = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 12pt; width: 100%;">
  <thead>
    <tr style="background-color: #f1f5f9; font-weight: bold; text-align: center;">
      <th style="padding: 8px 10px; border: 1px solid #333333; width: 50px;">STT</th>
      <th style="padding: 8px 10px; border: 1px solid #333333; text-align: left; width: 220px;">Chỉ số vi phạm</th>
      <th style="padding: 8px 10px; border: 1px solid #333333; text-align: left;">Danh sách học sinh &amp; Số lần</th>
      <th style="padding: 8px 10px; border: 1px solid #333333; width: 110px;">Tổng số lượt</th>
      <th style="padding: 8px 10px; border: 1px solid #333333; width: 100px;">Điểm trừ</th>
    </tr>
  </thead>
  <tbody>
    ${htmlRows}
  </tbody>
</table>`;

    // Tab-delimited format for plain text paste
    let tsv = `STT\tChỉ số vi phạm\tDanh sách học sinh & Số lần\tTổng số lượt\tĐiểm trừ\n`;
    indicators.forEach((ind) => {
      const points = getIndicatorDeduction(ind);
      const detailsClean = (ind.details || 'Không ghi nhận').replace(/\t/g, ' ').replace(/\n/g, ' ');
      tsv += `${ind.index}\t${ind.title}\t${detailsClean}\t${ind.count}\t${points}\n`;
    });

    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([tsv], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      navigator.clipboard.write([item]).catch(() => {
        navigator.clipboard.writeText(tsv);
      });
    } catch {
      navigator.clipboard.writeText(tsv);
    }

    setCopied13Table(true);
    setTimeout(() => setCopied13Table(false), 2000);
  };

  // Week 13 indicators & grouped SCN
  const weekIndicators = activeReport ? get13Indicators(activeReport) : [];
  const weekGroupedScn = activeReport ? getGroupedScnRowsFromEntries(activeReport.scnJournalEntries || []) : [];
  const weekColl = activeReport?.collectiveCompetition || {
    startingPoints: 100,
    periodDeductions: 0,
    periodDetails: '',
    saoDoDeductions: 0,
    saoDoDetails: '',
    finalScore: 100,
    estimatedRank: 'Hạng 1',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining 2 independent streams & 35-week engine */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
              <span>EduMaster AI • Bộ Lọc Thời Gian Đa Tầng 35 Tuần Học</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {filterMode === 'week' && `Báo Cáo Sơ Kết - Tuần ${selectedWeekNum} (${getWeekCycleInfo(selectedWeekNum).monthName})`}
              {filterMode === 'month' && `Tổng Hợp Sơ Kết - Tháng ${selectedMonthNum}/2026 (Tuần ${monthData.monthWeeks.join(', ')})`}
              {filterMode === 'semester' && `Đánh Giá Kết Quả Rèn Luyện - Học Kỳ ${selectedSemesterNum} (Thông tư 22)`}
              {filterMode === 'year' && `Tổng Kết Đánh Giá Toàn Diện - Cả Năm Học (35 Tuần)`}
            </h2>
            <p className="text-xs text-blue-200/90 max-w-2xl mt-1.5 leading-relaxed">
              <strong>• Luồng 1 (Điểm thi đua lớp):</strong> Độc lập, chỉ trừ theo Sổ Sao Đỏ &amp; Xếp loại tiết học Sổ Đầu Bài. <br />
              <strong>• Luồng 2 (Hồ sơ cá nhân):</strong> Tích lũy theo tháng &amp; 35 tuần; tự động cảnh báo phụ huynh khi chạm ngưỡng {profile.alertThreshold} lỗi/tháng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenProfileSettings && (
              <button
                onClick={onOpenProfileSettings}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-blue-200 transition"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                <span>Hồ Sơ &amp; Mẫu Tin</span>
              </button>
            )}

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 text-right min-w-[170px]">
              <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block">
                Lớp {profile.className} • Năm học
              </span>
              <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white">{profile.academicYear}</span>
              </div>
              <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                Sĩ số: {students.length} học sinh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE TIME COMMAND QUERY BAR (PHẦN 2)
          ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteQuery();
          }}
          className="flex flex-wrap sm:flex-nowrap items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryCommand}
              onChange={(e) => setQueryCommand(e.target.value)}
              placeholder="Nhập lệnh tra cứu (VD: 'Xem Tuần 3', 'Xem Tháng 9', 'Tổng kết Tháng 10', 'Xem Học kỳ 1', 'Xem Cả năm')..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
          >
            <span>Tra cứu</span>
          </button>
        </form>

        {queryFeedback && (
          <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5 px-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{queryFeedback}</span>
          </div>
        )}

        {/* Quick query chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Lệnh nhanh:
          </span>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Xem Tuần 3')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            🔍 Xem Tuần 3
          </button>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Xem Tuần 4')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            🔍 Xem Tuần 4
          </button>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Xem Tháng 9')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            📅 Xem Tháng 9 (Tuần 1-4)
          </button>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Tổng kết Tháng 10')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            📅 Tổng kết Tháng 10
          </button>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Xem Học kỳ 1')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            🎓 Xem Học kỳ 1 (Tuần 1-18)
          </button>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Xem Học kỳ 2')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            🎓 Xem Học kỳ 2 (Tuần 19-35)
          </button>
          <button
            type="button"
            onClick={() => handleExecuteQuery('Xem Cả năm')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
          >
            🏆 Xem Cả năm (35 Tuần)
          </button>
        </div>
      </div>

      {/* =========================================================================
          MULTI-TIER CYCLE NAVIGATION (4 CHU KỲ TRUY VẤN)
          ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        {/* Tier 1 Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setFilterMode('week')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'week' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Theo Tuần (Tuần 1 - 35)</span>
            </button>
            <button
              onClick={() => setFilterMode('month')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>2. Theo Tháng (Tháng 9 - 5)</span>
            </button>
            <button
              onClick={() => setFilterMode('semester')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'semester' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Theo Học Kỳ (HK1 &amp; HK2)</span>
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'year' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>4. Tổng Kết Cả Năm</span>
            </button>
          </div>

          {/* Quick Actions (Save Drive, JSON) */}
          <div className="flex items-center gap-2">
            {activeReport && (
              <button
                onClick={() => onSaveToDrive(activeReport)}
                disabled={isSavingToDrive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isSavingToDrive ? 'Đang lưu...' : 'Lưu Drive'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Sub-selector based on selected Mode */}
        {filterMode === 'week' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Chọn Tuần Học (Trục 35 tuần):</span>
              <span>Đang xem: <strong>Tuần {selectedWeekNum} ({getWeekCycleInfo(selectedWeekNum).dateRange})</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
              {SCHOOL_YEAR_WEEKS.map((w) => {
                const hasReport = reports.some((r) => r.weekNumber === w.weekNumber);
                const isSelected = w.weekNumber === selectedWeekNum;
                return (
                  <button
                    key={w.weekNumber}
                    onClick={() => {
                      setSelectedWeekNum(w.weekNumber);
                      onSelectWeek(w.weekNumber);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : hasReport
                        ? 'bg-white text-slate-800 border border-blue-200 hover:border-blue-400'
                        : 'bg-white/60 text-slate-400 border border-slate-200 hover:text-slate-700'
                    }`}
                  >
                    <span>T{w.weekNumber}</span>
                    {hasReport && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filterMode === 'month' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Chọn Tháng Cần Báo Cáo &amp; Kích Hoạt Cảnh Báo Phụ Huynh:</span>
              <span>Gồm: <strong>Tuần {monthData.monthWeeks.join(', ')}</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {MONTH_LIST.map((m) => {
                const isSel = m.monthNumber === selectedMonthNum;
                return (
                  <button
                    key={m.monthNumber}
                    onClick={() => setSelectedMonthNum(m.monthNumber)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{m.monthName}</span>
                    <span className="text-[10px] opacity-75">(Tuần {m.weeks[0]}-{m.weeks[m.weeks.length - 1]})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filterMode === 'semester' && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Chọn Học Kỳ:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedSemesterNum(1)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedSemesterNum === 1
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Học Kỳ I (Tuần 1 - Tuần 18)
              </button>
              <button
                onClick={() => setSelectedSemesterNum(2)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedSemesterNum === 2
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Học Kỳ II (Tuần 19 - Tuần 35)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: THEO TUẦN CỤ THỂ (13 CHỈ SỐ, THI ĐUA TUẦN, SCN TUẦN)
          ========================================================================= */}
      {filterMode === 'week' && activeReport && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-10">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                  {profile.schoolName} • Sổ Công Tác Chủ Nhiệm THCS
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                  BÁO CÁO CÔNG TÁC CHỦ NHIỆM – TUẦN {activeReport.weekNumber}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                  Lớp: <strong className="text-slate-900">{profile.className}</strong> • GVCN: <strong className="text-slate-900">{profile.teacherName}</strong> • Năm học: <strong>{profile.academicYear}</strong> • Chu kỳ: <strong>{activeReport.dateRange}</strong>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Điểm thi đua tuần</span>
                <div className="flex items-baseline justify-end gap-1 mt-0.5">
                  <span className="text-2xl font-black text-blue-700">{weekColl.finalScore}</span>
                  <span className="text-xs text-slate-500">/ 100đ</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">{weekColl.estimatedRank}</span>
              </div>
            </div>
          </div>

          {/* MỤC 1: BẢNG SƠ KẾT THI ĐUA TẬP THỂ LỚP */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                MỤC 1: BẢNG SƠ KẾT THI ĐUA TẬP THỂ LỚP (SỔ ĐẦU BÀI &amp; SAO ĐỎ)
              </h2>
            </div>

            <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <span className="text-xs font-bold text-slate-600 uppercase block">1. Điểm Chuẩn Khởi Đầu</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">100 điểm</span>
                  <p className="text-[11px] text-slate-500 mt-1">Mốc thi đua ban đầu của tuần</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-rose-100">
                  <span className="text-xs font-bold text-rose-700 uppercase block">2. Trừ Tiết Học (Sổ Đầu Bài)</span>
                  <span className="text-2xl font-black text-rose-700 block mt-1">
                    -{weekColl.periodDeductions || 0} điểm
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">{weekColl.periodDetails || 'Đảm bảo 100% tiết Tốt'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-amber-100">
                  <span className="text-xs font-bold text-amber-700 uppercase block">3. Trừ Sổ Sao Đỏ (Liên Đội)</span>
                  <span className="text-2xl font-black text-amber-700 block mt-1">
                    -{weekColl.saoDoDeductions || 0} điểm
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">{weekColl.saoDoDetails || 'Không có vi phạm tập thể'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* MỤC 2: TỔNG HỢP VẤN ĐỀ HỌC SINH TRONG TUẦN (13 CHỈ SỐ THEO DÕI) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  MỤC 2: TỔNG HỢP VẤN ĐỀ HỌC SINH TRONG TUẦN (13 CHỈ SỐ THEO DÕI)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Bộ đếm chuẩn 13 chỉ số
                </span>

                <button
                  type="button"
                  onClick={() => handleCopy13Indicators(weekIndicators)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                    copied13Table
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title="Sao chép toàn bộ nội dung của Bảng 13 chỉ số dưới dạng bảng HTML/Tab-delimited text để dán trực tiếp vào Excel hoặc Word"
                >
                  {copied13Table ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>✓ Đã sao chép bảng!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Sao chép bảng (Excel/Word)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-14 text-center">STT</th>
                    <th className="py-2.5 px-4 w-60">Chỉ số vi phạm</th>
                    <th className="py-2.5 px-4">Danh sách học sinh &amp; Số lần</th>
                    <th className="py-2.5 px-3 w-28 text-center">Tổng số lượt</th>
                    <th className="py-2.5 px-3 w-28 text-center">Điểm trừ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weekIndicators.map((ind) => {
                    const points = getIndicatorDeduction(ind);
                    return (
                      <tr key={ind.index} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">{ind.index}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{ind.title}</td>
                        <td className="py-2.5 px-4 text-slate-700">{ind.details}</td>
                        <td className="py-2.5 px-3 text-center font-black">
                          <span className={ind.count > 0 ? 'text-blue-700' : 'text-slate-400'}>{ind.count}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span className={points.startsWith('-') ? 'text-rose-600' : points.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}>
                            {points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MỤC 3: CẢNH BÁO THÁNG & TIN NHẮN PHỤ HUYNH */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-amber-500 rounded-full inline-block"></span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  MỤC 3: CẢNH BÁO THÁNG &amp; TIN NHẮN PHỤ HUYNH (NGƯỠNG ≥ {profile.alertThreshold} LỖI)
                </h2>
              </div>
            </div>

            {(!activeReport.monthlyParentAlerts || activeReport.monthlyParentAlerts.length === 0) ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-xs sm:text-sm font-medium">
                {activeReport.monthStatusNote ||
                  `Tháng này nề nếp học sinh vẫn trong ngưỡng kiểm soát (dưới ${profile.alertThreshold} lỗi), chưa cần gửi tin nhắn cảnh báo phụ huynh.`}
              </div>
            ) : (
              <div className="space-y-4">
                {activeReport.monthlyParentAlerts.map((al, idx) => (
                  <div key={idx} className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{al.studentName} (STT {al.stt})</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                          {al.totalMonthlyErrors || al.violations.length} lỗi trong tháng
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyZalo(getRenderedZaloMessage(al), idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        {copiedZaloIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedZaloIndex === idx ? 'Đã sao chép!' : 'Sao chép tin Zalo'}</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      {al.violations.map((v, vIdx) => (
                        <div key={vIdx} className="font-mono">
                          • Ngày {v.date}, Tiết {v.period} môn {v.subject}: {cleanExpressionText(v.behavior)}
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-amber-200 font-mono text-xs text-slate-800 whitespace-pre-line">
                      {getRenderedZaloMessage(al)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MỤC 4: THEO DÕI CÁC BIỂU HIỆN CỦA HỌC SINH (SCN) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  MỤC 4: THEO DÕI CÁC BIỂU HIỆN CỦA HỌC SINH (MỤC IV SCN)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportScnToWordDoc(weekGroupedScn, profile, activeReport.weekNumber, activeReport.monthName)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file Word (.docx)</span>
                </button>
                <button
                  onClick={() => handleCopySCNTable(weekGroupedScn)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  {copiedSection === 'scn' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">✓ Đã sao chép bảng!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép bảng SCN (Excel/Word)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-28 text-center">Ngày tháng</th>
                    <th className="py-2.5 px-4 w-44">Họ và tên học sinh</th>
                    <th className="py-2.5 px-4">Biểu hiện cụ thể (Học tập &amp; Kỷ luật)</th>
                    <th className="py-2.5 px-4 w-60">Biện pháp giáo dục của GVCN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weekGroupedScn.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {row.dates.map((d, dIdx) => (
                          <div key={dIdx}>{d}</div>
                        ))}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{row.studentName}</td>
                      <td className="py-2.5 px-4 text-slate-700 space-y-1">
                        {row.expressions.map((exp, eIdx) => (
                          <div key={eIdx}>{exp}</div>
                        ))}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 italic space-y-1">
                        {row.measures.map((m, mIdx) => (
                          <div key={mIdx}>{m}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MỤC 5: BIÊN BẢN & KẾ HOẠCH SINH HOẠT LỚP TUẦN */}
          <div className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-cyan-600 rounded-full inline-block"></span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  MỤC 5: BIÊN BẢN &amp; TRỌNG TÂM SINH HOẠT LỚP (TUẦN {activeReport.weekNumber})
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Lớp {profile.className} • Năm học {profile.academicYear}
              </span>
            </div>

            {/* Ban Điều Hành Sinh Hoạt (Hiển thị linh hoạt nếu có cấu hình, để trống nếu chưa nhập) */}
            {(profile.officers?.classLeader || profile.officers?.viceLeader || profile.officers?.groupLeader1) && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  Ban Điều Hành Tiết Sinh Hoạt:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-700">
                  {profile.officers.classLeader && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium block text-[11px]">Chủ tọa điều hành:</span>
                      <strong className="text-slate-900">{profile.officers.classLeader}</strong> (Lớp trưởng)
                    </div>
                  )}
                  {profile.officers.viceLeader && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium block text-[11px]">Thư ký ghi biên bản:</span>
                      <strong className="text-slate-900">{profile.officers.viceLeader}</strong> (Lớp phó)
                    </div>
                  )}
                  {(profile.officers.groupLeader1 || profile.officers.groupLeader2 || profile.officers.groupLeader3 || profile.officers.groupLeader4) && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium block text-[11px]">Tổ trưởng 4 tổ:</span>
                      <span>
                        T1: {profile.officers.groupLeader1 || '—'} • T2: {profile.officers.groupLeader2 || '—'} • T3: {profile.officers.groupLeader3 || '—'} • T4: {profile.officers.groupLeader4 || '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trọng tâm nội dung sinh hoạt lớp */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Nội dung trọng tâm triển khai:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                {(activeReport.tt22Forecast?.homeroomFocusPoints || [
                  'Sơ kết thi đua tuần, biểu dương các bạn có hoa điểm tốt và nề nếp gương mẫu.',
                  'Chấn chỉnh các trường hợp đi muộn, chưa mang đủ SGK/vở bài tập theo ghi nhận SCN.',
                  'Phổ biến kế hoạch học tập và các hoạt động Đội tuần kế tiếp.',
                ]).map((pt, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: THEO THÁNG (TỔNG HỢP CÁC TUẦN, CẢNH BÁO THÁNG, DỰ PHÓNG TT22)
          ========================================================================= */}
      {filterMode === 'month' && (
        <div className="space-y-6">
          {/* Month Summary Top Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                  Tổng hợp Sơ kết Chu kỳ Tháng
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  TỔNG HỢP TOÀN BỘ CÁC TUẦN TRONG THÁNG {selectedMonthNum}/2026
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Bao gồm các tuần: <strong>Tuần {monthData.monthWeeks.join(', ')}</strong> • Tổng số báo cáo tuần đã nạp:{' '}
                  <strong>{monthData.monthReports.length} tuần</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportScnToWordDoc(monthData.groupedMonthScn, profile, undefined, `Tháng ${selectedMonthNum}/2026`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải SCN Tháng {selectedMonthNum} (.docx)</span>
                </button>
              </div>
            </div>

            {/* Weekly Scores Comparison in this Month */}
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Điểm Thi Đua Tập Thể Từng Tuần Trong Tháng:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {monthData.monthWeeks.map((wNum) => {
                  const rep = reports.find((r) => r.weekNumber === wNum);
                  return (
                    <div
                      key={wNum}
                      className={`p-3 rounded-xl border ${
                        rep ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Tuần {wNum}</span>
                        {rep && <span className="text-[10px] font-bold text-blue-700">{rep.collectiveCompetition?.estimatedRank || 'Hạng 1'}</span>}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900">
                          {rep?.collectiveCompetition?.finalScore ?? '—'}
                        </span>
                        {rep && <span className="text-xs text-slate-500">/ 100đ</span>}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {rep ? rep.dateRange : 'Chưa nạp sổ'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KÍCH HOẠT MỤC CẢNH BÁO PHỤ HUYNH THEO THÁNG */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-amber-500 rounded-full inline-block"></span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                    KÍCH HOẠT MỤC CẢNH BÁO PHỤ HUYNH – THÁNG {selectedMonthNum}/2026
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nguyên tắc: Chỉ lọc những học sinh có tổng lỗi tích lũy trong tháng ≥ {profile.alertThreshold} lỗi
                  </p>
                </div>
              </div>

              {monthData.monthlyAlertsList.length > 0 && (
                <button
                  onClick={handleCopyAllZaloMonth}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSection === 'all_zalo' ? 'Đã sao chép tất cả!' : 'Sao chép toàn bộ tin Zalo tháng'}</span>
                </button>
              )}
            </div>

            {monthData.monthlyAlertsList.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Tháng {selectedMonthNum} nề nếp học sinh vẫn trong ngưỡng kiểm soát (dưới {profile.alertThreshold} lỗi), chưa cần gửi tin nhắn cảnh báo phụ huynh.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {monthData.monthlyAlertsList.map((al, idx) => (
                  <div key={idx} className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {al.studentName} (STT {al.stt} • {al.group})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                          {al.totalMonthlyErrors || al.violations.length} lỗi trong tháng {selectedMonthNum}
                        </span>
                        <span className="text-xs text-slate-500">Phụ huynh: {al.parentName} ({al.phone})</span>
                      </div>

                      <button
                        onClick={() => handleCopyZalo(getRenderedZaloMessage(al), idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        {copiedZaloIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedZaloIndex === idx ? 'Đã sao chép!' : 'Sao chép tin Zalo'}</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 font-mono bg-white/80 p-2.5 rounded-lg border border-amber-100">
                      {al.violations.map((v, vIdx) => (
                        <div key={vIdx}>
                          • Ngày {v.date}, Tiết {v.period} môn {v.subject}: {cleanExpressionText(v.behavior)}
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-lg p-3.5 border border-amber-200 font-mono text-xs text-slate-800 whitespace-pre-line">
                      {getRenderedZaloMessage(al)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BẢNG DỰ PHÓNG XẾP LOẠI RÈN LUYỆN CỦA THÁNG (THÔNG TƯ 22) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  BẢNG DỰ PHÓNG XẾP LOẠI RÈN LUYỆN THÁNG {selectedMonthNum} (THÔNG TƯ 22/2021/TT-BGDĐT)
                </h3>
                <p className="text-xs text-slate-500">
                  Tốt (0-2 lỗi) • Khá (3-4 lỗi) • Đạt (5-6 lỗi) • Chưa đạt (≥ 7 lỗi)
                </p>
              </div>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <span className="text-xs font-bold text-emerald-800 uppercase block">Mức Tốt</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-900">{monthData.rankCounts.tot}</span>
                  <span className="text-xs text-emerald-700">học sinh</span>
                </div>
                <span className="text-[11px] text-emerald-600 mt-1 block">
                  {((monthData.rankCounts.tot / students.length) * 100).toFixed(0)}% sĩ số
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <span className="text-xs font-bold text-blue-800 uppercase block">Mức Khá</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-blue-900">{monthData.rankCounts.kha}</span>
                  <span className="text-xs text-blue-700">học sinh</span>
                </div>
                <span className="text-[11px] text-blue-600 mt-1 block">
                  {((monthData.rankCounts.kha / students.length) * 100).toFixed(0)}% sĩ số
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <span className="text-xs font-bold text-amber-800 uppercase block">Mức Đạt</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-900">{monthData.rankCounts.dat}</span>
                  <span className="text-xs text-amber-700">học sinh</span>
                </div>
                <span className="text-[11px] text-amber-600 mt-1 block">
                  {((monthData.rankCounts.dat / students.length) * 100).toFixed(0)}% sĩ số
                </span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
                <span className="text-xs font-bold text-rose-800 uppercase block">Mức Chưa Đạt</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-900">{monthData.rankCounts.chuaDat}</span>
                  <span className="text-xs text-rose-700">học sinh</span>
                </div>
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {((monthData.rankCounts.chuaDat / students.length) * 100).toFixed(0)}% sĩ số
                </span>
              </div>
            </div>
          </div>

          {/* BẢNG NHẬT KÝ SCN MỤC IV TỔNG HỢP CẢ THÁNG */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-slate-900 rounded-full inline-block"></span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  NHẬT KÝ SCN MỤC IV TỔNG HỢP CẢ THÁNG {selectedMonthNum}/2026
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportScnToWordDoc(monthData.groupedMonthScn, profile, undefined, `Tháng ${selectedMonthNum}/2026`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Word (.docx)</span>
                </button>
                <button
                  onClick={() => handleCopySCNTable(monthData.groupedMonthScn)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  {copiedSection === 'scn' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">✓ Đã sao chép bảng!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép bảng (Excel/Word)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-28 text-center">Ngày tháng</th>
                    <th className="py-2.5 px-4 w-44">Họ và tên học sinh</th>
                    <th className="py-2.5 px-4">Biểu hiện cụ thể (Học tập &amp; Kỷ luật)</th>
                    <th className="py-2.5 px-4 w-64">Biện pháp giáo dục của GVCN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthData.groupedMonthScn.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {row.dates.map((d, dIdx) => (
                          <div key={dIdx}>{d}</div>
                        ))}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{row.studentName}</td>
                      <td className="py-2.5 px-4 text-slate-700 space-y-1">
                        {row.expressions.map((exp, eIdx) => (
                          <div key={eIdx}>{exp}</div>
                        ))}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 italic space-y-1">
                        {row.measures.map((m, mIdx) => (
                          <div key={mIdx}>{m}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3 & 4: THEO HỌC KỲ & CẢ NĂM (XẾP LOẠI TT22, KHEN THƯỞNG, HỒ SƠ 35 TUẦN)
          ========================================================================= */}
      {(filterMode === 'semester' || filterMode === 'year') && (
        <div className="space-y-6">
          {/* Cycle Overview Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                  Đánh Giá Xếp Loại Hạnh Kiểm &amp; Rèn Luyện
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {filterMode === 'year'
                    ? 'TỔNG KẾT RÈN LUYỆN TOÀN DIỆN CẢ NĂM HỌC (35 TUẦN HỌC)'
                    : `KẾT QUẢ RÈN LUYỆN HỌC KỲ ${selectedSemesterNum} (THÔNG TƯ 22)`}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Căn cứ Quy chế đánh giá học sinh THCS theo Thông tư 22/2021/TT-BGDĐT
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800">
                  {cycleEvaluation.exemplaryList.length} Học sinh Tốt • {cycleEvaluation.atRiskList.length} Rèn luyện hè
                </span>
              </div>
            </div>

            {/* TT22 Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Mức Tốt</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-950">{cycleEvaluation.exemplaryList.length}</span>
                  <span className="text-xs text-emerald-700">học sinh</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">Đạt chuẩn Khen thưởng</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase">Mức Khá</span>
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-blue-950">
                    {cycleEvaluation.satisfactoryList.filter((e) => e.rank === 'Khá').length}
                  </span>
                  <span className="text-xs text-blue-700">học sinh</span>
                </div>
                <p className="text-[11px] text-blue-700 mt-1">Tiến bộ tốt trong năm</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase">Mức Đạt</span>
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-950">
                    {cycleEvaluation.satisfactoryList.filter((e) => e.rank === 'Đạt').length}
                  </span>
                  <span className="text-xs text-amber-700">học sinh</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">Cần nhắc nhở thêm</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 uppercase">Mức Chưa Đạt</span>
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-950">{cycleEvaluation.atRiskList.length}</span>
                  <span className="text-xs text-rose-700">học sinh</span>
                </div>
                <p className="text-[11px] text-rose-700 mt-1">Phải rèn luyện hè</p>
              </div>
            </div>
          </div>

          {/* DANH SÁCH KHEN THƯỞNG & RÈN LUYỆN LẠI HÈ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DANH SÁCH KHEN THƯỞNG */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
                <Award className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-emerald-950 uppercase">
                  🏆 DANH SÁCH KHEN THƯỞNG (ĐẠT XẾP LOẠI TỐT TOÀN DIỆN)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Học sinh gương mẫu, chấp hành nghiêm túc nội quy và có nhiều điểm tốt, việc tốt:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cycleEvaluation.exemplaryList.map(({ student, bonuses }, idx) => (
                  <div
                    key={student.id}
                    onClick={() => setInspectedStudentId(student.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-100/70 cursor-pointer border border-emerald-100 text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">#{student.stt}</span>
                      <span className="font-bold text-slate-900">{student.name}</span>
                      <span className="text-slate-500">({student.role})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      +{bonuses.length} hoa điểm tốt
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DANH SÁCH RÈN LUYỆN LẠI HÈ */}
            <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold text-rose-950 uppercase">
                  ⚠️ DANH SÁCH RÈN LUYỆN LẠI TRONG KỲ NGHỈ HÈ (CHƯA ĐẠT)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Học sinh cần lập kế hoạch rèn luyện hè theo quy định của nhà trường và Thông tư 22:
              </p>
              {cycleEvaluation.atRiskList.length === 0 ? (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-semibold">
                  ✓ Toàn bộ lớp đều đạt kết quả rèn luyện từ Đạt trở lên, không có học sinh phải rèn luyện lại trong hè!
                </div>
              ) : (
                <div className="space-y-2">
                  {cycleEvaluation.atRiskList.map(({ student, violations }, idx) => (
                    <div
                      key={student.id}
                      onClick={() => setInspectedStudentId(student.id)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 cursor-pointer border border-rose-200 text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-700">#{student.stt}</span>
                        <span className="font-bold text-slate-900">{student.name}</span>
                        <span className="text-slate-500">(Tổ {student.group})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                        {violations.length} lỗi vi phạm
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              TRA CỨU HỒ SƠ CHI TIẾT TỪNG HỌC SINH (35 TUẦN HỌC)
              ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                    TRA CỨU HỒ SƠ CHI TIẾT CÁ NHÂN HỌC SINH (CHU KỲ 35 TUẦN)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tích hợp toàn bộ điểm kiểm tra các môn, lỗi vi phạm nề nếp và biện pháp sư phạm đã thực hiện
                  </p>
                </div>
              </div>

              {/* Student selector dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Chọn học sinh:</span>
                <select
                  value={inspectedStudentId}
                  onChange={(e) => setInspectedStudentId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-700 focus:outline-hidden"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      STT {s.stt}: {s.name} (Tổ {s.group} - {s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Student Profile Summary */}
            {inspectedStudentObj && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        {inspectedStudentObj.name}
                        <span className="text-xs font-normal text-slate-500 ml-2">
                          (STT: {inspectedStudentObj.stt} • Tổ {inspectedStudentObj.group} • {inspectedStudentObj.role})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Phụ huynh: <strong>{inspectedStudentObj.parentName || 'Chưa cập nhật'}</strong> • SĐT:{' '}
                        <strong>{inspectedStudentObj.parentPhone || 'Chưa có'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          exportStudentProfileToWordDoc(
                            inspectedStudentObj,
                            inspectedStudentRecords,
                            profile,
                            filterMode === 'year' ? 'Toàn bộ Năm học (35 Tuần)' : `Học kỳ ${selectedSemesterNum}`
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất Hồ Sơ Word (.doc)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline / Table of all 35-week recorded events for this student */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nhật Ký Ghi Nhận Toàn Bộ Các Biểu Hiện &amp; Điểm Số ({inspectedStudentRecords.length} lần ghi nhận):
                  </h5>

                  {inspectedStudentRecords.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500 italic">
                      Học sinh chưa có biểu hiện vi phạm hoặc điểm kiểm tra nào được ghi nhận trong cơ sở dữ liệu.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 w-16 text-center">Tuần</th>
                            <th className="py-2.5 px-3 w-28 text-center">Ngày - Tiết</th>
                            <th className="py-2.5 px-3 w-28">Môn học</th>
                            <th className="py-2.5 px-4">Biểu hiện cụ thể (Học tập / Điểm số / Kỷ luật)</th>
                            <th className="py-2.5 px-3 w-24 text-center">Barem</th>
                            <th className="py-2.5 px-4 w-60">Biện pháp giáo dục của GVCN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inspectedStudentRecords.map((r) => {
                            const isBonus = r.pointsImpact > 0;
                            return (
                              <tr key={r.id} className={isBonus ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                                  T{r.weekNumber}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                                  {r.date} (T{r.period})
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">{r.subject}</td>
                                <td className="py-2.5 px-4 text-slate-800 font-medium">
                                  {cleanExpressionText(r.behavior)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isBonus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {r.pointsImpact > 0 ? `+${r.pointsImpact}đ` : `${r.pointsImpact}đ`}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-600 italic">
                                  {cleanEducationalMeasureText(r.educationalMeasure)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
