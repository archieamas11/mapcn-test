// ─── Constants ───────────────────────────────────────────────────────────────

export const LAWN_TYPE = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
} as const

export const PLOT_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
  HOLD: 'hold',
  NOT_AVAILABLE: 'not_available',
} as const

export const PLOT_CATEGORY = {
  LAWN: 'lawn_lot',
  CHAMBERS: 'chambers',
  COLUMBARIUM: 'columbarium',
} as const

// ─── Derived Types ───────────────────────────────────────────────────────────

export type PlotStatusType = (typeof PLOT_STATUS)[keyof typeof PLOT_STATUS]
export type PlotLawnType = (typeof LAWN_TYPE)[keyof typeof LAWN_TYPE]
export type PlotCategoryType
  = (typeof PLOT_CATEGORY)[keyof typeof PLOT_CATEGORY]

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// ─── Domain Models (match DB schema) ─────────────────────────────────────────

export interface Plot {
  plot_id: number
  branch_id: number
  category: PlotCategoryType
  niche_row: number | null
  niche_column: number | null
  cluster: string | null
  bay: number | null
  image_url: string | null
  lng: number | null
  lat: number | null
  isVisible: number
  branch: string
  created_at: string
  updated_at: string
}

export interface Niche {
  niche_id: number
  plot_id: number
  cluster: string | null
  adjacent: number | null
  bay: number | null
  unit_code: string | null
  niche_number: number
  niche_status: PlotStatusType
  created_at: string
  updated_at: string
}

export interface NicheResponse {
  niches: Niche[]
  summary: {
    available: number
    reserved: number
    sold: number
    hold: number
  }
}

export interface LawnLot {
  lawn_id: number
  plot_id: number
  unit_code: string | null
  block: string | null
  length: number
  width: number
  area: number
  lawn_type: PlotLawnType
  lawn_status: PlotStatusType
  created_at: string
  updated_at: string
}

export interface Branches {
  branch_id: number
  branch_name: string
  address: string
  lng: number | null
  lat: number | null
  status: string
  created_at: string
  updated_at: string
}

// ─── Joined API Row (lawn lot + plot) ────────────────────────────────────────

export interface LawnLotWithPlot extends LawnLot {
  image_url: string | null
  lng: number | null
  lat: number | null
  isVisible: number
  category: PlotCategoryType
  plot_created_at: string
  plot_updated_at: string
  lawn_lot_created_at: string
  lawn_lot_updated_at: string
}

// ─── GeoJSON Feature Properties ──────────────────────────────────────────────

export interface PlotFeatureProperties {
  plot_id: number
  branch_id: number
  category: PlotCategoryType
  image_url: string
  niche_row: number | null
  niche_column: number | null
  cluster: string | null
  bay: number | null
  // Lawn lot fields (null for non-lawn plots)
  lawn_id: number | null
  lawn_status: PlotStatusType | null
  lawn_type: PlotLawnType | null
  width: number | null
  length: number | null
  area: number | null
  unit_code: string | null
  block: string | null
}

// ─── Selected Plot (sidebar display model) ───────────────────────────────────

export interface SelectedPlot {
  plot_id: number
  category: PlotCategoryType
  cluster: string | null
  bay: number | null
  coordinates: [number, number]
  image_url: string
  niche_row: number | null
  niche_column: number | null
  // Lawn lot specific
  lawn_status: PlotStatusType | null
  lawn_type: PlotLawnType | null
  width: number | null
  length: number | null
  area: number | null
  unit_code: string | null
  block: string | null
}
