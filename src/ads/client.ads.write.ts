import { API_ADS_PREFIX } from '../globals';
import TwitterAdsReadOnly from './client.ads.read';

/**
 * Base Twitter ads client with read/write rights.
 */
export default class TwitterAdsReadWrite extends TwitterAdsReadOnly {
  protected _prefix = API_ADS_PREFIX;

  /**
   * Get a client with only read rights.
   */
  public get readOnly() {
    return this as TwitterAdsReadOnly;
  }
}
