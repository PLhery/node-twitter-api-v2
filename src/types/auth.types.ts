import type TwitterApi from '../client';

export interface RequestTokenArgs {
  authAccessType: 'read' | 'write';
  linkMode: 'authenticate' | 'authorize';
}

export interface RequestTokenResult {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: 'true';
}

export interface AccessTokenResult {
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
}

export interface BearerTokenResult {
  token_type: 'bearer';
  access_token: string;
}

export interface LoginResult {
  userId: string;
  screenName: string;
  accessToken: string;
  accessSecret: string;
  client: TwitterApi;
}
