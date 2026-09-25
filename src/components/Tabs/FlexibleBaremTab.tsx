import React, { useState, useRef } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Save,
  Info,
  FolderUp,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Edit3,
} from 'lucide-react';
import { BaremRule, ViolationCategory } from '../../types';
import { DEFAULT_BAREM_RULES } from '../../data/defaultData';
import { BaremVerificationModal, ExtractedRuleInput } from '../BaremVerificationModal';
import { getStoredGeminiApiKey, hasGeminiApiKey } from '../../utils/geminiApiKey';
import { analyzeBaremWithGemini } from '../../services/geminiService';

export const CATEGORY_LABELS: Record<ViolationCategory, string> = {
  mat_trat_tu: 'Mất trật tự',
  quen_bai: 'Quên bài / Chưa làm bài',
  di_muon: 'Đi muộn / Trễ giờ',
  khong_dong_phuc: 'Tác phong / Đồng phục',
  nghi_hoc: 'Nghỉ học không phép',
  bo_tiet: 'Bỏ tiết / Trốn học',
  diem_duoi_5: 'Điểm kiểm tra < 5.0',
  thai_do_sai: 'Thái độ sai / Vô lễ',
  vi_pham_nghiem_trong: 'Vi phạm nghiêm trọng',
  diem_tot: 'Điểm tốt (8, 9, 10)',
  viec_tot: 'Việc tốt',
  khen_thuong: 'Khen thưởng / Tuyên dương',
  phe_binh: 'Phê bình',
  khac: 'Quy định khác',
};

interface SelectedFileInfo {
  file: File;
  name: string;
  size: number;
  mimeType: string;
  base64: string;
  previewUrl: string | null;
}

interface FlexibleBaremTabProps {
  baremRules: BaremRule[];
  onUpdateBarem: (newRules: BaremRule[]) => void;
  onResetToDefault: () => void;
  className?: string;
  onRequireApiKey?: () => void;
}

export const FlexibleBaremTab: React.FC<FlexibleBaremTabProps> = ({
  baremRules,
  onUpdateBarem,
  onResetToDefault,
  className = '9.5',
  onRequireApiKey,
}) => {
  const [nlpInput, setNlpInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 1. Quét Ảnh/File bản quy định của trường (Gemini Vision)
  const schoolFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSchoolFile, setSelectedSchoolFile] = useState<SelectedFileInfo | null>(null);
  const [isExtractingWithAI, setIsExtractingWithAI] = useState(false);

  // 2. Modal Đối Soát Barem (Chiếm 80% màn hình)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [scannedRulesForModal, setScannedRulesForModal] = useState<ExtractedRuleInput[]>([]);

  // New Rule Modal Form State
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<ViolationCategory>('mat_trat_tu');
  const [newRulePoints, setNewRulePoints] = useState<number>(-2);
  const [newRuleDesc, setNewRuleDesc] = useState('');

  const displayClassName = className ? (className.startsWith('Lớp') ? className : `Lớp ${className}`) : 'Lớp 9.5';

  const mergeRules = (newRules: any[]): number => {
    const parsedRules: BaremRule[] = newRules.map((r: any, idx: number) => ({
      id: `b_custom_${Date.now()}_${idx}`,
      code: `CUSTOM_${idx}`,
      name: r.name,
      category: (r.category || 'khac') as ViolationCategory,
      points: Number(r.points) || -1,
      description: r.description || '',
      isDefault: false,
    }));

    // Replace matching rules or append without losing old ones
    const updated = [...baremRules];
    parsedRules.forEach((pr) => {
      const existingIdx = updated.findIndex((u) => u.name.toLowerCase().trim() === pr.name.toLowerCase().trim());
      if (existingIdx >= 0) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          points: pr.points,
          description: pr.description || updated[existingIdx].description,
          category: pr.category,
        };
      } else {
        updated.push(pr);
      }
    });

    onUpdateBarem(updated);
    return parsedRules.length;
  };

  // Xử lý chọn tệp ảnh/quy định của trường
  const handleSchoolFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanErrorMsg(null);
    const isImage = file.type.startsWith('image/');
    let previewUrl: string | null = null;
    let base64 = '';

    if (isImage) {
      previewUrl = URL.createObjectURL(file);
    }

    try {
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setSelectedSchoolFile({
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        base64,
        previewUrl,
      });
    } catch (err) {
      setScanErrorMsg('Không thể đọc tệp đã chọn. Vui lòng thử lại!');
    }
  };

  // Thực thi AI quét & trích xuất bảng quy định thi đua của trường
  const handleExecuteAIScan = async () => {
    const apiKey = localStorage.getItem('edumaster_user_gemini_key') || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setScanErrorMsg('⚠️ Bạn chưa cài đặt Gemini API Key cá nhân. Vui lòng bấm vào nút [🔑 Nhập Gemini API Key] trên thanh tiêu đề để cài đặt.');
      if (onRequireApiKey) onRequireApiKey();
      return;
    }

    if (!selectedSchoolFile) {
      setScanErrorMsg('Vui lòng chọn tệp ảnh hoặc file quy định trước khi quét!');
      return;
    }

    setIsExtractingWithAI(true);
    setScanErrorMsg(null);

    try {
      const rules = await analyzeBaremWithGemini({
        fileBase64: selectedSchoolFile.base64,
        mimeType: selectedSchoolFile.mimeType,
        fileName: selectedSchoolFile.name,
      });

      if (Array.isArray(rules) && rules.length > 0) {
        // Mở Hộp thoại Đối soát Barem (80% màn hình) theo đúng yêu cầu!
        setScannedRulesForModal(rules);
        setIsVerificationModalOpen(true);
      } else {
        throw new Error('AI không nhận diện được quy tắc điểm nào trong tệp. Hãy kiểm tra ảnh có rõ nét không.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Kiểm tra lại kết nối mạng hoặc API Key';
      setScanErrorMsg('Lỗi phân tích: ' + msg);
      alert('Lỗi phân tích: ' + msg);
      if (err?.message?.includes('API Key') || err?.message?.includes('401')) {
        if (onRequireApiKey) onRequireApiKey();
      }
    } finally {
      setIsExtractingWithAI(false);
    }
  };

  // Nhận kết quả hợp nhất từ Modal Đối Soát
  const handleConfirmMergeFromModal = (mergedRules: BaremRule[]) => {
    onUpdateBarem(mergedRules);
    setSuccessMsg(`Đã cập nhật thành công ${mergedRules.length} quy tắc từ văn bản quy định của trường!`);
    setSelectedSchoolFile(null);
    if (schoolFileInputRef.current) schoolFileInputRef.current.value = '';
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    const apiKey = localStorage.getItem('edumaster_user_gemini_key') || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert('⚠️ Bạn chưa cài đặt Gemini API Key cá nhân. Vui lòng bấm vào nút [🔑 Nhập Gemini API Key] trên thanh tiêu đề.');
      if (onRequireApiKey) onRequireApiKey();
      return;
    }

    setIsParsing(true);
    setSuccessMsg(null);

    try {
      const rules = await analyzeBaremWithGemini({ nlpText: nlpInput });

      if (Array.isArray(rules) && rules.length > 0) {
        // Mở ngay Bảng Đối Soát Barem (Review Modal) để GVCN kiểm tra trước khi nạp vào lớp
        setScannedRulesForModal(rules);
        setIsVerificationModalOpen(true);
        setNlpInput('');
      } else {
        throw new Error('AI không nhận diện được quy tắc điểm trong câu lệnh');
      }
    } catch (err: any) {
      alert('Lỗi phân tích: ' + (err.message || 'Kiểm tra lại kết nối mạng hoặc API Key'));
      if (err?.message?.includes('API Key') || err?.message?.includes('401')) {
        if (onRequireApiKey) onRequireApiKey();
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteRule = (id: string) => {
    const updated = baremRules.filter((r) => r.id !== id);
    onUpdateBarem(updated);
    setSuccessMsg('Đã xóa quy tắc khỏi Barem!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePointChange = (id: string, newPoints: number) => {
    const updated = baremRules.map((r) => (r.id === id ? { ...r, points: newPoints } : r));
    onUpdateBarem(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: BaremRule = {
      id: `b_usr_${Date.now()}`,
      code: `USER_${Date.now()}`,
      name: newRuleName.trim(),
      category: newRuleCategory,
      points: Number(newRulePoints),
      description: newRuleDesc.trim(),
      isDefault: false,
    };

    onUpdateBarem([...baremRules, newRule]);
    setShowAddModal(false);
    setNewRuleName('');
    setNewRuleDesc('');
    setSuccessMsg(`Đã thêm quy tắc "${newRule.name}" vào Barem tính điểm!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-cyan-200 border border-blue-400/30 mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
              <span>Cơ chế Barem Điểm Thi Đua Linh Hoạt (Flexible Penalty System)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Barem Trừ Điểm &amp; Khen Thưởng Thi Đua Tuần
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              GVCN có thể quét ảnh chụp văn bản quy định của trường hoặc gõ bằng văn bản tự nhiên. Barem này sẽ được áp dụng làm chuẩn tính toán cho toàn bộ 13 chỉ số thi đua tuần mà không làm mất dữ liệu học sinh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn khôi phục lại Barem mặc định chuẩn Liên đội (Thang 100)?')) {
                  onResetToDefault();
                  setSuccessMsg('Đã khôi phục Barem chuẩn Liên đội thành công!');
                  setTimeout(() => setSuccessMsg(null), 3000);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Khôi phục Chuẩn Liên Đội</span>
            </button>
          </div>
        </div>
      </div>

      {/* TÍNH NĂNG: QUÉT ẢNH/FILE BẢN QUY ĐỊNH TRỪ ĐIỂM THI ĐUA CỦA TRƯỜNG */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 rounded-2xl border-2 border-indigo-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gemini Vision AI • Tự động bóc tách quy chế</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Quét Ảnh / File Bản Quy Định Trừ Điểm Thi Đua Của Trường
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Tải ảnh chụp bảng quy định chấm điểm của Liên đội, ảnh quy chế nhà trường hoặc file PDF/Word. Khi quét xong, hệ thống tự động mở <strong>Bảng Đối Soát Barem</strong> để phát hiện lỗi trùng lặp và xác nhận.
            </p>
          </div>
        </div>

        {/* Khung tải tệp & Nút bấm thực thi */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div
            onClick={() => schoolFileInputRef.current?.click()}
            className="flex-1 cursor-pointer border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white/90 hover:bg-indigo-50/40 rounded-xl p-4 transition text-center flex flex-col items-center justify-center gap-1.5 group min-h-[90px]"
          >
            <input
              type="file"
              ref={schoolFileInputRef}
              onChange={handleSchoolFileSelect}
              accept="image/*,application/pdf,.doc,.docx,.txt"
              className="hidden"
            />
            {selectedSchoolFile ? (
              <div className="flex items-center gap-3 w-full text-left p-1">
                {selectedSchoolFile.previewUrl ? (
                  <img
                    src={selectedSchoolFile.previewUrl}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{selectedSchoolFile.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(selectedSchoolFile.size / 1024).toFixed(1)} KB • Nhấn để chọn ảnh/tệp khác
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSchoolFile(null);
                    if (schoolFileInputRef.current) schoolFileInputRef.current.value = '';
                  }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Hủy tệp này"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
                  <FolderUp className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-indigo-950">
                  [📷/📄 Tải ảnh hoặc file Quy Định / Barem Thi Đua Của Trường (Ảnh/PDF/Word)]
                </p>
                <p className="text-[11px] text-slate-500">
                  Hỗ trợ ảnh chụp điện thoại (JPG, PNG), tài liệu PDF quy chế, hoặc tệp Word
                </p>
              </>
            )}
          </div>

          {/* Nút bấm thực thi AI */}
          <div className="sm:w-72 flex shrink-0">
            <button
              type="button"
              onClick={handleExecuteAIScan}
              disabled={isExtractingWithAI || !selectedSchoolFile}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isExtractingWithAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>AI Đang Quét &amp; Bóc Tách...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>[✨ AI Quét &amp; Tự Động Trích Xuất Barem]</span>
                </>
              )}
            </button>
          </div>
        </div>

        {scanErrorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{scanErrorMsg}</span>
          </div>
        )}

        {/* Form nhập văn bản tự nhiên nhanh */}
        <div className="pt-3 border-t border-indigo-100/60 space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Hoặc gõ nhanh quy tắc bằng Văn bản Tự nhiên:</span>
          </label>
          <form onSubmit={handleNlpSubmit} className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder="Gõ: Cập nhật barem: Đi trễ trừ 3đ, quên bài trừ 2.5đ, vỡ kính trừ 10đ..."
              className="flex-1 min-w-[200px] bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isParsing || !nlpInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition disabled:opacity-50 shrink-0"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <span>Cập nhật Barem</span>
              )}
            </button>
          </form>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
      </div>

      {/* Barem Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bảng Barem Hiện Hành Đang Áp Dụng Cho {displayClassName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thang điểm gốc tuần: <strong>100 điểm</strong> • Có {baremRules.length} quy tắc đang kích hoạt
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm quy tắc mới</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Tên quy định / Lỗi vi phạm / Việc tốt</th>
                <th className="py-2.5 px-3 w-40">Phân loại</th>
                <th className="py-2.5 px-4 w-44 text-center">Điểm cộng / trừ</th>
                <th className="py-2.5 px-4">Mô tả chi tiết áp dụng</th>
                <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baremRules.map((rule) => {
                const isBonus = rule.points > 0;
                return (
                  <tr key={rule.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {rule.name}
                      {rule.isDefault && (
                        <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          Chuẩn Đội
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs font-mono">
                      {CATEGORY_LABELS[rule.category] || rule.category}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step={0.5}
                          value={rule.points}
                          onChange={(e) => handlePointChange(rule.id, Number(e.target.value))}
                          className={`w-20 text-center font-bold text-xs p-1 border rounded ${
                            isBonus
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        />
                        <span className="text-xs text-slate-500">điểm</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-xs">{rule.description || 'Chưa có mô tả'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                        title="Xóa quy tắc này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddRule}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Thêm Quy Tắc Barem Thi Đua Mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên hành vi / Quy định:</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="VD: Không đội mũ bảo hiểm, Quên phù hiệu..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân loại:</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as ViolationCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                      <option key={catKey} value={catKey}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điểm (+/-):</label>
                  <input
                    type="number"
                    step={0.5}
                    required
                    value={newRulePoints}
                    onChange={(e) => setNewRulePoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả chi tiết áp dụng:</label>
                <textarea
                  rows={2}
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Ghi rõ điều kiện trừ điểm hoặc quy chế áp dụng..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs"
              >
                Thêm Quy Tắc
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HỘP THOẠI ĐỐI SOÁT & XÁC NHẬN BAREM (80% MÀN HÌNH) */}
      <BaremVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        extractedRules={scannedRulesForModal}
        currentBaremRules={baremRules}
        className={className}
        onConfirmMerge={handleConfirmMergeFromModal}
      />
    </div>
  );
};

