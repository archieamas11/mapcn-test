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

export type PlotStatusType = (typeof PLOT_STATUS)[keyof typeof PLOT_STATUS]
export type PlotLawnType = (typeof LAWN_TYPE)[keyof typeof LAWN_TYPE]
export type PlotCategoryType = (typeof PLOT_CATEGORY)[keyof typeof PLOT_CATEGORY]

export interface Plot {
  plot_id: number
  category: PlotCategoryType
  niche_row: number
  niche_columns: number
  image_url: string
  lng: number
  lat: number
  isVisible: boolean
  created_at: string
  updated_at: string
}

export interface Niche {
  niche_id: number
  plot_id: number
  cluster: string
  adjacent: boolean
  bay: number
  unit_code: string
  niche_number: number
  niche_status: PlotStatusType
  created_at: string
  updated_at: string
}

export interface LawnLot {
  lawn_id: number
  plot_id: number
  unit_code: string
  block: string
  length: number
  width: number
  area: number
  lawn_type: PlotLawnType
  lawn_status: PlotStatusType
  created_at: string
  updated_at: string
}
