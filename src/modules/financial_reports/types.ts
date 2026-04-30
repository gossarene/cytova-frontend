export type FinancialSourceType = 'ALL' | 'DIRECT_PATIENT' | 'PARTNER'

export interface FinancialReportFilters {
  period_start: string
  period_end: string
  source_type: FinancialSourceType
  partner_ids?: string[]
}

export interface FinancialReportSummary {
  request_count: number
  exam_count: number
  /** Decimal strings — preserve precision across the wire. */
  gross_total: string
  discount_total: string
  net_total: string
}

export interface FinancialReportRowExam {
  code: string
  name: string
  quantity: number
  unit_price: string
  gross_amount: string
  discount_amount: string
  net_amount: string
}

export interface FinancialReportRow {
  request_id: string
  reference: string
  date: string | null
  patient_name: string
  source_type: 'DIRECT_PATIENT' | 'PARTNER_ORGANIZATION' | string
  partner_id: string | null
  partner_name: string
  exam_count: number
  gross_amount: string
  discount_amount: string
  net_amount: string
  /** Drill-down: one entry per distinct exam in the request (qty grouped). */
  exams: FinancialReportRowExam[]
}

export interface SourceDistributionPoint {
  source: string
  value: string
}

export interface TimeEvolutionPoint {
  date: string
  revenue: string
  requests: number
}

export interface ExamRankingPoint {
  code: string
  name: string
  /** Revenue chart sends a Decimal string; volume chart sends a number. */
  value: string | number
}

export interface PartnerRankingPoint {
  partner_id: string | null
  name: string
  value: string
}

export interface PartnerTimeSeries {
  partner_id: string | null
  name: string
  series: { date: string; value: string }[]
}

export interface FinancialReportCharts {
  source_distribution: SourceDistributionPoint[]
  time_evolution: TimeEvolutionPoint[]
  top_exams_by_revenue: ExamRankingPoint[]
  top_exams_by_volume: ExamRankingPoint[]
  top_partners_by_revenue: PartnerRankingPoint[]
  partner_time_comparison: PartnerTimeSeries[]
}

export interface FinancialReportResponse {
  summary: FinancialReportSummary
  rows: FinancialReportRow[]
  charts: FinancialReportCharts
  filters_applied: {
    period_start: string
    period_end: string
    source_type: FinancialSourceType
    partner_ids: string[]
  }
}
