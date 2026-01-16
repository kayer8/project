export interface AdminAuthUser {
  adminId: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  permissions: Record<string, boolean>;
}
