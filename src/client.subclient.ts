import TwitterApiBase from './client.base';

/**
 * Base subclient for every v1 and v2 client.
 */
export default abstract class TwitterApiSubClient extends TwitterApiBase {
  constructor(instance: TwitterApiBase) {
    super();

    if (!(instance instanceof TwitterApiBase)) {
      throw new Error('You must instance TwitterApiv1 instance from existing TwitterApi instance.');
    }

    const inst: TwitterApiSubClient = instance;

    this._bearerToken = inst._bearerToken;
    this._consumerToken = inst._consumerToken;
    this._consumerSecret = inst._consumerSecret;
    this._accessToken = inst._accessToken;
    this._accessSecret = inst._accessSecret;
    this._basicToken = inst._basicToken;
    this._oauth = inst._oauth;
    this._clientId = inst._clientId;
    this._rateLimits = inst._rateLimits;
    this._clientSettings = { ...inst._clientSettings };
  }
}
