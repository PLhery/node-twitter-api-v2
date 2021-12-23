import { TwitterApiV2Settings } from './settings';

export interface SharedPromise<T> {
  value: T | undefined;
  promise: Promise<T>;
}

export function sharedPromise<T>(getter: () => Promise<T>) {
  const sharedPromise: SharedPromise<T> = {
    value: undefined,
    promise: getter().then(val => {
      sharedPromise.value = val;
      return val;
    }),
  };

  return sharedPromise;
}

export function arrayWrap<T>(value: T | T[]) : T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

export function trimUndefinedProperties(object: any) {
  // Delete undefined parameters
  for (const parameter in object) {
    if (object[parameter] === undefined)
      delete object[parameter];
  }
}

export function isTweetStreamV2ErrorPayload(payload: any) {
  // Is error only if 'errors' is present and 'data' does not exists
  return typeof payload === 'object'
    && 'errors' in payload
    && !('data' in payload);
}

export function hasMultipleItems(item: string | string[]) {
  if (Array.isArray(item) && item.length > 1) {
    return true;
  }
  return item.toString().includes(',');
}

/* Deprecation warnings */

export interface IDeprecationWarning {
  instance: string;
  method: string;
  problem: string;
  resolution: string;
}

const deprecationWarningsCache = new Set<string>();

export function safeDeprecationWarning(message: IDeprecationWarning) {
  if (typeof console === 'undefined' || !console.warn || !TwitterApiV2Settings.deprecationWarnings) {
    return;
  }

  const hash = `${message.instance}-${message.method}-${message.problem}`;
  if (deprecationWarningsCache.has(hash)) {
    return;
  }

  const formattedMsg = `[twitter-api-v2] Deprecation warning: In ${message.instance}.${message.method}() call` +
    `, ${message.problem}.\n${message.resolution}.`;

  console.warn(formattedMsg);
  console.warn('To disable this message, import TwitterApiV2Settings from twitter-api-v2 and set TwitterApiV2Settings.deprecationWarnings to false.');
  deprecationWarningsCache.add(hash);
}
