import { getStoredGeminiApiKey } from '../utils/geminiApiKey';

export const MODEL_NAME = 'gemini-3.8-flash';

export interface BaremParsedRule {
  name: string;
  category?: string;
  points: number;
  description?: string;
}

export interface ParseBaremRequest {
  nlpText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}

export interface AnalyzeRecordRequest {
  imageBase64?: string;
  mimeType?: string;
  textInput?: string;
  roster: any[];
  baremRules: any[];
  weekNumber: number;
  academicYear?: string;
  semester?: number;
}

const BAREM_PROMPT = `
Bạn là chuyên gia quy chế thi đua Đội TNTP và Sổ Chủ Nhiệm THCS.
Nhiệm vụ:
Nhận diện và bóc tách tất cả danh mục hành vi vi phạm, lỗi nề nếp, điểm kiểm tra, việc tốt cùng số điểm trừ (số âm, VD: -1, -2, -5, -10) hoặc số điểm cộng (số dương, VD: 1, 2, 5).

Bắt buộc trả về JSON Array thuần túy (không kèm markdown):
[
  {
    "name": "Tên quy định / Lỗi vi phạm / Việc tốt",
    "category": "di_muon | mat_trat_tu | quen_bai | diem_duoi_5 | khong_dong_phuc | diem_tot | viec_tot | nghi_hoc | bo_tiet | thai_do_sai | phe_binh | khen_thuong | vi_pham_nghiem_trong | khac",
    "points": -2,
    "description": "Mô tả ngắn gọn điều kiện áp dụng hoặc căn cứ điểm trừ"
  }
]
`;

/**
 * Làm sạch chuỗi phản hồi từ Gemini và parse thành JSON Array
 */
export const cleanAndParseJsonRules = (rawText: string): BaremParsedRule[] => {
  if (!rawText) return [];
  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Tìm vị trí mở/đóng mảng JSON nếu có text thừa xung quanh
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd >= arrayStart) {
    cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
  }

  const result = JSON.parse(cleaned);
  if (!Array.isArray(result)) {
    throw new Error('Dữ liệu AI trả về không phải định dạng danh sách quy tắc');
  }
  return result;
};

/**
 * Làm sạch chuỗi phản hồi từ Gemini và parse thành JSON Object (cho phân tích Sổ Đầu Bài)
 */
export const cleanAndParseJsonObject = (rawText: string): any => {
  if (!rawText) return null;
  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd >= objStart) {
    cleaned = cleaned.substring(objStart, objEnd + 1);
  }

  return JSON.parse(cleaned);
};

/**
 * Gọi trực tiếp endpoint Google API gemini-3.8-flash:generateContent
 * Cấu trúc URL chính xác:
 * const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
 */
export const callGeminiDirect = async (
  apiKey: string,
  parts: any[]
): Promise<string> => {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `Google API error ${response.status}`;
    const errObj: any = new Error(errMsg);
    errObj.status = response.status;
    errObj.isKeyError =
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403 ||
      response.status === 429 ||
      errMsg.includes('API key') ||
      errMsg.includes('API_KEY');
    throw errObj;
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) {
    throw new Error('Google Gemini không trả về dữ liệu nội dung');
  }
  return text;
};

/**
 * Phân tích Barem từ Văn bản tự nhiên hoặc Ảnh/Tệp sử dụng trực tiếp Gemini 3.8 Flash
 */
export const analyzeBaremWithGemini = async (
  params: ParseBaremRequest
): Promise<BaremParsedRule[]> => {
  const apiKey = getStoredGeminiApiKey();

  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const promptText = `
${BAREM_PROMPT}

${params.fileBase64 ? 'Hãy đọc và bóc tách TOÀN BỘ quy chế thi đua, bảng điểm trừ, bảng điểm cộng từ tệp tài liệu được cung cấp.' : 'Hãy phân tích đoạn văn bản quy định điểm trừ/điểm cộng thi đua sau:'}
${params.nlpText ? `Nội dung văn bản: "${params.nlpText}"` : ''}
`;

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
  parts.push({ text: promptText });

  let responseText = '';

  // 1. Thử gọi trực tiếp Google Generative Language API với gemini-3.8-flash
  try {
    responseText = await callGeminiDirect(apiKey, parts);
  } catch (directErr: any) {
    // Nếu lỗi do API Key sai/hết hạn mức, ném lỗi ra ngoài ngay
    if (directErr?.isKeyError || directErr?.status === 401 || directErr?.status === 403) {
      throw directErr;
    }

    // 2. Dự phòng: gọi qua backend server proxy /api/parse-barem (cũng dùng gemini-3.8-flash)
    try {
      const serverRes = await fetch('/api/parse-barem', {
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
      if (sData.success && Array.isArray(sData.rules)) {
        return sData.rules;
      }
      throw new Error(sData.error || 'Dữ liệu trả về không hợp lệ');
    } catch (serverErr: any) {
      throw new Error(serverErr?.message || directErr?.message || 'Không thể phân tích barem bằng AI');
    }
  }

  // 3. Làm sạch cú pháp JSON và parse
  return cleanAndParseJsonRules(responseText);
};
