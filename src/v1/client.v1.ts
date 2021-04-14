import { API_V1_1_PREFIX } from '../globals';
import TwitterApiv1ReadWrite from './client.v1.write';

/**
 * Twitter v1.1 API client with read/write/DMs rights.
 */
export default class TwitterApiv1 extends TwitterApiv1ReadWrite {
  protected _prefix = API_V1_1_PREFIX;

  /**
   * Get a client with read/write rights.
   */
  public get readWrite() {
    return this as TwitterApiv1ReadWrite;
  }
}
