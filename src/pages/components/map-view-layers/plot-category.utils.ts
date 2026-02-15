import type { SelectedPlot } from '@/types/plot.types'
import { PLOT_CATEGORY } from '@/types/plot.types'

export function isNicheCategory(category: SelectedPlot['category']): boolean {
  return category === PLOT_CATEGORY.CHAMBERS || category === PLOT_CATEGORY.COLUMBARIUM
}
