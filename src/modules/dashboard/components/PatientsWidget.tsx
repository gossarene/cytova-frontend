import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'
import type { DashboardPatients } from '../types'

interface Props {
  data: DashboardPatients | undefined
  isLoading: boolean
}

export function PatientsWidget({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Patients</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5" />)}
          </div>
        ) : !data ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.registered_today}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.registered_this_week}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data.registered_this_month}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums">{data.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-semibold tabular-nums text-emerald-600">{data.active}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inactive</span>
                <span className="font-semibold tabular-nums text-red-600">{data.inactive}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
