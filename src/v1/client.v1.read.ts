import TwitterApiSubClient from '../client.subclient';
import { API_V1_1_PREFIX, API_V1_1_STREAM_PREFIX } from '../globals';
import TwitterApiv1 from '../v1/client.v1';

/**
 * Base Twitter v1 client with only read right.
 */
export default class TwitterApiv1ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V1_1_PREFIX;

  /**
   * Create a client that is prefixed with `https//stream.twitter.com` instead of classic API.
   */
  public get stream() : this {
    const copiedClient = new TwitterApiv1(this);
    copiedClient.setPrefix(API_V1_1_STREAM_PREFIX);

    return copiedClient as any;
  }
}
