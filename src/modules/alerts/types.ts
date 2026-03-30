export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED'
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO'
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
}

export const ALERT_TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
  { value: 'EXPIRED', label: 'Expired' },
]

export const SEVERITY_OPTIONS: { value: AlertSeverity; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'INFO', label: 'Info' },
]

export const STATUS_OPTIONS: { value: AlertStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' },
]

export interface AlertListItem {
  id: string
  alert_type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  stock_item_id: string
  stock_item_code: string
  stock_item_name: string
  stock_lot_id: string | null
  lot_number: string | null
  title: string
  threshold_value: string | null
  current_value: string | null
  created_at: string
}

export interface AlertDetail extends AlertListItem {
  message: string
  acknowledged_at: string | null
  acknowledged_by_email: string | null
  resolved_at: string | null
  resolved_by_email: string | null
  updated_at: string
}

export interface AlertSummaryItem {
  alert_type: string
  severity: string
  count: number
}
