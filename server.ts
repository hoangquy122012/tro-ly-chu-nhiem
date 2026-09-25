import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Khởi tạo GoogleGenAI Client với BYOK (Gemini API Key cá nhân của từng giáo viên)
 */
const getGeminiClient = (req: express.Request): GoogleGenAI => {
  const userApiKey =
    (req.headers['x-gemini-api-key'] as string)?.trim() ||
    (req.body?.apiKey as string)?.trim() ||
    process.env.GEMINI_API_KEY?.trim();

  if (!userApiKey) {
    const err: any = new Error('MISSING_API_KEY');
    err.status = 401;
    throw err;
  }

  return new GoogleGenAI({
    apiKey: userApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const handleGeminiError = (error: any, res: express.Response) => {
  console.error('Gemini API Error:', error);
  const errMsg = String(error?.message || '');
  const status = error?.status;

  if (
    errMsg === 'MISSING_API_KEY' ||
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 429 ||
    errMsg.includes('API key') ||
    errMsg.includes('API_KEY') ||
    errMsg.includes('PERMISSION_DENIED') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota') ||
    errMsg.includes('unregistered')
  ) {
    return res.status(401).json({
      error: '❌ API Key không hợp lệ hoặc đã hết hạn mức. Vui lòng bấm vào nút [Đổi API Key] trên thanh tiêu đề để kiểm tra lại.',
      isKeyError: true,
    });
  }

  return res.status(500).json({
    error: error?.message || 'Có lỗi xảy ra khi gọi Google AI',
  });
};

// API endpoint to analyze Sổ đầu bài, Sổ cờ đỏ from photo or text
app.post('/api/analyze-record', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      textInput,
      roster,
      baremRules,
      weekNumber = 3,
      academicYear = '2026-2027',
      semester = 1,
    } = req.body;

    if (!imageBase64 && !textInput) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ảnh chụp sổ hoặc nội dung văn bản' });
    }

    const rosterText = Array.isArray(roster)
      ? roster.map((s: any) => `STT ${s.stt}: ${s.name} (Chức vụ: ${s.role || 'Học sinh'})`).join('\n')
      : '';

    const baremText = Array.isArray(baremRules)
      ? baremRules.map((b: any) => `- ${b.name}: ${b.points > 0 ? '+' : ''}${b.points}đ (${b.description || ''})`).join('\n')
      : '';

    const promptText = `
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

${textInput ? `NỘI DUNG VĂN BẢN ĐƯỢC CUNG CẤP:\n${textInput}` : 'HÃY BÓC TÁCH TOÀN BỘ TỪ ẢNH CHỤP ĐƯỢC ĐÍNH KÈM.'}

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON HỢP LỆ (chỉ JSON thuần túy, không có markdown text bao quanh):
{
  "weekNumber": ${weekNumber},
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
      "date": "DD/MM/YYYY",
      "studentName": "...",
      "details": "Tiết ... môn ...: Hành vi cụ thể",
      "educationalMeasure": "Nhắc nhở, rút kinh nghiệm"
    }
  ],
  "monthlyParentAlerts": [
    {
      "studentName": "...",
      "stt": 1,
      "monthNumber": 9,
      "monthName": "Tháng 9/2026",
      "totalMonthlyErrors": 3,
      "predictedRank": "Khá",
      "violations": [
        { "dayOfWeek": "...", "date": "...", "period": 1, "subject": "...", "behavior": "..." }
      ],
      "messageZalo": "Dạ kính gửi phụ huynh em [Tên]. Thầy/Cô chủ nhiệm lớp xin gửi lời chào gia đình ạ.\nTrong tháng vừa qua, nhìn chung em có cố gắng trong sinh hoạt tập thể. Tuy nhiên, về mặt nề nếp và học tập, em có tích lũy [Số lần] lần nhắc nhở:\n- [Ngày DD/MM, Tiết Y môn Z]: [Lỗi]\nDo số lần vi phạm đã vượt mức quy định của lớp, Thầy/Cô rất mong gia đình dành thời gian trò chuyện, nhắc nhở thêm tại nhà để tháng tới em chấn chỉnh nề nếp, tránh làm ảnh hưởng đến kết quả rèn luyện định kỳ của em. Thầy/Cô cảm ơn sự phối hợp của gia đình ạ!"
    }
  ],
  "monthStatusNote": "Tháng này nề nếp học sinh vẫn trong ngưỡng kiểm soát.",
  "ambiguousNames": [],
  "tt22Forecast": {
    "atRiskStudents": [],
    "exemplaryStudents": [],
    "homeroomFocusPoints": ["Kiểm tra bài tập đầu giờ", "Nhắc nhở tác phong trang phục"]
  }
}
`;

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
    parts.push({ text: promptText });

    // Model: gemini-3.8-flash with auto-retry on 503/429 (no fallback models)
    const client = getGeminiClient(req);
    let responseText = '';
    const maxRetries = 3;
    let lastErr: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });
        responseText = result.text || '';
        if (responseText) break;
      } catch (err: any) {
        lastErr = err;
        const status = err?.status;
        const msg = String(err?.message || '');
        const isOverloaded =
          status === 503 ||
          status === 429 ||
          msg.includes('high demand') ||
          msg.includes('overloaded') ||
          msg.includes('resource_exhausted') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isOverloaded && attempt < maxRetries) {
          console.warn(`[gemini-3.8-flash] 503/429 encountered, auto-retrying (${attempt + 1}/${maxRetries}) in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw err;
      }
    }

    if (!responseText && lastErr) {
      throw lastErr;
    }

    if (!responseText) {
      throw new Error('Không nhận được dữ liệu phản hồi từ AI');
    }

    // Clean JSON response if necessary
    let cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const objStart = cleanedText.indexOf('{');
    const objEnd = cleanedText.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd >= objStart) {
      cleanedText = cleanedText.substring(objStart, objEnd + 1);
    }
    const parsedData = JSON.parse(cleanedText);

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// API endpoint to parse natural language barem rules or uploaded barem document/image
app.post('/api/parse-barem', async (req, res) => {
  try {
    const { nlpText, fileBase64, mimeType, fileName } = req.body;
    if (!nlpText && !fileBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp văn bản hoặc tệp Barem (Ảnh/Word/PDF)' });
    }

    const promptText = `
Bạn là chuyên gia quy chế thi đua Đội TNTP và Sổ Chủ Nhiệm THCS.
${fileBase64 ? 'Hãy đọc và bóc tách TOÀN BỘ quy chế thi đua, bảng điểm trừ, bảng điểm cộng từ tệp tài liệu được cung cấp.' : 'Hãy phân tích đoạn văn bản quy định điểm trừ/điểm cộng thi đua sau:'}
${nlpText ? `Nội dung văn bản: "${nlpText}"` : ''}

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

    const parts: any[] = [];
    if (fileBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: fileBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
    parts.push({ text: promptText });

    const client = getGeminiClient(req);
    let responseText = '';
    const maxRetries = 3;
    let lastErr: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });
        responseText = result.text || '';
        if (responseText) break;
      } catch (err: any) {
        lastErr = err;
        const status = err?.status;
        const msg = String(err?.message || '');
        const isOverloaded =
          status === 503 ||
          status === 429 ||
          msg.includes('high demand') ||
          msg.includes('overloaded') ||
          msg.includes('resource_exhausted') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isOverloaded && attempt < maxRetries) {
          console.warn(`[gemini-3.8-flash] Barem parse retry (${attempt + 1}/${maxRetries}) in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw err;
      }
    }

    if (!responseText && lastErr) {
      throw lastErr;
    }

    let cleaned = (responseText || '[]').replace(/```json/gi, '').replace(/```/g, '').trim();
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd >= arrayStart) {
      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }
    const parsed = JSON.parse(cleaned);
    return res.json({ success: true, rules: parsed });
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// Setup Vite or Static File Serving
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EduMaster AI Server đang chạy tại http://0.0.0.0:${PORT}`);
});
