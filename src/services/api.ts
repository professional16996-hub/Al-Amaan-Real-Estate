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

  return data as T;
}

export async function uploadMediaRequest<T>(
  endpoint: string,
  file: File,
  title?: string,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
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
