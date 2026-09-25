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

