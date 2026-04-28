import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Eye, EyeOff, User, Lock, PenTool, Upload, Trash2, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { useAuthStore } from '@/lib/auth/store'
import { ROLE_LABELS } from '@/lib/auth/types'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'

const profileSchema = z.object({
  first_name: z.string().min(1, 'Required').max(100),
  last_name: z.string().min(1, 'Required').max(100),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string().min(1, 'Confirm your new password'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

/**
 * Personal profile page — accessible to ALL authenticated users.
 * This is NOT an admin settings page. It covers:
 * - Viewing own account info (email, role, permissions count)
 * - Editing own display name
 * - Changing own password
 */
export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const permissions = useAuthStore((s) => s.permissions)
  const [showPassword, setShowPassword] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: user ? { first_name: user.firstName, last_name: user.lastName } : undefined,
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  async function handleProfileSave(data: ProfileForm) {
    setProfileSaving(true)
    try {
      await api.patch('/users/me/', data)
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, firstName: data.first_name, lastName: data.last_name } : null,
      }))
      toast.success('Profile updated.')
    } catch { toast.error('Failed to update profile.') }
    finally { setProfileSaving(false) }
  }

  async function handlePasswordChange(data: PasswordForm) {
    setPasswordSaving(true)
    try {
      await api.patch('/users/me/', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully.')
      passwordForm.reset()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: Array<{ message: string; field: string | null }> } } })
        ?.response?.data?.errors?.[0]
      if (msg?.field === 'current_password') {
        passwordForm.setError('current_password', { message: msg.message })
      } else {
        toast.error(msg?.message || 'Failed to change password.')
      }
    }
    finally { setPasswordSaving(false) }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile and account settings" />

      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          {/* Profile info (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permissions</span>
                <span className="text-xs text-muted-foreground">{permissions.size} active</span>
              </div>
            </CardContent>
          </Card>

          {/* Editable profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Profile</CardTitle>
              <CardDescription>Update your display name. Email and role are managed by your administrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="First name" htmlFor="s-fn" required error={profileForm.formState.errors.first_name?.message}>
                    <Input id="s-fn" {...profileForm.register('first_name')} />
                  </FormField>
                  <FormField label="Last name" htmlFor="s-ln" required error={profileForm.formState.errors.last_name?.message}>
                    <Input id="s-ln" {...profileForm.register('last_name')} />
                  </FormField>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Signature — biologists only */}
          {(user.role === 'BIOLOGIST' || user.role === 'LAB_ADMIN') && (
            <SignatureCard />
          )}
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Enter your current password to set a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FormField label="Current password" htmlFor="s-cpw" required error={passwordForm.formState.errors.current_password?.message}>
                  <Input id="s-cpw" type="password" autoComplete="current-password" {...passwordForm.register('current_password')} />
                </FormField>
                <Separator />
                <FormField label="New password" htmlFor="s-npw" required error={passwordForm.formState.errors.new_password?.message}
                  hint="Minimum 8 characters.">
                  <div className="relative">
                    <Input id="s-npw" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                      className="pr-10" {...passwordForm.register('new_password')} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>
                <FormField label="Confirm new password" htmlFor="s-cpw2" required error={passwordForm.formState.errors.confirm_password?.message}>
                  <Input id="s-cpw2" type="password" autoComplete="new-password" {...passwordForm.register('confirm_password')} />
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordSaving}>
                    {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Signature upload card — biologists / lab admins
// ---------------------------------------------------------------------------

const ALLOWED_SIG_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif'])
const MAX_SIG_BYTES = 2 * 1024 * 1024

function SignatureCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get<Blob>('/users/me/signature/', { responseType: 'blob' })
      .then((resp) => {
        if (!cancelled) {
          const url = URL.createObjectURL(resp.data)
          setPreviewUrl(url)
          setHasSignature(true)
        }
      })
      .catch(() => {
        if (!cancelled) setHasSignature(false)
      })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_SIG_TYPES.has(file.type)) {
      toast.error('Unsupported image type. Use PNG, JPEG or GIF.')
      return
    }
    if (file.size > MAX_SIG_BYTES) {
      toast.error('File too large. Maximum 2 MB.')
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post<ApiResponse<unknown>>('/users/me/signature/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
      setHasSignature(true)
      // Refresh /users/me so the auth store picks up has_signature=true and
      // the biologist onboarding banner disappears without a page reload.
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Signature uploaded.')
    } catch {
      toast.error('Failed to upload signature.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete('/users/me/signature/')
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setHasSignature(false)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Signature removed.')
    } catch {
      toast.error('Failed to remove signature.')
    } finally {
      setDeleting(false)
    }
  }

  const busy = uploading || deleting

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenTool className="h-4 w-4 text-muted-foreground" />
          Signature
        </CardTitle>
        <CardDescription>
          Your signature image is printed on final patient reports that you validate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-36 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {hasSignature && previewUrl ? (
              <img src={previewUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
            ) : loaded ? (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef} type="file" className="hidden"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleUpload}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
                {uploading
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Upload className="mr-2 h-4 w-4" />}
                {hasSignature ? 'Replace' : 'Upload'}
              </Button>
              {hasSignature && (
                <Button type="button" variant="outline" size="sm" onClick={handleDelete} disabled={busy}>
                  {deleting
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Trash2 className="mr-2 h-4 w-4" />}
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG or GIF · up to 2 MB. Your signature is rendered on reports you validate.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
