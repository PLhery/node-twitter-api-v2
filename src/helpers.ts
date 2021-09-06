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
