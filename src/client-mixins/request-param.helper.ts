import { FormDataHelper } from './form-data.helper';
import type { RequestOptions } from 'https';
import type { TBodyMode, TRequestBody, TRequestQuery, TRequestStringQuery } from './request-maker.mixin';

/* Helpers functions that are specific to this class but do not depends on instance */

export class RequestParamHelpers {
  static readonly JSON_1_1_ENDPOINTS = new Set([
    'direct_messages/events/new',
    'direct_messages/welcome_messages/new',
    'direct_messages/welcome_messages/rules/new',
    'media/metadata/create',
    'collections/entries/curate',
  ]);

  static formatQueryToString(query: TRequestQuery) {
    const formattedQuery: TRequestStringQuery = {};

    for (const prop in query) {
      if (typeof query[prop] === 'string') {
        formattedQuery[prop] = query[prop] as string;
      }
      else if (typeof query[prop] !== 'undefined') {
        formattedQuery[prop] = String(query[prop]);
      }
    }

    return formattedQuery;
  }

  static autoDetectBodyType(url: string): TBodyMode {
    if (url.includes('.twitter.com/2')) {
      // Twitter API v2 always has JSON-encoded requests, right?
      return 'json';
    }

    if (url.startsWith('https://upload.twitter.com/1.1/media')) {
      return 'form-data';
    }

    const endpoint = url.split('.twitter.com/1.1/', 2)[1];

    if (this.JSON_1_1_ENDPOINTS.has(endpoint)) {
      return 'json';
    }
    return 'url';
  }

  static constructGetParams(query: TRequestQuery) {
    if (Object.keys(query).length)
      return '?' + new URLSearchParams(query as Record<string, string>).toString();

    return '';
  }

  static constructBodyParams(
    body: TRequestBody,
    headers: Record<string, string>,
    mode: TBodyMode,
  ) {
    if (body instanceof Buffer) {
      return body;
    }

    if (mode === 'json') {
      headers['content-type'] = 'application/json;charset=UTF-8';
      return JSON.stringify(body);
    }
    else if (mode === 'url') {
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

      if (Object.keys(body).length)
        return new URLSearchParams(body).toString();

      return '';
    }
    else if (mode === 'raw') {
      throw new Error('You can only use raw body mode with Buffers. To give a string, use Buffer.from(str).');
    }
    else {
      const form = new FormDataHelper();

      for (const parameter in body) {
        form.append(parameter, body[parameter]);
      }

      const formHeaders = form.getHeaders();
      headers['content-type'] = formHeaders['content-type'];

      return form.getBuffer();
    }
  }

  static setBodyLengthHeader(options: RequestOptions, body: string | Buffer) {
    options.headers = options.headers ?? {};

    if (typeof body === 'string') {
      options.headers['content-length'] = Buffer.byteLength(body);
    }
    else {
      options.headers['content-length'] = body.length;
    }
  }

  static isOAuthSerializable(item: any) {
    return !(item instanceof Buffer);
  }

  static mergeQueryAndBodyForOAuth(query: TRequestQuery, body: TRequestBody) {
    const parameters: any = {};

    for (const prop in query) {
      parameters[prop] = query[prop];
    }

    if (this.isOAuthSerializable(body)) {
      for (const prop in body) {
        const bodyProp = (body as any)[prop];

        if (this.isOAuthSerializable(bodyProp)) {
          parameters[prop] = bodyProp;
        }
      }
    }

    return parameters;
  }

  static mergeUrlQueryIntoObject(url: string, query: TRequestQuery) {
    const urlObject = new URL(url);

    for (const [param, value] of urlObject.searchParams) {
      query[param] = value;
    }

    // Remove the query string
    return urlObject.href.slice(0, urlObject.href.length - urlObject.search.length);
  }
}

export default RequestParamHelpers;
