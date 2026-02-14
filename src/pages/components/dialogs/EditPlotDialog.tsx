import type { SelectedPlot } from '@/types/plot.types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function EditPlotDialog({
  isOpen,
  selectedPlot,
  onClose,
}: {
  isOpen: boolean
  selectedPlot: SelectedPlot | null
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
              Edit Plot #
              {selectedPlot?.plot_id}
            </DialogTitle>
            <DialogDescription>
              Category:
              {' '}
              <span className="font-medium">{selectedPlot?.category}</span>
              <br />
              Status:
              {' '}
              <span className="font-medium">{selectedPlot?.lawn_status ?? 'N/A'}</span>
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
