/**
 * Word (.doc / .docx) Export Utility & SCN Text Cleanser
 * Chuẩn hóa thể thức văn bản hành chính theo Sổ Công Tác Chủ Nhiệm THCS
 */

import { SystemProfile } from '../types';

/**
 * 1. TÁCH BẠCH HOÀN TOÀN ĐIỂM THI ĐUA KHỎI BIỂU HIỆN CÁ NHÂN
 * Quy chuẩn: Chỉ ghi thuần túy sự thật khách quan (Thứ/Ngày, Tiết, Môn, Hành vi/Điểm kiểm tra)
 * TUYỆT ĐỐI KHÔNG ghi các mức điểm trừ thi đua (-1đ, -2đ, trừ điểm thi đua lớp...)
 */
export function cleanExpressionText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove patterns like (-2đ), (-1 điểm), (bị trừ 2 điểm), (trừ 1đ)
  cleaned = cleaned.replace(/\s*\(\s*[-+]?\d+\s*(?:đ|điểm)\s*(?:thi đua|của lớp|lớp)?\s*\)/gi, '');
  // Remove patterns like "(-2 điểm thi đua của lớp)"
  cleaned = cleaned.replace(/\s*\(\s*trừ\s*\d+\s*(?:đ|điểm)[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*bị\s*trừ\s*\d+\s*(?:đ|điểm)[^.;,\n]*/gi, '');
  cleaned = cleaned.replace(/\s*trừ\s*\d+\s*(?:đ|điểm)\s*(?:thi đua|của lớp)?[^.;,\n]*/gi, '');
  // Remove notes like "(Lỗi thứ 3 trong tháng)" or "(Lỗi thứ 2 trong tháng)"
  cleaned = cleaned.replace(/\s*\(\s*Lỗi\s*thứ\s*\d+\s*trong\s*tháng\s*\)/gi, '');
  // Clean trailing punctuation or double spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // If text starts with bullet or punctuation, normalize
  if (cleaned.startsWith('- ')) {
    cleaned = cleaned.substring(2).trim();
  }

  return cleaned;
}

/**
 * 2. CHUẨN HÓA CỘT BIỆN PHÁP GIÁO DỤC
 * Chỉ ghi biện pháp sư phạm của GVCN, bỏ các giải thích rườm rà
 */
export function cleanEducationalMeasureText(text: string): string {
  if (!text) return 'Nhắc nhở, động viên';

  let cleaned = text;

  // Remove verbose procedural notes like:
  // (Mức 1 lỗi tháng: chưa gửi tin PH)
  // (dưới 3 lỗi nên chỉ nhắc nhở học sinh, chưa gửi tin PH)
  // (Kích hoạt cảnh báo tháng, gửi tin nhắn Zalo...)
  cleaned = cleaned.replace(/\s*\(\s*Mức\s*\d+\s*lỗi[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*\(\s*dưới\s*\d+\s*lỗi[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*\(\s*chưa\s*(?:cần\s*)?gửi\s*tin[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*\(\s*Kích hoạt cảnh báo[^)]*\)/gi, '');

  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  if (cleaned.startsWith('- ')) {
    cleaned = cleaned.substring(2).trim();
  }

  return cleaned || 'Nhắc nhở, động viên';
}

export interface GroupedScnExportRow {
  studentName: string;
  dates: string[];
  expressions: string[];
  measures: string[];
}

/**
 * Xuất dữ liệu Mục IV SCN thành file Microsoft Word (.doc)
 * Chuẩn định dạng văn bản hành chính THCS: Times New Roman 12pt, Table borders, Canh lề
 */
export function exportScnToWordDoc(
  rows: GroupedScnExportRow[],
  profile: SystemProfile,
  weekNumber?: number,
  monthName?: string
) {
  const cleanClassName = profile.className.replace(/\s+/g, '_');
  const fileName = `SCN_Muc_IV_Theo_Doi_Hoc_Sinh_Lop_${cleanClassName}.doc`;

  // Build table rows HTML
  const tableRowsHtml = rows
    .map((row, index) => {
      const datesHtml = row.dates
        .map((d) => `<div style="margin-bottom: 3px;">${d}</div>`)
        .join('');

      const expressionsHtml = row.expressions
        .map((exp) => {
          const cleanExp = cleanExpressionText(exp);
          return `<div style="margin-bottom: 4px; text-align: justify;">- ${cleanExp}</div>`;
        })
        .join('');

      const measuresHtml = row.measures
        .map((mea) => {
          const cleanMea = cleanEducationalMeasureText(mea);
          return `<div style="margin-bottom: 4px;">- ${cleanMea}</div>`;
        })
        .join('');

      const rowBg = index % 2 === 1 ? '#fcfcfc' : '#ffffff';

      return `
        <tr style="background-color: ${rowBg};">
          <td style="border: 1px solid #000000; padding: 6px 8px; vertical-align: top; text-align: center; width: 15%;">
            ${datesHtml}
          </td>
          <td style="border: 1px solid #000000; padding: 6px 8px; vertical-align: top; font-weight: bold; width: 22%;">
            ${row.studentName}
          </td>
          <td style="border: 1px solid #000000; padding: 6px 8px; vertical-align: top; width: 38%;">
            ${expressionsHtml}
          </td>
          <td style="border: 1px solid #000000; padding: 6px 8px; vertical-align: top; width: 25%;">
            ${measuresHtml}
          </td>
        </tr>
      `;
    })
    .join('');

  const documentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>SỔ CHỦ NHIỆM - MỤC IV - THEO DÕI HỌC SINH</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: 1.8cm 1.8cm 1.8cm 2cm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.35;
          color: #000000;
        }
        h1, h2, h3, p {
          margin: 0;
          padding: 0;
        }
        .header-table {
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        .header-table td {
          vertical-align: top;
          border: none;
        }
        .doc-title {
          font-size: 15pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-top: 15px;
          margin-bottom: 6px;
        }
        .doc-subtitle {
          font-size: 12pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 4px;
        }
        .doc-info {
          font-size: 11pt;
          font-style: italic;
          text-align: center;
          margin-bottom: 18px;
        }
        .scn-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000000;
          font-size: 12pt;
        }
        .scn-table th {
          border: 1px solid #000000;
          background-color: #f2f2f2;
          font-weight: bold;
          padding: 8px;
          text-align: center;
        }
        .footer-table {
          width: 100%;
          margin-top: 30px;
          border-collapse: collapse;
        }
        .footer-table td {
          border: none;
          vertical-align: top;
          text-align: center;
          width: 50%;
        }
      </style>
    </head>
    <body>
      <!-- Header hành chính -->
      <table class="header-table">
        <tr>
          <td style="width: 45%; text-align: center;">
            <p style="text-transform: uppercase; font-size: 11pt;">PHÒNG GD&ĐT QUẬN/HUYỆN</p>
            <p style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">${profile.schoolName.toUpperCase()}</p>
            <p style="font-size: 10pt;">***</p>
          </td>
          <td style="width: 55%; text-align: center;">
            <p style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p style="font-weight: bold; font-size: 11pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
          </td>
        </tr>
      </table>

      <!-- Tiêu đề chính -->
      <div class="doc-title">THEO DÕI CÁC BIỂU HIỆN CỦA HỌC SINH</div>
      <div class="doc-subtitle">(TRÍCH XUẤT MỤC IV - SỔ CÔNG TÁC CHỦ NHIỆM)</div>
      <div class="doc-info">
        Lớp: ${profile.className} • Năm học: ${profile.academicYear} • GVCN: ${profile.teacherName} (SĐT: ${profile.teacherPhone})
        ${weekNumber ? `<br>Thời điểm trích xuất: Tuần ${weekNumber} ${monthName ? `(${monthName})` : ''}` : ''}
      </div>

      <!-- Bảng 4 Cột chuẩn Hồ sơ thanh tra SCN -->
      <table class="scn-table">
        <thead>
          <tr>
            <th style="width: 15%;">Ngày, tháng, năm</th>
            <th style="width: 22%;">Họ, tên học sinh</th>
            <th style="width: 38%;">
              Các biểu hiện cụ thể đáng chú ý<br>
              <span style="font-size: 10pt; font-weight: normal; font-style: italic;">
                (Tìm hiểu hoàn cảnh, theo dõi, biểu dương, khen ngợi hoặc nhắc nhở, phê bình)
              </span>
            </th>
            <th style="width: 25%;">
              Biện pháp giáo dục<br>
              <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Sư phạm GVCN)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Chữ ký xác nhận -->
      <table class="footer-table">
        <tr>
          <td></td>
          <td>
            <p style="font-style: italic; font-size: 11pt; margin-bottom: 6px;">
              Ngày ..... tháng ..... năm 202...
            </p>
            <p style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">
              GIÁO VIÊN CHỦ NHIỆM
            </p>
            <p style="font-style: italic; font-size: 10pt; margin-bottom: 55px;">(Ký và ghi rõ họ tên)</p>
            <p style="font-weight: bold; font-size: 11pt;">
              ${profile.teacherName}
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Create Blob and trigger immediate browser download
  const blob = new Blob(['\ufeff', documentHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

/**
 * Xuất Hồ sơ theo dõi cá nhân của 1 học sinh trong toàn bộ chu kỳ 35 tuần ra file Word (.doc)
 */
export function exportStudentProfileToWordDoc(
  student: { name: string; stt: number; group?: number; role?: string; parentName?: string; parentPhone?: string },
  records: Array<{
    date: string;
    dayOfWeek?: string;
    period?: number;
    subject?: string;
    behavior: string;
    educationalMeasure?: string;
    pointsImpact?: number;
    weekNumber?: number;
  }>,
  profile: SystemProfile,
  periodName: string = 'Năm học 2026 - 2027 (35 Tuần học)'
) {
  const fileName = `Ho_So_Theo_Doi_${student.name.replace(/\s+/g, '_')}_Lop_${profile.className.replace(/\s+/g, '_')}.doc`;

  const rowsHtml = records
    .map((r, idx) => {
      const isPositive = (r.pointsImpact || 0) > 0;
      const cleanExp = cleanExpressionText(r.behavior);
      const cleanMea = cleanEducationalMeasureText(r.educationalMeasure || 'Nhắc nhở, động viên');
      const timeStr = `${r.date}${r.dayOfWeek ? ` (${r.dayOfWeek})` : ''} - Tiết ${r.period || 1}`;
      const bg = idx % 2 === 1 ? '#fbfbfb' : '#ffffff';

      return `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 12%; font-size: 11pt;">
            Tuần ${r.weekNumber || '—'}
          </td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 18%; font-size: 11pt;">
            ${timeStr}
          </td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 15%; font-weight: bold; font-size: 11pt;">
            ${r.subject || 'Chung'}
          </td>
          <td style="border: 1px solid #000; padding: 6px; width: 33%; font-size: 11pt; text-align: justify;">
            ${isPositive ? '<b>[Khen ngợi/Điểm tốt]:</b> ' : ''}${cleanExp}
          </td>
          <td style="border: 1px solid #000; padding: 6px; width: 22%; font-size: 11pt; font-style: italic;">
            ${cleanMea}
          </td>
        </tr>
      `;
    })
    .join('');

  const documentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>HỒ SƠ CÁ NHÂN HỌC SINH - ${student.name.toUpperCase()}</title>
      <style>
        @page { size: A4 portrait; margin: 2cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000; }
        h1, h2, h3, p { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top;">
            <p style="font-size: 11pt; text-transform: uppercase;">UBND TP. HỒ CHÍ MINH</p>
            <p style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">${profile.schoolName}</p>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top;">
            <p style="font-weight: bold; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p style="font-size: 11pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 15pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
          HỒ SƠ THEO DÕI BIỂU HIỆN VÀ RÈN LUYỆN CÁ NHÂN
        </h2>
        <p style="font-size: 12pt; font-style: italic;">Chu kỳ: ${periodName}</p>
      </div>

      <div style="background-color: #f7f9fa; border: 1px solid #ccc; padding: 12px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 4px;"><b>Họ và tên học sinh:</b> ${student.name}</td>
            <td style="width: 25%; padding: 4px;"><b>STT:</b> ${student.stt}</td>
            <td style="width: 25%; padding: 4px;"><b>Lớp:</b> ${profile.className}</td>
          </tr>
          <tr>
            <td style="padding: 4px;"><b>Chức vụ:</b> ${student.role || 'Học sinh'}</td>
            <td style="padding: 4px;" colspan="2"><b>Phụ huynh:</b> ${student.parentName || 'Chưa cập nhật'} (SĐT: ${student.parentPhone || 'Chưa có'})</td>
          </tr>
          <tr>
            <td style="padding: 4px;" colspan="3"><b>Tổng số biểu hiện ghi nhận:</b> ${records.length} lượt ghi nhận trong chu kỳ</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
        NHẬT KÝ CHI TIẾT CÁC LẦN GHI NHẬN BIỂU HIỆN & BIỆN PHÁP SƯ PHẠM
      </h3>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 6px;">Tuần</th>
            <th style="border: 1px solid #000; padding: 6px;">Ngày - Tiết</th>
            <th style="border: 1px solid #000; padding: 6px;">Môn học</th>
            <th style="border: 1px solid #000; padding: 6px;">Biểu hiện cụ thể (Học tập & Tác phong)</th>
            <th style="border: 1px solid #000; padding: 6px;">Biện pháp giáo dục của GVCN</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" style="border: 1px solid #000; padding: 12px; text-align: center; font-style: italic;">Học sinh luôn gương mẫu, không có biểu hiện nhắc nhở trong chu kỳ này.</td></tr>'}
        </tbody>
      </table>

      <table style="width: 100%; margin-top: 20px;">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%; text-align: center;">
            <p style="font-style: italic; font-size: 11pt; margin-bottom: 5px;">Ngày ..... tháng ..... năm 202...</p>
            <p style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">GIÁO VIÊN CHỦ NHIỆM</p>
            <p style="font-style: italic; font-size: 10pt; margin-bottom: 50px;">(Ký và ghi rõ họ tên)</p>
            <p style="font-weight: bold; font-size: 11pt;">${profile.teacherName}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', documentHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

