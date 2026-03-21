import { AdminAuthUser } from '../admin/interfaces/admin-auth-user.interface';

export interface AdminAuditContext {
  admin: AdminAuthUser;
  ip?: string | null;
  userAgent?: string | null;
}
