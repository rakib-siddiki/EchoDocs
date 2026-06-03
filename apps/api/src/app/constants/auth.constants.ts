export const ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const;

export type TAuthRole = (typeof ROLES)[keyof typeof ROLES];