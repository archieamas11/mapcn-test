function getCellSize(cols: number) {
  if (cols <= 10)
    return 'min-h-8 min-w-8 text-lg'
  if (cols <= 20)
    return 'min-h-6 min-w-6 text-lg'
  if (cols <= 30)
    return 'min-h-5 min-w-5 text-lg'
  return 'min-h-4 min-w-4 text-lg'
}

export function NicheGridDisplay({
  rows,
  cols,
}: {
  rows: number
  cols: number
}) {
  // Generate grid cells with random status
  const generateGridCells = () => {
    const cells = []
    const statuses = ['available', 'sold', 'reserved', 'hold']

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const randomStatus
          = statuses[Math.floor(Math.random() * statuses.length)]
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

  const cellSize = getCellSize(cols)
  const cells = generateGridCells()

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
    <div className="mt-4 max-h-[300px] overflow-auto rounded-lg border bg-white p-3">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          width: cols > 15 ? `${cols * 32}px` : '100%',
        }}
      >
        {cells.map(cell => (
          <button
            key={`${cell.row}-${cell.col}`}
            className={`relative flex cursor-pointer items-center justify-center rounded-sm border-2 text-center font-semibold transition-all duration-150 hover:scale-110 hover:shadow-md focus:outline-none ${cellSize} ${getStatusStyle(cell.status)}`}
            title={`Niche #${cell.number} - ${cell.status}`}
          >
            <span>{cell.number}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
