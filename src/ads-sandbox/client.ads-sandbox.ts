import { API_ADS_SANDBOX_PREFIX } from '../globals';
import TwitterAdsSandboxReadWrite from './client.ads-sandbox.write';

/**
 * Twitter ads sandbox client with all rights (read/write)
 */
export class TwitterAdsSandbox extends TwitterAdsSandboxReadWrite {
  protected _prefix = API_ADS_SANDBOX_PREFIX;

  /**
   * Get a client with read/write rights.
   */
  public get readWrite() {
    return this as TwitterAdsSandboxReadWrite;
  }
}

export default TwitterAdsSandbox;
