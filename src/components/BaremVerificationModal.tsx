import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  Zap,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { BaremRule, ViolationCategory } from '../types';

export const CATEGORY_OPTIONS: { key: ViolationCategory; label: string }[] = [
  { key: 'mat_trat_tu', label: 'Mất trật tự' },
  { key: 'quen_bai', label: 'Quên bài / Chưa làm bài' },
  { key: 'di_muon', label: 'Đi muộn / Trễ giờ' },
  { key: 'khong_dong_phuc', label: 'Tác phong / Đồng phục' },
  { key: 'nghi_hoc', label: 'Nghỉ học không phép' },
  { key: 'bo_tiet', label: 'Bỏ tiết / Trốn học' },
  { key: 'diem_duoi_5', label: 'Điểm kiểm tra < 5.0' },
  { key: 'thai_do_sai', label: 'Thái độ sai / Vô lễ' },
  { key: 'vi_pham_nghiem_trong', label: 'Vi phạm nghiêm trọng' },
  { key: 'diem_tot', label: 'Điểm tốt (8, 9, 10)' },
  { key: 'viec_tot', label: 'Việc tốt' },
  { key: 'khen_thuong', label: 'Khen thưởng / Tuyên dương' },
  { key: 'phe_binh', label: 'Phê bình' },
  { key: 'khac', label: 'Quy định khác' },
];

export interface ExtractedRuleInput {
  name: string;
  category?: ViolationCategory | string;
  points?: number;
  description?: string;
}

export type DuplicateResolution = 'overwrite' | 'skip' | 'add_new';

export interface BaremReviewItem {
  id: string;
  name: string;
  category: ViolationCategory;
  points: number;
  description: string;
  matchedExistingRule: BaremRule | null;
  duplicateStatus: 'new' | 'duplicate';
  resolutionAction: DuplicateResolution;
}

interface BaremVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedRules: ExtractedRuleInput[];
  currentBaremRules: BaremRule[];
  className?: string;
  onConfirmMerge: (newRules: BaremRule[]) => void;
}

// Bảng từ đồng nghĩa phổ biến trong quy chế thi đua nhà trường
const SYNONYM_GROUPS: string[][] = [
  ['di tre', 'di muon', 'di hoc muon', 'tre gio', 'den muon'],
  ['quen vo', 'quen bai', 'chua lam bai', 'khong lam bai', 'khong chuan bi bai', 'quen sach'],
  ['mat trat tu', 'noi chuyen rieng', 'on ao', 'nghich'],
  ['khong dong phuc', 'sai dong phuc', 'quen phu hieu', 'khong doi mu bao hiem', 'sai giay', 'sai dep'],
  ['nghi hoc', 'vang', 'nghi khong phep', 'nghi hoc khong phep'],
  ['bo tiet', 'tron tiet', 'tron hoc', 'bo tiet hoc'],
  ['diem tot', 'diem 10', 'diem 9', 'diem 8', 'hoa diem 10', 'hoa diem tot'],
  ['viec tot', 'nhat duoc cua roi', 'giup ban', 'nhung viec tot'],
];

const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim();
};

const checkIsSimilar = (nameA: string, nameB: string): boolean => {
  const normA = removeAccents(nameA);
  const normB = removeAccents(nameB);

  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;

  // Kiểm tra qua nhóm từ đồng nghĩa
  for (const group of SYNONYM_GROUPS) {
    const aInGroup = group.some((term) => normA.includes(term));
    const bInGroup = group.some((term) => normB.includes(term));
    if (aInGroup && bInGroup) return true;
  }

  return false;
};

export const BaremVerificationModal: React.FC<BaremVerificationModalProps> = ({
  isOpen,
  onClose,
  extractedRules,
  currentBaremRules,
  className = '9.5',
  onConfirmMerge,
}) => {
  const [items, setItems] = useState<BaremReviewItem[]>([]);

  // Khi modal mở hoặc extractedRules thay đổi, phân tích đối soát với currentBaremRules
  useEffect(() => {
    if (!isOpen || extractedRules.length === 0) return;

    const analyzed: BaremReviewItem[] = extractedRules.map((ext, idx) => {
      const cleanName = (ext.name || 'Hành vi vi phạm').trim();
      // Tìm quy tắc tương đồng trong barem hiện tại
      const matched = currentBaremRules.find((curr) => checkIsSimilar(curr.name, cleanName)) || null;

      const isDup = !!matched;
      return {
        id: `rev_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        category: (ext.category as ViolationCategory) || matched?.category || 'mat_trat_tu',
        points: typeof ext.points === 'number' ? ext.points : -1,
        description: ext.description || '',
        matchedExistingRule: matched,
        duplicateStatus: isDup ? 'duplicate' : 'new',
        resolutionAction: isDup ? 'overwrite' : 'add_new',
      };
    });

    setItems(analyzed);
  }, [isOpen, extractedRules, currentBaremRules]);

  if (!isOpen) return null;

  const totalDetected = items.length;
  const duplicateCount = items.filter((i) => i.duplicateStatus === 'duplicate').length;
  const newCount = items.filter((i) => i.duplicateStatus === 'new').length;

  // Cập nhật từng trường inline
  const handleUpdateField = (id: string, field: keyof BaremReviewItem, value: any) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // Xóa 1 dòng khỏi danh sách đối soát
  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Thêm dòng thủ công mới
  const handleAddManualRow = () => {
    const newItem: BaremReviewItem = {
      id: `rev_manual_${Date.now()}`,
      name: 'Lỗi bổ sung thủ công',
      category: 'mat_trat_tu',
      points: -2,
      description: 'Quy định bổ sung từ văn bản trường',
      matchedExistingRule: null,
      duplicateStatus: 'new',
      resolutionAction: 'add_new',
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Nút 1: [✅ Xác Nhận Nạp Tất Cả Quy Tắc Vào Barem Lớp]
  const handleConfirmAll = () => {
    // Merge logic:
    const updated = [...currentBaremRules];

    items.forEach((item) => {
      if (item.resolutionAction === 'skip') {
        // Bỏ qua không nạp
        return;
      }

      if (item.resolutionAction === 'overwrite' && item.matchedExistingRule) {
        // Ghi đè lên quy tắc cũ đã tìm thấy
        const idx = updated.findIndex((r) => r.id === item.matchedExistingRule?.id);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            points: item.points,
            description: item.description || updated[idx].description,
            category: item.category,
          };
        } else {
          updated.push({
            id: `b_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            code: `CUSTOM_${updated.length + 1}`,
            name: item.name,
            category: item.category,
            points: item.points,
            description: item.description,
            isDefault: false,
          });
        }
      } else {
        // 'add_new': lưu thành quy tắc riêng biệt
        updated.push({
          id: `b_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          code: `CUSTOM_${updated.length + 1}`,
          name: item.name,
          category: item.category,
          points: item.points,
          description: item.description,
          isDefault: false,
        });
      }
    });

    onConfirmMerge(updated);
    onClose();
  };

  // Nút 2: [⚡ Chỉ Thêm Lỗi Mới (Tự Động Bỏ Qua Các Lỗi Trùng)]
  const handleOnlyAddNew = () => {
    const updated = [...currentBaremRules];
    const onlyNewItems = items.filter((i) => i.duplicateStatus === 'new');

    onlyNewItems.forEach((item) => {
      updated.push({
        id: `b_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        code: `CUSTOM_${updated.length + 1}`,
        name: item.name,
        category: item.category,
        points: item.points,
        description: item.description,
        isDefault: false,
      });
    });

    onConfirmMerge(updated);
    onClose();
  };

  const displayClassName = className.startsWith('Lớp') ? className : `Lớp ${className}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-t-2xl flex items-center justify-between border-b border-indigo-900/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-cyan-200 border border-indigo-400/30 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Gemini Vision • Đối Soát Barem Tự Động</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>📋 ĐỐI SOÁT BAREM THI ĐUA VỪA TRÍCH XUẤT</span>
              <span className="text-xs sm:text-sm font-semibold bg-blue-600/60 text-cyan-200 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                Phát hiện: {totalDetected} quy tắc
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Áp dụng cho <strong>{displayClassName}</strong> • Phát hiện{' '}
              <span className="text-amber-300 font-bold">{duplicateCount} quy tắc trùng lặp</span> và{' '}
              <span className="text-emerald-300 font-bold">{newCount} quy tắc mới hoàn toàn</span>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tóm tắt trạng thái */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Quy tắc mới: {newCount}
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Trùng với Barem cũ: {duplicateCount}
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            * Bạn có thể click trực tiếp vào từng ô để chỉnh sửa tên lỗi, phân loại hoặc điểm số trước khi nạp.
          </div>
        </div>

        {/* Thân bảng đối soát */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Không có quy tắc nào trong danh sách.</p>
              <button
                onClick={handleAddManualRow}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                + Bấm vào đây để thêm dòng thủ công
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const isDup = item.duplicateStatus === 'duplicate';
                const isBonus = item.points > 0;
                const matched = item.matchedExistingRule;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border-2 p-3.5 sm:p-4 transition space-y-3 ${
                      isDup
                        ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                        : 'border-emerald-300 bg-emerald-50/30 shadow-xs'
                    }`}
                  >
                    {/* Hàng 1: Huy hiệu nhận diện trùng / mới + Tùy chọn xử lý */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>

                        {isDup && matched ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              [⚠️ Trùng quy tắc cũ: Điểm cũ: <strong>{matched.points}đ</strong> ({matched.name}) | Điểm quét được: <strong>{item.points}đ</strong>]
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>[✨ Quy tắc mới]</span>
                          </div>
                        )}
                      </div>

                      {/* 3 Lựa chọn nhanh ngay tại dòng trùng lặp */}
                      {isDup ? (
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-amber-300 text-xs">
                          <span className="text-[11px] font-bold text-slate-500 px-1">Tùy chọn:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateField(item.id, 'resolutionAction', 'overwrite')}
                            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                              item.resolutionAction === 'overwrite'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title="Ghi đè số điểm mới vào quy tắc cũ"
                          >
                            (1) Ghi đè điểm mới
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateField(item.id, 'resolutionAction', 'skip')}
                            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                              item.resolutionAction === 'skip'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title="Bỏ qua không thay đổi quy tắc này"
                          >
                            (2) Giữ điểm cũ (Bỏ qua)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateField(item.id, 'resolutionAction', 'add_new')}
                            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                              item.resolutionAction === 'add_new'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title="Lưu thành một dòng quy tắc riêng biệt mới"
                          >
                            (3) Lưu riêng biệt
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Sẽ thêm mới vào Barem
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteRow(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hàng 2: Form chỉnh sửa trực tiếp trên dòng */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Tên hành vi / Lỗi vi phạm:</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateField(item.id, 'name', e.target.value)}
                          className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Phân loại danh mục:</label>
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateField(item.id, 'category', e.target.value)}
                          className="w-full font-medium bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 text-center">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Số điểm (+/-):</label>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateField(item.id, 'points', Number((item.points - 0.5).toFixed(1)))}
                            className="w-7 h-7 rounded bg-slate-200 hover:bg-slate-300 font-bold text-slate-800"
                            title="Giảm 0.5 điểm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step={0.5}
                            value={item.points}
                            onChange={(e) => handleUpdateField(item.id, 'points', Number(e.target.value))}
                            className={`w-16 text-center font-black text-xs p-1.5 border rounded-lg ${
                              isBonus
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateField(item.id, 'points', Number((item.points + 0.5).toFixed(1)))}
                            className="w-7 h-7 rounded bg-slate-200 hover:bg-slate-300 font-bold text-slate-800"
                            title="Tăng 0.5 điểm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Mô tả chi tiết áp dụng:</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateField(item.id, 'description', e.target.value)}
                          placeholder="Căn cứ điểm trừ..."
                          className="w-full text-slate-600 bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Nút Thêm dòng thủ công */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddManualRow}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>[➕ Thêm dòng thủ công]</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal: 3 nút điều hành */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-semibold">
            Tổng cộng: <strong>{items.filter((i) => i.resolutionAction !== 'skip').length}</strong> quy tắc sẽ được cập nhật vào Barem của lớp.
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút 3: Hủy bỏ */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer"
            >
              [❌ Hủy Bỏ]
            </button>

            {/* Nút 2: Chỉ thêm lỗi mới */}
            {duplicateCount > 0 && (
              <button
                type="button"
                onClick={handleOnlyAddNew}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                title="Tự động bỏ qua các lỗi bị trùng, chỉ nạp những quy tắc mới hoàn toàn"
              >
                <Zap className="w-4 h-4 text-yellow-200" />
                <span>[⚡ Chỉ Thêm Lỗi Mới ({newCount})]</span>
              </button>
            )}

            {/* Nút 1: Xác nhận nạp tất cả */}
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>
                [✅ Xác Nhận Nạp {items.filter((i) => i.resolutionAction !== 'skip').length} Quy Tắc Vào Barem Lớp]
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
