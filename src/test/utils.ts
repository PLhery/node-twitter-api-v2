import { TwitterApi } from '..';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env' });

/** User OAuth 1.0a client */
export function getUserClient() {
  return new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
    accessToken: process.env.OAUTH_TOKEN!,
    accessSecret: process.env.OAUTH_SECRET!,
  });
}

// Test auth 1.0a flow
export function getAuthLink(callback: string) {
  let requestClient = new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
  });

  return requestClient.generateAuthLink(callback);
}

export async function getAccessClient(verifier: string) {
  let requestClient = new TwitterApi({
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
