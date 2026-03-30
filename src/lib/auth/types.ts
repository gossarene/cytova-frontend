export type TenantRole =
  | 'LAB_ADMIN'
  | 'BIOLOGIST'
  | 'TECHNICIAN'
  | 'RECEPTIONIST'
  | 'BILLING_OFFICER'
  | 'INVENTORY_MANAGER'
  | 'VIEWER_AUDITOR'

export type PlatformRole = 'PLATFORM_OWNER' | 'PLATFORM_STAFF'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: TenantRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: TenantRole
  }
}

export interface DecodedToken {
  sub: string
  role: TenantRole
  email: string
  permissions: string[]
  exp: number
  iat: number
}

export const ROLE_LABELS: Record<TenantRole, string> = {
  LAB_ADMIN: 'Lab Admin',
  BIOLOGIST: 'Biologist',
  TECHNICIAN: 'Technician',
  RECEPTIONIST: 'Receptionist',
  BILLING_OFFICER: 'Billing Officer',
  INVENTORY_MANAGER: 'Inventory Manager',
  VIEWER_AUDITOR: 'Viewer / Auditor',
}
