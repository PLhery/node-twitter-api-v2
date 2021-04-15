export enum ETwitterStreamEvent {
  ConnectionError = 'connection error',
  ConnectionClosed = 'connection closed',
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
