import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { PartnerForm } from '../components/PartnerForm'
import { useCreatePartner } from '../api'
import { ROUTES } from '@/config/routes'

export function PartnerCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreatePartner()

  async function handleSubmit(data: Record<string, unknown>) {
    const partner = await mutation.mutateAsync(data)
    toast.success(`Partner "${partner.name}" created.`)
    navigate(`/partners/${partner.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Partner" breadcrumbs={[{ label: 'Partners', href: ROUTES.PARTNERS }, { label: 'New' }]} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">New Partner Organization</CardTitle>
          <CardDescription>Register a referring clinic, hospital, or laboratory.</CardDescription>
        </CardHeader>
        <CardContent>
          <PartnerForm mode="create" onSubmit={handleSubmit} onCancel={() => navigate(ROUTES.PARTNERS)} isSubmitting={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
