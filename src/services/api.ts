const CUSTOMER_TOKEN_KEY = 'al_amaan_customer_jwt';
const ADMIN_TOKEN_KEY = 'al_amaan_admin_jwt';

export function getStoredToken(scope: 'customer' | 'admin'): string | null {
  try {
    return localStorage.getItem(scope === 'admin' ? ADMIN_TOKEN_KEY : CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(scope: 'customer' | 'admin', token: string | null): void {
  try {
    const key = scope === 'admin' ? ADMIN_TOKEN_KEY : CUSTOMER_TOKEN_KEY;
    if (token) {
      localStorage.setItem(key, token);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage restriction errors
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    scope?: 'customer' | 'admin' | 'public';
  } = {}
): Promise<T> {
  const { method = 'GET', body, scope = 'public' } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (scope === 'customer' || scope === 'admin') {
    const token = getStoredToken(scope);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } else {
    // Attach customer token if present on public inquiry submissions so account links automatically
    const optionalCustomerToken = getStoredToken('customer');
    if (optionalCustomerToken) {
      headers.Authorization = `Bearer ${optionalCustomerToken}`;
    }
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  if (!contentType.includes('application/json') || data === null) {
    throw new Error('Unexpected response format from server.');
  }

  return data as T;
}

async function optimizeMobilePhoto(file: File): Promise<File> {
  const compressible = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!compressible.includes(file.type) || file.size < 900 * 1024) {
    return file;
  }

  try {
    const imageUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Unable to decode image'));
        el.src = imageUrl;
      });

      const maxDim = 1800;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width <= maxDim && height <= maxDim && file.size < 2 * 1024 * 1024) {
        return file;
      }

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      ctx.drawImage(img, 0, 0, width, height);
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outputType, 0.85)
      );

      if (!blob || blob.size >= file.size) {
        return file;
      }

      const ext = outputType === 'image/png' ? '.png' : '.jpg';
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
      return new File([blob], `${baseName}${ext}`, { type: outputType });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  } catch {
    return file;
  }
}

export async function uploadMediaRequest<T>(
  endpoint: string,
  file: File,
  title?: string,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const preparedFile = await optimizeMobilePhoto(file);
  const formData = new FormData();
  formData.append('file', preparedFile);
  if (title) {
    formData.append('title', title);
  }

  const headers: Record<string, string> = {};
  const adminToken = getStoredToken('admin');
  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Image upload failed.');
  }
  return data as T;
}

export async function uploadMultipleMediaFiles<T>(
  files: FileList | File[],
  titlePrefix?: string,
  onProgress?: (current: number, total: number) => void
): Promise<T[]> {
  const list = Array.from(files);
  const results: T[] = [];
  for (let i = 0; i < list.length; i += 1) {
    onProgress?.(i + 1, list.length);
    const label = titlePrefix ? `${titlePrefix} (${i + 1})` : list[i].name;
    const res = await uploadMediaRequest<T>('/api/admin/media/upload', list[i], label);
    results.push(res);
  }
  return results;
}
