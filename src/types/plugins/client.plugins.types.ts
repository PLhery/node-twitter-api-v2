import type { ClientRequestArgs } from 'http';
import type TwitterApiBase from '../../client.base';
import type { IGetHttpRequestArgs } from '../request-maker.mixin.types';
import type { TwitterResponse } from '../responses.types';
import type { IComputedHttpRequestArgs } from '../request-maker.mixin.types';
import type { IOAuth2RequestTokenResult, RequestTokenResult } from '../auth.types';
import type { PromiseOrType } from '../shared.types';

export interface ITwitterApiClientPlugin {
  // Classic requests
  onBeforeRequestConfig?: TTwitterApiBeforeRequestConfigHook;
  onBeforeRequest?: TTwitterApiBeforeRequestHook;
  onAfterRequest?: TTwitterApiAfterRequestHook;
  // Stream requests
  onBeforeStreamRequestConfig?: TTwitterApiBeforeStreamRequestConfigHook;
  // Request token
  onOAuth1RequestToken?: TTwitterApiAfterOAuth1RequestTokenHook;
  onOAuth2RequestToken?: TTwitterApiAfterOAuth2RequestTokenHook;
}

// - Requests -

export interface ITwitterApiBeforeRequestConfigHookArgs {
  client: TwitterApiBase;
  plugin: ITwitterApiClientPlugin;
  url: URL;
  params: IGetHttpRequestArgs;
}

export interface ITwitterApiBeforeRequestHookArgs extends ITwitterApiBeforeRequestConfigHookArgs {
  computedParams: IComputedHttpRequestArgs;
  requestOptions: Partial<ClientRequestArgs>
}

export interface ITwitterApiAfterRequestHookArgs extends ITwitterApiBeforeRequestHookArgs {
  response: TwitterResponse<any>;
}

export type TTwitterApiBeforeRequestConfigHook = (args: ITwitterApiBeforeRequestConfigHookArgs) => PromiseOrType<TwitterResponse<any> | void>;
export type TTwitterApiBeforeRequestHook = (args: ITwitterApiBeforeRequestHookArgs) => void | Promise<void>;
export type TTwitterApiAfterRequestHook = (args: ITwitterApiAfterRequestHookArgs) => void | Promise<void>;

export type TTwitterApiBeforeStreamRequestConfigHook = (args: ITwitterApiBeforeRequestConfigHookArgs) => void;


// - Auth -

export interface ITwitterApiAfterOAuth1RequestTokenHookArgs {
  client: TwitterApiBase;
  plugin: ITwitterApiClientPlugin;
  url: string;
  oauthResult: RequestTokenResult;
}

export interface ITwitterApiAfterOAuth2RequestTokenHookArgs {
  client: TwitterApiBase;
  plugin: ITwitterApiClientPlugin;
  result: IOAuth2RequestTokenResult;
  redirectUri: string;
}

export type TTwitterApiAfterOAuth1RequestTokenHook = (args: ITwitterApiAfterOAuth1RequestTokenHookArgs) => void | Promise<void>;
export type TTwitterApiAfterOAuth2RequestTokenHook = (args: ITwitterApiAfterOAuth2RequestTokenHookArgs) => void | Promise<void>;
