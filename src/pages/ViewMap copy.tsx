import type { MapRef } from '@/components/ui/map'
import type { Branches } from '@/types/plot.types'
import { useEffect, useRef, useState } from 'react'
import { Map } from '@/components/ui/map'
import { Select, SelectContent, SelectItem, SelectPositioner, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useBranches } from '@/hooks/use-plots'
import { mapStyles } from './components/map.styles'
import { MarkersLayer } from './components/MapViewLayers'

const BRANCH_STORAGE_KEY = 'selected_branch_id'

/**
 * Extract [lng, lat] from a branch record.
 * Always parses through Number.parseFloat so string values from the DB work correctly.
 * Number.isFinite("123.79") === false, so we must parse first.
 */
function branchCenter(branch: Branches): [number, number] | null {
  const lng = Number.parseFloat(String(branch.lng))
  const lat = Number.parseFloat(String(branch.lat))

  if (!Number.isFinite(lng) || !Number.isFinite(lat))
    return null

  return [lng, lat]
}

function normalizeBranchId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined)
    return null

  const branchId = Number.parseInt(String(value), 10)
  return Number.isNaN(branchId) ? null : branchId
}

// ─── Default fallback center (Minglanilla) ───────────────────────────────────

const FALLBACK_CENTER: [number, number] = [123.79779924469761, 10.249290885383175]

function App() {
  const mapRef = useRef<MapRef>(null)
  const [style, setStyle] = useState<string>('arcgis-satellite')
  const selectedMapStyle = mapStyles.find(ms => ms.id === style)
  const selectedStyle = selectedMapStyle?.styleUrl
  const is3D = style === 'osm-3d'

  // ─── Branch state ────────────────────────────────────────────────────────
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches()
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (typeof window === 'undefined')
      return ''
    return window.localStorage.getItem(BRANCH_STORAGE_KEY) ?? ''
  })

  // Persist selected branch to localStorage
  useEffect(() => {
    if (typeof window === 'undefined')
      return

    if (selectedBranchId === '') {
      window.localStorage.removeItem(BRANCH_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(BRANCH_STORAGE_KEY, selectedBranchId)
  }, [selectedBranchId])

  // Auto-select first branch when data loads if stored value is no longer valid
  useEffect(() => {
    if (branches.length === 0)
      return

    const hasSelectedBranch = branches.some(
      branch => normalizeBranchId(branch.branch_id) === normalizeBranchId(selectedBranchId),
    )

    if (!hasSelectedBranch) {
      const firstBranchId = normalizeBranchId(branches[0].branch_id)
      setSelectedBranchId(firstBranchId !== null ? String(firstBranchId) : '')
    }
  }, [branches, selectedBranchId])

  // Stable initial center — computed once at mount before data is available.
  // We intentionally do NOT update this ref so it doesn't fight with flyTo.
  const initialMapCenter = useRef<[number, number]>(FALLBACK_CENTER)

  // Fly to selected branch whenever the selection or data changes
  useEffect(() => {
    if (!selectedBranchId || branches.length === 0 || !mapRef.current)
      return

    const branch = branches.find(
      b => normalizeBranchId(b.branch_id) === normalizeBranchId(selectedBranchId),
    )
    if (!branch)
      return

    const center = branchCenter(branch)
    if (!center)
      return

    mapRef.current.flyTo({
      center,
      zoom: 19,
      duration: 1500,
      essential: true,
    })
  }, [selectedBranchId, branches])

  // Toggle 3D pitch when map style changes
  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 })
  }, [is3D])

  const selectedBranchIdNumber = normalizeBranchId(selectedBranchId)

  const onBranchChange = (value: string | null) => {
    if (!value)
      return
    const id = Number.parseInt(value, 10)
    if (!Number.isNaN(id))
      setSelectedBranchId(value)
  }

  return (
    <div className="h-screen w-screen">
      <div className="h-full p-0 w-full">
        <Map
          ref={mapRef}
          center={initialMapCenter.current}
          zoom={19}
          styles={selectedStyle ? { light: selectedStyle, dark: selectedStyle } : undefined}
        >
          {/* Markers filtered by selected branch */}
          <MarkersLayer branchId={selectedBranchIdNumber} />
        </Map>

        {/* Map style selector — bottom-right overlay */}
        <div className="flex flex-row absolute bottom-2 right-2 gap-2">
          {/* Branch selector — top-left overlay */}
          <div className="z-10">
            {isBranchesLoading
              ? <Skeleton className="h-9 w-44 rounded-md" />
              : (
                  <Select
                    value={selectedBranchId}
                    onValueChange={onBranchChange}
                  >
                    <SelectTrigger className="bg-background text-foreground border rounded-md px-3 py-2 text-sm shadow w-fit min-w-[11rem]">
                      <SelectValue render={(_, { value }) => {
                        const selected = branches.find(b => String(b.branch_id) === value)
                        return selected ? <span>{selected.branch_name}</span> : <span>Select branch</span>
                      }}
                      />
                    </SelectTrigger>
                    <SelectPositioner>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.branch_id} value={String(branch.branch_id)}>
                            {branch.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectPositioner>
                  </Select>
                )}
          </div>
          <div className="z-10">
            <Select
              value={style}
              onValueChange={(value) => {
                if (value)
                  setStyle(value)
              }}
            >
              <SelectTrigger className="bg-background text-foreground border rounded-md px-3 py-2 text-sm shadow w-fit min-w-[11rem]">
                <SelectValue render={(_, { value }) => {
                  const selected = mapStyles.find(ms => ms.id === value)
                  return selected
                    ? (
                        <div className="flex gap-2">
                          {selected.name}
                          <img src={selected.image} alt={selected.name} className="w-4 h-4" />
                        </div>
                      )
                    : (
                        <span>Select a style</span>
                      )
                }}
                />
              </SelectTrigger>
              <SelectPositioner>
                <SelectContent>
                  {mapStyles.map(ms => (
                    <SelectItem key={ms.id} value={ms.id}>
                      <div className="flex gap-2">
                        {ms.name}
                        <img src={ms.image} alt={ms.name} className="w-4 h-4" />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectPositioner>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
