import { API_V2_LABS_PREFIX } from '../globals';
import TwitterApiv2LabsReadWrite from './client.v2.labs.write';

/**
 * Twitter v2 labs client with all rights (read/write/DMs)
 */
export class TwitterApiv2Labs extends TwitterApiv2LabsReadWrite {
  protected _prefix = API_V2_LABS_PREFIX;

  /**
   * Get a client with read/write rights.
   */
  public get readWrite() {
    return this as TwitterApiv2LabsReadWrite;
  }
}

export default TwitterApiv2Labs;
