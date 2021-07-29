import { TwitterApi } from '..';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env' });

/** User OAuth 1.0a client */
export function getUserClient(this: any) {
  if (this.__client) {
    return this.__client as TwitterApi;
  }
  return this.__client = new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
    accessToken: process.env.OAUTH_TOKEN!,
    accessSecret: process.env.OAUTH_SECRET!,
  });
}

export async function sleepTest(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** User-unlogged OAuth 1.0a client */
export function getRequestClient() {
  return new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
  });
}

// Test auth 1.0a flow
export function getAuthLink(callback: string) {
  return getRequestClient().generateAuthLink(callback);
}

export async function getAccessClient(verifier: string) {
  const requestClient = new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
    accessToken: process.env.OAUTH_TOKEN!,
    accessSecret: process.env.OAUTH_SECRET!,
  });

  const { client } = await requestClient.login(verifier);
  return client;
}

/** App OAuth 2.0 client */
export function getAppClient() {
  let requestClient: TwitterApi;

  if (process.env.BEARER_TOKEN) {
    requestClient = new TwitterApi(process.env.BEARER_TOKEN);
    return Promise.resolve(requestClient);
  }
  else {
    requestClient = new TwitterApi({
      appKey: process.env.CONSUMER_TOKEN!,
      appSecret: process.env.CONSUMER_SECRET!,
    });
    return requestClient.appLogin();
  }
}
