// -- Supplier --

export interface SupplierListItem {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  is_active: boolean
  created_at: string
}

export interface SupplierDetail extends SupplierListItem {
  address: string
  notes: string
  updated_at: string
}

// -- Purchase Order --

export type PurchaseOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'

export interface POItemRead {
  id: string
  stock_item_id: string
  stock_item_code: string
  stock_item_name: string
  stock_item_unit: string
  ordered_quantity: string
  received_quantity: string
  remaining_quantity: string
  unit_price: string | null
  notes: string
  created_at: string
}

export interface POListItem {
  id: string
  order_number: string
  supplier_id: string
  supplier_name: string
  status: PurchaseOrderStatus
  expected_delivery_date: string | null
  items_count: number
  receptions_count: number
  created_at: string
}

export interface PODetail {
  id: string
  order_number: string
  supplier: SupplierListItem
  status: PurchaseOrderStatus
  expected_delivery_date: string | null
  notes: string
  confirmed_at: string | null
  confirmed_by_email: string | null
  cancelled_at: string | null
  cancelled_by_email: string | null
  closed_at: string | null
  closed_by_email: string | null
  created_by_email: string | null
  receptions_count: number
  items: POItemRead[]
  created_at: string
  updated_at: string
}

// -- Reception --

export interface ReceptionItemRead {
  id: string
  order_item_id: string
  stock_item_code: string
  stock_item_name: string
  received_quantity: string
  lot_number: string
  expiry_date: string | null
  unit_cost: string | null
  discrepancy_quantity: string
  notes: string
  stock_lot_id: string | null
  created_at: string
}

export interface ReceptionListItem {
  id: string
  order_id: string
  received_at: string
  received_by_email: string | null
  has_discrepancy: boolean
  items_count: number
  created_at: string
}

export interface ReceptionDetail {
  id: string
  order_id: string
  received_at: string
  received_by_email: string | null
  notes: string
  has_discrepancy: boolean
  items: ReceptionItemRead[]
  created_at: string
}
