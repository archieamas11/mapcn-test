import type { NicheResponse, SelectedPlot } from '@/types/plot.types'
import { Skeleton } from '@/components/ui/skeleton'
import { NicheGrids } from './NicheGrids'

interface NicheDetailsProps {
  selectedPlot: SelectedPlot
  nicheData?: NicheResponse
  isNichesLoading: boolean
  highlightedUnitCode?: string | null
}

const SUMMARY_CARD_STYLES = {
  available: {
    container: 'bg-green-500/10 dark:bg-green-500/15 border border-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    value: 'text-green-700 dark:text-green-200',
    label: 'Available',
  },
  reserved: {
    container: 'bg-yellow-500/10 dark:bg-yellow-500/15 border border-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    value: 'text-yellow-700 dark:text-yellow-200',
    label: 'Reserved',
  },
  sold: {
    container: 'bg-red-500/10 dark:bg-red-500/15 border border-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    value: 'text-red-700 dark:text-red-200',
    label: 'Sold',
  },
  hold: {
    container: 'bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    value: 'text-cyan-700 dark:text-cyan-200',
    label: 'Hold',
  },
} as const

export function NicheDetails({
  selectedPlot,
  nicheData,
  isNichesLoading,
  highlightedUnitCode = null,
}: NicheDetailsProps) {
  const niches = nicheData?.niches ?? []
  const nicheStatusCounts = nicheData?.summary ?? {
    available: 0,
    reserved: 0,
    sold: 0,
    hold: 0,
  }
  const summaryCards = [
    { key: 'available', value: nicheStatusCounts.available },
    { key: 'reserved', value: nicheStatusCounts.reserved },
    { key: 'sold', value: nicheStatusCounts.sold },
    { key: 'hold', value: nicheStatusCounts.hold },
  ] as const

  return (
    <>
      {/* Niche grid + summary */}
      <div className="bg-secondary rounded-3xl p-2 space-y-2 w-full justify-center">
        {selectedPlot.niche_row && selectedPlot.niche_column && (
          <NicheGrids
            rows={selectedPlot.niche_row}
            cols={selectedPlot.niche_column}
            niches={niches}
            isLoading={isNichesLoading}
            highlightedUnitCode={highlightedUnitCode}
          />
        )}

        <div className="grid grid-cols-4 gap-2 text-xs bg-secondary/60 backdrop-blur-sm">
          {isNichesLoading || !nicheData
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-background/60 px-3 py-2 border border-border/40"
                >
                  <Skeleton className="h-3 w-12 rounded-sm" />
                  <Skeleton className="h-5 w-8 rounded-md" />
                </div>
              ))
            : (
                <>
                  {summaryCards.map(({ key, value }) => {
                    const styles = SUMMARY_CARD_STYLES[key]
                    return (
                      <div
                        key={key}
                        className={`flex items-center flex-col justify-between rounded-2xl px-3 py-2 transition-colors ${styles.container}`}
                      >
                        <span className={`text-[11px] font-medium ${styles.text}`}>
                          {styles.label}
                        </span>
                        <span className={`text-sm font-bold ${styles.value}`}>
                          {value}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
        </div>

      </div>
    </>
  )
}
