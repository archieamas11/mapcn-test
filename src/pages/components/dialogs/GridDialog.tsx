import type { PlotStatusType } from '@/types/plot.types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Cell {
  row: number
  col: number
  status: PlotStatusType
  number: number
}

export default function GridDialog({
  isOpen,
  selectedCell,
  closeGridDialog,
  openGridDialog: _openGridDialog,
}: {
  isOpen: boolean
  selectedCell: Cell | null
  closeGridDialog: () => void
  openGridDialog: (cell: Cell) => void
}) {
  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open)
            closeGridDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Niche #
              {selectedCell?.number}
            </DialogTitle>
            <DialogDescription>
              Status:
              <span className="font-medium">{selectedCell?.status}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 mt-4">
              <Button
                className="bg-secondary text-secondary-foreground"
                onClick={closeGridDialog}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary"
                onClick={() => {
                  closeGridDialog()
                }}
              >
                OK
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
