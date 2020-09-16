import TwitterApiSubClient from '../client.subclient';
import { API_V1_1_PREFIX } from '../globals';

/**
 * Base Twitter v1 client with only read right.
 */
export default class TwitterApiv1ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V1_1_PREFIX;
}
