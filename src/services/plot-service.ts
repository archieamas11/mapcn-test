import type {
  ApiResponse,
  Branches,
  LawnLot,
  LawnLotWithPlot,
  NicheResponse,
  Plot,
  PlotCategoryType,
  PlotFeatureProperties,
} from '@/types/plot.types'
import { apiClient } from '@/lib/axios'
import { PLOT_CATEGORY } from '@/types/plot.types'

// ─── Default image for plots without one ─────────────────────────────────────

const DEFAULT_IMAGE_URL
  = 'https://res.cloudinary.com/djrkvgfvo/image/upload/v1756789574/unnamed_r3svir.png'

// ─── API Fetch Functions ─────────────────────────────────────────────────────

// These are unused since i switched to fetch plot by branch, but keeping them here for now since they may be useful for a future "All Plots" view or admin panel.
export async function fetchAllPlots(): Promise<Plot[]> {
  const { data } = await apiClient.get<ApiResponse<Plot[]>>(
    '/plots/get_plots.php',
    { params: { action: 'get_all_plots' } },
  )
  return data.data
}

export async function fetchAllLawnLotDetails(): Promise<LawnLotWithPlot[]> {
  const { data } = await apiClient.get<ApiResponse<LawnLotWithPlot[]>>(
    '/plots/get_plots.php',
    { params: { action: 'get_all_lawn_lot_details' } },
  )
  return data.data
}
// ________________________________________________________________________

export async function fetchNichesByPlotId(plotId: number): Promise<NicheResponse> {
  const { data } = await apiClient.get<ApiResponse<NicheResponse>>(
    '/plots/get_plots.php',
    { params: { action: 'get_niches_by_plot_id', plot_id: plotId } },
  )
  return data.data
}

export async function fetchBranches(): Promise<Branches[]> {
  const { data } = await apiClient.get<ApiResponse<Branches[]>>(
    '/plots/get_plots.php',
    { params: { action: 'get_branches' } },
  )
  return data.data
}

// Fetch plots for a specific branch, used in the MapView to only load relevant data for the selected branch and improve performance.
export async function fetchPlotsByBranch(branchId: number): Promise<Plot[]> {
  const { data } = await apiClient.get<ApiResponse<Plot[]>>(
    '/plots/get_plots.php',
    { params: { action: 'get_plots_by_branch', branch_id: branchId } },
  )
  return data.data
}

export async function fetchLawnLotDetailsByBranch(branchId: number): Promise<LawnLotWithPlot[]> {
  const { data } = await apiClient.get<ApiResponse<LawnLotWithPlot[]>>(
    '/plots/get_plots.php',
    { params: { action: 'get_lawn_lot_details_by_branch', branch_id: branchId } },
  )
  return data.data
}

// ─── GeoJSON Builder ─────────────────────────────────────────────────────────

interface PlotsGeoJson {
  type: 'FeatureCollection'
  features: GeoJSON.Feature<GeoJSON.Point, PlotFeatureProperties>[]
}

/**
 * Combines plots and lawn lot data into a GeoJSON FeatureCollection
 * ready for the MapLibre source layer.
 */
export function buildPlotsGeoJson(
  plots: Plot[],
  lawnLots: LawnLot[],
): PlotsGeoJson {
  // Index lawn lots by plot_id for O(1) lookups
  const lawnLotByPlotId = new Map<number, LawnLot>()
  for (const ll of lawnLots) {
    lawnLotByPlotId.set(ll.plot_id, ll)
  }

  const features: GeoJSON.Feature<GeoJSON.Point, PlotFeatureProperties>[] = []

  for (const plot of plots) {
    // Skip plots without valid coordinates or that are hidden
    if (Number.isNaN(plot.lng) || Number.isNaN(plot.lat) || plot.isVisible === 0) {
      continue
    }

    const lawnLot
      = plot.category === PLOT_CATEGORY.LAWN
        ? (lawnLotByPlotId.get(plot.plot_id) ?? null)
        : null

    const properties: PlotFeatureProperties = {
      plot_id: plot.plot_id,
      branch_id: plot.branch_id,
      category: plot.category as PlotCategoryType,
      image_url: plot.image_url ?? DEFAULT_IMAGE_URL,
      niche_row: plot.niche_row,
      niche_column: plot.niche_column,
      cluster: plot.cluster,
      bay: plot.bay,
      // Lawn lot fields
      lawn_id: lawnLot?.lawn_id ?? null,
      lawn_status: lawnLot?.lawn_status ?? null,
      lawn_type: lawnLot?.lawn_type ?? null,
      width: lawnLot ? lawnLot.width : null,
      length: lawnLot ? lawnLot.length : null,
      area: lawnLot ? lawnLot.area : null,
      unit_code: lawnLot?.unit_code ?? null,
      block: lawnLot?.block ?? null,
    }

    features.push({
      type: 'Feature',
      properties,
      geometry: {
        type: 'Point',
        coordinates: [plot.lng as number, plot.lat as number],
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
