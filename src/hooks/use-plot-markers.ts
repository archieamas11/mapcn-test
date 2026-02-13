import { useQuery } from '@tanstack/react-query'
import { getPlotMarkersData } from '@/api/plots'

export const plotMarkersQueryKey = ['plot-markers'] as const

export function usePlotMarkers() {
  return useQuery({
    queryKey: plotMarkersQueryKey,
    queryFn: getPlotMarkersData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  })
}
