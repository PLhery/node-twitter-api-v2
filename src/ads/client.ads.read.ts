import TwitterApiSubClient from '../client.subclient';
import { API_ADS_PREFIX } from '../globals';

/**
 * Base Twitter ads client with only read rights.
 */
export default class TwitterAdsReadOnly extends TwitterApiSubClient {
  protected _prefix = API_ADS_PREFIX;
}
