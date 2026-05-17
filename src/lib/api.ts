// Configuration برای API calls
export const API_CONFIG = {
  // در محیط development از روت نسبی استفاده می‌کنیم
  // اما اگر نیاز به absolute URL بود، می‌توان از این استفاده کرد:
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
};

/**
 * یک wrapper برای fetch با error handling بهتر
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = `${API_CONFIG.baseURL}${url}`;

  // Default headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Default options
  const defaultOptions: RequestInit = {
    cache: 'no-cache' as RequestCache,
    ...options,
    headers: defaultHeaders,
  };

  try {
    const response = await fetch(fullUrl, defaultOptions);
    return response;
  } catch (error) {
    console.error('API Fetch Error:', {
      url: fullUrl,
      options: defaultOptions,
      error,
    });
    throw error;
  }
}

/**
 * Helper برای POST requests
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'خطا در ارتباط با سرور');
  }

  return result;
}

/**
 * Helper برای GET requests
 */
export async function apiGet<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch(url, {
    method: 'GET',
    ...options,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'خطا در ارتباط با سرور');
  }

  return result;
}

/**
 * Helper برای authenticated requests
 */
export async function authApiPost<T = any>(
  url: string,
  data: any,
  token?: string
): Promise<T> {
  return apiPost<T>(url, data, {
    headers: {
      Authorization: `Bearer ${token || getToken()}`,
    },
  });
}

/**
 * Helper برای authenticated GET requests
 */
export async function authApiGet<T = any>(
  url: string,
  token?: string
): Promise<T> {
  return apiGet<T>(url, {
    headers: {
      Authorization: `Bearer ${token || getToken()}`,
    },
  });
}

/**
 * Helper برای authenticated PATCH requests
 */
export async function authApiPatch<T = any>(
  url: string,
  data: any,
  token?: string
): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${token || getToken()}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'خطا در ارتباط با سرور');
  }

  return result;
}

/**
 * Helper برای authenticated DELETE requests
 */
export async function authApiDelete<T = any>(
  url: string,
  token?: string
): Promise<T> {
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token || getToken()}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'خطا در ارتباط با سرور');
  }

  return result;
}

/**
 * دریافت token از localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * ذخیره token در localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * حذف token از localStorage
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * دریافت user از localStorage
 */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * ذخیره user در localStorage
 */
export function setUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * بررسی اینکه آیا کاربر لاگین است یا نه
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
}
