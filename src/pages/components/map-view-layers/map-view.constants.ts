import { PLOT_CATEGORY } from '@/types/plot.types'

export const CATEGORY_LABEL: Record<string, string> = {
  [PLOT_CATEGORY.CHAMBERS]: 'Memorial Chambers',
  [PLOT_CATEGORY.COLUMBARIUM]: 'Columbarium',
  [PLOT_CATEGORY.LAWN]: 'Lawn Lot',
}

export const CATEGORY_DESCRIPTION: Record<string, string> = {
  [PLOT_CATEGORY.CHAMBERS]: 'A dignified memorial chamber with individual niches for placement and remembrance.',
  [PLOT_CATEGORY.COLUMBARIUM]: 'A peaceful columbarium with organized niches for eternal rest and peaceful remembrance.',
  [PLOT_CATEGORY.LAWN]: 'A serene lawn lot perfect for gatherings, ceremonies, and peaceful moments of reflection.',
}

export const NORMALIZED_CLUSTER_LABELS: Record<string, string> = {
  A: 'Cluster A',
  B: 'Cluster B',
  C: 'Cluster C',
  D: 'Cluster D',
  E: 'Cluster E',
  F: 'Cluster F',
  SM: 'St. Michael',
  SG: 'St. Gabriel',
}
