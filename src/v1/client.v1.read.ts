import TwitterApiSubClient from '../client.subclient';
import { API_V1_1_PREFIX, API_V1_1_STREAM_PREFIX } from '../globals';
import { arrayWrap } from '../helpers';
import TwitterApiv1 from '../v1/client.v1';
import type {
  FilterStreamV1Params,
  SampleStreamV1Params,
  UserV1,
  VerifyCredentialsV1Params,
  AppRateLimitV1Result,
  TAppRateLimitResourceV1,
  HelpLanguageV1Result,
  HelpConfigurationV1Result,
  ReverseGeoCodeV1Params,
  ReverseGeoCodeV1Result,
  PlaceV1,
  SearchGeoV1Params,
  SearchGeoV1Result,
  TrendMatchV1,
  TrendsPlaceV1Params, TrendLocationV1,
} from '../types';

/**
 * Base Twitter v1 client with only read right.
 */
export default class TwitterApiv1ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V1_1_PREFIX;

  /* Users */

  /**
   * Returns an HTTP 200 OK response code and a representation of the requesting user if authentication was successful;
   * returns a 401 status code and an error message if not.
   * Use this method to test if supplied user credentials are valid.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
   */
  public verifyCredentials(options: Partial<VerifyCredentialsV1Params> = {}) {
    return this.get<UserV1>('account/verify_credentials.json', options);
  }

  /* Streaming API */

  /**
   * Returns public statuses that match one or more filter predicates.
   * Multiple parameters may be specified which allows most clients to use a single connection to the Streaming API.
   * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/api-reference/post-statuses-filter
   */
  public filterStream(params: Partial<FilterStreamV1Params> = {}) {
    const parameters: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (key === 'follow' || key === 'track') {
        parameters[key] = value.toString();
      }
      else if (key === 'locations') {
        const locations = value as FilterStreamV1Params['locations'];
        parameters.locations = arrayWrap(locations).map(loc => `${loc.lng},${loc.lat}`).join(',');
      }
      else {
        parameters[key] = value;
      }
    }

    const streamClient = this.stream;
    return streamClient.postStream('statuses/filter.json', parameters);
  }

  /**
   * Returns a small random sample of all public statuses.
   * The Tweets returned by the default access level are the same, so if two different clients connect to this endpoint, they will see the same Tweets.
   * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/sample-realtime/api-reference/get-statuses-sample
   */
  public sampleStream(params: Partial<SampleStreamV1Params> = {}) {
    const streamClient = this.stream;
    return streamClient.getStream('statuses/sample.json', params);
  }

  /**
   * Create a client that is prefixed with `https//stream.twitter.com` instead of classic API URL.
   */
  public get stream(): this {
    const copiedClient = new TwitterApiv1(this);
    copiedClient.setPrefix(API_V1_1_STREAM_PREFIX);

    return copiedClient as any;
  }

  /* Trends API */

  /**
   * Returns the top 50 trending topics for a specific id, if trending information is available for it.
   * Note: The id parameter for this endpoint is the "where on earth identifier" or WOEID, which is a legacy identifier created by Yahoo and has been deprecated.
   * https://developer.twitter.com/en/docs/twitter-api/v1/trends/trends-for-location/api-reference/get-trends-place
   */
  public trendsByPlace(woeId: string | number, options: Partial<TrendsPlaceV1Params> = {}) {
    return this.get<TrendMatchV1[]>('trends/place.json', { id: woeId, ...options });
  }

  /**
   * Returns the locations that Twitter has trending topic information for.
   * The response is an array of "locations" that encode the location's WOEID
   * and some other human-readable information such as a canonical name and country the location belongs in.
   * https://developer.twitter.com/en/docs/twitter-api/v1/trends/locations-with-trending-topics/api-reference/get-trends-available
   */
  public trendsAvailable() {
    return this.get<TrendLocationV1[]>('trends/available.json');
  }

  /**
   * Returns the locations that Twitter has trending topic information for, closest to a specified location.
   * https://developer.twitter.com/en/docs/twitter-api/v1/trends/locations-with-trending-topics/api-reference/get-trends-closest
   */
  public trendsClosest(lat: number, long: number) {
    return this.get<TrendLocationV1[]>('trends/closest.json', { lat, long });
  }

  /* Geo API */

  /**
   * Returns all the information about a known place.
   * https://developer.twitter.com/en/docs/twitter-api/v1/geo/place-information/api-reference/get-geo-id-place_id
   */
  public geoPlace(placeId: string) {
    return this.get<PlaceV1>(`geo/id/${placeId}.json`);
  }

  /**
   * Search for places that can be attached to a Tweet via POST statuses/update.
   * This request will return a list of all the valid places that can be used as the place_id when updating a status.
   * https://developer.twitter.com/en/docs/twitter-api/v1/geo/places-near-location/api-reference/get-geo-search
   */
  public geoSearch(options: Partial<SearchGeoV1Params>) {
    return this.get<SearchGeoV1Result>('geo/search.json', options);
  }

  /**
   * Given a latitude and a longitude, searches for up to 20 places that can be used as a place_id when updating a status.
   * This request is an informative call and will deliver generalized results about geography.
   * https://developer.twitter.com/en/docs/twitter-api/v1/geo/places-near-location/api-reference/get-geo-reverse_geocode
   */
  public geoReverseGeoCode(options: ReverseGeoCodeV1Params) {
    return this.get<ReverseGeoCodeV1Result>('geo/reverse_geocode.json', options as Partial<ReverseGeoCodeV1Params>);
  }

  /* Developer utilities */

  /**
   * Returns the current rate limits for methods belonging to the specified resource families.
   * Each API resource belongs to a "resource family" which is indicated in its method documentation.
   * The method's resource family can be determined from the first component of the path after the resource version.
   * https://developer.twitter.com/en/docs/twitter-api/v1/developer-utilities/rate-limit-status/api-reference/get-application-rate_limit_status
   */
  public rateLimitStatuses(...resources: TAppRateLimitResourceV1[]) {
    return this.get<AppRateLimitV1Result>('application/rate_limit_status.json', { resources });
  }

  /**
   * Returns the list of languages supported by Twitter along with the language code supported by Twitter.
   * https://developer.twitter.com/en/docs/twitter-api/v1/developer-utilities/supported-languages/api-reference/get-help-languages
   */
  public supportedLanguages() {
    return this.get<HelpLanguageV1Result[]>('help/languages.json');
  }

  /**
   * Returns the current configuration used by Twitter including twitter.com slugs which are not usernames, maximum photo resolutions, and t.co shortened URL length.
   * https://developer.twitter.com/en/docs/twitter-api/v1/developer-utilities/configuration/api-reference/get-help-configuration
   */
  public twitterConfigurationLimits() {
    return this.get<HelpConfigurationV1Result>('help/configuration.json');
  }
}
