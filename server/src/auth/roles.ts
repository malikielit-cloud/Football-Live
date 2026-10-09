import { UserRole } from 'shared';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  OPERATOR: 2,
  ADMIN: 3,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canControlMatch(userRole: UserRole): boolean {
  return hasPermission(userRole, 'OPERATOR');
}
