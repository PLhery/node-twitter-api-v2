import TwitterApiSubClient from '../client.subclient';
import { API_V1_1_PREFIX, API_V1_1_STREAM_PREFIX } from '../globals';
import { arrayWrap } from '../helpers';
import TwitterApiv1 from '../v1/client.v1';
import { FilterStreamParams, SampleStreamParams } from './types.v1';

/**
 * Base Twitter v1 client with only read right.
 */
export default class TwitterApiv1ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V1_1_PREFIX;

  /**
   * Correspond to Twitter's stream.twitter.com/statuses/filter.
   */
  filterByStream(params: Partial<FilterStreamParams> = {}) {
    const parameters: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (key === 'follow') {
        const follow = value as FilterStreamParams['follow'];
        parameters.follow = arrayWrap(follow).map(item => item.toString()).join(',');
      }
      else if (key === 'track') {
        const track = value as FilterStreamParams['track'];
        parameters.track = arrayWrap(track).join(',');
      }
      else if (key === 'locations') {
        const locations = value as FilterStreamParams['locations'];
        parameters.locations = arrayWrap(locations).map(loc => `${loc.lng},${loc.lat}`).join(',');
      }
      else if (key === 'stall_warnings') {
        parameters.stall_warnings = String(value);
      }
      else {
        parameters[key] = value;
      }
    }

    const streamClient = this.stream;
    return streamClient.postStream('statuses/filter.json', parameters);
  }

  /**
   * Correspond to Twitter's stream.twitter.com/statuses/sample.
   */
   sampleByStream(params: Partial<SampleStreamParams> = {}) {
    const parameters: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (key === 'stall_warnings') {
        parameters.stall_warnings = String(value);
      }
      else {
        parameters[key] = value;
      }
    }

    const streamClient = this.stream;
    return streamClient.getStream('statuses/sample.json', parameters);
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
