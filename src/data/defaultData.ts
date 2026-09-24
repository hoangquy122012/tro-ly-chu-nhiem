import { Student, BaremRule, BehaviorRecord, WeeklyReport, SystemProfile } from '../types';

export const DEFAULT_STUDENTS: Student[] = [
  { id: 'hs_01', stt: 1, name: 'Nguyễn An Khang', gender: 'Nam', group: 1, role: 'Lớp trưởng', parentName: 'Nguyễn Văn Minh', parentPhone: '0912345601' },
  { id: 'hs_02', stt: 2, name: 'Trần Bảo Châu', gender: 'Nữ', group: 1, role: 'Lớp phó học tập', parentName: 'Trần Văn Long', parentPhone: '0912345602' },
  { id: 'hs_03', stt: 3, name: 'Lê Tuấn Anh', gender: 'Nam', group: 1, role: 'Lớp phó kỷ luật', parentName: 'Lê Văn Tuấn', parentPhone: '0912345603' },
  { id: 'hs_04', stt: 4, name: 'Phạm Minh Đức', gender: 'Nam', group: 1, role: 'Lớp phó lao động', parentName: 'Phạm Đức Hòa', parentPhone: '0912345604' },
  { id: 'hs_05', stt: 5, name: 'Hoàng Thị Mai', gender: 'Nữ', group: 1, role: 'Tổ trưởng Tổ 1', parentName: 'Hoàng Văn Thắng', parentPhone: '0912345605' },
  { id: 'hs_06', stt: 6, name: 'Vũ Đức Nam', gender: 'Nam', group: 1, role: 'Học sinh', parentName: 'Vũ Văn Bách', parentPhone: '0912345606' },
  { id: 'hs_07', stt: 7, name: 'Đặng Thùy Dương', gender: 'Nữ', group: 1, role: 'Học sinh', parentName: 'Đặng Văn Cường', parentPhone: '0912345607' },
  { id: 'hs_08', stt: 8, name: 'Bùi Gia Huy', gender: 'Nam', group: 1, role: 'Học sinh', parentName: 'Bùi Văn Sang', parentPhone: '0912345608' },
  { id: 'hs_09', stt: 9, name: 'Ngô Thanh Hà', gender: 'Nữ', group: 1, role: 'Học sinh', parentName: 'Ngô Quốc Trung', parentPhone: '0912345609' },

  { id: 'hs_10', stt: 10, name: 'Đỗ Quốc Bảo', gender: 'Nam', group: 2, role: 'Tổ trưởng Tổ 2', parentName: 'Đỗ Hùng Dũng', parentPhone: '0912345610' },
  { id: 'hs_11', stt: 11, name: 'Nguyễn Phương Linh', gender: 'Nữ', group: 2, role: 'Cán sự bộ môn', parentName: 'Nguyễn Văn Đạt', parentPhone: '0912345611' },
  { id: 'hs_12', stt: 12, name: 'Lê Hoàng Nam', gender: 'Nam', group: 2, role: 'Học sinh', parentName: 'Lê Văn Trọng', parentPhone: '0912345612' },
  { id: 'hs_13', stt: 13, name: 'Phan Khánh Vy', gender: 'Nữ', group: 2, role: 'Học sinh', parentName: 'Phan Văn Hải', parentPhone: '0912345613' },
  { id: 'hs_14', stt: 14, name: 'Trương Tuấn Kiệt', gender: 'Nam', group: 2, role: 'Học sinh', parentName: 'Trương Văn Nghĩa', parentPhone: '0912345614' },
  { id: 'hs_15', stt: 15, name: 'Võ Minh Quân', gender: 'Nam', group: 2, role: 'Học sinh', parentName: 'Võ Văn Hưng', parentPhone: '0912345615' },
  { id: 'hs_16', stt: 16, name: 'Dương Thảo Nhi', gender: 'Nữ', group: 2, role: 'Học sinh', parentName: 'Dương Văn Bình', parentPhone: '0912345616' },
  { id: 'hs_17', stt: 17, name: 'Lý Gia Hưng', gender: 'Nam', group: 2, role: 'Học sinh', parentName: 'Lý Quốc Bảo', parentPhone: '0912345617' },
  { id: 'hs_18', stt: 18, name: 'Nguyễn Ngọc Anh', gender: 'Nữ', group: 2, role: 'Học sinh', parentName: 'Nguyễn Văn Tiến', parentPhone: '0912345618' },

  { id: 'hs_19', stt: 19, name: 'Hồ Tấn Phát', gender: 'Nam', group: 3, role: 'Tổ trưởng Tổ 3', parentName: 'Hồ Văn Lộc', parentPhone: '0912345619' },
  { id: 'hs_20', stt: 20, name: 'Trịnh Cẩm Tú', gender: 'Nữ', group: 3, role: 'Cán sự bộ môn', parentName: 'Trịnh Văn Hùng', parentPhone: '0912345620' },
  { id: 'hs_21', stt: 21, name: 'Lê Văn Tuấn Anh', gender: 'Nam', group: 3, role: 'Học sinh', parentName: 'Lê Văn Cảnh', parentPhone: '0912345621' },
  { id: 'hs_22', stt: 22, name: 'Đoàn Quang Khải', gender: 'Nam', group: 3, role: 'Học sinh', parentName: 'Đoàn Văn Sơn', parentPhone: '0912345622' },
  { id: 'hs_23', stt: 23, name: 'Mai Tuyết Nhung', gender: 'Nữ', group: 3, role: 'Học sinh', parentName: 'Mai Văn Tùng', parentPhone: '0912345623' },
  { id: 'hs_24', stt: 24, name: 'Đinh Quốc Việt', gender: 'Nam', group: 3, role: 'Học sinh', parentName: 'Đinh Văn Hoàng', parentPhone: '0912345624' },
  { id: 'hs_25', stt: 25, name: 'Lâm Mỹ Duyên', gender: 'Nữ', group: 3, role: 'Học sinh', parentName: 'Lâm Văn Phước', parentPhone: '0912345625' },
  { id: 'hs_26', stt: 26, name: 'Cao Đình Trọng', gender: 'Nam', group: 3, role: 'Học sinh', parentName: 'Cao Văn Hạnh', parentPhone: '0912345626' },
  { id: 'hs_27', stt: 27, name: 'Nguyễn Thảo Nguyên', gender: 'Nữ', group: 3, role: 'Học sinh', parentName: 'Nguyễn Văn Phúc', parentPhone: '0912345627' },

  { id: 'hs_28', stt: 28, name: 'Phùng Hải Đăng', gender: 'Nam', group: 4, role: 'Tổ trưởng Tổ 4', parentName: 'Phùng Văn Lâm', parentPhone: '0912345628' },
  { id: 'hs_29', stt: 29, name: 'Chu Quỳnh Trang', gender: 'Nữ', group: 4, role: 'Học sinh', parentName: 'Chu Văn Quý', parentPhone: '0912345629' },
  { id: 'hs_30', stt: 30, name: 'Tạ Minh Triết', gender: 'Nam', group: 4, role: 'Học sinh', parentName: 'Tạ Văn Tuấn', parentPhone: '0912345630' },
  { id: 'hs_31', stt: 31, name: 'Vương Bảo Trâm', gender: 'Nữ', group: 4, role: 'Học sinh', parentName: 'Vương Văn Nam', parentPhone: '0912345631' },
  { id: 'hs_32', stt: 32, name: 'Nguyễn Hoàng Nam', gender: 'Nam', group: 4, role: 'Học sinh', parentName: 'Nguyễn Văn Thành', parentPhone: '0912345632' },
  { id: 'hs_33', stt: 33, name: 'Trần Hoài An', gender: 'Nữ', group: 4, role: 'Học sinh', parentName: 'Trần Quốc Tuấn', parentPhone: '0912345633' },
  { id: 'hs_34', stt: 34, name: 'Lương Kiến Quốc', gender: 'Nam', group: 4, role: 'Học sinh', parentName: 'Lương Văn Thái', parentPhone: '0912345634' },
  { id: 'hs_35', stt: 35, name: 'Dương Yến Nhi', gender: 'Nữ', group: 4, role: 'Học sinh', parentName: 'Dương Văn Chiến', parentPhone: '0912345635' },
  { id: 'hs_36', stt: 36, name: 'Tạ Hoàng Bách', gender: 'Nam', group: 4, role: 'Học sinh', parentName: 'Tạ Văn Duy', parentPhone: '0912345636' },
];

export const DEFAULT_BAREM_RULES: BaremRule[] = [
  { id: 'b_1', code: 'DI_MUON', name: 'Đi học muộn / Vào lớp muộn', category: 'di_muon', points: -2, description: 'Đến sau hiệu lệnh trống vào lớp hoặc sau khi GV vào lớp', isDefault: true },
  { id: 'b_2', code: 'MAT_TRAT_TU', name: 'Mất trật tự / Nói chuyện riêng', category: 'mat_trat_tu', points: -1, description: 'Nói chuyện riêng bị giáo viên bộ môn nhắc nhở trong giờ học', isDefault: true },
  { id: 'b_3', code: 'QUEN_BAI', name: 'Không chuẩn bị bài / Quên vở, sách', category: 'quen_bai', points: -2, description: 'Không làm bài tập về nhà, quên mang sách giáo khoa hoặc vở ghi', isDefault: true },
  { id: 'b_4', code: 'DIEM_DUOI_5', name: 'Điểm kiểm tra dưới 5.0', category: 'diem_duoi_5', points: -2, description: 'Điểm kiểm tra miệng hoặc 15 phút dưới 5.0', isDefault: true },
  { id: 'b_5', code: 'SAI_DONG_PHUC', name: 'Sai đồng phục / Không nón bảo hiểm', category: 'khong_dong_phuc', points: -2, description: 'Không mặc áo đồng phục, đi dép lê, không đội nón bảo hiểm khi đi xe', isDefault: true },
  { id: 'b_6', code: 'DIEM_TOT', name: 'Điểm tốt (8, 9, 10)', category: 'diem_tot', points: 1, description: 'Được điểm 8, 9 hoặc 10 khi kiểm tra miệng, kiểm tra 15 phút', isDefault: true },
  { id: 'b_7', code: 'VIEC_TOT', name: 'Việc tốt / Nhặt được của rơi', category: 'viec_tot', points: 2, description: 'Nhặt được của rơi trả lại, giúp đỡ bạn bè, hỗ trợ giáo viên', isDefault: true },
  { id: 'b_8', code: 'NGHI_KHONG_PHEP', name: 'Nghỉ học không phép', category: 'nghi_hoc', points: -5, description: 'Tự ý nghỉ học không có đơn xin phép của phụ huynh', isDefault: true },
  { id: 'b_9', code: 'BO_TIET', name: 'Bỏ tiết / Trốn học', category: 'bo_tiet', points: -5, description: 'Có mặt đầu giờ nhưng trốn tiết giữa buổi học', isDefault: true },
  { id: 'b_10', code: 'THAI_DO_SAI', name: 'Mắc thái độ sai / Vô lễ', category: 'thai_do_sai', points: -5, description: 'Có thái độ vô lễ với giáo viên, cãi lời người lớn, văng tục', isDefault: true },
  { id: 'b_11', code: 'TIET_TU_QUAN_TOT', name: 'Tiết tự quản tốt (khi GV vắng)', category: 'khen_thuong', points: 2, description: 'Cả lớp giữ trật tự tốt khi có tiết tự quản hoặc GV có việc đột xuất', isDefault: true },
  { id: 'b_12', code: 'KHEN_THUONG_KHAC', name: 'Khen thưởng chuyên đề / Phong trào', category: 'khen_thuong', points: 2, description: 'Đạt giải phong trào, thi đua thể thao, văn nghệ cấp trường', isDefault: true },
];

export const INITIAL_BEHAVIOR_RECORDS: BehaviorRecord[] = [
  {
    id: 'br_01',
    studentId: 'hs_12',
    studentName: 'Lê Hoàng Nam',
    dayOfWeek: 'Thứ Ba',
    date: '15/09/2026',
    period: 1,
    subject: 'Tiếng Anh',
    behavior: 'Đi học muộn 15 phút không có lý do chính đáng',
    category: 'di_muon',
    pointsImpact: -2,
    educationalMeasure: 'Nhắc nhở, yêu cầu đi học đúng giờ, nhắc nhở trước lớp',
    severity: 'nhe',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-15T07:15:00',
  },
  {
    id: 'br_02',
    studentId: 'hs_12',
    studentName: 'Lê Hoàng Nam',
    dayOfWeek: 'Thứ Ba',
    date: '15/09/2026',
    period: 3,
    subject: 'Khoa học tự nhiên',
    behavior: 'Nói chuyện riêng làm ồn nhiều lần bị GVBM ghi sổ đầu bài',
    category: 'mat_trat_tu',
    pointsImpact: -1,
    educationalMeasure: 'Đổi chỗ ngồi lên bàn đầu, trao đổi riêng giờ ra chơi',
    severity: 'trung_binh',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-15T09:30:00',
  },
  {
    id: 'br_03',
    studentId: 'hs_12',
    studentName: 'Lê Hoàng Nam',
    dayOfWeek: 'Thứ Năm',
    date: '17/09/2026',
    period: 2,
    subject: 'Toán',
    behavior: 'Không chuẩn bị bài tập về nhà hình học và quên vở bài tập',
    category: 'quen_bai',
    pointsImpact: -2,
    educationalMeasure: 'Nhắc nhở, giao bạn Lớp phó học tập Trần Bảo Châu kiểm tra bài đầu giờ ngày mai',
    severity: 'trung_binh',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-17T08:15:00',
  },
  {
    id: 'br_04',
    studentId: 'hs_08',
    studentName: 'Bùi Gia Huy',
    dayOfWeek: 'Thứ Hai',
    date: '14/09/2026',
    period: 4,
    subject: 'Lịch sử & Địa lí',
    behavior: 'Quên mang sách giáo khoa và không ghi chép bài học',
    category: 'quen_bai',
    pointsImpact: -2,
    educationalMeasure: 'Nhắc nhở, giao bạn Tổ trưởng Mai kiểm tra vở',
    severity: 'nhe',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-14T10:00:00',
  },
  {
    id: 'br_05',
    studentId: 'hs_08',
    studentName: 'Bùi Gia Huy',
    dayOfWeek: 'Thứ Sáu',
    date: '18/09/2026',
    period: 1,
    subject: 'Toán',
    behavior: 'Điểm kiểm tra miệng đạt 3.0 do không thuộc công thức đại số',
    category: 'diem_duoi_5',
    pointsImpact: -2,
    educationalMeasure: 'Giao bạn Cán sự Toán hỗ trợ ôn tập, kiểm tra lại vào tuần sau',
    severity: 'trung_binh',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-18T07:30:00',
  },
  {
    id: 'br_06',
    studentId: 'hs_24',
    studentName: 'Đinh Quốc Việt',
    dayOfWeek: 'Thứ Tư',
    date: '16/09/2026',
    period: 2,
    subject: 'Ngữ văn',
    behavior: 'Gục mặt xuống bàn ngủ trong giờ học, không nghe giảng',
    category: 'mat_trat_tu',
    pointsImpact: -1,
    educationalMeasure: 'Nhắc nhở, hỏi thăm sức khỏe và sinh hoạt tại nhà',
    severity: 'nhe',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-16T08:20:00',
  },
  {
    id: 'br_07',
    studentId: 'hs_02',
    studentName: 'Trần Bảo Châu',
    dayOfWeek: 'Thứ Hai',
    date: '14/09/2026',
    period: 2,
    subject: 'Toán',
    behavior: 'Đạt điểm 10 kiểm tra miệng môn Toán, giải được bài toán nâng cao',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Tuyên dương trước lớp, cộng điểm thi đua cá nhân',
    severity: 'khen_thuong',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-14T08:00:00',
  },
  {
    id: 'br_08',
    studentId: 'hs_01',
    studentName: 'Nguyễn An Khang',
    dayOfWeek: 'Thứ Tư',
    date: '16/09/2026',
    period: 5,
    subject: 'Sinh hoạt ngoài giờ',
    behavior: 'Nhặt được 200.000đ ở sân trường nộp lại cho Tổng phụ trách Đội trả người mất',
    category: 'viec_tot',
    pointsImpact: 2,
    educationalMeasure: 'Tuyên dương gương người tốt việc tốt trước cờ và trong sổ SCN',
    severity: 'khen_thuong',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-16T11:00:00',
  },
  {
    id: 'br_09',
    studentId: 'hs_11',
    studentName: 'Nguyễn Phương Linh',
    dayOfWeek: 'Thứ Năm',
    date: '17/09/2026',
    period: 3,
    subject: 'Tiếng Anh',
    behavior: 'Đạt điểm 10 bài thuyết trình Tiếng Anh theo chủ đề',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Tuyên dương, động viên tiếp tục phát huy năng lực ngoại ngữ',
    severity: 'khen_thuong',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-17T09:40:00',
  },
  {
    id: 'br_10',
    studentId: 'hs_28',
    studentName: 'Phùng Hải Đăng',
    dayOfWeek: 'Thứ Sáu',
    date: '18/09/2026',
    period: 4,
    subject: 'Giáo dục công dân',
    behavior: 'Đạt điểm 9 kiểm tra 15 phút, phát biểu xây dựng bài sôi nổi',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Khen ngợi, động viên tích cực tương tác',
    severity: 'khen_thuong',
    weekNumber: 3,
    semester: 1,
    month: 9,
    timestamp: '2026-09-18T10:30:00',
  },
  // Tuần 1
  {
    id: 'br_w1_01',
    studentId: 'hs_01',
    studentName: 'Nguyễn An Khang',
    dayOfWeek: 'Thứ Ba',
    date: '02/09/2026',
    period: 2,
    subject: 'Toán',
    behavior: 'Đạt điểm 10 kiểm tra miệng bài khởi động năm học',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Tuyên dương trước lớp',
    severity: 'khen_thuong',
    weekNumber: 1,
    semester: 1,
    month: 9,
    timestamp: '2026-09-02T08:15:00',
  },
  {
    id: 'br_w1_02',
    studentId: 'hs_03',
    studentName: 'Lê Tuấn Anh',
    dayOfWeek: 'Thứ Năm',
    date: '04/09/2026',
    period: 1,
    subject: 'Ngữ văn',
    behavior: 'Phát biểu sôi nổi và chuẩn bị bài học tốt',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Động viên tiếp tục phát huy',
    severity: 'khen_thuong',
    weekNumber: 1,
    semester: 1,
    month: 9,
    timestamp: '2026-09-04T07:30:00',
  },
  // Tuần 2
  {
    id: 'br_w2_01',
    studentId: 'hs_12',
    studentName: 'Lê Hoàng Nam',
    dayOfWeek: 'Thứ Ba',
    date: '08/09/2026',
    period: 2,
    subject: 'Lịch sử & Địa lí',
    behavior: 'Quên mang sách giáo khoa Lịch sử và Địa lí 7',
    category: 'quen_bai',
    pointsImpact: -2,
    educationalMeasure: 'Nhắc nhở, mượn sách thư viện tạm thời',
    severity: 'nhe',
    weekNumber: 2,
    semester: 1,
    month: 9,
    timestamp: '2026-09-08T08:15:00',
  },
  {
    id: 'br_w2_02',
    studentId: 'hs_02',
    studentName: 'Trần Bảo Châu',
    dayOfWeek: 'Thứ Tư',
    date: '09/09/2026',
    period: 3,
    subject: 'Tiếng Anh',
    behavior: 'Đạt điểm 10 kiểm tra 15 phút từ vựng Unit 1',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Tuyên dương trước lớp',
    severity: 'khen_thuong',
    weekNumber: 2,
    semester: 1,
    month: 9,
    timestamp: '2026-09-09T09:30:00',
  },
  // Tuần 4
  {
    id: 'br_w4_01',
    studentId: 'hs_03',
    studentName: 'Lê Tuấn Anh',
    dayOfWeek: 'Thứ Hai',
    date: '21/09/2026',
    period: 2,
    subject: 'Toán',
    behavior: 'Đạt điểm 10 kiểm tra miệng bài Phép nhân số hữu tỉ',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Tuyên dương trước lớp',
    severity: 'khen_thuong',
    weekNumber: 4,
    semester: 1,
    month: 9,
    timestamp: '2026-09-21T08:00:00',
  },
  {
    id: 'br_w4_02',
    studentId: 'hs_10',
    studentName: 'Đỗ Quốc Bảo',
    dayOfWeek: 'Thứ Ba',
    date: '22/09/2026',
    period: 2,
    subject: 'Khoa học tự nhiên',
    behavior: 'Thao tác thí nghiệm chuẩn xác, đạt điểm 9 thực hành',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Khen ngợi tinh thần học tập nghiêm túc',
    severity: 'khen_thuong',
    weekNumber: 4,
    semester: 1,
    month: 9,
    timestamp: '2026-09-22T08:45:00',
  },
  {
    id: 'br_w4_03',
    studentId: 'hs_06',
    studentName: 'Vũ Đức Nam',
    dayOfWeek: 'Thứ Sáu',
    date: '25/09/2026',
    period: 1,
    subject: 'Công nghệ',
    behavior: 'Đạt điểm 10 kiểm tra miệng môn Công nghệ',
    category: 'diem_tot',
    pointsImpact: 1,
    educationalMeasure: 'Tuyên dương trước lớp',
    severity: 'khen_thuong',
    weekNumber: 4,
    semester: 1,
    month: 9,
    timestamp: '2026-09-25T07:30:00',
  }
];

export const SAMPLE_WEEK_1_REPORT: WeeklyReport = {
  id: 'rep_w01',
  weekNumber: 1,
  monthNumber: 9,
  monthName: 'Tháng 9/2026',
  academicYear: '2026-2027',
  semester: 1,
  dateRange: 'Từ 01/09/2026 đến 05/09/2026',
  collectiveCompetition: {
    startingPoints: 100,
    periodDeductions: 0,
    periodDetails: '25 tiết Đạt yêu cầu (Tốt), nề nếp đầu năm hoàn hảo',
    saoDoDeductions: 0,
    saoDoDetails: 'Không có điểm trừ Sao đỏ trong tuần khai giảng',
    finalScore: 100,
    estimatedRank: 'Hạng 1 / 12 lớp khối 7',
  },
  studentWeeklyIndicators: [
    { index: 1, title: 'Số học sinh nghỉ học', count: 0, details: 'Chuyên cần 100%' },
    { index: 2, title: 'Số đi muộn', count: 0, details: 'Không có học sinh đi muộn' },
    { index: 3, title: 'Số bỏ tiết', count: 0, details: 'Không có học sinh bỏ tiết' },
    { index: 4, title: 'Không chuẩn bị bài / Quên vở', count: 0, details: 'Đầy đủ SGK, vở' },
    { index: 5, title: 'Điểm kiểm tra dưới 5.0', count: 0, details: 'Không có' },
    { index: 6, title: 'Mắc thái độ sai', count: 0, details: 'Không có' },
    { index: 7, title: 'Điểm tốt (8, 9, 10)', count: 2, details: 'Nguyễn An Khang, Lê Tuấn Anh' },
    { index: 8, title: 'Việc tốt / Tuyên dương', count: 1, details: 'Ban cán sự lớp hỗ trợ sắp xếp bàn ghế' },
    { index: 9, title: 'Học sinh được khen', count: 2, details: 'An Khang, Tuấn Anh' },
    { index: 10, title: 'Học sinh bị phê bình', count: 0, details: 'Không có' },
    { index: 11, title: 'Tiết trống', count: 0, details: 'Đủ 25 tiết học' },
    { index: 12, title: 'Tiết tự quản tốt', count: 1, details: 'Tiết sinh hoạt đầu năm nghiêm túc' },
    { index: 13, title: 'Đánh giá chung nề nếp tuần', count: 1, details: 'Tuần đầu năm học khởi sắc' },
  ],
  monthlyParentAlerts: [],
  monthStatusNote: 'Tháng 9 nề nếp học sinh đang được duy trì rất tốt, chưa có học sinh nào chạm ngưỡng cảnh báo cần báo phụ huynh.',
  scnJournalEntries: [
    {
      date: '02/09/2026',
      studentName: 'Nguyễn An Khang',
      studentId: 'hs_01',
      details: 'Tiết 2 môn Toán: Đạt điểm 10 kiểm tra miệng bài khởi động năm học',
      educationalMeasure: 'Tuyên dương trước lớp',
    },
    {
      date: '04/09/2026',
      studentName: 'Lê Tuấn Anh',
      studentId: 'hs_03',
      details: 'Tiết 1 môn Ngữ văn: Phát biểu sôi nổi và chuẩn bị bài học tốt',
      educationalMeasure: 'Động viên tiếp tục phát huy',
    },
  ],
  tt22Forecast: {
    atRiskStudents: [],
    exemplaryStudents: [{ name: 'Nguyễn An Khang', stt: 1, goodPointsCount: 1 }],
    homeroomFocusPoints: [
      'Ổn định tổ chức lớp và phân công nhiệm vụ cán sự.',
      'Phổ biến nội quy trường học và tiêu chí Thông tư 22.',
    ],
  },
};

export const SAMPLE_WEEK_2_REPORT: WeeklyReport = {
  id: 'rep_w02',
  weekNumber: 2,
  monthNumber: 9,
  monthName: 'Tháng 9/2026',
  academicYear: '2026-2027',
  semester: 1,
  dateRange: 'Từ 07/09/2026 đến 12/09/2026',
  collectiveCompetition: {
    startingPoints: 100,
    periodDeductions: 0,
    periodDetails: '25 tiết Đạt yêu cầu (Tốt)',
    saoDoDeductions: 1,
    saoDoDetails: 'Thứ Ba (08/09): 1 học sinh chưa sơ vin đầu giờ, trừ 1đ',
    finalScore: 99,
    estimatedRank: 'Hạng 1 / 12 lớp khối 7',
  },
  studentWeeklyIndicators: [
    { index: 1, title: 'Số học sinh nghỉ học', count: 0, details: 'Chuyên cần 100%' },
    { index: 2, title: 'Số đi muộn', count: 0, details: 'Không có' },
    { index: 3, title: 'Số bỏ tiết', count: 0, details: 'Không có' },
    { index: 4, title: 'Không chuẩn bị bài / Quên vở', count: 1, details: 'Lê Hoàng Nam quên sách LS&ĐL' },
    { index: 5, title: 'Điểm kiểm tra dưới 5.0', count: 0, details: 'Không có' },
    { index: 6, title: 'Mắc thái độ sai', count: 0, details: 'Không có' },
    { index: 7, title: 'Điểm tốt (8, 9, 10)', count: 1, details: 'Trần Bảo Châu điểm 10 Tiếng Anh' },
    { index: 8, title: 'Việc tốt / Tuyên dương', count: 0, details: 'Không ghi nhận' },
    { index: 9, title: 'Học sinh được khen', count: 1, details: 'Bảo Châu' },
    { index: 10, title: 'Học sinh bị phê bình', count: 1, details: 'Lê Hoàng Nam (1 lỗi)' },
    { index: 11, title: 'Tiết trống', count: 0, details: 'Đủ 25 tiết' },
    { index: 12, title: 'Tiết tự quản tốt', count: 1, details: 'Lớp giữ trật tự tốt' },
    { index: 13, title: 'Đánh giá chung nề nếp tuần', count: 1, details: 'Nề nếp ổn định' },
  ],
  monthlyParentAlerts: [],
  monthStatusNote: 'Tháng 9 nề nếp học sinh vẫn trong ngưỡng kiểm soát (dưới 3 lỗi), chưa cần gửi tin nhắn cảnh báo phụ huynh.',
  scnJournalEntries: [
    {
      date: '08/09/2026',
      studentName: 'Lê Hoàng Nam',
      studentId: 'hs_12',
      details: 'Tiết 2 môn Lịch sử & Địa lí: Quên mang sách giáo khoa',
      educationalMeasure: 'Nhắc nhở, mượn sách thư viện tạm thời',
    },
    {
      date: '09/09/2026',
      studentName: 'Trần Bảo Châu',
      studentId: 'hs_02',
      details: 'Tiết 3 môn Tiếng Anh: Đạt điểm 10 kiểm tra 15 phút từ vựng Unit 1',
      educationalMeasure: 'Tuyên dương trước lớp',
    },
  ],
  tt22Forecast: {
    atRiskStudents: [],
    exemplaryStudents: [{ name: 'Trần Bảo Châu', stt: 2, goodPointsCount: 1 }],
    homeroomFocusPoints: [
      'Nhắc nhở học sinh kiểm tra sách vở môn học buổi tối trước khi đến trường.',
    ],
  },
};

export const SAMPLE_WEEK_4_REPORT: WeeklyReport = {
  id: 'rep_w04',
  weekNumber: 4,
  monthNumber: 9,
  monthName: 'Tháng 9/2026',
  academicYear: '2026-2027',
  semester: 1,
  dateRange: 'Từ 21/09/2026 đến 26/09/2026',
  collectiveCompetition: {
    startingPoints: 100,
    periodDeductions: 1,
    periodDetails: '24 tiết Tốt, 1 tiết Khá (Tiết 1 Thứ Ba môn KHTN bị nhắc nhở trật tự, trừ 1đ)',
    saoDoDeductions: 2,
    saoDoDetails: 'Thứ Tư (23/09): Trực nhật hành lang chậm sau giờ ra chơi, trừ 2đ Sao đỏ',
    finalScore: 97,
    estimatedRank: 'Hạng 2 / 12 lớp khối 7',
  },
  studentWeeklyIndicators: [
    { index: 1, title: 'Số học sinh nghỉ học', count: 0, details: 'Chuyên cần 100%' },
    { index: 2, title: 'Số đi muộn', count: 0, details: 'Không có' },
    { index: 3, title: 'Số bỏ tiết', count: 0, details: 'Không có' },
    { index: 4, title: 'Không chuẩn bị bài / Quên vở', count: 1, details: 'Bùi Gia Huy quên thước kẻ' },
    { index: 5, title: 'Điểm kiểm tra dưới 5.0', count: 0, details: 'Không có' },
    { index: 6, title: 'Mắc thái độ sai', count: 0, details: 'Không có' },
    { index: 7, title: 'Điểm tốt (8, 9, 10)', count: 3, details: 'Lê Tuấn Anh (10đ), Đỗ Quốc Bảo (9đ), Vũ Đức Nam (10đ)' },
    { index: 8, title: 'Việc tốt / Tuyên dương', count: 1, details: 'Tổ 2 chăm sóc bồn hoa sạch đẹp' },
    { index: 9, title: 'Học sinh được khen', count: 3, details: 'Tuấn Anh, Quốc Bảo, Đức Nam' },
    { index: 10, title: 'Học sinh bị phê bình', count: 1, details: 'Bùi Gia Huy' },
    { index: 11, title: 'Tiết trống', count: 0, details: 'Đầy đủ tiết' },
    { index: 12, title: 'Tiết tự quản tốt', count: 1, details: 'Tiết 3 Thứ Sáu tự quản tốt' },
    { index: 13, title: 'Đánh giá chung nề nếp tuần', count: 1, details: 'Hoàn thành chương trình Tháng 9' },
  ],
  monthlyParentAlerts: [
    {
      studentId: 'hs_12',
      studentName: 'Lê Hoàng Nam',
      stt: 12,
      monthNumber: 9,
      monthName: 'Tháng 9/2026',
      totalMonthlyErrors: 4,
      cumulativeErrorsCount: 4,
      predictedRank: 'Khá',
      phone: '0912345612',
      parentName: 'Lê Văn Trọng',
      violations: [
        { dayOfWeek: 'Thứ Ba', date: '08/09/2026', period: 2, subject: 'Lịch sử & Địa lí', behavior: 'Quên mang SGK' },
        { dayOfWeek: 'Thứ Ba', date: '15/09/2026', period: 1, subject: 'Tiếng Anh', behavior: 'Đi học muộn 15 phút' },
        { dayOfWeek: 'Thứ Ba', date: '15/09/2026', period: 3, subject: 'Khoa học tự nhiên', behavior: 'Nói chuyện riêng làm ồn' },
        { dayOfWeek: 'Thứ Năm', date: '17/09/2026', period: 2, subject: 'Toán', behavior: 'Không chuẩn bị bài tập về nhà hình học' },
      ],
      messageZalo: `Dạ kính gửi phụ huynh em Lê Hoàng Nam. Thầy/Cô chủ nhiệm lớp 9.5 xin gửi lời chào gia đình ạ.
Trong tháng 9 vừa qua, em có tích lũy 4 lần thầy cô bộ môn nhắc nhở ghi sổ:
- Ngày 08/09, Tiết 2 môn Lịch sử: Quên mang SGK
- Ngày 15/09, Tiết 1 môn Tiếng Anh: Đi học muộn 15 phút
- Ngày 15/09, Tiết 3 môn KHTN: Nói chuyện riêng làm ồn
- Ngày 17/09, Tiết 2 môn Toán: Quên bài tập về nhà
Do số lần vi phạm đã vượt mức quy định của lớp, Thầy/Cô rất mong gia đình dành thời gian trò chuyện, nhắc nhở thêm tại nhà để tháng tới em chấn chỉnh nề nếp tốt hơn. Thầy/Cô cảm ơn sự phối hợp của gia đình ạ!`,
    },
  ],
  scnJournalEntries: [
    {
      date: '21/09/2026',
      studentName: 'Lê Tuấn Anh',
      studentId: 'hs_03',
      details: 'Tiết 2 môn Toán: Đạt điểm 10 kiểm tra miệng bài Phép nhân số hữu tỉ',
      educationalMeasure: 'Tuyên dương trước lớp',
    },
    {
      date: '22/09/2026',
      studentName: 'Đỗ Quốc Bảo',
      studentId: 'hs_10',
      details: 'Tiết 2 môn KHTN: Thao tác thí nghiệm chuẩn xác, đạt điểm 9 thực hành',
      educationalMeasure: 'Khen ngợi tinh thần học tập nghiêm túc',
    },
    {
      date: '25/09/2026',
      studentName: 'Vũ Đức Nam',
      studentId: 'hs_06',
      details: 'Tiết 1 môn Công nghệ: Đạt điểm 10 kiểm tra miệng môn Công nghệ',
      educationalMeasure: 'Tuyên dương trước lớp',
    },
  ],
  tt22Forecast: {
    atRiskStudents: [
      {
        name: 'Lê Hoàng Nam',
        stt: 12,
        errorsCount: 4,
        commonSubjects: ['Tiếng Anh', 'KHTN', 'Toán', 'Lịch sử'],
        predictedRank: 'Khá',
      },
    ],
    exemplaryStudents: [
      { name: 'Trần Bảo Châu', stt: 2, goodPointsCount: 2 },
      { name: 'Nguyễn An Khang', stt: 1, goodPointsCount: 2 },
      { name: 'Lê Tuấn Anh', stt: 3, goodPointsCount: 2 },
      { name: 'Đỗ Quốc Bảo', stt: 10, goodPointsCount: 1 },
      { name: 'Vũ Đức Nam', stt: 6, goodPointsCount: 1 },
    ],
    homeroomFocusPoints: [
      'Tổng kết thi đua Tháng 9: Giữ vững nề nếp, không để Sao đỏ trừ điểm trực nhật.',
      'Phát động thi đua Tháng 10: Chào mừng ngày Phụ nữ Việt Nam 20/10.',
    ],
  },
};

export const SAMPLE_WEEK_3_REPORT: WeeklyReport = {
  id: 'rep_w03',
  weekNumber: 3,
  monthNumber: 9,
  monthName: 'Tháng 9/2026',
  academicYear: '2026-2027',
  semester: 1,
  dateRange: 'Từ 14/09/2026 đến 19/09/2026',
  // MỤC 1: Thi đua tập thể lớp (Theo Sổ Đầu Bài & Sao Đỏ)
  collectiveCompetition: {
    startingPoints: 100,
    periodDeductions: 1,
    periodDetails: '24 tiết Đạt yêu cầu (Tốt), 1 tiết Khá (Tiết 3 Thứ Ba môn KHTN bị nhắc nhở trật tự, trừ 1đ), 0 tiết TB, 0 tiết Chưa đạt',
    saoDoDeductions: 2,
    saoDoDetails: 'Thứ Hai (14/09): Cả lớp tập trung xếp hàng dưới cờ chậm 5 phút, Đội Cờ đỏ ghi nhận trừ 2đ. Các ngày còn lại trực nhật sạch sẽ, đồng phục 100%.',
    finalScore: 97,
    estimatedRank: 'Hạng 2 / 12 lớp khối 7',
  },
  // MỤC 2: Tổng hợp vấn đề học sinh trong tuần (13 chỉ số theo dõi)
  studentWeeklyIndicators: [
    {
      index: 1,
      title: 'Số học sinh nghỉ học',
      count: 0,
      details: 'Không có học sinh nghỉ học trong tuần, chuyên cần đạt 100%.',
    },
    {
      index: 2,
      title: 'Số đi muộn',
      count: 1,
      details: 'Lê Hoàng Nam (Thứ Ba, 15/09 - Tiết 1, Môn Tiếng Anh: Đi học muộn 15 phút không phép).',
    },
    {
      index: 3,
      title: 'Số bỏ tiết',
      count: 0,
      details: 'Không có học sinh bỏ tiết hoặc tự ý ra ngoài.',
    },
    {
      index: 4,
      title: 'Không chuẩn bị bài / Quên vở',
      count: 2,
      details: 'Bùi Gia Huy (Thứ Hai, 14/09 - Tiết 4, Môn Lịch sử & Địa lí: Quên mang SGK); Lê Hoàng Nam (Thứ Năm, 17/09 - Tiết 2, Môn Toán: Quên vở bài tập hình học).',
    },
    {
      index: 5,
      title: 'Điểm kiểm tra dưới 5.0',
      count: 1,
      details: 'Bùi Gia Huy (Thứ Sáu, 18/09 - Tiết 1, Môn Toán: Điểm 3.0 kiểm tra miệng công thức đại số).',
    },
    {
      index: 6,
      title: 'Mắc thái độ sai',
      count: 0,
      details: 'Học sinh lễ phép, không có hành vi vô lễ với thầy cô.',
    },
    {
      index: 7,
      title: 'Điểm tốt (8, 9, 10)',
      count: 3,
      details: 'Trần Bảo Châu (Thứ Hai, Tiết 2 - Toán: 10đ); Nguyễn Phương Linh (Thứ Năm, Tiết 3 - Tiếng Anh: 10đ); Phùng Hải Đăng (Thứ Sáu, Tiết 4 - GDCD: 9đ).',
    },
    {
      index: 8,
      title: 'Việc tốt / Tuyên dương',
      count: 1,
      details: 'Nguyễn An Khang (Thứ Tư, 16/09 - Tiết 5, SHNG: Nhặt được 200.000đ rơi ở sân trường nộp lại cho TPT Đội).',
    },
    {
      index: 9,
      title: 'Học sinh được khen',
      count: 4,
      details: 'Trần Bảo Châu, Nguyễn An Khang, Nguyễn Phương Linh, Phùng Hải Đăng.',
    },
    {
      index: 10,
      title: 'Học sinh bị phê bình',
      count: 3,
      details: 'Lê Hoàng Nam (3 lỗi), Bùi Gia Huy (2 lỗi), Đinh Quốc Việt (1 lỗi gục đầu ngủ gật môn Ngữ văn).',
    },
    {
      index: 11,
      title: 'Tiết trống',
      count: 0,
      details: '100% các tiết học đều có giáo viên giảng dạy đúng lịch.',
    },
    {
      index: 12,
      title: 'Tiết tự quản tốt',
      count: 1,
      details: 'Tiết 5 Thứ Tư: Lớp tự quản giữ trật tự tốt khi GV có việc đột xuất.',
    },
    {
      index: 13,
      title: 'Đánh giá chung nề nếp tuần',
      count: 1,
      details: 'Đa số học sinh giữ vững nề nếp tác phong, trang phục nghiêm túc. Cần nhắc nhở thói quen chuẩn bị sách vở buổi tối và khẩn trương xếp hàng sinh hoạt đầu tuần.',
    },
  ],
  // MỤC 3: Cảnh báo tháng & Tin nhắn Phụ huynh (Chỉ HS >= 3 lỗi trong tháng)
  monthlyParentAlerts: [
    {
      studentId: 'hs_12',
      studentName: 'Lê Hoàng Nam',
      stt: 12,
      monthNumber: 9,
      monthName: 'Tháng 9/2026',
      totalMonthlyErrors: 3,
      predictedRank: 'Khá',
      phone: '0912345612',
      parentName: 'Lê Văn Trọng',
      violations: [
        { dayOfWeek: 'Thứ Ba', date: '15/09/2026', period: 1, subject: 'Tiếng Anh', behavior: 'Đi học muộn 15 phút không có lý do chính đáng' },
        { dayOfWeek: 'Thứ Ba', date: '15/09/2026', period: 3, subject: 'Khoa học tự nhiên', behavior: 'Nói chuyện riêng làm ồn nhiều lần bị GVBM ghi sổ đầu bài' },
        { dayOfWeek: 'Thứ Năm', date: '17/09/2026', period: 2, subject: 'Toán', behavior: 'Không chuẩn bị bài tập về nhà hình học và quên vở bài tập' },
      ],
      messageZalo: `Dạ kính gửi phụ huynh em Lê Hoàng Nam. Thầy/Cô chủ nhiệm lớp xin gửi lời chào gia đình ạ.
Trong tháng vừa qua, nhìn chung em có cố gắng trong sinh hoạt tập thể. Tuy nhiên, về mặt nề nếp và học tập, em có tích lũy 3 lần nhắc nhở:
- Ngày 15/09, Tiết 1 môn Tiếng Anh: Đi học muộn 15 phút không có lý do chính đáng
- Ngày 15/09, Tiết 3 môn Khoa học tự nhiên: Nói chuyện riêng làm ồn nhiều lần bị GVBM ghi sổ đầu bài
- Ngày 17/09, Tiết 2 môn Toán: Không chuẩn bị bài tập về nhà hình học và quên vở bài tập
Do số lần vi phạm đã vượt mức quy định của lớp, Thầy/Cô rất mong gia đình dành thời gian trò chuyện, nhắc nhở thêm tại nhà để tháng tới em chấn chỉnh nề nếp, tránh làm ảnh hưởng đến kết quả rèn luyện định kỳ của em. Thầy/Cô cảm ơn sự phối hợp của gia đình ạ!`
    }
  ],
  // MỤC 4: Dữ liệu cập nhật "Nhật ký theo dõi biểu hiện học sinh" (SCN)
  scnJournalEntries: [
    {
      date: '14/09/2026',
      studentName: 'Trần Bảo Châu',
      studentId: 'hs_02',
      details: 'Tiết 2 môn Toán: Đạt điểm 10 kiểm tra miệng bài toán nâng cao',
      educationalMeasure: 'Tuyên dương trước lớp, động viên tiếp tục phát huy'
    },
    {
      date: '14/09/2026',
      studentName: 'Bùi Gia Huy',
      studentId: 'hs_08',
      details: 'Tiết 4 môn Lịch sử & Địa lí: Quên mang sách giáo khoa và chưa ghi chép bài',
      educationalMeasure: 'Nhắc nhở trên lớp, giao bạn Tổ trưởng kiểm tra vở đầu giờ (Mức 1 lỗi tháng: chưa gửi tin PH)'
    },
    {
      date: '15/09/2026',
      studentName: 'Lê Hoàng Nam',
      studentId: 'hs_12',
      details: 'Tiết 1 môn Tiếng Anh: Đi học muộn 15 phút; Tiết 3 môn KHTN: Nói chuyện riêng làm ồn',
      educationalMeasure: 'Nhắc nhở trước lớp, đổi chỗ ngồi lên bàn 1, trao đổi riêng giờ ra chơi'
    },
    {
      date: '16/09/2026',
      studentName: 'Nguyễn An Khang',
      studentId: 'hs_01',
      details: 'Tiết 5 SHNG: Nhặt được 200.000đ ở sân trường nộp lại cho TPT Đội',
      educationalMeasure: 'Tuyên dương gương người tốt việc tốt trước cờ'
    },
    {
      date: '16/09/2026',
      studentName: 'Đinh Quốc Việt',
      studentId: 'hs_24',
      details: 'Tiết 2 môn Ngữ văn: Gục đầu xuống bàn ngủ trong giờ học',
      educationalMeasure: 'Nhắc nhở, hỏi thăm tình hình sức khỏe và giấc ngủ ở nhà'
    },
    {
      date: '17/09/2026',
      studentName: 'Nguyễn Phương Linh',
      studentId: 'hs_11',
      details: 'Tiết 3 môn Tiếng Anh: Đạt điểm 10 bài thuyết trình dự án',
      educationalMeasure: 'Tuyên dương, động viên làm nòng cốt CLB Tiếng Anh'
    },
    {
      date: '17/09/2026',
      studentName: 'Lê Hoàng Nam',
      studentId: 'hs_12',
      details: 'Tiết 2 môn Toán: Không làm bài tập về nhà và quên mang vở bài tập (Lỗi thứ 3 trong tháng)',
      educationalMeasure: 'Kích hoạt cảnh báo tháng, gửi tin nhắn Zalo tổng hợp 3 lỗi gửi phụ huynh phối hợp giáo dục'
    },
    {
      date: '18/09/2026',
      studentName: 'Bùi Gia Huy',
      studentId: 'hs_08',
      details: 'Tiết 1 môn Toán: Điểm 3.0 kiểm tra miệng công thức đại số (Lỗi thứ 2 trong tháng)',
      educationalMeasure: 'Giao cán sự Toán kèm cặp ôn tập; dưới 3 lỗi nên chỉ nhắc nhở học sinh, chưa gửi tin PH'
    },
    {
      date: '18/09/2026',
      studentName: 'Phùng Hải Đăng',
      studentId: 'hs_28',
      details: 'Tiết 4 môn GDCD: Đạt điểm 9 kiểm tra 15 phút, phát biểu sôi nổi',
      educationalMeasure: 'Tuyên dương, động viên duy trì tinh thần học tập tích cực'
    }
  ],
  tt22Forecast: {
    atRiskStudents: [
      {
        name: 'Lê Hoàng Nam',
        stt: 12,
        errorsCount: 3,
        commonSubjects: ['Tiếng Anh (đi muộn)', 'KHTN (nói chuyện)', 'Toán (quên bài)'],
        predictedRank: 'Khá'
      }
    ],
    exemplaryStudents: [
      { name: 'Trần Bảo Châu', stt: 2, goodPointsCount: 1 },
      { name: 'Nguyễn An Khang', stt: 1, goodPointsCount: 1 },
      { name: 'Nguyễn Phương Linh', stt: 11, goodPointsCount: 1 },
      { name: 'Phùng Hải Đăng', stt: 28, goodPointsCount: 1 }
    ],
    homeroomFocusPoints: [
      'Nề nếp tập thể lớp: Khắc phục triệt để tình trạng xếp hàng chào cờ chậm sáng thứ 2 để không bị Đội Cờ đỏ trừ điểm thi đua tập thể.',
      'Học tập cá nhân: Phê bình tình trạng quên vở bài tập và không ôn bài kỹ môn Toán. Giao bạn cán sự học tập kiểm tra chéo 15 phút đầu giờ.',
      'Tuyên dương Lớp trưởng An Khang (nhặt của rơi) và các em đạt điểm 10 môn Toán, Tiếng Anh để tạo động lực thi đua cho tuần kế tiếp.'
    ]
  },
  createdAt: '2026-09-19T11:30:00'
};

export const DEFAULT_REPORTS: WeeklyReport[] = [
  SAMPLE_WEEK_4_REPORT,
  SAMPLE_WEEK_3_REPORT,
  SAMPLE_WEEK_2_REPORT,
  SAMPLE_WEEK_1_REPORT,
];

export const DEFAULT_SYSTEM_PROFILE: SystemProfile = {
  schoolName: 'Trường THCS Nguyễn Công Trứ',
  className: '9.5',
  academicYear: '2026 - 2027',
  teacherName: 'Cô Vũ Thị Anh Phụng',
  teacherTitle: 'Cô',
  teacherPhone: '0978057875',
  alertThreshold: 3,
  officers: {
    classLeader: 'Nguyễn An Khang',
    viceLeader: 'Trần Bảo Ngọc',
    groupLeader1: 'Lê Hoàng Long',
    groupLeader2: 'Vũ Minh Anh',
    groupLeader3: 'Phạm Đức Trọng',
    groupLeader4: 'Đỗ Thùy Trang',
  },
  template1Monthly: `Dạ kính gửi phụ huynh em {ten_hoc_sinh}. {xung_ho_gv} chủ nhiệm lớp {lop} xin gửi lời chào gia đình ạ.
Trong tháng vừa qua, nhìn chung em vẫn duy trì việc đến lớp đầy đủ. Tuy nhiên, về mặt nề nếp và học tập, em có tích lũy {so_luot_loi} lần thầy cô bộ môn nhắc nhở ghi sổ:
{danh_sach_loi_chi_tiet_ngay_tiet_mon}
Do số lần nhắc nhở trong tháng đã vượt mức quy định của lớp, {xung_ho_gv} rất mong gia đình dành thời gian trò chuyện, nhắc nhở thêm tại nhà để tháng tới em chấn chỉnh nề nếp học tập tốt hơn, tránh ảnh hưởng đến kết quả rèn luyện định kỳ của em.
Mọi thắc mắc phụ huynh có thể liên hệ trực tiếp qua số {sdt_gvcn}. {xung_ho_gv} cảm ơn sự phối hợp của gia đình ạ!`,
  template2Urgent: `Dạ kính gửi phụ huynh em {ten_hoc_sinh}. {xung_ho_gv} chủ nhiệm lớp {lop} xin phép trao đổi khẩn với gia đình về sự việc hôm nay:
Vào {ngay_gio}, trong tiết {tiet_hoc} môn {ten_mon}, em có vi phạm sự việc: {hanh_vi_cu_the}.
Đây là vi phạm nội quy nghiêm trọng của nhà trường. {xung_ho_gv} thông báo để gia đình nắm thông tin và phối hợp làm việc. Kính mong phụ huynh gọi lại cho {xung_ho_gv} qua số {sdt_gvcn} hoặc sắp xếp thời gian đến trường gặp {xung_ho_gv} vào sáng mai để cùng giải quyết. Cảm ơn phụ huynh!`,
  template3Praise: `Dạ kính gửi phụ huynh em {ten_hoc_sinh}. {xung_ho_gv} chủ nhiệm lớp {lop} xin gửi lời chúc mừng đến gia đình ạ!
Trong tuần này, em {ten_hoc_sinh} đã có sự cố gắng rất đáng khen ngợi: {thanh_tich_hoac_diem_tot_cu_the}.
{xung_ho_gv} gửi lời tuyên dương em trước lớp và báo tin vui để gia đình cùng động viên, khích lệ em tiếp tục phát huy trong thời gian tới. Cảm ơn sự đồng hành quý báu của gia đình!`,
};

export const SAMPLE_OCR_SDB_TEXT = `SỔ ĐẦU BÀI & SỔ TRỰC SAO ĐỎ - LỚP 9.5 - TUẦN 4 (THÁNG 9/2026)

I. GHI NHẬN TỪ SỔ SAO ĐỎ / LIÊN ĐỘI (LUỒNG THI ĐUA TẬP THỂ LỚP):
- Thứ Hai (21/09): Lớp tập trung đầu tuần đúng giờ, trang phục nghiêm túc.
- Thứ Ba (22/09): Vệ sinh lớp sạch sẽ, khu vực bồn hoa được chăm sóc tốt.
- Thứ Tư (23/09): Cờ đỏ ghi nhận lớp trực nhật hành lang chậm 10 phút sau giờ ra chơi (Bị Sao đỏ trừ 2 điểm thi đua tuần).
- Thứ Năm (24/09): 100% học sinh đội nón bảo hiểm khi ngồi sau xe máy phụ huynh.
- Thứ Sáu (25/09): Thể dục giữa giờ xếp hàng ngay ngắn.
=> TỔNG ĐIỂM TRỪ SAO ĐỎ: 2 điểm.

II. GHI NHẬN TỪ SỔ ĐẦU BÀI (XẾP LOẠI TIẾT HỌC):
- Tiết 1 Thứ 2 - Chào cờ: Tốt.
- Tiết 2 Thứ 2 - Toán (Cô Hương): Dạy bài Phép nhân số hữu tỉ. Xếp loại: Tốt. Em Lê Tuấn Anh phát biểu tích cực đạt điểm 10. Em Bùi Gia Huy quên mang thước kẻ và sách bài tập.
- Tiết 3 Thứ 2 - Ngữ văn (Thầy Tuấn): Dạy bài Thực hành Tiếng Việt. Xếp loại: Tốt.
- Tiết 4 Thứ 2 - Tiếng Anh (Cô Lan): Kiểm tra từ vựng. Xếp loại: Tốt. Em Lê Hoàng Nam đi muộn 10 phút, không thuộc từ mới (điểm 4).
- Tiết 5 Thứ 2 - GDCD (Cô Mai): Xếp loại: Tốt.

- Tiết 1 Thứ 3 - KHTN (Thầy Hùng): Thực hành đo nhiệt độ. Xếp loại: KHÁ (Do có học sinh mất trật tự nghịch dụng cụ thí nghiệm, trừ 1 điểm tiết học). Em Bùi Gia Huy và Đinh Quốc Việt mất trật tự.
- Tiết 2 Thứ 3 - KHTN (Thầy Hùng): Thực hành tiếp tục. Xếp loại: Tốt. Em Đỗ Quốc Bảo thao tác thí nghiệm chính xác, đạt điểm 9.
- Tiết 3 Thứ 3 - Lịch sử (Cô Hà): Xếp loại: Tốt.
- Tiết 4 Thứ 3 - Địa lí (Cô Hà): Xếp loại: Tốt. Em Nguyễn Thảo Nguyên đạt điểm 10.

- Tiết 1 Thứ 4 - Toán (Cô Hương): Chữa bài tập. Xếp loại: Tốt. Em Lê Hoàng Nam nói chuyện riêng với bạn ngồi cạnh trong tiết học, bị nhắc nhở.
- Tiết 2 Thứ 4 - Tin học (Thầy Thành): Xếp loại: Tốt.
- Tiết 3 Thứ 4 - Âm nhạc (Cô Oanh): Xếp loại: Tốt. Em Hoàng Thị Mai hát tốt, được cô khen.
- Tiết 4 Thứ 4 - Mỹ thuật (Thầy Nam): Xếp loại: Tốt. Em Tạ Minh Triết quên mang màu vẽ.

- Tiết 1 Thứ 5 - Ngữ văn (Thầy Tuấn): Xếp loại: Tốt. Em Mai Tuyết Nhung đọc diễn cảm tốt, điểm 9.
- Tiết 2 Thứ 5 - Tiếng Anh (Cô Lan): Xếp loại: Tốt. Em Lê Hoàng Nam tiếp tục không chuẩn bị bài tập trang 25.
- Tiết 3 Thứ 5 - KHTN (Thầy Hùng): Xếp loại: Tốt.
- Tiết 4 Thứ 5 - GDTC (Thầy Đức): Xếp loại: Tốt. Cả lớp mang đúng giày thể thao.

- Tiết 1 Thứ 6 - Công nghệ (Cô Nga): Xếp loại: Tốt. Em Vũ Đức Nam đạt điểm 10.
- Tiết 2 Thứ 6 - Lịch sử (Cô Hà): Xếp loại: Tốt.
- Tiết 3 Thứ 6 - HĐTN (GVCN): Lớp tự quản tốt.
- Tiết 4 Thứ 6 - Sinh hoạt lớp: Sơ kết tuần.
=> Xếp loại tiết học: 24 tiết Tốt, 1 tiết Khá (trừ 1đ), 0 tiết TB, 0 tiết Chưa đạt.`;

