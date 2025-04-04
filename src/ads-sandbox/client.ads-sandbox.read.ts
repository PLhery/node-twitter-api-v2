import TwitterApiSubClient from '../client.subclient';
import { API_ADS_SANDBOX_PREFIX } from '../globals';

/**
 * Base Twitter ads sandbox client with only read rights.
 */
export default class TwitterAdsSandboxReadOnly extends TwitterApiSubClient {
  protected _prefix = API_ADS_SANDBOX_PREFIX;
}
