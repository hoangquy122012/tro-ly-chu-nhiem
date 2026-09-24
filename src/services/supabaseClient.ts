import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lfgvkbhujmaympjcehsg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_D10eq7uwVAIxe8Eozh4ffQ_-db8cjnu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Chuẩn hóa tên lớp thành class_id chuẩn (VD: "9.5" -> "lop_95", "8A2" -> "lop_8a2")
 */
export const formatClassId = (className?: string): string => {
  if (!className) return 'lop_95';
  const clean = className.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || '95';
  return clean.startsWith('lop_') ? clean : `lop_${clean}`;
};

/**
 * Lấy toàn bộ dữ liệu lớp học từ bảng class_records trên Supabase
 */
export const fetchClassDataFromSupabase = async (classId: string) => {
  try {
    const { data, error } = await supabase
      .from('class_records')
      .select('*')
      .eq('class_id', classId)
      .maybeSingle();

    if (error) {
      console.warn('Lỗi truy vấn Supabase:', error.message);
      return null;
    }

    if (data && data.data) {
      return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
    }
    return null;
  } catch (err) {
    console.error('Lỗi khi fetch từ Supabase:', err);
    return null;
  }
};

/**
 * Tự động upsert (cập nhật hoặc tạo mới) bản ghi lớp học lên bảng class_records
 */
export const saveClassDataToSupabase = async (classId: string, payload: any): Promise<boolean> => {
  try {
    const record: { class_id: string; data: any; updated_at?: string } = {
      class_id: classId,
      data: payload,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('class_records')
      .upsert(record, { onConflict: 'class_id' });

    if (error) {
      // Thử upsert không có updated_at nếu bảng chưa có cột này
      const fallbackRecord = {
        class_id: classId,
        data: payload,
      };
      const { error: fallbackError } = await supabase
        .from('class_records')
        .upsert(fallbackRecord, { onConflict: 'class_id' });

      if (fallbackError) {
        console.warn('Lỗi lưu Supabase:', fallbackError.message);
        throw fallbackError;
      }
    }
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu Supabase:', err);
    throw err;
  }
};
