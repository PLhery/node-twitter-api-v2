export enum ETwitterStreamEvent {
  ConnectionError = 'connection error',
  ConnectionClosed = 'connection closed',
  ReconnectError = 'reconnect error',
  ReconnectLimitExceeded = 'reconnect limit exceeded',
  DataKeepAlive = 'data keep-alive',
  Data = 'data event content',
  TweetParseError = 'data tweet parse error',
  Error = 'stream error',
}

export interface TwitterApiTokens {
  appKey: string;
  appSecret: string;
  accessToken?: string;
  accessSecret?: string;
}

export interface TwitterApiBasicAuth {
  username: string;
  password: string;
}

export interface IClientTokenBearer {
  bearerToken: string;
  type: 'oauth2';
}

export interface IClientTokenBasic {
  token: string;
  type: 'basic';
}

export interface IClientTokenOauth {
  appKey: string;
  appSecret: string;
  accessToken?: string;
  accessSecret?: string;
  type: 'oauth-1.0a';
}

export interface IClientTokenNone {
  type: 'none';
}

export type TClientTokens = IClientTokenNone | IClientTokenBearer | IClientTokenOauth | IClientTokenBasic;
