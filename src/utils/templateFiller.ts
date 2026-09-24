import { SystemProfile, Student } from '../types';

export interface TemplateFillParams {
  profile: SystemProfile;
  studentName: string;
  errorCount?: number;
  violationListText?: string;
  dateTimeStr?: string;
  period?: number | string;
  subject?: string;
  behavior?: string;
  achievement?: string;
}

/**
 * Thay thế biến số linh hoạt vào các mẫu tin nhắn phụ huynh
 */
export function fillMessageTemplate(template: string, params: TemplateFillParams): string {
  const {
    profile,
    studentName,
    errorCount = 3,
    violationListText = '',
    dateTimeStr = 'Hôm nay',
    period = 1,
    subject = '',
    behavior = '',
    achievement = '',
  } = params;

  let result = template;

  // Profile variables
  result = result.replace(/\{truong\}/gi, profile.schoolName);
  result = result.replace(/\{lop\}/gi, profile.className);
  result = result.replace(/\{nam_hoc\}/gi, profile.academicYear);
  result = result.replace(/\{ten_gvcn\}/gi, profile.teacherName);
  result = result.replace(/\{xung_ho_gv\}/gi, profile.teacherTitle);
  result = result.replace(/\{sdt_gvcn\}/gi, profile.teacherPhone);

  // Student variables
  result = result.replace(/\{ten_hoc_sinh\}/gi, studentName);
  result = result.replace(/\{so_luot_loi\}/gi, String(errorCount));
  result = result.replace(/\{danh_sach_loi_chi_tiet_ngay_tiet_mon\}/gi, violationListText);

  // Incident specific variables
  result = result.replace(/\{ngay_gio\}/gi, dateTimeStr);
  result = result.replace(/\{tiet_hoc\}/gi, String(period));
  result = result.replace(/\{ten_mon\}/gi, subject);
  result = result.replace(/\{hanh_vi_cu_the\}/gi, behavior);
  result = result.replace(/\{thanh_tich_hoac_diem_tot_cu_the\}/gi, achievement);

  return result;
}
