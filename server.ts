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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
      ? roster.map((s: any) => `STT ${s.stt}: ${s.name} (Tổ ${s.group}, Chức vụ: ${s.role || 'Học sinh'})`).join('\n')
      : '';

    const baremText = Array.isArray(baremRules)
      ? baremRules.map((b: any) => `- ${b.name}: ${b.points > 0 ? '+' : ''}${b.points}đ (${b.description || ''})`).join('\n')
      : '';

    const promptText = `
Bạn là "EduMaster AI" – Trợ lý Số Quản trị Lớp học và Cố vấn Sư phạm dành riêng cho Giáo viên Chủ nhiệm (GVCN) cấp THCS, vận hành bám sát chuẩn nghiệp vụ Sổ Công Tác Chủ Nhiệm (SCN) và Quy chế đánh giá học sinh theo Thông tư 22/2021/TT-BGDĐT.

HỆ THỐNG VẬN HÀNH CƠ CHẾ PHÂN TÁCH 2 LUỒNG DỮ LIỆU ĐỘC LẬP:
- LUỒNG 1 (ĐIỂM THI ĐUA TẬP THỂ LỚP): Chỉ tính toán điểm thi đua tuần của lớp dựa trên điểm trừ từ Sổ Sao Đỏ và Xếp loại tiết học trong Sổ Đầu Bài.
  * Điểm chuẩn ban đầu: 100 điểm.
  * Điểm trừ từ Xếp loại tiết học Sổ đầu bài: Tiết Tốt (không trừ), Tiết Khá (trừ 1đ/tiết), Tiết TB (trừ 2đ/tiết), Tiết Chưa đạt (trừ 5đ/tiết).
  * Điểm trừ từ Sổ Sao Đỏ trường: Lỗi tập thể bị Sao đỏ ghi nhận (trừ theo quy định).
  * TUYỆT ĐỐI KHÔNG trừ điểm lớp vì lỗi cá nhân học sinh trừ khi bị Sao đỏ ghi nhận!
- LUỒNG 2 (HỒ SƠ CÁ NHÂN HỌC SINH): Tích hợp toàn bộ lỗi vi phạm, điểm số, tác phong cụ thể vào từng học sinh. QUẢN LÝ CẢNH BÁO THEO CHU KỲ THÁNG.

NGUYÊN TẮC CẢNH BÁO VÀ GỢI Ý TIN NHẮN PHỤ HUYNH THEO THÁNG:
- Tuyệt đối không gửi tin nhắn dồn dập hàng tuần cho những sơ suất nhỏ lẻ.
- Mức bình thường (1-2 lỗi/tháng): Chỉ ghi nhận vào SCN và nhắc nhở trên lớp. TUYỆT ĐỐI KHÔNG xuất tin nhắn gửi phụ huynh.
- Mức vi phạm nhiều (TỪ 3 LỖI TRỞ LÊN TRONG THÁNG): Lập tức kích hoạt cảnh báo tháng và soạn sẵn tin nhắn Zalo tổng hợp TOÀN BỘ các lần vi phạm trong cả tháng của học sinh (nêu rõ Ngày, Tiết, Môn từng lần).
- Ngoại lệ: Lỗi nghiêm trọng (đánh nhau, vô lễ GV, thuốc lá điện tử, trốn tiết...) cảnh báo ngay trong tuần phát sinh.

QUY CHUẨN GHI CHÉP BẢNG MỤC 4 SỔ CHỦ NHIỆM (THEO DÕI HỌC SINH):
1. TÁCH BẠCH HOÀN TOÀN ĐIỂM THI ĐUA: Điểm thi đua & điểm trừ (-1đ, -2đ, trừ điểm thi đua lớp...) CHỈ ĐƯỢC PHÉP xuất hiện duy nhất ở Luồng 1 (Điểm thi đua tập thể). TUYỆT ĐỐI KHÔNG ghi bất kỳ điểm trừ thi đua nào vào Mục 4 (Nhật ký cá nhân). CẤM ghi: "(-2đ thi đua)", "bị trừ 1 điểm", "trừ điểm lớp".
2. CỘT "BIỂU HIỆN CỤ THỂ" (CỘT 3): Chỉ ghi thuần túy sự thật khách quan gồm: Ngày/Thứ, Tiết mấy, Môn gì, và Hành vi hoặc Điểm kiểm tra môn học. (Ví dụ: "Tiết 2 môn Toán: Đạt điểm 10 kiểm tra miệng", "Tiết 4 môn Lịch sử: Quên mang sách giáo khoa và chưa ghi chép bài").
3. CỘT "BIỆN PHÁP GIÁO DỤC" (CỘT 4): Chỉ ghi biện pháp sư phạm của GVCN: Động viên / Nhắc nhở / Trao đổi riêng / Giao bạn cán sự kèm cặp / Gửi tin nhắn Zalo PH / Yêu cầu viết bản kiểm điểm. Tuyệt đối không ghi giải thích rườm rà như "(Mức 1 lỗi chưa gửi tin PH)" hay "(dưới 3 lỗi nên chỉ nhắc nhở)".

ĐỊNH DANH VI PHẠM BẮT BUỘC: Đủ 4 trường: [Ngày/Thứ] - [Tiết học] - [Tên Môn học] - [Hành vi cụ thể].

DANH SÁCH LỚP CHÍNH THỨC (ROSTER ĐỐI CHIẾU):
${rosterText}

BAREM ĐIỂM THI ĐUA ĐANG ÁP DỤNG:
${baremText}

${textInput ? `NỘI DUNG VĂN BẢN ĐƯỢC CUNG CẤP:\n${textInput}` : 'HÃY BÓC TÁCH TOÀN BỘ TỪ ẢNH CHỤP ĐƯỢC ĐÍNH KÈM.'}

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON HỢP LỆ (chỉ JSON thuần túy, không có markdown text bao quanh):
{
  "weekNumber": ${weekNumber},
  "monthNumber": 9,
  "monthName": "Tháng 9/2026",
  "dateRange": "Từ ngày ... đến ngày ...",
  "collectiveCompetition": {
    "startingPoints": 100,
    "periodDeductions": 1,
    "periodDetails": "... tiết Khá/TB/Chưa đạt, trừ ... điểm",
    "saoDoDeductions": 2,
    "saoDoDetails": "Lỗi tập thể bị Sao đỏ bắt, trừ ... điểm",
    "finalScore": 97,
    "estimatedRank": "Hạng ... / 12 lớp"
  },
  "studentWeeklyIndicators": [
    { "index": 1, "title": "Số học sinh nghỉ học", "count": 0, "details": "..." },
    { "index": 2, "title": "Số đi muộn", "count": 0, "details": "..." },
    { "index": 3, "title": "Số bỏ tiết", "count": 0, "details": "..." },
    { "index": 4, "title": "Không chuẩn bị bài / Quên vở", "count": 0, "details": "..." },
    { "index": 5, "title": "Điểm kiểm tra dưới 5.0", "count": 0, "details": "..." },
    { "index": 6, "title": "Mắc thái độ sai", "count": 0, "details": "..." },
    { "index": 7, "title": "Điểm tốt (8, 9, 10)", "count": 0, "details": "..." },
    { "index": 8, "title": "Việc tốt / Tuyên dương", "count": 0, "details": "..." },
    { "index": 9, "title": "Học sinh được khen", "count": 0, "details": "..." },
    { "index": 10, "title": "Học sinh bị phê bình", "count": 0, "details": "..." },
    { "index": 11, "title": "Tiết trống", "count": 0, "details": "..." },
    { "index": 12, "title": "Tiết tự quản tốt", "count": 0, "details": "..." },
    { "index": 13, "title": "Đánh giá chung nề nếp tuần", "count": 1, "details": "..." }
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
  "monthStatusNote": "Tháng này nề nếp học sinh vẫn trong ngưỡng kiểm soát (dưới 3 lỗi), chưa cần gửi tin nhắn cảnh báo phụ huynh.",
  "scnJournalEntries": [
    {
      "date": "DD/MM/YYYY",
      "studentName": "...",
      "details": "Tiết ... môn ...: Hành vi/Điểm số",
      "educationalMeasure": "Nhắc nhở, động viên / Giao cán sự kèm / Báo PH..."
    }
  ],
  "events": [
    {
      "studentName": "...",
      "dayOfWeek": "Thứ ...",
      "date": "DD/MM/YYYY",
      "period": 1,
      "subject": "...",
      "behavior": "...",
      "category": "di_muon | quen_bai | mat_trat_tu | diem_duoi_5 | diem_tot | viec_tot | khac",
      "pointsImpact": -2,
      "educationalMeasure": "...",
      "severity": "nhe | trung_binh | nang | khen_thuong"
    }
  ],
  "ambiguousNames": [],
  "tt22Forecast": {
    "atRiskStudents": [
      {
        "name": "...",
        "stt": 1,
        "errorsCount": 3,
        "commonSubjects": ["..."],
        "predictedRank": "Khá"
      }
    ],
    "exemplaryStudents": [
      { "name": "...", "stt": 1, "goodPointsCount": 1 }
    ],
    "homeroomFocusPoints": [
      "Trọng tâm 1...",
      "Trọng tâm 2...",
      "Trọng tâm 3..."
    ]
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

    // Primary model: gemini-3.1-pro-preview as specified by user instructions
    // Fallback: gemini-3.8-flash for high resilience
    let responseText = '';
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      responseText = result.text || '';
    } catch (primaryError: any) {
      console.warn('Primary model gemini-3.1-pro-preview failed, using gemini-3.8-flash fallback:', primaryError?.message);
      const fallbackResult = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      responseText = fallbackResult.text || '';
    }

    if (!responseText) {
      throw new Error('Không nhận được dữ liệu phản hồi từ AI');
    }

    // Clean JSON response if necessary
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Lỗi phân tích sổ đầu bài:', error);
    return res.status(500).json({ error: error?.message || 'Có lỗi xảy ra khi phân tích dữ liệu sổ đầu bài' });
  }
});

// API endpoint to parse natural language barem rules
app.post('/api/parse-barem', async (req, res) => {
  try {
    const { nlpText } = req.body;
    if (!nlpText) {
      return res.status(400).json({ error: 'Nội dung quy tắc trống' });
    }

    const prompt = `
Bạn là chuyên gia quy chế thi đua Đội TNTP và Sổ Chủ Nhiệm THCS.
Hãy phân tích đoạn văn bản quy định điểm trừ/điểm cộng thi đua sau đây thành danh sách các quy tắc Barem điểm:
"${nlpText}"

Bắt buộc trả về JSON Array thuần túy:
[
  {
    "name": "Tên lỗi hoặc việc tốt",
    "category": "di_muon | mat_trat_tu | quen_bai | diem_duoi_5 | khong_dong_phuc | diem_tot | viec_tot | nghi_hoc | bo_tiet | thai_do_sai | khen_thuong | khac",
    "points": -2 (số âm nếu là điểm trừ, số dương nếu là điểm cộng),
    "description": "Mô tả ngắn gọn điều kiện áp dụng"
  }
]
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse((result.text || '[]').replace(/```json/gi, '').replace(/```/g, '').trim());
    return res.json({ success: true, rules: parsed });
  } catch (error: any) {
    console.error('Lỗi phân tích barem:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi phân tích barem' });
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
