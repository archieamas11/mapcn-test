import type { Niche, PlotStatusType } from '@/types/plot.types'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PLOT_STATUS } from '@/types/plot.types'
import { getStatusStyle } from '@/utils/status-style'
import GridDialog from './dialogs/GridDialog'

const MAX_COLS_PER_PAGE = 10

interface Cell {
  row: number
  col: number
  status: PlotStatusType
  number: number
}

function buildVisibleGridCells(
  rows: number,
  startCol: number,
  endColExclusive: number,
  totalCols: number,
  statusesByNicheNumber: Record<number, PlotStatusType>,
) {
  const cells: Cell[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = startCol; c < endColExclusive; c++) {
      const nicheNumber = r * totalCols + c + 1
      cells.push({
        row: r,
        col: c,
        status: statusesByNicheNumber[nicheNumber] ?? PLOT_STATUS.NOT_AVAILABLE,
        number: nicheNumber,
      })
    }
  }

  return cells
}

export function NicheGrids({
  rows,
  cols,
  niches,
  isLoadingNiches,
}: {
  rows: number
  cols: number
  niches: Niche[]
  isLoadingNiches: boolean
}) {
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const statusesByNicheNumber = useMemo(() => {
    return niches.reduce<Record<number, PlotStatusType>>((accumulator, niche) => {
      accumulator[niche.niche_number] = niche.niche_status
      return accumulator
    }, {})
  }, [niches])

  const [columnPage, setColumnPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(cols / MAX_COLS_PER_PAGE))

  useEffect(() => {
    setColumnPage(currentPage => Math.min(currentPage, pageCount - 1))
  }, [pageCount])

  const isPaginated = cols > MAX_COLS_PER_PAGE
  const startCol = isPaginated ? columnPage * MAX_COLS_PER_PAGE : 0
  const endColExclusive = isPaginated
    ? Math.min(cols, startCol + MAX_COLS_PER_PAGE)
    : cols
  const visibleCols = Math.max(1, endColExclusive - startCol)

  const columnsRangeLabel = `Columns ${startCol + 1}-${endColExclusive} of ${cols}`
  const pageLabel = `${columnPage + 1} / ${pageCount}`

  const visibleCells = useMemo(
    () => buildVisibleGridCells(rows, startCol, endColExclusive, cols, statusesByNicheNumber),
    [rows, startCol, endColExclusive, cols, statusesByNicheNumber],
  )

  const skeletonCells = useMemo(() => {
    const maxSkeletonCells = 120
    const totalVisible = rows * visibleCols
    const count = Math.min(totalVisible, maxSkeletonCells)

    return Array.from({ length: count }, (_, index) => ({
      id: `skeleton-${index}`,
    }))
  }, [rows, visibleCols])

  const openGridDialog = (cell: Cell) => {
    setSelectedCell(cell)
    setIsOpen(true)
  }
  const closeGridDialog = () => {
    setIsOpen(false)
    setSelectedCell(null)
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

      <div className="overflow-hidden flex justify-center items-center">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleCols}, 32px)`,
          }}
        >
          {isLoadingNiches
            ? skeletonCells.map(cell => (
                <Skeleton
                  key={cell.id}
                  className="h-8 w-8 rounded-lg"
                />
              ))
            : visibleCells.map(cell => (
                <button
                  key={`${cell.row}-${cell.col}`}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-2 text-center font-semibold focus:outline-none w-8 h-8 ${getStatusStyle(cell.status)}`}
                  title={`Niche #${cell.number} - ${cell.status}`}
                  onClick={() => openGridDialog(cell)}
                >
                  <span className="text-[15px]">{cell.number}</span>
                </button>
              ))}
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
