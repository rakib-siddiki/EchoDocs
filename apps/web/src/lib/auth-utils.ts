import Cookies from 'js-cookie';

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(name) || null;
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, days = 1) {
  if (typeof window === 'undefined') return;
  const isHttps = window.location.protocol === 'https:';
  Cookies.set(name, value, {
    expires: days,
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
  });
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string) {
  if (typeof window === 'undefined') return;
  Cookies.remove(name, { path: '/' });
}
