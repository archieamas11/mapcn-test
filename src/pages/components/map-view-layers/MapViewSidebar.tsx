import type { SelectedPlot, UnitSearchResult } from '@/types/plot.types'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { useNichesByPlotId, useUnitCodeSearch } from '@/hooks/use-plots'
import { useSidebarStore } from '@/stores/sidebar-store'
import { PLOT_CATEGORY } from '@/types/plot.types'
import { LawnDetails } from '../LawnDetails'
import { NicheDetails } from '../NicheDetails'
import { NORMALIZED_CLUSTER_LABELS } from './map-view.constants'
import { isNicheCategory } from './plot-category.utils'
import { PlotInfoCard } from './PlotInfoCard'
import { PlotSearch } from './PlotSearch'

interface FloatingPlotSearchBarProps {
  onSelectSearchResult: (result: UnitSearchResult) => void
}

// Floating searchbar in the map view
function FloatingPlotSearchBar({ onSelectSearchResult }: FloatingPlotSearchBarProps) {
  const { open, openMobile, isMobile } = useSidebarStore(
    useShallow(state => ({
      open: state.open,
      openMobile: state.openMobile,
      isMobile: state.isMobile,
    })),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const isOpen = isMobile ? openMobile : open
  const { data: searchResults = [], isFetching: isSearching } = useUnitCodeSearch(debouncedSearchTerm)
  const hasSearchTerm = debouncedSearchTerm.trim().length > 0
  const hasResults = searchResults.length > 0

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setDebouncedSearchTerm('')
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.form
          layoutId="search-bar"
          className="flex w-full gap-1 absolute top-2 right-1/2 transform translate-x-1/2 z-20 max-w-xs sm:max-w-lg"
          role="search"
          aria-label="Admin lot search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onSubmit={event => event.preventDefault()}
        >
          <PlotSearch
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            hasSearchTerm={hasSearchTerm}
            isSearching={isSearching}
            hasResults={hasResults}
            searchResults={searchResults}
            onSelectSearchResult={onSelectSearchResult}
            className="flex w-full gap-1"
            inputClassName="peer h-12 w-full rounded-full bg-card dark:bg-card ps-12 pe-10 text-xs md:h-14 md:text-sm"
            dropdownClassName="absolute top-full mt-2 w-full rounded-2xl border bg-background shadow-lg overflow-hidden"
            branchLabelPrefix=""
            metaInfoClassName="flex flex-col"
          />
        </motion.form>
      )}
    </AnimatePresence>
  )
}

interface SidebarPlotContentProps {
  selectedPlot: SelectedPlot | null
  setSelectedPlot: (plot: SelectedPlot | null) => void
  highlightedUnitCode: string | null
  onSelectSearchResult: (result: UnitSearchResult) => void
}

function SidebarPlotContent({
  selectedPlot,
  setSelectedPlot,
  highlightedUnitCode,
  onSelectSearchResult,
}: SidebarPlotContentProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const hasSelectedNicheCategory = selectedPlot != null && isNicheCategory(selectedPlot.category)

  const { data: nicheData, isLoading: isNichesLoading } = useNichesByPlotId(
    hasSelectedNicheCategory ? selectedPlot.plot_id : null,
  )

  const niches = nicheData?.niches ?? []
  const fallbackNiche = niches[0] ?? null
  const displayCluster = selectedPlot?.cluster ?? fallbackNiche?.cluster ?? null
  const normalizedClusterLabel = NORMALIZED_CLUSTER_LABELS[displayCluster ?? ''] ?? displayCluster
  const displayBay = selectedPlot?.bay ?? fallbackNiche?.bay ?? null

  const { setOpen, setOpenMobile, isMobile } = useSidebarStore(
    useShallow(state => ({
      setOpen: state.setOpen,
      setOpenMobile: state.setOpenMobile,
      isMobile: state.isMobile,
    })),
  )

  const { data: searchResults = [], isFetching: isSearching } = useUnitCodeSearch(debouncedSearchTerm)
  const hasSearchTerm = debouncedSearchTerm.trim().length > 0
  const hasResults = searchResults.length > 0

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  const handleClearSelection = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')

    if (isMobile) {
      setOpenMobile(false)
    }
    else {
      setOpen(false)
    }

    setSelectedPlot(null)
  }

  const handleOpenEditDialog = () => {
    setIsEditOpen(true)
  }

  if (!selectedPlot) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Select a marker on the map to view details</p>
      </div>
    )
  }

  return (
    <>
      {/* Searchbar in sidebar content */}
      <div className="sticky top-0 px-3 pt-3 z-10 bg-transparent">
        <motion.form
          layoutId="search-bar"
          className="flex w-full gap-1"
          role="search"
          aria-label="Admin lot search"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onSubmit={event => event.preventDefault()}
        >
          <PlotSearch
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            hasSearchTerm={hasSearchTerm}
            isSearching={isSearching}
            hasResults={hasResults}
            searchResults={searchResults}
            onSelectSearchResult={(result) => {
              onSelectSearchResult(result)
              setSearchTerm('')
              setDebouncedSearchTerm('')
            }}
            className="flex w-full gap-1"
            inputClassName="peer h-12 w-full rounded-full bg-card dark:bg-card ps-12 pe-10 text-xs md:h-12 md:text-sm"
            dropdownClassName="absolute top-full mt-2 w-full rounded-2xl border bg-background shadow-lg overflow-hidden z-20"
            branchLabelPrefix="Branch: "
            metaInfoClassName="flex flex-col gap-2"
            onClear={handleClearSelection}
            showClearButton={Boolean(selectedPlot)}
          />
        </motion.form>
      </div>

      <div className="pb-8 px-3 space-y-2">
        <PlotInfoCard
          selectedPlot={selectedPlot}
          isNicheCategory={hasSelectedNicheCategory}
          isNichesLoading={isNichesLoading}
          normalizedClusterLabel={normalizedClusterLabel}
          displayBay={displayBay}
          isEditOpen={isEditOpen}
          onOpenEdit={handleOpenEditDialog}
          onCloseEdit={() => setIsEditOpen(false)}
        />

        {selectedPlot.category !== PLOT_CATEGORY.LAWN
          ? (
              <NicheDetails
                selectedPlot={selectedPlot}
                nicheData={nicheData}
                isNichesLoading={isNichesLoading}
                highlightedUnitCode={highlightedUnitCode}
              />
            )
          : <LawnDetails selectedPlot={selectedPlot} />}
      </div>
    </>
  )
}

interface MapViewSidebarProps {
  selectedPlot: SelectedPlot | null
  setSelectedPlot: (plot: SelectedPlot | null) => void
  highlightedUnitCode: string | null
  onSelectSearchResult: (result: UnitSearchResult) => void
}

export function MapViewSidebar({
  selectedPlot,
  setSelectedPlot,
  highlightedUnitCode,
  onSelectSearchResult,
}: MapViewSidebarProps) {
  return (
    <LayoutGroup>
      <FloatingPlotSearchBar onSelectSearchResult={onSelectSearchResult} />
      <Sidebar>
        <SidebarContent>
          <SidebarPlotContent
            selectedPlot={selectedPlot}
            setSelectedPlot={setSelectedPlot}
            highlightedUnitCode={highlightedUnitCode}
            onSelectSearchResult={onSelectSearchResult}
          />
        </SidebarContent>
      </Sidebar>
    </LayoutGroup>
  )
}
