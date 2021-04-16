import TwitterApiSubClient from '../client.subclient';
import { API_V2_LABS_PREFIX } from '../globals';

/**
 * Base Twitter v2 labs client with only read right.
 */
export default class TwitterApiv2LabsReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V2_LABS_PREFIX;
}
