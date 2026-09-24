import { DriveSavedFile } from '../types';

export const saveFileToDrive = async (
  token: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<DriveSavedFile> => {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: 'Báo cáo Sổ Công Tác Chủ Nhiệm THCS - EduMaster AI',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi khi lưu lên Google Drive (${response.status})`);
  }

  return await response.json();
};

export const listFilesFromDrive = async (token: string): Promise<DriveSavedFile[]> => {
  const query = encodeURIComponent("trashed=false and (name contains 'EduMaster' or name contains 'SoChuNhiem' or name contains 'BaoCao')");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,size,webViewLink)&orderBy=createdTime desc&pageSize=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tải danh sách từ Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

export const getFileContent = async (token: string, fileId: string): Promise<string> => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Lỗi tải nội dung file từ Google Drive (${response.status})`);
  }

  return await response.text();
};

export const deleteFileFromDrive = async (token: string, fileId: string): Promise<void> => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi xóa file trên Google Drive (${response.status})`);
  }
};
