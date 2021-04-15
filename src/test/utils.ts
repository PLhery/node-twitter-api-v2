import { TwitterApi } from '..';
import dotenv from 'dotenv';

const ENV = dotenv.config({ path: __dirname + '/../../.env' }).parsed!;

export const currentEnv = ENV as any;

/** User OAuth 1.0a client */
export function getUserClient() {
  return new TwitterApi({
    appKey: ENV.CONSUMER_TOKEN!,
    appSecret: ENV.CONSUMER_SECRET!,
    accessToken: ENV.OAUTH_TOKEN!,
    accessSecret: ENV.OAUTH_SECRET!,
  });
}

// Test auth 1.0a flow
export function getAuthLink(callback: string) {
  let requestClient = new TwitterApi({
    appKey: ENV.CONSUMER_TOKEN!,
    appSecret: ENV.CONSUMER_SECRET!,
  });

  return requestClient.generateAuthLink(callback);
}

export function getAccessClient(verifier: string) {
  let requestClient = new TwitterApi({
    appKey: ENV.CONSUMER_TOKEN!,
    appSecret: ENV.CONSUMER_SECRET!,
    accessToken: ENV.OAUTH_TOKEN!,
    accessSecret: ENV.OAUTH_SECRET!,
  });

  return requestClient.login(verifier);
}

/** App OAuth 2.0 client */
export function getAppClient() {
  let requestClient: TwitterApi;

  if (ENV.BEARER_TOKEN) {
    requestClient = new TwitterApi(ENV.BEARER_TOKEN);
    return Promise.resolve(requestClient);
  }
  else {
    requestClient = new TwitterApi({
      appKey: ENV.CONSUMER_TOKEN!,
      appSecret: ENV.CONSUMER_SECRET!,
    });
    return requestClient.appLogin();
  }
}
