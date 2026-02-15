import type { PlotStatusType } from '@/types/plot.types'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectPositioner, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NicheCell {
  row: number
  col: number
  status: PlotStatusType
  number: number
  niche_id: number
  unit_code: string | null
}

export default function GridDialog({
  isOpen,
  selectedCell,
  closeGridDialog,
  openGridDialog: _openGridDialog,
}: {
  isOpen: boolean
  selectedCell: NicheCell | null
  closeGridDialog: () => void
  openGridDialog: (cell: NicheCell) => void
}) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [unitCode, setUnitCode] = useState(selectedCell?.unit_code || '')
  const [status, setStatus] = useState(selectedCell?.status || '')

  const handleUpdateClick = () => {
    setUnitCode(selectedCell?.unit_code || '')
    setStatus(selectedCell?.status || '')
    setIsUpdateDialogOpen(true)
  }

  const handleUpdateSubmit = () => {
    // TODO: Implement update logic here
    setIsUpdateDialogOpen(false)
    closeGridDialog()
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeGridDialog()
            setIsUpdateDialogOpen(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Niche #
              {selectedCell?.number}
            </DialogTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status:</label>
                <p className="font-medium">{selectedCell?.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Unit Code:</label>
                <p className="font-medium">{selectedCell?.unit_code}</p>
              </div>
            </div>
          </DialogHeader>
          <Button onClick={handleUpdateClick}>
            Update Niche
          </Button>
        </DialogContent>
      </Dialog>

      {/* Update niche dialog */}
      <Dialog
        open={isUpdateDialogOpen}
        onOpenChange={(open) => {
          if (!open)
            setIsUpdateDialogOpen(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Niche Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Unit Code:</label>
              <Input
                value={unitCode}
                onChange={e => setUnitCode(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status:</label>
              <Select value={status} onValueChange={value => setStatus(value || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectPositioner>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="not_available">Not Available</SelectItem>
                  </SelectContent>
                </SelectPositioner>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSubmit}>
                OK
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
