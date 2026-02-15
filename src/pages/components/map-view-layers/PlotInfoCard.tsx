/* eslint-disable no-alert */
import type { SelectedPlot } from '@/types/plot.types'
import { ExternalLink, Navigation, Pencil, PrinterIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PLOT_CATEGORY } from '@/types/plot.types'
import EditPlotDialog from '../dialogs/EditPlotDialog'
import { CATEGORY_DESCRIPTION, CATEGORY_LABEL } from './map-view.constants'

interface PlotInfoCardProps {
  selectedPlot: SelectedPlot
  isNicheCategory: boolean
  isNichesLoading: boolean
  normalizedClusterLabel?: string | null
  displayBay?: number | null
  isEditOpen: boolean
  onOpenEdit: () => void
  onCloseEdit: () => void
}

export function PlotInfoCard({
  selectedPlot,
  isNicheCategory,
  isNichesLoading,
  normalizedClusterLabel,
  displayBay,
  isEditOpen,
  onOpenEdit,
  onCloseEdit,
}: PlotInfoCardProps) {
  return (
    <div className="w-full bg-secondary rounded-3xl">
      <div className="relative">
        <img
          src={selectedPlot.image_url}
          className="object-cover w-full h-60 rounded-t-3xl"
          alt="plot"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-60 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--secondary) 0%, transparent 100%)',
          }}
        >
        </div>
      </div>
      <div className="space-y-4 pb-4">
        <span className="text-lg text-primary uppercase tracking-wide font-bold justify-center flex">
          {CATEGORY_LABEL[selectedPlot.category] ?? ''}
        </span>
        <div className="border-t border-primary border-2 relative">
          <Badge className="absolute top-[-12px] left-1/2 -translate-x-1/2 rounded-full">
            <span className="text-sm font-medium text-primary-foreground uppercase tracking-wide">
              {isNicheCategory
                ? isNichesLoading
                  ? <Skeleton className="h-4 w-28 rounded-sm" />
                  : (normalizedClusterLabel ? `${normalizedClusterLabel}${displayBay != null ? ` - Bay ${displayBay}` : ''}` : '')
                : (selectedPlot.block && selectedPlot.unit_code
                    ? `Block ${selectedPlot.block} - ${selectedPlot.unit_code}`
                    : ''
                  )}
            </span>
          </Badge>
        </div>
        <span className="font-medium flex max-w-80 w-full mx-auto text-sm text-foreground leading-tight justify-center text-center">
          {CATEGORY_DESCRIPTION[selectedPlot.category] ?? ''}
        </span>
        {/* Sidebar Button Controls */}
        <div className="flex justify-evenly">
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-10 h-10 flex items-center justify-center p-0"
              title="Get Direction"
              onClick={() => alert('Get Direction clicked')}
            >
              <Navigation className="size-4" />
            </Button>
            <span className="text-foreground-muted">Direction</span>
          </div>
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-10 h-10 flex items-center justify-center p-0"
              title="Share Plot"
              onClick={() => alert('Share Plot clicked')}
            >
              <ExternalLink className="size-4" />
            </Button>
            <span className="text-foreground-muted">Share</span>
          </div>
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-10 h-10 flex items-center justify-center p-0"
              title="Print Plot"
              onClick={() => alert('Print Plot clicked')}
            >
              <PrinterIcon className="size-4" />
            </Button>
            <span className="text-foreground-muted">Print</span>
          </div>

          <div className="flex flex-col items-center">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-10 h-10 flex items-center justify-center p-0"
              title="Edit Plot"
              onClick={onOpenEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <span className="text-foreground-muted">Edit</span>
          </div>
        </div>
        <div className="border-t border-border/50"></div>
        <>
          {selectedPlot.category !== PLOT_CATEGORY.LAWN
            ? (
                <div className="bg-secondary rounded-3xl">
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
              )
            : (
                <div className="bg-secondary rounded-3xl">
                  <div className="grid grid-cols-3 divide-x divide-border text-center rounded-lg overflow-hidden">
                    <div className="flex flex-col items-center py-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Width</span>
                      <span className="text-lg font-bold text-foreground">
                        {selectedPlot.width ?? '—'}
                        m
                      </span>
                    </div>
                    <div className="flex flex-col items-center py-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Length</span>
                      <span className="text-lg font-bold text-foreground">
                        {selectedPlot.length ?? '—'}
                        m
                      </span>
                    </div>
                    <div className="flex flex-col items-center py-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Area</span>
                      <span className="text-lg font-bold text-foreground">
                        {selectedPlot.area ?? '—'}
                        m²
                      </span>
                    </div>
                  </div>
                </div>
              )}
        </>

        <EditPlotDialog
          isOpen={isEditOpen}
          selectedPlot={selectedPlot}
          onClose={onCloseEdit}
        />
      </div>
    </div>
  )
}
