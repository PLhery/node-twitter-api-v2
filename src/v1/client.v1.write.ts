import { API_V1_1_PREFIX } from '../globals';
import TwitterApiv1ReadOnly from './client.v1.read';
import { SendTweetParams } from './types.v1';

/**
 * Base Twitter v1 client with read/write rights.
 */
export default class TwitterApiv1ReadWrite extends TwitterApiv1ReadOnly {
  protected _prefix = API_V1_1_PREFIX;

  /**
   * Get a client with only read rights.
   */
  public get readOnly() {
    return this as TwitterApiv1ReadOnly;
  }

  /**
   * Post a new tweet.
   */
  public async tweet(status: string, payload: Partial<SendTweetParams> = {}) {
    return this.post('statuses/update.json', { status, ...payload });
  }

  /**
   * Reply to an existing tweet.
   */
  public async reply(status: string, in_reply_to_status_id: string, payload: Partial<SendTweetParams> = {}) {
    return this.tweet(status, {
      auto_populate_reply_metadata: true,
      in_reply_to_status_id,
      ...payload,
    });
  }
}
