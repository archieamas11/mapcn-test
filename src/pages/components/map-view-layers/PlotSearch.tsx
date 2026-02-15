import type { UnitSearchResult } from '@/types/plot.types'
import { SearchIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PLOT_CATEGORY } from '@/types/plot.types'
import { CATEGORY_LABEL } from './map-view.constants'

interface PlotSearchProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  hasSearchTerm: boolean
  isSearching: boolean
  hasResults: boolean
  searchResults: UnitSearchResult[]
  onSelectSearchResult: (result: UnitSearchResult) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  dropdownClassName?: string
  branchLabelPrefix?: string
  metaInfoClassName?: string
  onClear?: () => void
  showClearButton?: boolean
}

export function PlotSearch({
  searchTerm,
  onSearchTermChange,
  hasSearchTerm,
  isSearching,
  hasResults,
  searchResults,
  onSelectSearchResult,
  placeholder = 'Search...',
  className = 'flex w-full gap-1',
  inputClassName = 'peer dark:bg-background h-12 w-full rounded-full bg-white ps-12 pe-10 text-xs md:h-14 md:text-sm',
  dropdownClassName = 'absolute top-full mt-2 w-full rounded-2xl border bg-background shadow-lg overflow-hidden',
  branchLabelPrefix = '',
  metaInfoClassName = 'flex flex-col gap-2',
  onClear,
  showClearButton = false,
}: PlotSearchProps) {
  return (
    <div className={className}>
      <div className="relative flex-1 shadow-md rounded-full">
        <Input
          className={inputClassName}
          placeholder={placeholder}
          aria-label="Search lot"
          autoComplete="off"
          name="search"
          value={searchTerm}
          onChange={event => onSearchTermChange(event.target.value)}
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-5">
          <SearchIcon size={20} />
        </div>

        {showClearButton && onClear && (
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center rounded-e-full transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer pr-5"
            aria-label="Clear search"
            type="button"
            onClick={onClear}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {hasSearchTerm && (
          <div className={dropdownClassName}>
            {isSearching
              ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">Searching unit code...</p>
                )
              : hasResults
                ? (
                    <ul className="max-h-72 overflow-y-auto">
                      {searchResults.map(result => (
                        <li key={`${result.source_type}-${result.plot_id}-${result.unit_code ?? 'unknown'}-${result.niche_number ?? '0'}`}>
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                            onClick={() => onSelectSearchResult(result)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="font-medium text-sm">{result.unit_code ?? 'No Unit Code'}</span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {result.category === PLOT_CATEGORY.LAWN
                                    ? `Block ${result.block ?? 'N/A'}`
                                    : `Niche #${result.niche_number ?? 'N/A'}`}
                                </p>
                              </div>
                              <div className={metaInfoClassName}>
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {CATEGORY_LABEL[result.category] ?? result.category}
                                </span>
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {branchLabelPrefix}
                                  {result.branch_name ?? 'N/A'}
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                : (
                    <p className="px-4 py-3 text-xs text-muted-foreground">
                      No matching unit code found.
                    </p>
                  )}
          </div>
        )}
      </div>
    </div>
  )
}
