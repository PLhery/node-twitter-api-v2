import { API_ADS_PREFIX } from '../globals';
import TwitterAdsReadWrite from './client.ads.write';
import TwitterAdsSandbox from '../ads-sandbox/client.ads-sandbox';

/**
 * Twitter ads client with all rights (read/write)
 */
export class TwitterAds extends TwitterAdsReadWrite {
  protected _prefix = API_ADS_PREFIX;
  protected _sandbox?: TwitterAdsSandbox;

  /**
   * Get a client with read/write rights.
   */
  public get readWrite() {
    return this as TwitterAdsReadWrite;
  }

  /**
   * Get Twitter Ads Sandbox API client
   */
  public get sandbox() {
    if (this._sandbox) return this._sandbox;
    return this._sandbox = new TwitterAdsSandbox(this);
  }
}

export default TwitterAds;
