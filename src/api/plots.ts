import type { LawnLot, Niche, Plot, PlotCategoryType, PlotLawnType, PlotStatusType } from '@/types/plot.types'
import { PLOT_CATEGORY, PLOT_STATUS } from '@/types/plot.types'
import { httpClient } from './http'

interface ApiResponse<TData> {
  success: boolean
  message: string
  data: TData
}

type ApiPlotRow = Omit<Plot, 'niche_columns' | 'lat' | 'lng' | 'isVisible'> & {
  category: PlotCategoryType | null
  niche_column: number | string | null
  lat: number | string | null
  lng: number | string | null
  isVisible: number | string | boolean
}

type ApiNicheRow = Omit<Niche, 'adjacent' | 'bay' | 'niche_number'> & {
  adjacent: number | string | boolean | null
  bay: number | string | null
  niche_number: number | string | null
}

type ApiLawnLotRow = Omit<LawnLot, 'length' | 'width' | 'area'> & {
  length: number | string
  width: number | string
  area: number | string
}

export interface PlotMarkerData {
  plot: Plot
  lawnLot: LawnLot | null
  niche: Niche | null
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function toBoolean(value: number | string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true'
  }

  return false
}

function toPlotStatus(value: string | null | undefined): PlotStatusType {
  const statuses = Object.values(PLOT_STATUS)
  if (value && statuses.includes(value as PlotStatusType)) {
    return value as PlotStatusType
  }

  return PLOT_STATUS.AVAILABLE
}

function toPlotLawnType(value: string | null | undefined): PlotLawnType {
  const lawnTypes: PlotLawnType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  if (value && lawnTypes.includes(value as PlotLawnType)) {
    return value as PlotLawnType
  }

  return 'bronze'
}

function toPlotCategory(value: PlotCategoryType | null | undefined): PlotCategoryType {
  if (value === PLOT_CATEGORY.CHAMBERS || value === PLOT_CATEGORY.COLUMBARIUM || value === PLOT_CATEGORY.LAWN) {
    return value
  }

  return PLOT_CATEGORY.LAWN
}

function normalizePlot(row: ApiPlotRow): Plot {
  return {
    plot_id: row.plot_id,
    category: toPlotCategory(row.category),
    niche_row: toNumber(row.niche_row),
    niche_columns: toNumber(row.niche_column),
    image_url: row.image_url,
    lng: toNumber(row.lng),
    lat: toNumber(row.lat),
    isVisible: toBoolean(row.isVisible),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function normalizeNiche(row: ApiNicheRow): Niche {
  return {
    niche_id: row.niche_id,
    plot_id: row.plot_id,
    cluster: row.cluster,
    adjacent: toBoolean(row.adjacent),
    bay: toNumber(row.bay),
    unit_code: row.unit_code,
    niche_number: toNumber(row.niche_number),
    niche_status: toPlotStatus(row.niche_status),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function normalizeLawnLot(row: ApiLawnLotRow): LawnLot {
  return {
    lawn_id: row.lawn_id,
    plot_id: row.plot_id,
    unit_code: row.unit_code,
    block: row.block,
    length: toNumber(row.length),
    width: toNumber(row.width),
    area: toNumber(row.area),
    lawn_type: toPlotLawnType(row.lawn_type),
    lawn_status: toPlotStatus(row.lawn_status),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function getAllPlots(): Promise<Plot[]> {
  const response = await httpClient.get<ApiResponse<ApiPlotRow[]>>('/plots/get_plots.php', {
    params: { action: 'get_all_plots' },
  })

  const data = Array.isArray(response.data.data) ? response.data.data : []
  return data.map(normalizePlot)
}

async function getAllNicheDetails(): Promise<Niche[]> {
  const response = await httpClient.get<ApiResponse<ApiNicheRow[]>>('/plots/get_plots.php', {
    params: { action: 'get_all_niche_details' },
  })

  const data = Array.isArray(response.data.data) ? response.data.data : []
  return data.map(normalizeNiche)
}

export async function getNichesByPlotId(plotId: number): Promise<Niche[]> {
  const response = await httpClient.get<ApiResponse<ApiNicheRow[]>>('/plots/get_plots.php', {
    params: {
      action: 'get_niches_by_plot_id',
      plot_id: plotId,
    },
  })

  const data = Array.isArray(response.data.data) ? response.data.data : []
  return data.map(normalizeNiche)
}

async function getAllLawnLotDetails(): Promise<LawnLot[]> {
  const response = await httpClient.get<ApiResponse<ApiLawnLotRow[]>>('/plots/get_plots.php', {
    params: { action: 'get_all_lawn_lot_details' },
  })

  const data = Array.isArray(response.data.data) ? response.data.data : []
  return data.map(normalizeLawnLot)
}

export async function getPlotMarkersData(): Promise<PlotMarkerData[]> {
  const [plots, niches, lawnLots] = await Promise.all([
    getAllPlots(),
    getAllNicheDetails(),
    getAllLawnLotDetails(),
  ])

  const nicheByPlotId = niches.reduce<Record<number, Niche>>((accumulator, niche) => {
    if (!accumulator[niche.plot_id]) {
      accumulator[niche.plot_id] = niche
    }
    return accumulator
  }, {})

  const lawnLotByPlotId = lawnLots.reduce<Record<number, LawnLot>>((accumulator, lawnLot) => {
    if (!accumulator[lawnLot.plot_id]) {
      accumulator[lawnLot.plot_id] = lawnLot
    }
    return accumulator
  }, {})

  return plots.map(plot => ({
    plot,
    niche: nicheByPlotId[plot.plot_id] ?? null,
    lawnLot: lawnLotByPlotId[plot.plot_id] ?? null,
  }))
}
