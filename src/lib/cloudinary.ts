const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'xi7gmxxu';
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '981957649779935';
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || '-u9xiH4RoJ4yhg1WPf77iV_i3B8';

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

// Helper function to generate SHA-1 hash using browser native Web Crypto API
async function sha1Hex(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface CloudinaryUploadResponse {
  url: string;
  secure_url: string;
  public_id: string;
}

export async function uploadToCloudinary(file: File | string): Promise<string> {
  if (isCloudinaryConfigured) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1Hex(toSign);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Cloudinary 이미지 업로드 실패');
    }

    const data: CloudinaryUploadResponse = await response.json();
    return data.secure_url || data.url;
  }

  // Fallback for file object if not configured
  if (file instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('파일 읽기 오류'));
      };
      reader.onerror = () => reject(new Error('파일 읽기 오류'));
      reader.readAsDataURL(file);
    });
  }

  return file;
}
