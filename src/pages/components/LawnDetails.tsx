import type { SelectedPlot } from '@/types/plot.types'

interface LawnDetailsProps {
  selectedPlot: SelectedPlot
}

export function LawnDetails({ selectedPlot }: LawnDetailsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-0">
          <p className="text-xs text-muted-foreground">Width</p>
          <p className="text-lg font-semibold">{selectedPlot.width ?? '—'}</p>
        </div>
        <div className="space-y-0">
          <p className="text-xs text-muted-foreground">Length</p>
          <p className="text-lg font-semibold">
            {selectedPlot.length ?? '—'}
            {' '}
            m
          </p>
        </div>
        <div className="space-y-0">
          <p className="text-xs text-muted-foreground">Area</p>
          <p className="text-lg font-semibold">
            {selectedPlot.area ?? '—'}
            {' '}
            m²
          </p>
        </div>
      </div>

      <div className="bg-secondary rounded-3xl p-5 w-full mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</div>
            <div className="flex justify-center">
              <div
                className="text-foreground font-bold text-md leading-none rounded-full px-2 py-1 flex gap-1 items-center justify-center"
                aria-label="Plot Status"
                title="Plot Status"
              >
                <span className="text-xs capitalize leading-none">{selectedPlot.lawn_status ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2 border-l border-border">
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Category</div>
            <div className="flex justify-center">
              <span className="text-foreground font-bold text-md leading-none rounded-full px-2 py-1 flex gap-1 items-center justify-center">
                <span className="text-xs capitalize font-bold">{selectedPlot.lawn_type ?? '—'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
