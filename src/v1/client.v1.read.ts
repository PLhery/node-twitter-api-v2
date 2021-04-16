import TwitterApiSubClient from '../client.subclient';
import { API_V1_1_PREFIX, API_V1_1_STREAM_PREFIX } from '../globals';
import { arrayWrap } from '../helpers';
import TwitterApiv1 from '../v1/client.v1';
import type { FilterStreamV1Params, SampleStreamV1Params } from '../types';

/**
 * Base Twitter v1 client with only read right.
 */
export default class TwitterApiv1ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V1_1_PREFIX;

  /* Streaming API */

  /**
   * Returns public statuses that match one or more filter predicates.
   * Multiple parameters may be specified which allows most clients to use a single connection to the Streaming API.
   * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/api-reference/post-statuses-filter
   */
  filterStream(params: Partial<FilterStreamV1Params> = {}) {
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
  sampleStream(params: Partial<SampleStreamV1Params> = {}) {
    const streamClient = this.stream;
    return streamClient.getStream('statuses/sample.json', params);
  }

  /**
   * Create a client that is prefixed with `https//stream.twitter.com` instead of classic API URL.
   */
  public get stream() : this {
    const copiedClient = new TwitterApiv1(this);
    copiedClient.setPrefix(API_V1_1_STREAM_PREFIX);

    return copiedClient as any;
  }
}
