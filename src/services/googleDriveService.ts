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

/**
 * Tự động đồng bộ toàn bộ dữ liệu lớp học lên Google Drive (cập nhật đè file hiện có hoặc tạo mới)
 */
export const syncClassDataToDrive = async (
  token: string,
  className: string,
  data: any
): Promise<DriveSavedFile> => {
  const normalizedClass = (className || '9.5').replace(/[^a-zA-Z0-9]/g, '') || '95';
  const targetFileName = `EduMaster_SyncData_${normalizedClass}.json`;
  const content = JSON.stringify(data, null, 2);

  try {
    // 1. Kiểm tra xem file đã tồn tại trên Drive chưa
    const query = encodeURIComponent(`trashed=false and name='${targetFileName}'`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,webViewLink)&pageSize=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const existingFile = searchData.files && searchData.files[0];
      if (existingFile && existingFile.id) {
        // Cập nhật nội dung đè vào file cũ
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: content,
          }
        );

        if (updateRes.ok) {
          return {
            id: existingFile.id,
            name: targetFileName,
            mimeType: 'application/json',
            createdTime: new Date().toISOString(),
            webViewLink: existingFile.webViewLink,
          };
        }
      }
    }
  } catch (searchErr) {
    console.warn('Lỗi kiểm tra file tồn tại trên Drive, tạo file mới:', searchErr);
  }

  // 2. Nếu chưa có hoặc lỗi patch, tạo file mới
  return await saveFileToDrive(token, targetFileName, content, 'application/json');
};

/**
 * Tải lại dữ liệu lớp học mới nhất từ Google Drive
 */
export const restoreClassDataFromDrive = async (
  token: string,
  className?: string
): Promise<{ data: any; fileName: string; modifiedTime?: string } | null> => {
  const query = encodeURIComponent(
    "trashed=false and (name contains 'EduMaster_SyncData' or name contains 'EduMaster_Backup' or name contains 'EduMaster') and (mimeType='application/json' or name contains '.json')"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime)&orderBy=modifiedTime desc,createdTime desc&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tải tệp sao lưu từ Google Drive (${response.status})`);
  }

  const resJson = await response.json();
  const files: any[] = resJson.files || [];
  if (files.length === 0) {
    return null;
  }

  // Ưu tiên tệp khớp với tên lớp nếu có
  let selectedFile = files[0];
  if (className) {
    const normalizedClass = className.replace(/[^a-zA-Z0-9]/g, '');
    const matched = files.find((f) => f.name.includes(normalizedClass));
    if (matched) {
      selectedFile = matched;
    }
  }

  const rawContent = await getFileContent(token, selectedFile.id);
  const parsedData = JSON.parse(rawContent);

  return {
    data: parsedData,
    fileName: selectedFile.name,
    modifiedTime: selectedFile.modifiedTime || selectedFile.createdTime,
  };
};
