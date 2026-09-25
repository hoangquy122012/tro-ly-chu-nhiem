import { getStoredGeminiApiKey } from '../utils/geminiApiKey';

export const MODEL_NAME = 'gemini-3.8-flash';

export interface AnalyzeRecordRequest {
  imageBase64?: string;
  mimeType?: string;
  textInput?: string;
  roster: any[];
  weekNumber: number;
  academicYear?: string;
  semester?: number;
  [key: string]: any;
}

export const buildRecordPrompt = (params: {
  roster: any[];
  weekNumber: number;
  textInput?: string;
}): string => {
  const rosterText = Array.isArray(params.roster)
    ? params.roster.map((s: any) => `STT ${s.stt}: ${s.name} (Chức vụ: ${s.role || 'Học sinh'})`).join('\n')
    : '';

  return `
Bạn là "EduMaster AI" – Trợ lý Số Quản trị Lớp học và Cố vấn Sư phạm dành riêng cho Giáo viên Chủ nhiệm (GVCN) cấp THCS, vận hành bám sát chuẩn nghiệp vụ Sổ Công Tác Chủ Nhiệm (SCN) và Quy chế đánh giá rèn luyện học sinh theo Thông tư 22/2021/TT-BGDĐT.

NGUYÊN TẮC CỐT LÕI (TUYỆT ĐỐI TUÂN THỦ):
1. TRỌNG TÂM: NHẬT KÝ NỀ NẾP & THEO DÕI HỌC SINH TRONG TUẦN.
2. TUYỆT ĐỐI KHÔNG TÍNH ĐIỂM SỐ, KHÔNG GÁN ĐIỂM TRỪ HOẶC ĐIỂM CỘNG. Điểm thi đua của trường đã có bộ phận khác tính riêng bên ngoài.
3. BÓC TÁCH CHÍNH XÁC 5 TRƯỜNG THÔNG TIN MỖI LƯỢT GHI NHẬN:
   - [Ngày / Thứ]: VD "Thứ Hai", ngày "21/09/2026"
   - [Tiết / Môn học]: VD "Tiết 1", môn "Toán"
   - [Tên học sinh liên quan]: Đối chiếu chính xác theo danh sách lớp được cung cấp. Nếu ghi nhận của cả lớp (VD: Tiết học tốt, lớp ồn ào), ghi tên "Cả lớp".
   - [Hành vi / Lỗi vi phạm cụ thể]: Ghi nhận khách quan, trung thực (VD: "Nói chuyện riêng nhiều lần trong giờ học", "Quên sách giáo khoa và bài tập về nhà", "Đi học muộn 15 phút", "Đạt điểm 10 kiểm tra miệng").
   - [Nhận xét của GV bộ môn / Biện pháp giáo dục]: Lời phê của giáo viên bộ môn trong sổ hoặc biện pháp GVCN cần lưu ý.

DANH SÁCH HỌC SINH LỚP CHÍNH THỨC (ROSTER ĐỐI CHIẾU):
${rosterText}

${params.textInput ? `NỘI DUNG VĂN BẢN ĐƯỢC CUNG CẤP:\n${params.textInput}` : 'HÃY BÓC TÁCH TOÀN BỘ TỪ ẢNH CHỤP SỔ ĐẦU BÀI / SỔ GHI NHẬN ĐƯỢC ĐÍNH KÈM.'}

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON HỢP LỆ (chỉ JSON thuần túy, không có markdown text bao quanh):
{
  "weekNumber": ${params.weekNumber},
  "monthNumber": 9,
  "monthName": "Tháng 9/2026",
  "dateRange": "Từ ngày ... đến ngày ...",
  "events": [
    {
      "studentName": "Nguyễn Văn A",
      "dayOfWeek": "Thứ Hai",
      "date": "21/09/2026",
      "period": 1,
      "subject": "Toán",
      "behavior": "Quên mang vở bài tập và không chú ý nghe giảng",
      "teacherNote": "Nhắc nhở làm bài bù",
      "category": "hoc_tap | dong_phuc | di_muon | ve_sinh | mat_trat_tu | chuyen_can | khen_thuong | khac",
      "severity": "nhe | trung_binh | nang | khen_thuong"
    }
  ],
  "statistics": {
    "totalViolations": 5,
    "byCategory": {
      "hoc_tap": 2,
      "dong_phuc": 1,
      "di_muon": 1,
      "ve_sinh": 0,
      "mat_trat_tu": 1,
      "chuyen_can": 0,
      "khen_thuong": 2
    },
    "topStudents": [
      { "name": "Nguyễn Văn A", "count": 2, "mainIssues": "Quên bài tập; Đi muộn" }
    ]
  },
  "scnJournalEntries": [
    {
      "date": "21/09/2026",
      "studentName": "Nguyễn Văn A",
      "details": "Tiết 1 môn Toán: Quên mang vở bài tập",
      "educationalMeasure": "Nhắc nhở, giao bạn cán sự kèm cặp"
    }
  ],
  "monthlyParentAlerts": [],
  "tt22Forecast": {
    "atRiskStudents": [],
    "exemplaryStudents": [],
    "homeroomFocusPoints": ["Kiểm tra bài tập đầu giờ", "Nhắc nhở tác phong trang phục"]
  }
}
`;
};

/**
 * Làm sạch chuỗi phản hồi từ Gemini và parse thành JSON Object
 */
export const cleanAndParseJsonObject = (rawText: string): any => {
  if (!rawText) return null;
  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd >= objStart) {
    cleaned = cleaned.substring(objStart, objEnd + 1);
  }

  const parsedData = JSON.parse(cleaned);
  return parsedData;
};

/**
 * Gọi Google API chính thức với duy nhất 'gemini-3.8-flash'
 * Tích hợp Silent Auto-Retry khi gặp lỗi quá tải 503 (High demand) hoặc 429 (Rate limit)
 * - Chờ 1.5 giây giữa các lần thử
 * - Tự động thử lại tối đa 3 lần
 * - Không bật popup cảnh báo gây gián đoạn
 */
export const callGeminiDirect = async (
  apiKey: string,
  parts: any[],
  onStatusChange?: (msg: string) => void,
  maxRetries = 3
): Promise<string> => {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const status = response.status;
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `Google API error ${status}`;
        const errObj: any = new Error(errMsg);
        errObj.status = status;
        errObj.isKeyError =
          status === 400 ||
          status === 401 ||
          status === 403 ||
          errMsg.includes('API key') ||
          errMsg.includes('API_KEY');

        // Bắt lỗi quá tải tạm thời (503 High demand hoặc 429 Rate limit)
        const isOverloaded =
          status === 503 ||
          status === 429 ||
          errMsg.toLowerCase().includes('high demand') ||
          errMsg.toLowerCase().includes('overloaded') ||
          errMsg.toLowerCase().includes('resource_exhausted') ||
          errMsg.toLowerCase().includes('rate limit');

        if (isOverloaded && attempt < maxRetries && !errObj.isKeyError) {
          lastError = errObj;
          if (onStatusChange) {
            onStatusChange(`⚡ Gemini 3.8 Flash đang xử lý (Đang kết nối lại sau 1.5s - lần ${attempt + 1}/${maxRetries})...`);
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        throw errObj;
      }

      const json = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        throw new Error('Google Gemini không trả về dữ liệu nội dung');
      }
      return text;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        String(err?.message || '').toLowerCase().includes('high demand') ||
        String(err?.message || '').toLowerCase().includes('overloaded') ||
        String(err?.message || '').toLowerCase().includes('failed to fetch');

      if (isTransient && attempt < maxRetries && !err?.isKeyError) {
        if (onStatusChange) {
          onStatusChange(`⚡ Gemini 3.8 Flash đang xử lý (Đang kết nối lại sau 1.5s - lần ${attempt + 1}/${maxRetries})...`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error(`Máy chủ Gemini 3.8 Flash không phản hồi sau ${maxRetries} lần thử`);
};

/**
 * Phân tích Sổ Đầu Bài / Nhật ký lớp sử dụng duy nhất Gemini 3.8 Flash
 * Tuyệt đối không gán điểm trừ, tập trung vào [Thứ/Ngày] - [Tiết/Môn] - [Học sinh] - [Vi phạm] - [Nhận xét GVBM]
 */
export const analyzeRecordWithGemini = async (
  params: AnalyzeRecordRequest,
  onStatusChange?: (msg: string) => void
): Promise<any> => {
  const apiKey = getStoredGeminiApiKey();

  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const promptText = buildRecordPrompt({
    roster: params.roster,
    weekNumber: params.weekNumber,
    textInput: params.textInput,
  });

  const parts: any[] = [];
  if (params.imageBase64) {
    const pureBase64 = params.imageBase64.replace(/^data:[^;]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: params.mimeType || 'image/jpeg',
        data: pureBase64,
      },
    });
  }
  parts.push({ text: promptText });

  // 1. Thử gọi trực tiếp Google Generative Language API với gemini-3.8-flash (có retry 1.5s)
  try {
    const responseText = await callGeminiDirect(apiKey, parts, onStatusChange);
    return cleanAndParseJsonObject(responseText);
  } catch (directErr: any) {
    if (directErr?.isKeyError || directErr?.status === 401 || directErr?.status === 403) {
      throw directErr;
    }

    // 2. Dự phòng: gọi qua backend server proxy /api/analyze-record
    try {
      if (onStatusChange) {
        onStatusChange('⚡ Đang xử lý bóc tách... (kết nối lại)');
      }
      const serverRes = await fetch('/api/analyze-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
        },
        body: JSON.stringify({
          ...params,
          apiKey,
        }),
      });

      if (!serverRes.ok) {
        const sErr = await serverRes.json().catch(() => ({}));
        throw new Error(sErr.error || directErr?.message || `Lỗi máy chủ (${serverRes.status})`);
      }

      const sData = await serverRes.json();
      if (sData.success && sData.data) {
        return sData.data;
      }
      throw new Error(sData.error || 'Dữ liệu trả về không hợp lệ');
    } catch (serverErr: any) {
      throw new Error(serverErr?.message || directErr?.message || 'Không thể bóc tách Sổ Đầu Bài');
    }
  }
};

export interface AnalyzeBaremParams {
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  nlpText?: string;
}

/**
 * Bóc tách quy định Barem từ ảnh/PDF hoặc văn bản tự nhiên bằng duy nhất 'gemini-3.8-flash'
 * Làm sạch JSON chuẩn xác: let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
 */
export const analyzeBaremWithGemini = async (
  params: AnalyzeBaremParams,
  onStatusChange?: (msg: string) => void
): Promise<any[]> => {
  const apiKey = getStoredGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const baremPrompt = params.nlpText
    ? `Bạn là trợ lý giáo dục chuyên nghiệp. Hãy phân tích yêu cầu quy tắc sau và trích xuất thành danh sách quy tắc JSON hợp lệ.
Mỗi quy tắc gồm:
- name: Tên quy tắc ngắn gọn (VD: Đi học muộn, Quên bài tập, Trực nhật tốt)
- category: hoc_tap | chuyen_can | tac_phong | ve_sinh | khen_thuong
- points: Số điểm (số âm nếu vi phạm như -2, -5; số dương nếu khen thưởng như +5, +10)
- description: Mô tả chi tiết hành vi
- appliesTo: "ca_nhan" hoặc "tap_the"

Yêu cầu người dùng:
"${params.nlpText}"

BẮT BUỘC TRẢ VỀ DUY NHẤT MẢNG JSON HỢP LỆ (Không có markdown text):
[
  { "id": "rule_1", "name": "...", "category": "...", "points": -2, "description": "...", "appliesTo": "ca_nhan" }
]`
    : `Bạn là trợ lý giáo dục chuyên nghiệp. Hãy trích xuất toàn bộ bảng nội quy / barem quy định thi đua từ tài liệu đính kèm.
Mỗi quy tắc gồm:
- name: Tên quy tắc ngắn gọn
- category: hoc_tap | chuyen_can | tac_phong | ve_sinh | khen_thuong
- points: Số điểm (số âm nếu trừ điểm như -2, số dương nếu cộng điểm như +5)
- description: Mô tả chi tiết quy định
- appliesTo: "ca_nhan" hoặc "tap_the"

BẮT BUỘC TRẢ VỀ DUY NHẤT MẢNG JSON HỢP LỆ (Không có markdown text):
[
  { "id": "rule_1", "name": "...", "category": "...", "points": -2, "description": "...", "appliesTo": "ca_nhan" }
]`;

  const parts: any[] = [];
  if (params.fileBase64) {
    const pureBase64 = params.fileBase64.replace(/^data:[^;]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: params.mimeType || 'image/jpeg',
        data: pureBase64,
      },
    });
  }
  parts.push({ text: baremPrompt });

  // 1. Thử gọi trực tiếp Google API gemini-3.8-flash (có auto-retry 1.5s tối đa 3 lần)
  try {
    const responseText = await callGeminiDirect(apiKey, parts, onStatusChange);
    let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd >= arrStart) {
      cleaned = cleaned.substring(arrStart, arrEnd + 1);
    }
    const parsedData = JSON.parse(cleaned);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (directErr: any) {
    if (directErr?.isKeyError || directErr?.status === 401 || directErr?.status === 403) {
      throw directErr;
    }

    // 2. Dự phòng: gọi qua backend server proxy /api/parse-barem
    try {
      const serverRes = await fetch('/api/parse-barem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
        },
        body: JSON.stringify({
          fileBase64: params.fileBase64,
          mimeType: params.mimeType,
          nlpText: params.nlpText,
          apiKey,
        }),
      });

      if (!serverRes.ok) {
        const sErr = await serverRes.json().catch(() => ({}));
        throw new Error(sErr.error || directErr?.message || `Lỗi máy chủ (${serverRes.status})`);
      }

      const sData = await serverRes.json();
      if (sData.success && Array.isArray(sData.rules)) {
        return sData.rules;
      }
      throw new Error(sData.error || 'Dữ liệu Barem không hợp lệ');
    } catch (serverErr: any) {
      throw new Error(serverErr?.message || directErr?.message || 'Không thể phân tích Barem');
    }
  }
};

export type CommentDetailLevel = 'ngan_gon' | 'chi_tiet';

export interface StudentPedagogicalInput {
  id: string;
  stt: number;
  name: string;
  role?: string;
  rank: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  violationsCount: number;
  bonusesCount: number;
  violationDetails: string[]; // Chi tiết từng dòng: "Thứ 3 - Tiết 2 môn Toán: Quên làm bài tập"
  bonusDetails: string[]; // Chi tiết biểu hiện tốt / khen thưởng
  violationBehaviors?: string[];
  bonusBehaviors?: string[];
  currentNote?: string;
}

export interface GeneratePedagogicalCommentsParams {
  students: StudentPedagogicalInput[];
  period: string;
  className: string;
  detailLevel: CommentDetailLevel;
  onStatusChange?: (msg: string) => void;
}

/**
 * Hậu xử lý lời nhận xét để bảo đảm 2 quy tắc cốt lõi:
 * 1. TUYỆT ĐỐI KHÔNG NÊU TÊN HỌC SINH trong lời phê (bắt đầu thẳng bằng nhận xét).
 * 2. TUYỆT ĐỐI KHÔNG CHÈN CÂU XÃ GIAO PHỤ HUYNH ("Kính mong gia đình...", "Mong phụ huynh...").
 */
export const postProcessComment = (rawComment: string, studentName?: string): string => {
  if (!rawComment) return '';
  let comment = rawComment.trim();

  // Bỏ bọc ngoặc kép, ngoặc đơn ngoài cùng nếu có
  comment = comment.replace(/^["'`“”]|["'`“”]$/g, '').trim();

  // 1. Loại bỏ tên học sinh nếu có ở đầu câu
  if (studentName) {
    const escapedName = studentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`^(?:Em|Học sinh|Bạn)?\\s*${escapedName}[:,\\s-]*`, 'i');
    comment = comment.replace(nameRegex, '');
  }

  // Loại bỏ các mở đầu "Em ...", "Học sinh ..."
  comment = comment.replace(/^Em\s+(?=[a-zà-ỹA-ZÀ-Ỹ])/i, '');
  comment = comment.replace(/^Học sinh\s+(?=[a-zà-ỹA-ZÀ-Ỹ])/i, '');

  // 2. Loại bỏ các câu xã giao phụ huynh
  comment = comment.replace(
    /\s*(?:Kính mong|Rất mong|Mong|Đề nghị|GVCN mong)?\s*(?:quý\s*)?(?:gia đình|phụ huynh|cha mẹ)\s*(?:tiếp tục|hãy|dành thời gian|quan tâm|phối hợp|đôn đốc|nhắc nhở|khích lệ|hỗ trợ|cùng)[^.!?]*[.!?]?/gi,
    ''
  );
  comment = comment.replace(/\s*GVCN\s+(?:rất\s+)?mong\s+(?:quý\s*)?(?:gia đình|phụ huynh)[^.!?]*[.!?]?/gi, '');

  comment = comment.trim();

  // Viết hoa chữ cái đầu tiên
  if (comment.length > 0) {
    comment = comment.charAt(0).toUpperCase() + comment.slice(1);
  }

  return comment;
};

/**
 * Tạo nhận xét sư phạm dự phòng chuẩn mẫu Thông tư 22 (khi offline hoặc chưa có API key)
 * Phân tích thực tế nhật ký của từng học sinh - Chống văn mẫu
 */
export const generateFallbackPedagogicalComment = (
  student: StudentPedagogicalInput,
  detailLevel: CommentDetailLevel
): string => {
  const { violationsCount, violationDetails = [], bonusDetails = [] } = student;
  const violationTexts = [
    ...(student.violationBehaviors || []),
    ...violationDetails,
  ].join(' ').toLowerCase();

  const isHomeworkIssue =
    violationTexts.includes('bài tập') ||
    violationTexts.includes('quên') ||
    violationTexts.includes('vở') ||
    violationTexts.includes('sách') ||
    violationTexts.includes('chưa làm') ||
    violationTexts.includes('chưa chuẩn bị');

  const isNoiseIssue =
    violationTexts.includes('nói chuyện') ||
    violationTexts.includes('trật tự') ||
    violationTexts.includes('việc riêng') ||
    violationTexts.includes('ồn');

  const isLateOrUniformIssue =
    violationTexts.includes('muộn') ||
    violationTexts.includes('trễ') ||
    violationTexts.includes('đồng phục') ||
    violationTexts.includes('khăn quàng') ||
    violationTexts.includes('tác phong');

  // Nhận diện môn học phát sinh vi phạm nếu có
  let subjectMention = '';
  const subjects = ['Toán', 'Tiếng Anh', 'Ngữ văn', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 'Tin học', 'GDCD'];
  for (const sub of subjects) {
    if (violationTexts.includes(sub.toLowerCase())) {
      subjectMention = ` môn ${sub}`;
      break;
    }
  }

  if (detailLevel === 'ngan_gon') {
    if (violationsCount === 0) {
      if (bonusDetails.length > 0) {
        return 'Ý thức nề nếp rất tốt, tự giác, tích cực tham gia xây dựng bài học.';
      }
      return 'Ý thức nề nếp rất tốt, chăm ngoan, tự giác và tích cực trong các hoạt động học tập.';
    }

    if (isHomeworkIssue) {
      return `Ngoan ngoãn, cần chú ý chuẩn bị bài tập chu đáo và đầy đủ hơn${subjectMention} trước khi đến lớp.`;
    }
    if (isNoiseIssue) {
      return `Ý thức nề nếp tốt, cần chú ý tập trung nghe giảng và hạn chế nói chuyện riêng trong giờ${subjectMention}.`;
    }
    if (isLateOrUniformIssue) {
      return 'Lễ phép, cần nghiêm túc chấp hành nề nếp giờ giấc và quy định trang phục.';
    }
    return 'Ngoan ngoãn, lễ phép, cần chú ý chấn chỉnh nề nếp và hoàn thành tốt nhiệm vụ học tập.';
  }

  // detailLevel === 'chi_tiet' (2 - 3 câu)
  if (violationsCount === 0) {
    if (bonusDetails.length > 0) {
      return 'Chấp hành rất tốt mọi nề nếp, nội quy trường lớp. Ý thức học tập tự giác cao, tích cực tham gia xây dựng bài. Tiếp tục duy trì và phát huy tinh thần gương mẫu.';
    }
    return 'Chấp hành rất tốt mọi nề nếp, nội quy trường lớp. Ý thức học tập tự giác, chăm ngoan và hoàn thành tốt mọi nhiệm vụ. Tiếp tục duy trì và phát huy tinh thần gương mẫu.';
  }

  if (isHomeworkIssue) {
    const subNote = subjectMention ? ` môn ${subjectMention.replace(' môn ', '')}` : '';
    return `Ngoan ngoãn, chấp hành tốt nội quy trường lớp. Tuy nhiên trong quá trình học tập còn đôi lúc chưa chuẩn bị chu đáo bài tập về nhà${subNote}. Cần chủ động ôn tập và hoàn thành bài đầy đủ hơn.`;
  }

  if (isNoiseIssue) {
    const subNote = subjectMention ? ` môn ${subjectMention.replace(' môn ', '')}` : '';
    return `Ý thức nề nếp tốt, hòa nhã với bạn bè. Trong giờ học${subNote} cần tập trung chú ý nghe giảng hơn, tránh nói chuyện riêng làm ảnh hưởng đến tiết học. Cần rèn luyện tính tập trung để đạt kết quả tốt hơn.`;
  }

  if (isLateOrUniformIssue) {
    return 'Lễ phép, có ý thức tôn trọng thầy cô giáo. Tuy nhiên cần chú ý chấp hành nghiêm túc giờ giấc đi học và quy định đồng phục của nhà trường. Cần rèn luyện tính kỷ luật để tiến bộ hơn nữa.';
  }

  return 'Lễ phép, có ý thức rèn luyện đạo đức. Trong quá trình học tập còn một số vi phạm cần nghiêm túc chấn chỉnh. Cần tập trung và nâng cao ý thức tự giác chấp hành kỷ luật.';
};

/**
 * Gọi Gemini 3.8 Flash sinh lời nhận xét sư phạm theo mức độ chi tiết (Ngắn gọn / Chi tiết)
 * Tự động phân tích nhật ký thực tế của từng học sinh (Chống văn mẫu)
 */
export const generatePedagogicalComments = async (
  params: GeneratePedagogicalCommentsParams
): Promise<Record<string, string>> => {
  const { students, period, className, detailLevel, onStatusChange } = params;
  const apiKey = getStoredGeminiApiKey();

  // Nếu không có API Key, dùng bộ tạo dự phòng sư phạm chất lượng cao
  if (!apiKey) {
    const results: Record<string, string> = {};
    students.forEach((s) => {
      results[s.id] = generateFallbackPedagogicalComment(s, detailLevel);
    });
    return results;
  }

  const promptText = `
Bạn là "EduMaster AI" – Cố vấn Sư phạm dành riêng cho Giáo viên Chủ nhiệm (GVCN) THCS, thực hiện viết nhận xét học sinh định kỳ dựa trên NHẬT KÝ THEO DÕI NỀ NẾP THỰC TẾ (CHỐNG VĂN MẪU).

MỤC TIÊU HÀNG ĐẦU:
Từng câu chữ nhận xét phải được CÁ NHÂN HÓA SÂU SẮC, phân tích chính xác từng sự việc thực tế đã ghi nhận trong nhật ký của từng học sinh. TUYỆT ĐỐI KHÔNG VIẾT CHUNG CHUNG, KHÔNG DÙNG VĂN MẪU SÁO RỖNG.

2 NGUYÊN TẮC BẤT DI BẤT DỊCH (TUYỆT ĐỐI TUÂN THỦ):
1. TUYỆT ĐỐI KHÔNG NÊU TÊN HỌC SINH trong lời phê:
   - Bắt đầu THẲNG vào nhận xét đánh giá (Ví dụ: "Ngoan ngoãn, chấp hành tốt...", "Ý thức nề nếp tốt,...", "Chấp hành rất tốt mọi nề nếp,...").
   - CẤM VIẾT: "Em Nguyễn Văn A...", "Em...", "Học sinh A...", "Bạn...".
2. TUYỆT ĐỐI KHÔNG CHÈN CÂU XÃ GIAO PHỤ HUYNH:
   - CẤM TUYỆT ĐỐI các cụm từ: "Kính mong gia đình...", "Mong phụ huynh...", "GVCN mong gia đình...", "Rất mong quý phụ huynh phối hợp...".
   - Lời nhận xét là văn bản sư phạm thuần túy đánh giá sự rèn luyện của bản thân học sinh, định hướng để học sinh tự giác nỗ lực hoặc phát huy.

QUY TẮC PHÂN TÍCH NHẬT KÝ THỰC TẾ VÀ CÁ NHÂN HÓA NỘI DUNG:
- Đọc kỹ từng dòng trong "Nhật ký sự việc thực tế" của từng học sinh:
  * Nếu hay quên bài tập / chưa chuẩn bị bài / thiếu đồ dùng / chưa học bài: Nhận xét phải xoáy vào ý "cần chuẩn bị bài tập chu đáo trước khi đến lớp", "chủ động ôn tập và hoàn thành bài đầy đủ hơn".
  * Nếu hay nói chuyện riêng / mất trật tự / làm việc riêng: Nhận xét phải yêu cầu "cần tập trung chú ý nghe giảng, hạn chế làm việc riêng / nói chuyện riêng trong giờ".
  * Nếu đi trễ / vi phạm tác phong / thiếu đồng phục: Nhận xét phải chỉ rõ "cần nghiêm túc chấp hành nề nếp giờ giấc và đồng phục".
  * Nếu chỉ vi phạm ở một vài bộ môn cụ thể (Toán, Tiếng Anh, Ngữ văn, Vật lý...): Nhận xét phải chỉ rõ tên môn học đó để học sinh chấn chỉnh đúng bộ môn phát sinh lỗi.
  * Nếu có biểu hiện tốt / khen thưởng (phát biểu bài, việc tốt): Ghi nhận đúng việc tốt để tuyên dương, khích lệ.
  * Nếu học sinh HOÀN TOÀN KHÔNG CÓ VI PHẠM (0 vi phạm): Đánh giá cao tính tự giác, tinh thần trách nhiệm, tích cực xây dựng bài và sự gương mẫu.

ĐỘ CHI TIẾT YÊU CẦU: ${detailLevel === 'ngan_gon' ? 'NGẮN GỌN (1 CÂU SÚC TÍCH)' : 'CHI TIẾT (2 - 3 CÂU ĐẦY ĐỦ)'}

${
  detailLevel === 'ngan_gon'
    ? `
QUY ĐỊNH CHO MỨC "NGẮN GỌN" (Xuất Học bạ / CSDL ngành GD):
- Giới hạn ĐÚNG 1 CÂU DUY NHẤT (tối đa 20 - 25 từ).
- Nêu bật ngay ý thức rèn luyện và gọi trúng lỗi chính cần khắc phục (hoặc tinh thần tự giác nếu 0 lỗi).
- Ví dụ:
  * Quên bài: "Ngoan ngoãn, cần chú ý chuẩn bị bài tập chu đáo và đầy đủ hơn trước khi đến lớp."
  * Mất trật tự: "Ý thức nề nếp tốt, cần chú ý tập trung nghe giảng và hạn chế nói chuyện riêng trong giờ."
  * Không vi phạm: "Ý thức nề nếp rất tốt, chăm ngoan, tự giác và tích cực trong các hoạt động học tập."
`
    : `
QUY ĐỊNH CHO MỨC "CHI TIẾT" (2 - 3 câu rõ ràng, mạch lạc):
- Câu 1: Nhận định chung về thái độ, đạo đức, sự lễ phép và nề nếp.
- Câu 2: Gọi cụ thể biểu hiện / hành vi nổi bật từ nhật ký thực tế (chỉ rõ lỗi quên bài, nói chuyện riêng, đi muộn kèm môn học nếu có; hoặc ghi nhận tinh thần tự giác, tích cực phát biểu nếu không vi phạm).
- Câu 3: Định hướng khắc phục cụ thể cho học sinh tự chấn chỉnh bản thân (hoặc khích lệ tiếp tục phát huy tính gương mẫu).

VÍ DỤ ĐỐI CHIẾU THỰC TẾ BẮT BUỘC BÁM SÁT:
- TH1 (Có lỗi quên bài tập môn Toán & Lý):
  "Ngoan ngoãn, chấp hành tốt nội quy trường lớp. Tuy nhiên trong quá trình học tập còn đôi lúc chưa chuẩn bị chu đáo bài tập về nhà. Cần chủ động ôn tập và hoàn thành bài đầy đủ hơn."
- TH2 (Có lỗi nói chuyện riêng môn Tiếng Anh):
  "Ý thức nề nếp tốt, hòa nhã với bạn bè. Trong giờ học cần tập trung chú ý nghe giảng hơn, tránh nói chuyện riêng làm ảnh hưởng đến tiết học."
- TH3 (0 vi phạm, thường xuyên phát biểu):
  "Chấp hành rất tốt mọi nề nếp, nội quy trường lớp. Ý thức học tập tự giác cao, tích cực tham gia xây dựng bài. Tiếp tục duy trì và phát huy tinh thần gương mẫu."
`
}

THÔNG TIN LỚP HỌC:
- Lớp: ${className}
- Kỳ đánh giá: ${period}

DANH SÁCH DỮ LIỆU NHẬT KÝ THỰC TẾ TỪNG HỌC SINH (${students.length} học sinh):
${students
  .map(
    (s) => `
HỌC SINH [ID: "${s.id}" - STT ${s.stt}]:
- Xếp loại rèn luyện TT22: ${s.rank}
- Tổng số lần ghi nhận vi phạm: ${s.violationsCount} lần
- Danh sách sự việc cụ thể trong nhật ký:
${
  s.violationDetails && s.violationDetails.length > 0
    ? s.violationDetails.map((v) => `  * ${v}`).join('\n')
    : '  * Không có vi phạm, nề nếp học tập tốt'
}
- Biểu hiện tốt / Khen thưởng (nếu có):
${
  s.bonusDetails && s.bonusDetails.length > 0
    ? s.bonusDetails.map((b) => `  * ${b}`).join('\n')
    : '  * Không có ghi nhận đặc biệt'
}
`
  )
  .join('\n')}

BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON HỢP LỆ (Không có markdown text hay giải thích ngoài JSON):
{
  "evaluations": [
    {
      "studentId": "...",
      "comment": "..."
    }
  ]
}
`;

  try {
    if (onStatusChange) {
      onStatusChange(`🤖 Gemini 3.8 Flash đang phân tích nhật ký thực tế (${detailLevel === 'ngan_gon' ? 'Ngắn gọn' : 'Chi tiết'})...`);
    }

    const parts = [{ text: promptText }];
    const responseText = await callGeminiDirect(apiKey, parts, onStatusChange);
    const parsed = cleanAndParseJsonObject(responseText);

    const resultMap: Record<string, string> = {};
    if (parsed && Array.isArray(parsed.evaluations)) {
      parsed.evaluations.forEach((item: any) => {
        if (item.studentId && item.comment) {
          const studentObj = students.find((s) => s.id === item.studentId);
          const raw = String(item.comment).trim();
          resultMap[item.studentId] = postProcessComment(raw, studentObj?.name);
        }
      });
    }

    // Đảm bảo mọi học sinh đều có nhận xét (fallback nếu model bỏ sót một vài bạn)
    students.forEach((s) => {
      if (!resultMap[s.id]) {
        resultMap[s.id] = generateFallbackPedagogicalComment(s, detailLevel);
      }
    });

    return resultMap;
  } catch (err: any) {
    console.warn('Lỗi khi gọi Gemini AI nhận xét, chuyển sang bộ tạo dự phòng sư phạm:', err);
    const fallbackMap: Record<string, string> = {};
    students.forEach((s) => {
      fallbackMap[s.id] = generateFallbackPedagogicalComment(s, detailLevel);
    });
    return fallbackMap;
  }
};


