import TwitterApiv1 from '../v1/client.v1';
import TwitterApiv2 from '../v2/client.v2';
import { TwitterApiError } from '../types';
import TwitterApiBase from '../client.base';

// Lazy load TwitterApiReadWrite
const TwitterApiReadWritePromise = import('./readwrite').then(module => module.default);

// "Real" exported client for usage of TwitterApi.
/**
 * Twitter v1.1 and v2 API client.
 */
export class TwitterApi extends TwitterApiBase {
  protected _v1?: TwitterApiv1;
  protected _v2?: TwitterApiv2;
  private _readWriteInstance?: any;

  constructor(...args: ConstructorParameters<typeof TwitterApiBase>) {
    super(...args);
    TwitterApiReadWritePromise.then(TwitterApiReadWrite => {
      this._readWriteInstance = new TwitterApiReadWrite(...args);
    });
  }

  /* Direct access to subclients */
  public get v1() {
    if (this._v1) return this._v1;

    return this._v1 = new TwitterApiv1(this as TwitterApiBase);
  }

  public get v2() {
    if (this._v2) return this._v2;

    return this._v2 = new TwitterApiv2(this as TwitterApiBase);
  }

  /**
   * Get a client with read/write rights.
   */
  public async readWrite() {
    if (!this._readWriteInstance) {
      const TwitterApiReadWrite = await TwitterApiReadWritePromise;
      this._readWriteInstance = new TwitterApiReadWrite(this);
    }
    return this._readWriteInstance;
  }

  /* Static helpers */
  public static getErrors(error: any) {
    if (typeof error !== 'object')
      return [];

    if (!('data' in error))
      return [];

    return (error as TwitterApiError).data.errors ?? [];
  }

  /** Extract another image size than obtained in a `profile_image_url` or `profile_image_url_https` field of a user object. */
  public static getProfileImageInSize(profileImageUrl: string, size: 'normal' | 'bigger' | 'mini' | 'original') {
    const lastPart = profileImageUrl.split('/').pop()!;
    const sizes = ['normal', 'bigger', 'mini'];

    let originalUrl = profileImageUrl;

    for (const availableSize of sizes) {
      if (lastPart.includes(`_${availableSize}`)) {
        originalUrl = profileImageUrl.replace(`_${availableSize}`, '');
        break;
      }
    }

    if (size === 'original') {
      return originalUrl;
    }

    const extPos = originalUrl.lastIndexOf('.');
    if (extPos !== -1) {
      const ext = originalUrl.slice(extPos + 1);
      return originalUrl.slice(0, extPos) + '_' + size + '.' + ext;
    } else {
      return originalUrl + '_' + size;
    }
  }
}

export { TwitterApiReadWritePromise as TwitterApiReadWrite };
export { default as TwitterApiReadOnly } from './readonly';
export default TwitterApi;
