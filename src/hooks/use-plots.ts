import { useQuery } from '@tanstack/react-query'
import {
  buildPlotsGeoJson,
  fetchAllLawnLotDetails,
  fetchAllPlots,
  fetchNichesByPlotId,
} from '@/services/plot-service'

// ─── Query Key Factory ──────────────────────────────────────────────────────

export const plotKeys = {
  all: ['plots'] as const,
  geojson: () => [...plotKeys.all, 'geojson'] as const,
  niches: (plotId: number) => [...plotKeys.all, 'niches', plotId] as const,
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Fetches all plots and lawn lot details in parallel,
 * then builds a GeoJSON FeatureCollection for the map layer.
 */
export function usePlotsGeoJson() {
  return useQuery({
    queryKey: plotKeys.geojson(),
    queryFn: async () => {
      const [plots, lawnLots] = await Promise.all([
        fetchAllPlots(),
        fetchAllLawnLotDetails(),
      ])
      return buildPlotsGeoJson(plots, lawnLots)
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches all niches for a specific plot (chambers/columbarium).
 * Only enabled when a valid plotId is provided.
 */
export function useNichesByPlotId(plotId: number | null | undefined) {
  return useQuery({
    queryKey: plotKeys.niches(plotId ?? 0),
    queryFn: () => fetchNichesByPlotId(plotId!),
    enabled: plotId != null && plotId > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
