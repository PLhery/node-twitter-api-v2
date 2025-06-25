import { TwitterApi } from '..';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env' });

/** User OAuth 1.0a client */
export function getUserClient(this: any) {
  return new TwitterApi({
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
    accessToken: process.env.OAUTH_TOKEN!,
    accessSecret: process.env.OAUTH_SECRET!,
  });
}

export function getUserKeys() {
  return {
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
    accessToken: process.env.OAUTH_TOKEN!,
    accessSecret: process.env.OAUTH_SECRET!,
  };
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

export function getRequestKeys() {
  return {
    appKey: process.env.CONSUMER_TOKEN!,
    appSecret: process.env.CONSUMER_SECRET!,
  };
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

/** OAuth 2.0 user-context client for testing features requiring user scopes (like email access) */
export function getOAuth2UserClient() {
  if (!process.env.OAUTH2_ACCESS_TOKEN) {
    throw new Error('OAUTH2_ACCESS_TOKEN environment variable is required for OAuth 2.0 user-context authentication');
  }

  return new TwitterApi(process.env.OAUTH2_ACCESS_TOKEN);
}

/** Get OAuth 2.0 client for generating auth links (requires CLIENT_ID and CLIENT_SECRET) */
export function getOAuth2RequestClient() {
  return new TwitterApi({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  });
}

/** Generate OAuth 2.0 auth link with email scope for testing */
export function getOAuth2AuthLink(callback: string) {
  const client = getOAuth2RequestClient();
  return client.generateOAuth2AuthLink(callback, {
    scope: ['tweet.read', 'users.read', 'users.email', 'follows.read', 'offline.access'],
  });
}
