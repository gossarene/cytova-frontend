import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { SETUP_PROGRESS_QUERY_KEY } from '@/modules/dashboard/api'
import type { ApiResponse } from '@/lib/api/types'
import type { UserListItem, UserDetail, UserPermissions, RoleInfo } from './types'
import type { TenantRole } from '@/lib/auth/types'

export function useUsers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserListItem[]>>('/users/', { params })
      return data
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserDetail>>(`/users/${id}/`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      email: string; first_name: string; last_name: string; role: TenantRole;
      password: string;
      /** Optional professional title (e.g. "Dr", "Pr"). Surfaced on
       *  signed reports and in audit attribution. */
      title?: string;
    }) => {
      const { data } = await api.post<ApiResponse<UserDetail>>('/users/', p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      // First teammate ticks the team_users setup task.
      qc.invalidateQueries({ queryKey: SETUP_PROGRESS_QUERY_KEY })
    },
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data } = await api.patch<ApiResponse<UserDetail>>(`/users/${id}/`, p)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeactivateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<UserDetail>>(`/users/${id}/deactivate/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
      // Deactivating the last teammate flips team_users back to false.
      qc.invalidateQueries({ queryKey: SETUP_PROGRESS_QUERY_KEY })
    },
  })
}

export function useActivateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<UserDetail>>(`/users/${id}/activate/`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useAssignRole(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (role: TenantRole) => {
      const { data } = await api.post<ApiResponse<UserDetail>>(`/users/${id}/assign-role/`, { role })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: ['users', userId, 'permissions'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserPermissions>>(`/users/${userId}/permissions/`)
      return data.data
    },
    enabled: !!userId,
  })
}

export function useManagePermission(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: { action: 'grant' | 'revoke' | 'remove'; permission_code: string; reason?: string }) => {
      await api.post(`/users/${userId}/manage-permissions/`, p)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', userId, 'permissions'] })
    },
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RoleInfo[]>>('/users/roles/')
      return data.data
    },
    staleTime: 10 * 60_000,
  })
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Record<string, Array<{ code: string; description: string }>>>>('/users/permissions-catalog/')
      return data.data
    },
    staleTime: 10 * 60_000,
  })
}
