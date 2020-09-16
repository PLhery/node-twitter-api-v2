import TwitterApiBase from './client.base';

export default class TwitterApiv1 extends TwitterApiBase {
  protected static readonly PREFIX = 'https://api.twitter.com/1.1/';

  constructor(instance: TwitterApiBase) {
    super();

    if (!(instance instanceof TwitterApiBase)) {
      throw new Error('You must instance TwitterApiv1 instance from existing TwitterApi instance.');
    }

    const inst: TwitterApiv1 = instance;

    this._bearerToken = inst._bearerToken;
    this._consumerToken = inst._consumerToken;
    this._consumerSecret = inst._consumerSecret;
    this._accessToken = inst._accessToken;
    this._accessSecret = inst._accessSecret;
    this._oauth = inst._oauth;
    this._prefix = TwitterApiv1.PREFIX;
  }
}
