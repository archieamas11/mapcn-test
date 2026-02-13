import type { LawnLot, Plot, PlotCategoryType, PlotLawnType, PlotStatusType } from './plot.types'

type LawnDimensions = Pick<LawnLot, 'width' | 'length' | 'area'>
type PlotGrid = Pick<Plot, 'niche_row' | 'niche_columns'>

export interface PlotFeatureProperties extends Partial<LawnDimensions> {
  id: number
  name: string
  category: PlotCategoryType
  image: string
  status: PlotStatusType
  lawn_type?: PlotLawnType
  rows?: PlotGrid['niche_row']
  columns?: PlotGrid['niche_columns']
}

export type SelectedPoint = Pick<
  PlotFeatureProperties,
  'id' | 'name' | 'category' | 'image' | 'status' | 'lawn_type' | 'width' | 'length' | 'area' | 'rows' | 'columns'
> & {
  coordinates: [number, number]
}

export type PlotStatusCounts = Record<PlotStatusType, number>
