import type { SelectedPlot } from '@/types/plot.types'
import { getLawnTypeColor, getPlotStatusColor } from '@/types/plot.types'

interface LawnDetailsProps {
  selectedPlot: SelectedPlot
}

export function LawnDetails({ selectedPlot }: LawnDetailsProps) {
  const lawnTypeColor = selectedPlot.lawn_type ? getLawnTypeColor(selectedPlot.lawn_type) : undefined
  const statusColor = selectedPlot.lawn_status ? getPlotStatusColor(selectedPlot.lawn_status) : undefined

  return (
    <div className="space-y-4">
      {/* Status and Type Section */}
      <div className="bg-secondary rounded-3xl p-4 border border-border/50">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/40 rounded-2xl p-3 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">
              Category
            </span>
            <div className="flex items-center gap-2">
              {lawnTypeColor && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: lawnTypeColor }}
                />
              )}
              <span className="text-sm font-semibold text-foreground capitalize">
                {selectedPlot.lawn_type ?? '—'}
              </span>
            </div>
          </div>
          <div className="bg-background/40 rounded-2xl p-3 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">
              Lawn status
            </span>
            <div className="flex items-center gap-2">
              {statusColor && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              )}
              <span className="text-sm font-semibold text-foreground capitalize">
                {selectedPlot.lawn_status ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
