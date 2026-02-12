import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import GridDialog from './dialogs/GridDialog'

const MAX_COLS_PER_PAGE = 10

function getCellSize(cols: number) {
  if (cols <= 10)
    return 'min-h-8 text-lg'
  if (cols <= 20)
    return 'min-h-6 text-lg'
  if (cols <= 30)
    return 'min-h-5 text-lg'
  return 'min-h-4 text-lg'
}

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

  const cellSize = getCellSize(visibleCols)

  const openGridDialog = (cell: Cell) => {
    setSelectedCell(cell)
    setIsOpen(true)
  }
  const closeGridDialog = () => {
    setIsOpen(false)
    setSelectedCell(null)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-400 border-green-600 text-green-900 hover:bg-green-500'
      case 'sold':
        return 'bg-red-400 border-red-600 text-red-900 hover:bg-red-500'
      case 'reserved':
        return 'bg-yellow-400 border-yellow-600 text-yellow-900 hover:bg-yellow-500'
      case 'hold':
        return 'bg-cyan-400 border-cyan-600 text-cyan-900 hover:bg-cyan-500'
      default:
        return 'bg-gray-300 border-gray-500'
    }
  }

  return (
    <>
      {isPaginated && (
        <div className="mb-2 flex items-center justify-between gap-2">
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

      <div className="overflow-y-auto overflow-x-hidden rounded-lg bg-secondary p-2 w-full">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleCols}, minmax(0, 1fr))`,
          }}
        >
          {visibleCells.map(cell => (
            <button
              key={`${cell.row}-${cell.col}`}
              className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-sm border-2 text-center font-semibold transition-all duration-150 hover:scale-110 hover:shadow-md focus:outline-none ${cellSize} ${getStatusStyle(cell.status)}`}
              title={`Niche #${cell.number} - ${cell.status}`}
              onClick={() => openGridDialog(cell)}
            >
              <span className="text-[18px]">{cell.number}</span>
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
