import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ChevronRight,
  ShieldAlert,
  Award,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  Phone,
  UserCheck,
  Edit2,
  Clock,
} from 'lucide-react';
import { Student, BehaviorRecord, TT22Rank, StudentRole } from '../../types';

interface StudentRosterTabProps {
  students: Student[];
  records: BehaviorRecord[];
  onAddRecord: (newRec: BehaviorRecord) => void;
  onAddStudent: (newStudent: Student) => void;
  onUpdateStudent: (student: Student) => void;
}

export const StudentRosterTab: React.FC<StudentRosterTabProps> = ({
  students,
  records,
  onAddRecord,
  onAddStudent,
  onUpdateStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);

  // New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newStudentGroup, setNewStudentGroup] = useState<number>(1);
  const [newStudentRole, setNewStudentRole] = useState<StudentRole>('Học sinh');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');

  // New Record Form State (strictly enforces the 4 fields!)
  const [recDayOfWeek, setRecDayOfWeek] = useState('Thứ Ba');
  const [recDate, setRecDate] = useState('22/09/2026');
  const [recPeriod, setRecPeriod] = useState<number>(2);
  const [recSubject, setRecSubject] = useState('Toán');
  const [recBehavior, setRecBehavior] = useState('');
  const [recPoints, setRecPoints] = useState<number>(-2);
  const [recMeasure, setRecMeasure] = useState('Nhắc nhở, rút kinh nghiệm');

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || s.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const getStudentStats = (studentId: string) => {
    const studentRecords = records.filter((r) => r.studentId === studentId);
    const violations = studentRecords.filter((r) => r.pointsImpact < 0);
    const bonuses = studentRecords.filter((r) => r.pointsImpact > 0);

    // TT22 Monthly Projection Logic
    let rank: TT22Rank = 'Tốt';
    if (violations.length >= 7) rank = 'Chưa đạt';
    else if (violations.length >= 5) rank = 'Đạt';
    else if (violations.length >= 3) rank = 'Khá';
    else rank = 'Tốt';

    return {
      totalViolations: violations.length,
      totalBonuses: bonuses.length,
      rank,
      records: studentRecords,
    };
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const nextStt = students.length > 0 ? Math.max(...students.map((s) => s.stt)) + 1 : 1;
    const newStudent: Student = {
      id: `hs_${Date.now()}`,
      stt: nextStt,
      name: newStudentName.trim(),
      gender: newStudentGender,
      group: newStudentGroup,
      role: newStudentRole,
      parentName: newParentName.trim() || undefined,
      parentPhone: newParentPhone.trim() || undefined,
    };

    onAddStudent(newStudent);
    setShowAddModal(false);
    setNewStudentName('');
    setNewParentName('');
    setNewParentPhone('');
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !recBehavior.trim()) return;

    const newRec: BehaviorRecord = {
      id: `rec_${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      dayOfWeek: recDayOfWeek,
      date: recDate,
      period: Number(recPeriod),
      subject: recSubject,
      behavior: recBehavior.trim(),
      category: recPoints < 0 ? 'mat_trat_tu' : 'diem_tot',
      pointsImpact: Number(recPoints),
      educationalMeasure: recMeasure.trim(),
      severity: recPoints < 0 ? 'nhe' : 'khen_thuong',
      weekNumber: 4,
      semester: 1,
      month: 9,
      timestamp: new Date().toISOString(),
    };

    onAddRecord(newRec);
    setShowAddRecordModal(false);
    setRecBehavior('');
  };

  const generateSingleZaloMessage = (student: Student, stats: any) => {
    const studentViolations = stats.records.filter((r: any) => r.pointsImpact < 0);
    const count = studentViolations.length;

    let msg = `Dạ kính gửi phụ huynh em ${student.name}. Thầy/Cô chủ nhiệm lớp xin gửi lời chào gia đình ạ.\n`;
    msg += `Trong tháng vừa qua, nhìn chung em có cố gắng trong sinh hoạt tập thể. Tuy nhiên, về mặt nề nếp và học tập, em có tích lũy ${count} lần nhắc nhở:\n`;

    studentViolations.forEach((v: any) => {
      msg += `- Ngày ${v.date}, Tiết ${v.period} môn ${v.subject}: ${v.behavior}\n`;
    });

    msg += `Do số lần vi phạm đã vượt mức quy định của lớp, Thầy/Cô rất mong gia đình dành thời gian trò chuyện, nhắc nhở thêm tại nhà để tháng tới em chấn chỉnh nề nếp, tránh làm ảnh hưởng đến kết quả rèn luyện định kỳ của em. Thầy/Cô cảm ơn sự phối hợp của gia đình ạ!`;

    return msg;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm học sinh theo tên..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedGroup === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tất cả ({students.length})
            </button>
            {[1, 2, 3, 4].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  selectedGroup === g ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tổ {g}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm học sinh</span>
        </button>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const stats = getStudentStats(student.id);
          const isAtRisk = stats.rank === 'Khá' || stats.rank === 'Đạt' || stats.rank === 'Chưa đạt';

          return (
            <div
              key={student.id}
              onClick={() => setActiveStudent(student)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                      {student.stt}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {student.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {student.gender} • Tổ {student.group} {student.role !== 'Học sinh' ? `• ${student.role}` : ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stats.rank === 'Tốt'
                        ? 'bg-emerald-100 text-emerald-800'
                        : stats.rank === 'Khá'
                        ? 'bg-blue-100 text-blue-800'
                        : stats.rank === 'Đạt'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {stats.rank}
                  </span>
                </div>

                {/* Mini Stats Bar */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Số lần ghi nhận lỗi</span>
                    <span className={`font-bold ${stats.totalViolations > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {stats.totalViolations} lần
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Điểm / Việc tốt</span>
                    <span className={`font-bold ${stats.totalBonuses > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      +{stats.totalBonuses} lần
                    </span>
                  </div>
                </div>

                {student.parentPhone && (
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>SĐT PH: {student.parentPhone}</span>
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium group-hover:translate-x-0.5 transition">
                <span>Xem nhật ký SCN</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Student Profile Modal */}
      {activeStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-bold text-lg flex items-center justify-center">
                  {activeStudent.stt}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{activeStudent.name}</h3>
                  <p className="text-xs text-slate-500">
                    {activeStudent.gender} • Tổ {activeStudent.group} • {activeStudent.role}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Phụ huynh: {activeStudent.parentName || 'Chưa cập nhật'} • SĐT: {activeStudent.parentPhone || 'Chưa có'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Monthly Alert Policy Status */}
            {(() => {
              const stats = getStudentStats(activeStudent.id);
              const isAlert = stats.totalViolations >= 3;
              return (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                    isAlert ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${isAlert ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span>
                      {isAlert ? (
                        <>
                          <strong>Đạt ngưỡng cảnh báo tháng ({stats.totalViolations} lỗi):</strong> Cần gửi tin nhắn Zalo phối hợp cùng gia đình.
                        </>
                      ) : (
                        <>
                          <strong>Mức an toàn ({stats.totalViolations} lỗi trong tháng):</strong> Dưới 3 lỗi, chỉ ghi sổ SCN và nhắc nhở trên lớp, không gửi tin nhắn làm phiền phụ huynh.
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddRecordModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm biểu hiện mới (4 trường)</span>
              </button>

              {(() => {
                const stats = getStudentStats(activeStudent.id);
                const isAlert = stats.totalViolations >= 3;

                return (
                  <button
                    onClick={() => {
                      const msg = generateSingleZaloMessage(activeStudent, stats);
                      navigator.clipboard.writeText(msg);
                      setCopiedZalo(true);
                      setTimeout(() => setCopiedZalo(false), 2500);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isAlert
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {copiedZalo ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã sao chép tin Zalo PH!</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {isAlert
                            ? 'Sao chép tin Zalo PH (Kỹ thuật bánh kẹp)'
                            : 'Xem mẫu tin Zalo PH (Dự phòng)'}
                        </span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>

            {/* Timeline of Student Records */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Nhật Ký Biểu Hiện Chi Tiết (Chuẩn Mẫu Sổ Chủ Nhiệm)
              </h4>

              {getStudentStats(activeStudent.id).records.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 italic">
                  Chưa có sự kiện nào được ghi nhận cho học sinh này.
                </div>
              ) : (
                <div className="space-y-3">
                  {getStudentStats(activeStudent.id).records.map((rec) => {
                    const isReward = rec.pointsImpact > 0;
                    return (
                      <div
                        key={rec.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          isReward ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {rec.dayOfWeek} ({rec.date}) • Tiết {rec.period} - Môn {rec.subject}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              isReward ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.pointsImpact > 0 ? `+${rec.pointsImpact}đ` : `${rec.pointsImpact}đ`}
                          </span>
                        </div>

                        <p className="text-slate-800 font-medium">
                          <strong>Hành vi cụ thể:</strong> {rec.behavior}
                        </p>

                        <p className="text-slate-500 italic">
                          <strong>Biện pháp giáo dục:</strong> {rec.educationalMeasure}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Record Modal (4 Fields Enforced) */}
      {showAddRecordModal && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRecord}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Thêm Biểu Hiện Cho: {activeStudent.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRecordModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              Quy tắc bắt buộc: Bóc tách đủ 4 trường <strong>[Ngày/Thứ] - [Tiết] - [Môn] - [Hành vi cụ thể]</strong>.
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Thứ trong tuần:</label>
                <select
                  value={recDayOfWeek}
                  onChange={(e) => setRecDayOfWeek(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Thứ Hai">Thứ Hai</option>
                  <option value="Thứ Ba">Thứ Ba</option>
                  <option value="Thứ Tư">Thứ Tư</option>
                  <option value="Thứ Năm">Thứ Năm</option>
                  <option value="Thứ Sáu">Thứ Sáu</option>
                  <option value="Thứ Bảy">Thứ Bảy</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ngày (DD/MM/YYYY):</label>
                <input
                  type="text"
                  value={recDate}
                  onChange={(e) => setRecDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tiết học:</label>
                <select
                  value={recPeriod}
                  onChange={(e) => setRecPeriod(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      Tiết {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Môn học:</label>
                <input
                  type="text"
                  value={recSubject}
                  onChange={(e) => setRecSubject(e.target.value)}
                  placeholder="Toán, KHTN, Tiếng Anh..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">
                Hành vi cụ thể (Tuyệt đối không ghi chung chung):
              </label>
              <textarea
                rows={2}
                value={recBehavior}
                onChange={(e) => setRecBehavior(e.target.value)}
                placeholder="Ví dụ: Nói chuyện riêng bị GVBM nhắc nhở, quên vở bài tập..."
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Điểm cộng / trừ:</label>
                <select
                  value={recPoints}
                  onChange={(e) => setRecPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value={-1}>-1đ (Mất trật tự nhẹ)</option>
                  <option value={-2}>-2đ (Đi muộn / Quên bài / Điểm &lt; 5)</option>
                  <option value={-5}>-5đ (Nghỉ không phép / Thái độ sai)</option>
                  <option value={1}>+1đ (Điểm tốt 8, 9, 10)</option>
                  <option value={2}>+2đ (Việc tốt / Nhặt của rơi)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Biện pháp giáo dục:</label>
                <input
                  type="text"
                  value={recMeasure}
                  onChange={(e) => setRecMeasure(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddRecordModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
              >
                Lưu vào Nhật ký SCN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateStudent}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Thêm Học Sinh Mới Vào Danh Sách Lớp</h3>
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
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giới tính:</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tổ:</label>
                  <select
                    value={newStudentGroup}
                    onChange={(e) => setNewStudentGroup(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chức vụ cán bộ lớp:</label>
                <select
                  value={newStudentRole}
                  onChange={(e) => setNewStudentRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Học sinh">Học sinh (Thành viên)</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó kỷ luật">Lớp phó kỷ luật</option>
                  <option value="Lớp phó lao động">Lớp phó lao động</option>
                  <option value="Tổ trưởng Tổ 1">Tổ trưởng Tổ 1</option>
                  <option value="Tổ trưởng Tổ 2">Tổ trưởng Tổ 2</option>
                  <option value="Tổ trưởng Tổ 3">Tổ trưởng Tổ 3</option>
                  <option value="Tổ trưởng Tổ 4">Tổ trưởng Tổ 4</option>
                  <option value="Cán sự bộ môn">Cán sự bộ môn</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Họ tên Phụ huynh:</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    placeholder="Nguyễn Văn Minh"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SĐT Phụ huynh (Zalo):</label>
                  <input
                    type="text"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    placeholder="0912xxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
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
                Lưu học sinh
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
