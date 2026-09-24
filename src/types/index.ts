export type StudentRole =
  | 'Lớp trưởng'
  | 'Lớp phó học tập'
  | 'Lớp phó kỷ luật'
  | 'Lớp phó lao động'
  | 'Tổ trưởng Tổ 1'
  | 'Tổ trưởng Tổ 2'
  | 'Tổ trưởng Tổ 3'
  | 'Tổ trưởng Tổ 4'
  | 'Cán sự bộ môn'
  | 'Học sinh';

export type TT22Rank = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';

export interface Student {
  id: string;
  stt: number;
  name: string;
  gender: 'Nam' | 'Nữ';
  group: number; // 1, 2, 3, 4 (Tổ)
  role: StudentRole;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
}

export type ViolationCategory =
  | 'nghi_hoc'
  | 'di_muon'
  | 'bo_tiet'
  | 'quen_bai'
  | 'diem_duoi_5'
  | 'thai_do_sai'
  | 'mat_trat_tu'
  | 'khong_dong_phuc'
  | 'diem_tot'
  | 'viec_tot'
  | 'khen_thuong'
  | 'phe_binh'
  | 'vi_pham_nghiem_trong'
  | 'khac';

export interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  dayOfWeek: string; // "Thứ Hai", "Thứ Ba", ...
  date: string; // "15/09/2026"
  period: number; // Tiết 1, 2, 3, 4, 5
  subject: string; // "Toán", "Ngữ văn", "Tiếng Anh", ...
  behavior: string; // Hành vi cụ thể (không ghi chung chung)
  category: ViolationCategory;
  pointsImpact: number; // Điểm cá nhân (nếu có)
  educationalMeasure: string; // Biện pháp giáo dục sư phạm đề xuất
  severity: 'nhe' | 'trung_binh' | 'nang' | 'khen_thuong';
  weekNumber: number;
  semester: 1 | 2;
  month: number; // 9, 10, 11, 12, ...
  timestamp: string;
}

export interface BaremRule {
  id: string;
  code: string;
  name: string;
  category: ViolationCategory;
  points: number; // Điểm trừ hoặc điểm cộng
  description: string;
  isDefault?: boolean;
}

// Luồng 1: Điểm thi đua tập thể lớp
export interface CollectiveCompetition {
  startingPoints: number; // Điểm chuẩn ban đầu: 100 điểm
  periodDeductions: number; // Điểm trừ từ Xếp loại tiết học Sổ đầu bài
  periodDetails?: string; // e.g. "1 tiết Khá trừ 1đ, 0 tiết TB, 0 tiết Chưa đạt"
  periodDeductionDetails?: string[];
  saoDoDeductions?: number; // Điểm trừ từ Sổ Sao Đỏ trường
  saoDoDetails?: string; // e.g. "Thứ Hai: Xếp hàng vào lớp chậm trừ 2đ"
  redStarDeductions?: number;
  redStarDeductionDetails?: string[];
  bonusPoints?: number;
  bonusDetails?: string[];
  finalScore: number; // 100 - [Điểm trừ tiết học] - [Điểm trừ Sao đỏ]
  estimatedRank: string; // e.g. "Hạng 2 / 12 lớp khối 7"
}

// Luồng 2: 13 chỉ số theo dõi học sinh trong tuần
export interface StudentWeeklyIndicator {
  index: number; // 1 đến 13
  title: string;
  count: number;
  details: string; // Chi tiết học sinh liên quan (Thứ, Tiết, Môn, Hành vi)
  pointsFormula?: string;
  totalPoints?: number;
}

export interface PersonalViolationRecord {
  date: string;
  period: number;
  subject: string;
  studentName: string;
  behavior: string;
}

// Cảnh báo tháng & Tin nhắn Zalo cho HS có từ 3 lỗi/tháng trở lên
export interface MonthlyParentAlert {
  studentId: string;
  studentName: string;
  stt: number;
  group?: string;
  monthNumber?: number; // 9
  monthName?: string; // "Tháng 9/2026"
  weeklyErrorsCount?: number;
  cumulativeErrorsCount?: number;
  totalMonthlyErrors?: number; // >= 3 lần (hoặc lỗi đặc biệt nghiêm trọng)
  isSpecialException?: boolean; // Lỗi nghiêm trọng đột xuất (đánh nhau, vô lễ, thuốc lá ĐT...)
  violations: Array<{
    dayOfWeek: string;
    date: string;
    period: number;
    subject: string;
    behavior: string;
  }>;
  predictedRank: TT22Rank;
  messageZalo: string;
  phone?: string;
  parentName?: string;
}

// Bảng SCN mục IV
export interface ScnJournalEntry {
  date: string;
  studentName: string;
  studentId: string;
  details: string; // Tiết mấy, Môn gì, Vi phạm/Khen ngợi cụ thể
  educationalMeasure: string;
}

export interface WeeklyReport {
  id: string;
  weekNumber: number;
  monthNumber?: number;
  monthName?: string;
  academicYear: string;
  semester: 1 | 2;
  dateRange: string;
  // Các trường tương thích ngược và tiện ích
  startingPoints?: number;
  totalDeductions?: number;
  totalBonuses?: number;
  finalScore?: number;
  estimatedRank?: string;
  // MỤC 1: Thi đua tập thể lớp (Sổ Đầu Bài & Sao Đỏ)
  collectiveCompetition: CollectiveCompetition;
  // MỤC 2: Tổng hợp vấn đề học sinh trong tuần (13 chỉ số)
  studentWeeklyIndicators?: StudentWeeklyIndicator[];
  studentProblemsSummary?: {
    indicators13: StudentWeeklyIndicator[];
    personalViolations: PersonalViolationRecord[];
  };
  indicators?: StudentWeeklyIndicator[];
  // MỤC 3: Cảnh báo tháng & Tin nhắn Zalo (Chỉ HS >= 3 lỗi/tháng hoặc nghiêm trọng)
  monthlyParentAlerts?: MonthlyParentAlert[];
  monthlyAlerts?: MonthlyParentAlert[];
  parentAlerts?: MonthlyParentAlert[];
  monthStatusNote?: string; // Khi chưa có HS >= 3 lỗi: "Tháng này nề nếp học sinh vẫn trong ngưỡng kiểm soát (dưới 3 lỗi), chưa cần gửi tin nhắn cảnh báo phụ huynh."
  // MỤC 4: Bảng SCN (Mục IV)
  scnJournalEntries: ScnJournalEntry[];
  // Dự phóng Thông tư 22
  tt22Forecast: {
    atRiskStudents: Array<{
      name: string;
      stt: number;
      errorsCount: number;
      commonSubjects: string[];
      predictedRank: TT22Rank;
    }>;
    exemplaryStudents: Array<{
      name: string;
      stt: number;
      goodPointsCount: number;
    }>;
    homeroomFocusPoints: string[];
  };
  createdAt?: string;
}

export interface DriveSavedFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface ClassOfficers {
  classLeader?: string; // Lớp trưởng
  viceLeader?: string; // Lớp phó
  groupLeader1?: string; // Tổ trưởng Tổ 1
  groupLeader2?: string; // Tổ trưởng Tổ 2
  groupLeader3?: string; // Tổ trưởng Tổ 3
  groupLeader4?: string; // Tổ trưởng Tổ 4
}

export interface SystemProfile {
  schoolName: string; // e.g. "Trường THCS Nguyễn Công Trứ"
  className: string; // e.g. "9.5"
  academicYear: string; // e.g. "2026 - 2027"
  teacherName: string; // e.g. "Cô Vũ Thị Anh Phụng"
  teacherTitle: 'Cô' | 'Thầy'; // e.g. "Cô"
  teacherPhone: string; // e.g. "0978057875"
  alertThreshold: number; // e.g. 3
  officers?: ClassOfficers; // Ban cán sự lớp (tùy chọn)
  template1Monthly: string; // Mẫu 1: Nhắc nhở định kỳ cuối tháng
  template2Urgent: string; // Mẫu 2: Cảnh báo khẩn cấp trong tuần
  template3Praise: string; // Mẫu 3: Tuyên dương tiến bộ / thành tích
}

