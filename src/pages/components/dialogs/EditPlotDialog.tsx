import type { SelectedPoint } from '@/types/plot-marker.types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function EditPlotDialog({
  isOpen,
  selectedPoint,
  onClose,
}: {
  isOpen: boolean
  selectedPoint: SelectedPoint | null
  onClose: () => void
}) {
  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open)
            onClose()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Plot:
              {' '}
              {selectedPoint?.name}
            </DialogTitle>
            <DialogDescription>
              Category:
              {' '}
              <span className="font-medium">{selectedPoint?.category}</span>
              <br />
              Status:
              {' '}
              <span className="font-medium">{selectedPoint?.status}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 mt-4">
              <Button
                className="bg-secondary text-secondary-foreground"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary"
                onClick={() => {
                  onClose()
                  // TODO: Implement save logic
                }}
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
