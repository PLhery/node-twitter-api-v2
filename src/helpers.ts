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

