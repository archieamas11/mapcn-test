import { useQuery } from '@tanstack/react-query'
import { getNichesByPlotId } from '@/api/plots'

export function useNichesByPlot(plotId: number | null) {
  return useQuery({
    queryKey: ['niches-by-plot', plotId] as const,
    queryFn: async () => getNichesByPlotId(plotId as number),
    enabled: plotId !== null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  })
}
