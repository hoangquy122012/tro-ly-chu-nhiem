import React, { useState, useEffect } from 'react';
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
  Users,
  UserCheck,
  ClipboardList,
  Info,
} from 'lucide-react';
import { SystemProfile, Student } from '../types';
import { DEFAULT_SYSTEM_PROFILE } from '../data/defaultData';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SystemProfile;
  onSaveProfile: (newProfile: SystemProfile) => void;
  students?: Student[];
  onUpdateStudents?: (newStudents: Student[]) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  students = [],
  onUpdateStudents,
}) => {
  const [formData, setFormData] = useState<SystemProfile>(profile);
  const [currentStudents, setCurrentStudents] = useState<Student[]>(students);
  const [activeTab, setActiveTab] = useState<'class' | 'profile' | 'templates' | 'command'>('class');
  const [commandInput, setCommandInput] = useState<string>('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Quick paste roster state
  const [pasteRosterInput, setPasteRosterInput] = useState<string>('');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  // Sync with prop changes if modal reopens
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    setCurrentStudents(students);
  }, [students]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile(formData);
    if (onUpdateStudents && currentStudents !== students) {
      onUpdateStudents(currentStudents);
    }
    onClose();
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_SYSTEM_PROFILE);
  };

  // Quick paste parser for student roster
  const handleParsePastedRoster = () => {
    if (!pasteRosterInput.trim()) return;

    const lines = pasteRosterInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Student[] = [];

    lines.forEach((line, index) => {
      // Formats:
      // "1. Nguyễn An Khang"
      // "1\tNguyễn An Khang"
      // "Nguyễn An Khang"
      // "1  Nguyễn An Khang  Nam"
      let stt = index + 1;
      let name = line;
      let gender: 'Nam' | 'Nữ' = 'Nam';
      let role: any = 'Học sinh';

      // Check tab or comma or dash separated
      if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const firstNum = parseInt(parts[0], 10);
          if (!isNaN(firstNum)) {
            stt = firstNum;
            name = parts[1];
          } else {
            name = parts[0];
          }
        }
      } else {
        // Regex: (optional stt like "1." or "1 -") then (name)
        const match = line.match(/^(?:(\d+)[\s.,\-_)]+)?(.*)$/i);
        if (match) {
          if (match[1]) stt = parseInt(match[1], 10);
          if (match[2]) name = match[2].trim();
        }
      }

      // Clean name
      name = name.replace(/^(?:STT|\d+)[\s.:\-_]+/i, '')
                 .replace(/[\s,\-_|]+(?:Tổ|to)\s*[1-4]$/i, '')
                 .replace(/[\s,\-_|]+(?:Nam|Nữ)$/i, '')
                 .trim();

      if (name.length > 1) {
        parsed.push({
          id: `hs_${Date.now()}_${index}`,
          stt,
          name,
          gender,
          role,
        });
      }
    });

    if (parsed.length > 0) {
      setCurrentStudents(parsed);
      if (onUpdateStudents) {
        onUpdateStudents(parsed);
      }
      setPasteFeedback(`✓ Đã nạp thành công ${parsed.length} học sinh! Sĩ số lớp tự động đếm: ${parsed.length} em.`);
      setPasteRosterInput('');
      setTimeout(() => setPasteFeedback(null), 5000);
    } else {
      setPasteFeedback('Không nhận diện được học sinh nào từ văn bản đã dán. Vui lòng kiểm tra lại định dạng.');
    }
  };

  const handleClearOfficers = () => {
    setFormData({
      ...formData,
      officers: {
        classLeader: '',
        viceLeader: '',
        studyLeader: '',
        disciplineLeader: '',
      },
    });
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
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              activeTab === 'class'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Phần 1: Cấu hình Lớp &amp; Ban Cán Sự</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span>Phần 2: Hồ Sơ GVCN &amp; Trường</span>
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
            <span>Phần 3: 3 Mẫu Tin Nhắn Phụ Huynh</span>
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
            <span>Phần 4: Lệnh Điều Chỉnh Nhanh</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CẤU HÌNH LỚP HỌC & BAN CÁN SỰ */}
          {activeTab === 'class' && (
            <div className="space-y-6 text-xs">
              {/* PHẦN 1.1: THÔNG TIN LỚP HỌC & SĨ SỐ */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-2.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wide">
                    1. Thông tin Lớp học &amp; Sĩ số
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Tên Lớp (&#123;lop&#125;):
                    </label>
                    <input
                      type="text"
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: 9.5 hoặc 8A2"
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: 2026 - 2027"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Sĩ số lớp (Tự động đếm):
                    </label>
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between text-blue-900 font-bold">
                      <span className="text-base text-blue-700">{currentStudents.length} học sinh</span>
                      <span className="text-[10px] bg-blue-200/70 text-blue-950 px-2 py-0.5 rounded-full font-medium">
                        Tự động đếm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 1.2: KHU VỰC DANH SÁCH HỌC SINH (DÁN NHANH) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 uppercase tracking-wide">
                      2. Khu vực Danh sách học sinh (Dán nhanh STT, Họ và tên)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Hiện có: <strong>{currentStudents.length} học sinh</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    GVCN có thể sao chép nhanh cột STT, Họ tên từ Excel hoặc dán danh sách theo định dạng:
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded ml-1 font-mono">1. Nguyễn An Khang</code>
                  </p>

                  <textarea
                    rows={4}
                    value={pasteRosterInput}
                    onChange={(e) => setPasteRosterInput(e.target.value)}
                    placeholder={`Dán danh sách học sinh tại đây (mỗi em một dòng):\n1. Nguyễn An Khang\n2. Trần Bảo Ngọc\n3. Lê Hoàng Long\n4. Vũ Minh Anh\n... hoặc paste trực tiếp các cột từ Excel`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleParsePastedRoster}
                      disabled={!pasteRosterInput.trim()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>⚡ Nạp &amp; Cập Nhật Danh Sách Học Sinh</span>
                    </button>

                    {pasteFeedback && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        {pasteFeedback}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PHẦN 1.3: KHU VỰC BAN CÁN SỰ (KHÔNG BẮT BUỘC) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 uppercase tracking-wide">
                      3. Khu vực Ban Cán Sự Lớp (Linh hoạt - Không bắt buộc)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearOfficers}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline transition"
                  >
                    Xóa trắng Ban cán sự
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lưu ý:</strong> Thông tin Ban cán sự <em>cho phép để trống</em>. Nếu GVCN không nhập thông tin, hệ thống vẫn vận hành bình thường, không báo lỗi và tự động ẩn hoặc để trống phần người điều hành khi sinh biên bản sinh hoạt lớp.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Lớp trưởng:
                    </label>
                    <input
                      type="text"
                      value={formData.officers?.classLeader || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officers: { ...formData.officers, classLeader: e.target.value },
                        })
                      }
                      placeholder="Để trống nếu chưa bầu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Lớp phó:
                    </label>
                    <input
                      type="text"
                      value={formData.officers?.viceLeader || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officers: { ...formData.officers, viceLeader: e.target.value },
                        })
                      }
                      placeholder="Để trống nếu chưa bầu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Lớp phó học tập:
                    </label>
                    <input
                      type="text"
                      value={formData.officers?.studyLeader || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officers: { ...formData.officers, studyLeader: e.target.value },
                        })
                      }
                      placeholder="Để trống nếu chưa bầu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Lớp phó kỷ luật:
                    </label>
                    <input
                      type="text"
                      value={formData.officers?.disciplineLeader || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officers: { ...formData.officers, disciplineLeader: e.target.value },
                        })
                      }
                      placeholder="Để trống nếu chưa bầu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE */}
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
