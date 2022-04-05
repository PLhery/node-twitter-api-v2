import type { ClientRequestArgs } from 'http';
import type { ClientRequestMaker } from '../client-mixins/request-maker.mixin';
import { ApiPartialResponseError, ApiRequestError, ApiResponseError, IGetHttpRequestArgs, TwitterApiPluginResponseOverride } from '../types';
import type { IComputedHttpRequestArgs } from '../types/request-maker.mixin.types';

/* Plugin helpers */

export function hasRequestErrorPlugins(client: ClientRequestMaker) {
  if (!client.clientSettings.plugins?.length) {
    return false;
  }

  for (const plugin of client.clientSettings.plugins) {
    if (plugin.onRequestError || plugin.onResponseError) {
      return true;
    }
  }

  return false;
}

export async function applyResponseHooks(
  this: ClientRequestMaker,
  requestParams: IGetHttpRequestArgs,
  computedParams: IComputedHttpRequestArgs,
  requestOptions: Partial<ClientRequestArgs>,
  error: any,
) {
  if (error instanceof ApiRequestError || error instanceof ApiPartialResponseError) {
    await this.applyPluginMethod('onRequestError', {
      client: this,
      url: this.getUrlObjectFromUrlString(requestParams.url),
      params: requestParams,
      computedParams,
      requestOptions,
      error,
    });
  } else if (error instanceof ApiResponseError) {
    const override = await this.applyPluginMethod('onResponseError', {
      client: this,
      url: this.getUrlObjectFromUrlString(requestParams.url),
      params: requestParams,
      computedParams,
      requestOptions,
      error,
    });

    if (override && override instanceof TwitterApiPluginResponseOverride) {
      return override.value;
    }
  }

  return Promise.reject(error);
}
