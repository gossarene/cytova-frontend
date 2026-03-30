import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import { useCreateTenant } from './api'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  subdomain: z
    .string()
    .min(3, 'At least 3 characters')
    .max(100)
    .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, 'Lowercase letters, digits, hyphens. Must start with a letter.'),
  plan: z.string(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTenantDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateTenant()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', subdomain: '', plan: 'STARTER' },
  })

  async function onSubmit(data: FormData) {
    try {
      await mutation.mutateAsync(data)
      toast.success(`Laboratory "${data.name}" created successfully.`)
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create laboratory.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Laboratory</DialogTitle>
          <DialogDescription>
            Provision a new tenant with its own isolated schema and domain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Laboratory name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="City Hospital Labs" autoFocus {...register('name')} />
          </FormField>

          <FormField
            label="Subdomain"
            htmlFor="subdomain"
            required
            error={errors.subdomain?.message}
            hint="Will be accessible at {subdomain}.cytova.io"
          >
            <Input id="subdomain" placeholder="city-hospital" {...register('subdomain')} />
          </FormField>

          <FormField label="Plan" htmlFor="plan" error={errors.plan?.message}>
            <Select value={watch('plan') ?? 'STARTER'} onValueChange={(v) => setValue('plan', v ?? 'STARTER')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
