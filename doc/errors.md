# Error handling

When a request fails, you can catch a `ApiRequestError` or a `ApiResponseError` object (both instances of `Error`), that contain useful information about whats happening.

- An `ApiRequestError` happens when the request **failed to sent** (network error, bad URL...).
- An `ApiResponseError` happens when **Twitter replies with an error**.

Some properties are common for both objects:
- `error` is `true`
- `type` contains either `ETwitterApiError.Request` or `ETwitterApiError.Response` (depending of error)
- `request` containing node's raw `ClientRequest` instance

## Specific properties of `ApiRequestError`
- `requestError`, an instance of `Error` that has been thrown through `request.on('error')` handler

## Specific properties of `ApiResponseError`
- `data`, containing parsed Twitter response data (type of `TwitterApiErrorData`)
- `code` is a `number` containing the HTTP error code (`401`, `404`, ...)
- `response`, containing raw node's `IncomingMessage` instance
- `headers`, containing `IncomingHttpHeaders`
- `rateLimit` (can be undefined or `TwitterRateLimit`), containing parsed rate limit headers (if any)
- (getter) `errors`, direct access of parsed Twitter errors (`(ErrorV1 | ErrorV2)[]` or `undefined`)
- (getter) `rateLimitError`, `true` if this error is fired because a rate limit has been hit
- (getter) `isAuthError`, `true` if this error is fired because logged user cannot do this action (invalid token, invalid app rights...)

## Specific methods of `ApiResponseError`
- `hasErrorCode(code: number | EApiV1ErrorCode | EApiV2ErrorCode)`: Tells if given Twitter error code is present in error response

## Debug your requests

If you keep obtaining errors and you don't know how to obtain the response data, or you want to see exactly what have been sent to Twitter,
you can enable the debug mode:
```ts
import { TwitterApiV2Settings } from 'twitter-api-v2';

TwitterApiV2Settings.debug = true;
```

By default, **all requests and responses** will be printed to console.

You can customize the output by implementing your own debug logger:
```ts
// Here's the default logger:
TwitterApiV2Settings.logger = {
  log: (msg, payload) => console.log(msg, payload),
};

// .logger follows this interface:
interface ITwitterApiV2SettingsLogger {
  log(message: string, payload?: any): void;
}

// An example for a file logger
import * as fs from 'fs';
import * as util from 'util';

const destination = fs.createWriteStream('requests.log', { flags: 'a' });

TwitterApiV2Settings.logger = {
  log: (msg, payload) => {
    if (payload) {
      const strPayload = util.inspect(payload);
      destination.write(msg + ' ' + strPayload);
    } else {
      destination.write(msg);
    }
  },
};
```
