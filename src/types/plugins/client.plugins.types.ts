import type TwitterApiBase from '../../client.base';
import type { IGetHttpRequestArgs } from '../request-maker.mixin.types';
import type { TwitterResponse } from '../responses.types';
import { IComputedHttpRequestArgs } from '../request-maker.mixin.types';

export interface ITwitterApiClientPlugin {
  // Classic requests
  onBeforeRequestConfig?: TTwitterApiBeforeRequestConfigHook;
  onBeforeRequest?: TTwitterApiBeforeRequestHook;
  onAfterRequest?: TTwitterApiAfterRequestHook;
  // Stream requests
  onBeforeStreamRequestConfig?: TTwitterApiBeforeStreamRequestConfigHook;
}

export interface ITwitterApiBeforeRequestConfigHookArgs {
  client: TwitterApiBase;
  plugin: ITwitterApiClientPlugin;
  url: URL;
  params: IGetHttpRequestArgs;
}

export interface ITwitterApiBeforeRequestHookArgs extends ITwitterApiBeforeRequestConfigHookArgs {
  computedParams: IComputedHttpRequestArgs;
}

export interface ITwitterApiAfterRequestHookArgs extends ITwitterApiBeforeRequestHookArgs {
  response: TwitterResponse<any>;
}

export type TTwitterApiBeforeRequestConfigHook = (args: ITwitterApiBeforeRequestConfigHookArgs) => void | Promise<void>;
export type TTwitterApiBeforeRequestHook = (args: ITwitterApiBeforeRequestHookArgs) => void | Promise<void>;
export type TTwitterApiAfterRequestHook = (args: ITwitterApiAfterRequestHookArgs) => void | Promise<void>;

export type TTwitterApiBeforeStreamRequestConfigHook = (args: ITwitterApiBeforeRequestConfigHookArgs) => void;
