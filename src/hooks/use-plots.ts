import { useQuery } from '@tanstack/react-query'
import {
  buildPlotsGeoJson,
  fetchBranches,
  fetchLawnLotDetailsByBranch,
  fetchNichesByPlotId,
  fetchPlotsByBranch,
  searchUnits,
} from '@/services/plot-service'

// ─── Query Key Factory ──────────────────────────────────────────────────────

export const plotKeys = {
  all: ['plots'] as const,
  geojson: (branchId: number) => [...plotKeys.all, 'geojson', branchId] as const,
  niches: (plotId: number) => [...plotKeys.all, 'niches', plotId] as const,
  searchUnits: (searchTerm: string) => [...plotKeys.all, 'search-units', searchTerm] as const,
  branches: () => ['branches'] as const,
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Fetches all available branches from tbl_branch.
 */
export function useBranches() {
  return useQuery({
    queryKey: plotKeys.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches plots and lawn lot details for a specific branch,
 * then builds a GeoJSON FeatureCollection for the map layer.
 */
export function usePlotsGeoJson(branchId: number | null) {
  return useQuery({
    queryKey: plotKeys.geojson(branchId ?? 0),
    queryFn: async () => {
      if (!branchId)
        return { type: 'FeatureCollection' as const, features: [] }
      const [plots, lawnLots] = await Promise.all([
        fetchPlotsByBranch(branchId),
        fetchLawnLotDetailsByBranch(branchId),
      ])
      return buildPlotsGeoJson(plots, lawnLots)
    },
    enabled: branchId != null && branchId > 0,
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
    placeholderData: { niches: [], summary: { available: 0, reserved: 0, sold: 0, hold: 0 } },
  })
}

export function useUnitCodeSearch(searchTerm: string) {
  const normalizedTerm = searchTerm.trim()

  return useQuery({
    queryKey: plotKeys.searchUnits(normalizedTerm),
    queryFn: () => searchUnits(normalizedTerm),
    enabled: normalizedTerm.length > 0,
    placeholderData: [],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}
