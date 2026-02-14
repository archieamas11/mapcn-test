import type { Niche, PlotStatusType } from '@/types/plot.types'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getStatusStyle } from '@/utils/status-style'
import GridDialog from './dialogs/GridDialog'

const MAX_COLS_PER_PAGE = 10

interface NicheCell {
  row: number
  col: number
  status: PlotStatusType
  number: number
  niche_id: number
  unit_code: string | null
}

/**
 * Maps raw Niche records into grid-positioned cells
 * using niche_number to derive row/col placements.
 */
function mapNichesToCells(niches: Niche[], cols: number): NicheCell[] {
  return niches.map(niche => ({
    niche_id: niche.niche_id,
    number: niche.niche_number,
    status: niche.niche_status,
    row: Math.floor((niche.niche_number - 1) / cols),
    col: (niche.niche_number - 1) % cols,
    unit_code: niche.unit_code,
  }))
}

interface NicheGridsProps {
  rows: number
  cols: number
  niches: Niche[]
  isLoading: boolean
  highlightedUnitCode?: string | null
}

export function NicheGrids({ rows: _rows, cols, niches, isLoading, highlightedUnitCode = null }: NicheGridsProps) {
  const [selectedCell, setSelectedCell] = useState<NicheCell | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const cells = useMemo(() => mapNichesToCells(niches, cols), [niches, cols])

  const [columnPage, setColumnPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(cols / MAX_COLS_PER_PAGE))

  // Reset to page 1 when cols or niches change
  useEffect(() => {
    setColumnPage(0)
  }, [cols, niches.length])

  useEffect(() => {
    if (!highlightedUnitCode || cols <= MAX_COLS_PER_PAGE) {
      return
    }

    const normalizedUnitCode = highlightedUnitCode.trim().toLowerCase()
    const targetCell = cells.find(cell => (cell.unit_code ?? '').trim().toLowerCase() === normalizedUnitCode)

    if (!targetCell) {
      return
    }

    const targetPage = Math.floor(targetCell.col / MAX_COLS_PER_PAGE)
    setColumnPage(targetPage)
  }, [highlightedUnitCode, cells, cols])

  const isPaginated = cols > MAX_COLS_PER_PAGE
  const startCol = isPaginated ? columnPage * MAX_COLS_PER_PAGE : 0
  const endColExclusive = isPaginated
    ? Math.min(cols, startCol + MAX_COLS_PER_PAGE)
    : cols
  const visibleCols = Math.max(1, endColExclusive - startCol)

  const columnsRangeLabel = `Columns ${startCol + 1}-${endColExclusive} of ${cols}`
  const pageLabel = `${columnPage + 1} / ${pageCount}`

  const visibleCells = useMemo(
    () => (isPaginated
      ? cells.filter(cell => cell.col >= startCol && cell.col < endColExclusive)
      : cells),
    [isPaginated, cells, startCol, endColExclusive],
  )

  const openGridDialog = (cell: NicheCell) => {
    setSelectedCell(cell)
    setIsOpen(true)
  }
  const closeGridDialog = () => {
    setIsOpen(false)
    setSelectedCell(null)
  }

  if (isLoading || cells.length === 0) {
    const skeletonRows = 5
    const skeletonCols = Math.min(cols || MAX_COLS_PER_PAGE, MAX_COLS_PER_PAGE)

    return (
      <div className="flex justify-center items-center py-4">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${skeletonCols}, 32px)`,
          }}
        >
          {Array.from({ length: skeletonRows * skeletonCols }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {isPaginated && (
        <div className="mb-2 flex items-center justify-between gap-2 px-4">
          <div className="text-sm text-muted-foreground">
            {columnsRangeLabel}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => setColumnPage(page => Math.max(0, page - 1))}
              disabled={columnPage === 0}
              aria-label="Previous columns page"
            >
              Prev
            </Button>
            <div className="text-sm tabular-nums text-muted-foreground">
              {pageLabel}
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setColumnPage(page => Math.min(pageCount - 1, page + 1))}
              disabled={columnPage >= pageCount - 1}
              aria-label="Next columns page"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center items-center">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleCols}, 32px)`,
          }}
        >
          {visibleCells.map((cell) => {
            const normalizedHighlightedUnitCode = highlightedUnitCode?.trim().toLowerCase() ?? ''
            const isHighlighted
              = normalizedHighlightedUnitCode.length > 0
                && (cell.unit_code ?? '').trim().toLowerCase() === normalizedHighlightedUnitCode

            return (
              <button
                key={cell.niche_id}
                className={cn(
                  `flex cursor-pointer items-center justify-center rounded-lg border-2 text-center font-semibold transition-all duration-150 hover:scale-110 hover:shadow-md focus:outline-none w-8 h-8 ${getStatusStyle(cell.status)}`,
                  cell.status === 'not_available' ? 'opacity-50 hover:scale-100 hover:shadow-none' : '',
                  isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md' : '',
                )}
                title={`Niche #${cell.number} - ${cell.status}`}
                onClick={() => openGridDialog(cell)}
              >
                <span className="text-[15px]">
                  {cell.status === 'not_available' ? '✕' : cell.number}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dialog for cell details */}
      <GridDialog
        isOpen={isOpen}
        selectedCell={selectedCell}
        closeGridDialog={closeGridDialog}
        openGridDialog={openGridDialog}
      />
    </>
  )
}
