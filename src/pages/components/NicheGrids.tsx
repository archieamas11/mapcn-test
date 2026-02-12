import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getStatusStyle } from '@/utils/status-style'
import GridDialog from './dialogs/GridDialog'

const MAX_COLS_PER_PAGE = 10

interface Cell {
  row: number
  col: number
  status: string
  number: number
}

function generateGridCells(rows: number, cols: number) {
  const cells: Cell[] = []
  const statuses = ['available', 'sold', 'reserved', 'hold'] as const

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      cells.push({
        row: r,
        col: c,
        status: randomStatus,
        number: r * cols + c + 1,
      })
    }
  }

  return cells
}

export function NicheGrids({
  rows,
  cols,
}: {
  rows: number
  cols: number
}) {
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const [cells, setCells] = useState<Cell[]>(() => generateGridCells(rows, cols))
  useEffect(() => {
    setCells(generateGridCells(rows, cols))
  }, [rows, cols])

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

  const visibleCells = isPaginated
    ? cells.filter(cell => cell.col >= startCol && cell.col < endColExclusive)
    : cells

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
          {visibleCells.map(cell => (
            <button
              key={`${cell.row}-${cell.col}`}
              className={`flex cursor-pointer items-center justify-center rounded-lg border-2 text-center font-semibold transition-all duration-150 hover:scale-110 hover:shadow-md focus:outline-none w-8 h-8 ${getStatusStyle(cell.status)}`}
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
