import TwitterApiv1 from '../v1/client.v1';
import TwitterApiv2 from '../v2/client.v2';
import { TwitterApiError } from '../types';
import TwitterApiReadWrite from './readwrite';


// "Real" exported client for usage of TwitterApi.
/**
 * Twitter v1.1 and v2 API client.
 */
export default class TwitterApi extends TwitterApiReadWrite {
  protected _v1?: TwitterApiv1;
  protected _v2?: TwitterApiv2;

  /* Direct access to subclients */
  public get v1() {
    if (this._v1) return this._v1;
    
    return this._v1 = new TwitterApiv1(this);
  }

  public get v2() {
    if (this._v2) return this._v2;
    
    return this._v2 = new TwitterApiv2(this);
  }

  /* Static helpers */
  public static getErrors(error: any) {
    if (typeof error !== 'object')
      return [];

    if (!('data' in error))
      return [];

    return (error as TwitterApiError).data.errors ?? [];
  }
}
