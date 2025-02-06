import { API_ADS_SANDBOX_PREFIX } from '../globals';
import TwitterAdsSandboxReadOnly from './client.ads-sandbox.read';

/**
 * Base Twitter ads sandbox client with read/write rights.
 */
export default class TwitterAdsSandboxReadWrite extends TwitterAdsSandboxReadOnly {
  protected _prefix = API_ADS_SANDBOX_PREFIX;

  /**
   * Get a client with only read rights.
   */
  public get readOnly() {
    return this as TwitterAdsSandboxReadOnly;
  }
}
