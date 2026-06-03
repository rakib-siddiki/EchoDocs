export const AUTH_CONFIG = {
  PROTECTED_ROUTES: ['/dashboard(.*)', '/chat(.*)'],
} as const;

export const AUTH_ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const;

export type TAuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];