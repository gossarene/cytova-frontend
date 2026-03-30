import type { TenantRole } from '@/lib/auth/types'

export interface UserListItem {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: TenantRole
  is_active: boolean
  created_at: string
}

export interface UserDetail extends UserListItem {
  created_by: { id: string; email: string } | null
  updated_at: string
}

export interface PermissionOverride {
  id: string
  permission_code: string
  override_type: 'GRANT' | 'REVOKE'
  granted_by_email: string | null
  reason: string
  created_at: string
}

export interface UserPermissions {
  user_id: string
  role: TenantRole
  role_permissions: string[]
  overrides: PermissionOverride[]
  effective_permissions: string[]
}

export interface RoleInfo {
  code: TenantRole
  label: string
  permissions: string[]
}
