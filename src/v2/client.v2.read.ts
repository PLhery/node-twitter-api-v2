import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';

/**
 * Base Twitter v2 client with only read right.
 */
export default class TwitterApiv2ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V2_PREFIX;
}
