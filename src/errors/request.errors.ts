import { TwitterErrorPayload } from '../types';

export class TwitterError<T = any> extends Error {
  payload?: TwitterErrorPayload<T>

  constructor(message: string = '', twitterError?: TwitterErrorPayload<T>) {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    // This clips the constructor invocation from the stack trace.
    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.payload = twitterError;
  }
}

export class RateLimitError<T = any> extends TwitterError<T> {
  constructor(message: string = '', twitterError?: TwitterErrorPayload<T>) {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    // This clips the constructor invocation from the stack trace.
    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.payload = twitterError;
  }
}
