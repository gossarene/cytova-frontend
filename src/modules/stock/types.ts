export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'LOSS'

export const MOVEMENT_TYPE_OPTIONS: { value: MovementType; label: string; direction: 'in' | 'out' }[] = [
  { value: 'IN', label: 'Stock In', direction: 'in' },
  { value: 'OUT', label: 'Stock Out', direction: 'out' },
  { value: 'ADJUSTMENT_IN', label: 'Adjustment In', direction: 'in' },
  { value: 'ADJUSTMENT_OUT', label: 'Adjustment Out', direction: 'out' },
  { value: 'LOSS', label: 'Loss', direction: 'out' },
]

export const REQUIRES_REASON: MovementType[] = ['LOSS', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT']

// -- Category --

export interface StockCategoryListItem {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
}

// -- Item --

export interface StockItemListItem {
  id: string
  code: string
  name: string
  category_id: string
  category_name: string
  unit: string
  minimum_threshold: string
  current_quantity: string
  main_supplier_name: string
  is_active: boolean
  created_at: string
}

export interface StockItemDetail {
  id: string
  code: string
  name: string
  category: StockCategoryListItem
  description: string
  unit: string
  minimum_threshold: string
  reorder_quantity: string | null
  current_quantity: string
  main_supplier_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// -- Lot --

export interface StockLot {
  id: string
  item_id: string
  item_code: string
  item_name: string
  lot_number: string
  expiry_date: string | null
  supplier_name: string
  initial_quantity: string
  current_quantity: string
  unit_cost: string | null
  received_at: string
  notes: string
  is_exhausted: boolean
  created_at: string
  updated_at: string
}

// -- Movement --

export interface StockMovement {
  id: string
  lot_id: string
  movement_type: MovementType
  quantity: string
  quantity_before: string
  quantity_after: string
  reason: string
  reference: string
  reference_type: string
  performed_by_id: string | null
  performed_by_email: string | null
  performed_at: string
}
