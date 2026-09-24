import React, { useState } from 'react';
import {
  Settings,
  User,
  School,
  Phone,
  MessageSquare,
  Sparkles,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Send,
} from 'lucide-react';
import { SystemProfile } from '../types';
import { DEFAULT_SYSTEM_PROFILE } from '../data/defaultData';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SystemProfile;
  onSaveProfile: (newProfile: SystemProfile) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<SystemProfile>(profile);
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'command'>('profile');
  const [commandInput, setCommandInput] = useState<string>('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile(formData);
    onClose();
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_SYSTEM_PROFILE);
  };

  // Natural language command parser for quick profile & template adjustments
  const handleApplyCommand = () => {
    if (!commandInput.trim()) return;
    const lower = commandInput.toLowerCase();
    const updated = { ...formData };
    const notes: string[] = [];

    // Parse GVCN name
    const gvMatch = commandInput.match(/(?:đổi\s*tên\s*gvcn\s*(?:thành)?|tên\s*gvcn\s*:?)\s*([^,;.\n]+)/i);
    if (gvMatch && gvMatch[1]) {
      const newName = gvMatch[1].trim();
      updated.teacherName = newName;
      if (newName.toLowerCase().startsWith('thầy')) {
        updated.teacherTitle = 'Thầy';
      } else if (newName.toLowerCase().startsWith('cô')) {
        updated.teacherTitle = 'Cô';
      }
      notes.push(`Tên GVCN: ${newName}`);
    }

    // Parse Phone
    const phoneMatch = commandInput.match(/(?:số\s*điện\s*thoại|sđt|sdt)\s*(?:thành|là)?\s*([0-9xX]+)/i);
    if (phoneMatch && phoneMatch[1]) {
      updated.teacherPhone = phoneMatch[1].trim();
      notes.push(`SĐT: ${phoneMatch[1].trim()}`);
    }

    // Parse Class
    const classMatch = commandInput.match(/(?:đổi\s*lớp\s*(?:thành)?|lớp\s*:?)\s*([0-9A-Za-z.]+)/i);
    if (classMatch && classMatch[1]) {
      updated.className = classMatch[1].trim();
      notes.push(`Lớp: ${classMatch[1].trim()}`);
    }

    // Parse School
    const schoolMatch = commandInput.match(/(?:đổi\s*trường\s*(?:thành)?|trường\s*:?)\s*([^,;.\n]+)/i);
    if (schoolMatch && schoolMatch[1]) {
      updated.schoolName = schoolMatch[1].trim();
      notes.push(`Trường: ${schoolMatch[1].trim()}`);
    }

    // Parse threshold
    const thresholdMatch = commandInput.match(/(?:ngưỡng\s*cảnh\s*báo|hạ\s*ngưỡng|tăng\s*ngưỡng)[^\d]*(\d+)\s*lỗi/i);
    if (thresholdMatch && thresholdMatch[1]) {
      const th = parseInt(thresholdMatch[1], 10);
      if (!isNaN(th) && th > 0) {
        updated.alertThreshold = th;
        notes.push(`Ngưỡng cảnh báo: ${th} lỗi/tháng`);
      }
    }

    // Parse template additions
    if (lower.includes('mẫu') && (lower.includes('thêm') || lower.includes('chỉnh'))) {
      const extraText = commandInput.replace(/.*(?:thêm\s*câu|thêm\s*nội\s*dung)?\s*['"]([^'"]+)['"].*/i, '$1');
      if (extraText && extraText !== commandInput) {
        if (lower.includes('mẫu 1') || lower.includes('mẫu số 1')) {
          updated.template1Monthly += `\nLưu ý thêm từ GVCN: ${extraText}`;
          notes.push(`Đã bổ sung ghi chú vào Mẫu 1`);
        } else if (lower.includes('mẫu 2') || lower.includes('mẫu số 2')) {
          updated.template2Urgent += `\nLưu ý thêm từ GVCN: ${extraText}`;
          notes.push(`Đã bổ sung ghi chú vào Mẫu 2`);
        } else if (lower.includes('mẫu 3') || lower.includes('mẫu số 3')) {
          updated.template3Praise += `\nLưu ý thêm từ GVCN: ${extraText}`;
          notes.push(`Đã bổ sung ghi chú vào Mẫu 3`);
        }
      }
    }

    setFormData(updated);
    if (notes.length > 0) {
      setCommandFeedback(`Đã nhận diện và cập nhật: ${notes.join(' • ')}`);
    } else {
      setCommandFeedback('Đã tiếp nhận yêu cầu điều chỉnh. Hãy kiểm tra các ô thông tin bên dưới và bấm Lưu!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>[CẤU HÌNH HỆ THỐNG] HỒ SƠ &amp; MẪU TIN NHẮN</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  EduMaster Profile
                </span>
              </h2>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Thiết lập biến động &#123;truong&#125;, &#123;lop&#125;, &#123;ten_gvcn&#125; và 3 mẫu tin Zalo chuẩn mực
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Phần 1: Hồ Sơ Giáo Viên &amp; Lớp Học</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              activeTab === 'templates'
                ? 'bg-white text-indigo-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Phần 2: 3 Mẫu Tin Nhắn Phụ Huynh</span>
          </button>

          <button
            onClick={() => setActiveTab('command')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              activeTab === 'command'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phần 3: Lệnh Điều Chỉnh Nhanh</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Trường THCS (&#123;truong&#125;):
                  </label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                    placeholder="VD: Trường THCS Nguyễn Công Trứ"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Lớp chủ nhiệm (&#123;lop&#125;):
                  </label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                    placeholder="VD: 9.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Năm học (&#123;nam_hoc&#125;):
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                    placeholder="VD: 2026 - 2027"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Họ và tên GVCN (&#123;ten_gvcn&#125;):
                  </label>
                  <input
                    type="text"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                    placeholder="VD: Cô Vũ Thị Anh Phụng"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Xưng hô giáo viên (&#123;xung_ho_gv&#125;):
                  </label>
                  <select
                    value={formData.teacherTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, teacherTitle: e.target.value as 'Cô' | 'Thầy' })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                  >
                    <option value="Cô">Cô</option>
                    <option value="Thầy">Thầy</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số điện thoại GVCN (&#123;sdt_gvcn&#125;):
                  </label>
                  <input
                    type="text"
                    value={formData.teacherPhone}
                    onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 font-mono"
                    placeholder="VD: 0978057875"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Ngưỡng số lỗi trong tháng để kích hoạt gửi tin Zalo phụ huynh:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.alertThreshold}
                      onChange={(e) =>
                        setFormData({ ...formData, alertThreshold: Number(e.target.value) || 3 })
                      }
                      className="w-24 bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 text-center"
                    />
                    <span className="text-xs text-slate-500">
                      (Mặc định: <strong>3 lỗi/tháng</strong>. Dưới ngưỡng này hệ thống chỉ ghi sổ SCN và nhắc nhở trên lớp, bảo vệ phụ huynh khỏi tin nhắn rác.)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6 text-xs">
              {/* MẪU 1 */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>MẪU 1: NHẮC NHỞ ĐỊNH KỲ CUỐI THÁNG (Học sinh tích lũy &ge; 3 lỗi/tháng)</span>
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={formData.template1Monthly}
                  onChange={(e) => setFormData({ ...formData, template1Monthly: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 font-sans leading-relaxed text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* MẪU 2 */}
              <div className="space-y-2 border border-rose-200 rounded-xl p-4 bg-rose-50/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>MẪU 2: CẢNH BÁO KHẨN CẤP TRONG TUẦN (Vi phạm nghiêm trọng: cúp tiết, vô lễ, đánh nhau)</span>
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={formData.template2Urgent}
                  onChange={(e) => setFormData({ ...formData, template2Urgent: e.target.value })}
                  className="w-full bg-white border border-rose-300 rounded-lg p-3 font-sans leading-relaxed text-slate-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* MẪU 3 */}
              <div className="space-y-2 border border-emerald-200 rounded-xl p-4 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>MẪU 3: TUYÊN DƯƠNG TIẾN BỘ / ĐẠT THÀNH TÍCH (Điểm 10, việc tốt, tiến bộ vượt bậc)</span>
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={formData.template3Praise}
                  onChange={(e) => setFormData({ ...formData, template3Praise: e.target.value })}
                  className="w-full bg-white border border-emerald-300 rounded-lg p-3 font-sans leading-relaxed text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: COMMAND */}
          {activeTab === 'command' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                <p className="font-bold">
                  Phần 3: Cơ chế chỉnh sửa linh hoạt bằng câu lệnh tự nhiên từ GVCN
                </p>
                <p className="text-emerald-700 leading-relaxed">
                  Thầy/Cô có thể nhập bất kỳ câu lệnh điều chỉnh nào, hệ thống sẽ tự động bóc tách và cập nhật ngay lập tức:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-emerald-800 font-mono">
                  <li>"Đổi tên GVCN thành Cô Nguyễn Thị Thu Quỳnh, số điện thoại 0912345678"</li>
                  <li>"Đổi lớp thành 9A2, Trường THCS Chu Văn An"</li>
                  <li>"Hạ ngưỡng cảnh báo tháng xuống còn 2 lỗi là gửi tin nhắn"</li>
                  <li>"Đổi mẫu tin nhắn số 1: thêm câu 'nhắc em mang đủ máy tính bỏ túi'"</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Nhập câu lệnh điều chỉnh của Thầy/Cô:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCommand()}
                    placeholder="VD: Đổi tên GVCN thành Cô Vũ Thị Anh Phụng, SĐT 0978057875, Lớp 9.5..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                  />
                  <button
                    onClick={handleApplyCommand}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Áp dụng</span>
                  </button>
                </div>
              </div>

              {commandFeedback && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{commandFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định ban đầu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thiết Lập &amp; Áp Dụng Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
