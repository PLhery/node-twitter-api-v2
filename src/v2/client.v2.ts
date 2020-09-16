import { API_V2_PREFIX } from '../globals';
import TwitterApiv2ReadWrite from './client.v2.write';

/**
 * Twitter v2 client with all rights (read/write/DMs)
 */
export default class TwitterApiv2 extends TwitterApiv2ReadWrite {
  protected _prefix = API_V2_PREFIX;

  /**
   * Get a client with read/write rights.
   */
  public get readWrite() {
    return new TwitterApiv2ReadWrite(this);
  }
}
