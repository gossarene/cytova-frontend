import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { ROLE_LABELS, type TenantRole } from '@/lib/auth/types'
import { useCreateUser } from '../api'
import { ROUTES } from '@/config/routes'

const schema = z.object({
  email: z.string().email('Valid email required'),
  first_name: z.string().min(1, 'Required').max(100),
  last_name: z.string().min(1, 'Required').max(100),
  role: z.string().min(1, 'Role is required'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

type FormData = z.infer<typeof schema>

export function UserCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateUser()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', first_name: '', last_name: '', role: '', password: '' },
  })

  async function onSubmit(data: FormData) {
    try {
      const user = await mutation.mutateAsync({
        ...data,
        role: data.role as TenantRole,
      })
      toast.success(`User ${user.full_name} created.`)
      navigate(`/users/${user.id}`)
    } catch {
      toast.error('Failed to create user.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add User" breadcrumbs={[{ label: 'Users', href: ROUTES.USERS }, { label: 'New' }]} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">New Staff User</CardTitle>
          <CardDescription>Create a new account. The user will need to change their password on first login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" htmlFor="u-fn" required error={errors.first_name?.message}>
                <Input id="u-fn" placeholder="Alice" autoFocus {...register('first_name')} />
              </FormField>
              <FormField label="Last name" htmlFor="u-ln" required error={errors.last_name?.message}>
                <Input id="u-ln" placeholder="Dupont" {...register('last_name')} />
              </FormField>
            </div>

            <FormField label="Email" htmlFor="u-email" required error={errors.email?.message}
              hint="This will be their login email.">
              <Input id="u-email" type="email" placeholder="user@laboratory.io" {...register('email')} />
            </FormField>

            <FormField label="Role" htmlFor="u-role" required error={errors.role?.message}
              hint="Determines default permissions. Can be changed later.">
              <Select value={watch('role')} onValueChange={(v) => { if (v) setValue('role', v, { shouldValidate: true }) }}>
                <SelectTrigger id="u-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <Separator />

            <FormField label="Temporary password" htmlFor="u-pw" required error={errors.password?.message}
              hint="Minimum 8 characters. The user should change this on first login.">
              <div className="relative">
                <Input id="u-pw" type={showPassword ? 'text' : 'password'} placeholder="Temporary password"
                  className="pr-10" autoComplete="new-password" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.USERS)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
