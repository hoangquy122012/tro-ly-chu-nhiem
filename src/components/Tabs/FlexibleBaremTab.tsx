import React, { useState } from 'react';
import { SlidersHorizontal, Plus, Trash2, RotateCcw, Sparkles, Check, AlertCircle, Save, Info } from 'lucide-react';
import { BaremRule, ViolationCategory } from '../../types';
import { DEFAULT_BAREM_RULES } from '../../data/defaultData';

interface FlexibleBaremTabProps {
  baremRules: BaremRule[];
  onUpdateBarem: (newRules: BaremRule[]) => void;
  onResetToDefault: () => void;
}

export const FlexibleBaremTab: React.FC<FlexibleBaremTabProps> = ({
  baremRules,
  onUpdateBarem,
  onResetToDefault,
}) => {
  const [nlpInput, setNlpInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Rule Modal Form State
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<ViolationCategory>('mat_trat_tu');
  const [newRulePoints, setNewRulePoints] = useState<number>(-2);
  const [newRuleDesc, setNewRuleDesc] = useState('');

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    setIsParsing(true);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/parse-barem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nlpText: nlpInput }),
      });

      if (!response.ok) throw new Error('Không thể phân tích barem bằng AI');

      const data = await response.json();
      if (data.success && Array.isArray(data.rules) && data.rules.length > 0) {
        // Merge with existing or replace
        const parsedRules: BaremRule[] = data.rules.map((r: any, idx: number) => ({
          id: `b_custom_${Date.now()}_${idx}`,
          code: `CUSTOM_${idx}`,
          name: r.name,
          category: r.category || 'khac',
          points: Number(r.points) || -1,
          description: r.description || '',
          isDefault: false,
        }));

        // Replace matching categories or append
        const updated = [...baremRules];
        parsedRules.forEach((pr) => {
          const existingIdx = updated.findIndex((u) => u.name.toLowerCase() === pr.name.toLowerCase());
          if (existingIdx >= 0) {
            updated[existingIdx] = pr;
          } else {
            updated.push(pr);
          }
        });

        onUpdateBarem(updated);
        setSuccessMsg(`Đã cập nhật thành công ${parsedRules.length} quy tắc điểm theo yêu cầu!`);
        setNlpInput('');
      } else {
        throw new Error('AI không nhận diện được quy tắc điểm trong câu lệnh');
      }
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi nạp barem');
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
              GVCN có thể gõ quy tắc bằng văn bản tự nhiên, chỉnh sửa điểm số bất kỳ lúc nào. Barem này sẽ được áp dụng làm chuẩn tính toán cho toàn bộ 13 chỉ số thi đua tuần mà không làm mất dữ liệu học sinh.
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

      {/* NLP Quick Rule Intake Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Cập nhật nhanh Barem bằng Văn bản Tự nhiên (Gemini AI):</span>
          </label>
          <span className="text-[11px] text-slate-400">Ví dụ: "Đi trễ trừ 3đ, Không đội nón BH trừ 5đ, Điểm 10 cộng 2đ"</span>
        </div>

        <form onSubmit={handleNlpSubmit} className="flex gap-2">
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            placeholder="Gõ quy tắc: Cập nhật lại barem: Đi trễ trừ 3đ, quên bài trừ 2.5đ, làm vỡ kính trừ 10đ..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isParsing || !nlpInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition disabled:opacity-50 shrink-0"
          >
            {isParsing ? 'Đang phân tích...' : 'Cập nhật Barem'}
          </button>
        </form>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Barem Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bảng Barem Hiện Hành Đang Áp Dụng Cho Lớp 7A1
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
                        <span className="ml-2 text-[10px] font-normal px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          Chuẩn Đội
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs font-mono">{rule.category}</td>
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
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên lỗi hoặc việc tốt:</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ví dụ: Không đeo thẻ học sinh, Giúp đỡ bạn khuyết tật..."
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phân loại:</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="di_muon">Đi muộn</option>
                    <option value="mat_trat_tu">Mất trật tự</option>
                    <option value="quen_bai">Quên bài / sách vở</option>
                    <option value="diem_duoi_5">Điểm dưới 5</option>
                    <option value="khong_dong_phuc">Sai trang phục / nón BH</option>
                    <option value="thai_do_sai">Thái độ sai / Vô lễ</option>
                    <option value="nghi_hoc">Nghỉ học</option>
                    <option value="bo_tiet">Bỏ tiết</option>
                    <option value="diem_tot">Điểm tốt</option>
                    <option value="viec_tot">Việc tốt</option>
                    <option value="khen_thuong">Khen thưởng khác</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điểm (âm/dương):</label>
                  <input
                    type="number"
                    step={0.5}
                    value={newRulePoints}
                    onChange={(e) => setNewRulePoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả điều kiện áp dụng:</label>
                <textarea
                  rows={2}
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Mô tả cụ thể khi nào bị trừ hoặc được cộng điểm..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
              >
                Lưu vào Barem
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
