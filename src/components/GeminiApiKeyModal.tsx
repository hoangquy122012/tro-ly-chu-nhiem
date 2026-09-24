import React, { useState, useEffect } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getStoredGeminiApiKey,
  saveStoredGeminiApiKey,
  removeStoredGeminiApiKey,
} from '../utils/geminiApiKey';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (key: string) => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGeminiApiKey();
      setApiKeyInput(stored);
      setErrorMsg(null);
      setSuccessNotice(null);
      setShowKey(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = apiKeyInput.trim();

    if (!cleanKey) {
      setErrorMsg('Vui lòng nhập Gemini API Key của bạn trước khi lưu.');
      return;
    }

    if (!cleanKey.startsWith('AIza') && cleanKey.length < 20) {
      setErrorMsg('API Key dường như không đúng định dạng của Google (thường bắt đầu bằng "AIza..."). Vui lòng kiểm tra lại!');
      return;
    }

    saveStoredGeminiApiKey(cleanKey);
    setSuccessNotice('Đã lưu & kích hoạt thành công Gemini API Key cá nhân!');
    if (onSaveSuccess) onSaveSuccess(cleanKey);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Gemini API Key khỏi trình duyệt này?')) {
      removeStoredGeminiApiKey();
      setApiKeyInput('');
      setSuccessNotice('Đã xóa API Key thành công.');
      setTimeout(() => {
        setSuccessNotice(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-start justify-between border-b border-indigo-900/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-2">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>BYOK • Bring Your Own Key</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>🔑 CẤU HÌNH GEMINI API KEY ĐỂ SỬ DỤNG AI</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Để sử dụng tính năng AI bóc tách sổ sách và nhận diện nề nếp, vui lòng nhập API Key miễn phí từ tài khoản Google của bạn.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-2"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          {/* Thông báo cam kết bảo mật */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Bảo mật tuyệt đối:</strong> Khóa API chỉ lưu duy nhất trong trình duyệt của bạn (LocalStorage) và gửi trực tiếp đến Google AI. Hệ thống <strong>tuyệt đối không lưu</strong> khóa lên Supabase hay máy chủ chung.
            </div>
          </div>

          {/* Ô nhập API Key với toggle hiện/ẩn */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Nhập Gemini API Key cá nhân của bạn:
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Dán mã API Key dạng: AIzaSy..."
                className="w-full text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-20 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden transition"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                title={showKey ? 'Ẩn ký tự' : 'Hiện ký tự'}
              >
                {showKey ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ẩn</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Hiện</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              * Khóa cá nhân miễn phí từ Google, không tốn phí, hạn mức cao dành riêng cho giáo viên.
            </p>
          </div>

          {/* Nút bấm nhanh mở Google AI Studio lấy Key */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-indigo-950 font-medium">
              Chưa có mã Key? Lấy miễn phí trong 30 giây:
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>[🌐 Nhận API Key Miễn Phí (Mở Google AI Studio)]</span>
            </a>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thông báo thành công nếu có */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successNotice}</span>
            </div>
          )}

          {/* Footer nút hành động */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            {apiKeyInput ? (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                title="Xóa API Key khỏi trình duyệt này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Key</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                [Hủy]
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/30 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>[💾 Lưu &amp; Kích Hoạt]</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
