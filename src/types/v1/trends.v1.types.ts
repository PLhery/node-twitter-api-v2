import { TrendLocationV1, TrendV1 } from './entities.v1.types';

export interface TrendsPlaceV1Params {
  exclude: string;
}

export interface TrendMatchV1 {
  trends: TrendV1[];
  as_of: string;
  created_at: string;
  locations: TrendLocationV1[];
}
