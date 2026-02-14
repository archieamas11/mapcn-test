import type { SelectedPlot } from '@/types/plot.types'
import { Skeleton } from '@/components/ui/skeleton'
import { useNichesByPlotId } from '@/hooks/use-plots'
import { NicheGrids } from './NicheGrids'

interface NicheDetailsProps {
  plotId: number | null
  selectedPlot: SelectedPlot
}

export function NicheDetails({ plotId, selectedPlot }: NicheDetailsProps) {
  const { data: nicheData, isLoading: isNichesLoading } = useNichesByPlotId(plotId)

  const niches = nicheData?.niches ?? []
  const nicheStatusCounts = nicheData?.summary ?? {
    available: 0,
    reserved: 0,
    sold: 0,
    hold: 0,
  }

  return (
    <>
      <div className="bg-secondary p-2 rounded-3xl">
        <div className="grid grid-cols-3 divide-x divide-border text-center rounded-lg overflow-hidden">
          <div className="flex flex-col items-center py-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rows</span>
            <span className="text-lg font-bold text-foreground">{selectedPlot.niche_row ?? '—'}</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Columns</span>
            <span className="text-lg font-bold text-foreground">{selectedPlot.niche_column ?? '—'}</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
            <span className="text-lg font-bold text-foreground">
              {selectedPlot.niche_row && selectedPlot.niche_column
                ? selectedPlot.niche_row * selectedPlot.niche_column
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Niche grid + summary */}
      <div className="space-y-2">
        {selectedPlot.niche_row && selectedPlot.niche_column && (
          <NicheGrids
            rows={selectedPlot.niche_row}
            cols={selectedPlot.niche_column}
            niches={niches}
            isLoading={isNichesLoading}
          />
        )}

        <div className="grid grid-cols-4 gap-2 text-xs bg-secondary p-1 rounded-3xl justify-evenly">
          {isNichesLoading || !nicheData
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex justify-center items-center gap-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-14 rounded-sm" />
                </div>
              ))
            : (
                <>
                  <div className="flex justify-center items-center gap-1">
                    <div className="rounded-full bg-green-50 dark:bg-green-200 p-2">
                      <div className="font-semibold">{nicheStatusCounts.available}</div>
                    </div>
                    <div className="text-green-600">Available</div>
                  </div>
                  <div className="flex justify-center items-center gap-1">
                    <div className="rounded-full bg-yellow-50 dark:bg-yellow-200 p-2">
                      <div className="font-semibold">{nicheStatusCounts.reserved}</div>
                    </div>
                    <div className="text-yellow-600">Reserved</div>
                  </div>
                  <div className="flex justify-center items-center gap-1">
                    <div className="rounded-full bg-red-50 dark:bg-red-200 p-2">
                      <div className="font-semibold">{nicheStatusCounts.sold}</div>
                    </div>
                    <div className="text-red-600">Sold</div>
                  </div>
                  <div className="flex justify-center items-center gap-1">
                    <div className="rounded-full bg-cyan-200 dark:bg-cyan-400 p-2">
                      <div className="font-semibold">{nicheStatusCounts.hold}</div>
                    </div>
                    <div className="text-cyan-600">Hold</div>
                  </div>
                </>
              )}
        </div>
      </div>
    </>
  )
}
