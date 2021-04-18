import { PlaceV1 } from './entities.v1.types';

export interface ReverseGeoCodeV1Params {
  lat: number;
  long: number;
  accuracy?: string;
  granularity?: 'city' | 'neighborhood' | 'country' | 'admin';
  max_results?: number;
}

export interface ReverseGeoCodeV1Result {
  query: {
    params: Partial<ReverseGeoCodeV1Params>;
    type: string;
    url: string;
  };
  result: { places: PlaceV1[] };
}


export interface SearchGeoV1Params extends Partial<ReverseGeoCodeV1Params> {
  ip?: string;
  query?: string;
}

export interface SearchGeoV1Result {
  query: {
    params: SearchGeoV1Params;
    type: string;
    url: string;
  };
  result: { places: PlaceV1[] };
}
