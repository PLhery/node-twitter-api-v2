import TwitterApiBase from './client.base';

export default class TwitterApiv2 extends TwitterApiBase {
  protected static readonly PREFIX = 'https://api.twitter.com/2/';

  constructor(instance: TwitterApiBase) {
    super();

    if (!(instance instanceof TwitterApiBase)) {
      throw new Error('You must instance TwitterApiv2 instance from existing TwitterApi instance.');
    }

    const inst: TwitterApiv2 = instance;

    this._bearerToken = inst._bearerToken;
    this._consumerToken = inst._consumerToken;
    this._consumerSecret = inst._consumerSecret;
    this._accessToken = inst._accessToken;
    this._accessSecret = inst._accessSecret;
    this._oauth = inst._oauth;
    this._prefix = TwitterApiv2.PREFIX;
  }
}
