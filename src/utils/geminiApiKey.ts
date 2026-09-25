export const GEMINI_API_KEY_STORAGE_KEY = 'edumaster_user_gemini_key';

/**
 * Lấy Gemini API Key cá nhân được lưu trong localStorage của trình duyệt
 * (hoặc biến môi trường VITE_GEMINI_API_KEY nếu có)
 */
export const getStoredGeminiApiKey = (): string => {
  try {
    const userKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)?.trim();
    if (userKey) return userKey;
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim();
    return envKey || '';
  } catch {
    return '';
  }
};

/**
 * Lưu Gemini API Key cá nhân vào localStorage (tuyệt đối không gửi lên Supabase)
 */
export const saveStoredGeminiApiKey = (key: string): void => {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Lỗi khi lưu Gemini API Key vào localStorage:', err);
  }
};

/**
 * Xóa Gemini API Key cá nhân khỏi localStorage
 */
export const removeStoredGeminiApiKey = (): void => {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (err) {
    console.error('Lỗi khi xóa Gemini API Key khỏi localStorage:', err);
  }
};

/**
 * Kiểm tra xem người dùng đã cài đặt API Key cá nhân hay chưa
 */
export const hasGeminiApiKey = (): boolean => {
  return !!getStoredGeminiApiKey();
};
