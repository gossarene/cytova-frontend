import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { PatientForm, type PatientFormData } from '../components/PatientForm'
import { useCreatePatient } from '../api'
import { ROUTES } from '@/config/routes'

export function PatientCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreatePatient()

  async function handleSubmit(data: PatientFormData) {
    const patient = await mutation.mutateAsync({
      ...data,
      national_id: data.national_id!, // Required in create mode (validated by form)
    })
    toast.success(`Patient ${patient.full_name} registered successfully.`)
    navigate(`/patients/${patient.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register Patient"
        breadcrumbs={[
          { label: 'Patients', href: ROUTES.PATIENTS },
          { label: 'Register' },
        ]}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">New Patient</CardTitle>
          <CardDescription>
            Fill in the patient's information. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={() => navigate(ROUTES.PATIENTS)}
            isSubmitting={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
