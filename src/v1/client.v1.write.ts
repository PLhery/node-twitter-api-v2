import { API_V1_1_PREFIX } from '../globals';
import TwitterApiv1ReadOnly from './client.v1.read';

/**
 * Base Twitter v1 client with read/write rights.
 */
export default class TwitterApiv1ReadWrite extends TwitterApiv1ReadOnly {
  protected _prefix = API_V1_1_PREFIX;
}
