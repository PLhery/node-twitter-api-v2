# Basics

> *For convenience, all the code examples in this documentation will be presented in TypeScript.*
> Feel free to convert them to regular JavaScript. If you don't use a transpiler,
> you might need to replace `import`s by `require()` calls.

## Client basics

### Create a client

Import the default export/`TwitterApi` variable from `twitter-api-v2` module.

**Developer note:** Default export is a TypeScript-CommonJS-wrapped default export —
it isn't a regular ECMA module default export. See example below.

```ts
// This will ONLY work with TypeScript on module: "commonjs"
import TwitterApi from 'twitter-api-v2';

// This will work on TypeScript (with commonJS and ECMA)
// AND with Node.js in ECMA mode (.mjs files, type: "module" in package.json)
import { TwitterApi } from 'twitter-api-v2';

// This will work with Node.js on CommonJS mode (TypeScript or not)
const { TwitterApi } = require('twitter-api-v2');
```

Instanciate with your wanted authentification method.

```ts
// OAuth 1.0a (User context)
const userClient = new TwitterApi({
  appKey: 'consumerAppKey',
  appSecret: 'consumerAppSecret',
  // Following access tokens are not required if you are
  // at part 1 of user-auth process (ask for a request token)
  // or if you want a app-only client (see below)
  accessToken: 'accessOAuthToken',
  accessSecret: 'accessOAuthSecret',
});

// OAuth2 (App-only context)
const appOnlyClient = new TwitterApi('bearerToken');
// - you can also create a app-only client from your consumer keys -
const appOnlyClientFromConsumer = await userClient.appLogin();
```

Your client is now ready.

### Select your right level

If you already know your right limit (that you've selected when you've created your app on Twitter Dev portal),
you can choose the right sub-client:

- `DMs`: Nothing to do, default level
- `Read-write`: `rwClient = client.readWrite`
- `Read-only`: `roClient = client.readOnly`

## Authentification

Please see [Authentification part](./auth.md) of the doc.

### Get current user

If you want to access currently logged user (= you're logged with OAuth 1.0a context),
you can use the method `.currentUser()`.

This a shortcut to `.v1.verifyCredentials()` with a **cache that store user to avoid multiple API calls**.
Its returns a `UserV1` object.

## Request basics

The main goal of those clients is to make requests (right?). Let's see how we do it!

### Use the versionned API clients

By default, `twitter-api-v2` don't know which version of API you want to use (because it supports both!).

For this reason, we allow you to choose which version you want to use: `v1` or `v2`!
```ts
const v1Client = client.v1;
const v2Client = client.v2;

// We also think of users who test v2 labs endpoints :)
const v2LabsClient = client.v2.labs;
```

Using the versionned client **auto-prefix requests** with default prefixes
(for v1: `https://api.twitter.com/1.1/`, for v2: `https://api.twitter.com/2/`,
for labs v2: `https://api.twitter.com/labs/2/`)
and gives you access to endpoint-wrapper methods!

### Use the endpoint-wrapper methods

See the [documentation for v1 client API](./v1.md) or [documentation for v2 client API](./v2.md).

### Use the direct HTTP methods wrappers

If the endpoint-wrapper for your request has not been made yet, don't leave!
You can make requests on your own!

- `.get` and `.delete`, that takes `(partialUrl: string, query?: TRequestQuery)` in parameters
- `.post`, `.put` and `.patch` that takes `(partialUrl: string, body?: TRequestBody)` in parameters

```ts
// Don't forget the .json in most of the v1 endpoints!
client.v1.get('statuses/user_timeline.json', { user_id: 14 });

// or, for v2
client.v2.get('users/14/tweets');
```

### Advanced: make a custom signed request

`twitter-api-v2` gives you a client that handles all the request signin boilerplate for you.

Sometimes, you need to dive deep and make the request on your own.
2 raw helpers allow you to make the request you want:
- `.send`: Make a request, awaits its complete response, parse it and returns it
- `.sendStream`: Make a requests, returns a stream when server responds OK

**Warning**: When you use those methods, you need to prefix your requests (no auto-prefixing)!
Make sure you use a URL that begins with `https://...` with raw request managers.

#### .send

**Template types**: `T = any`

**Args**: `IGetHttpRequestArgs`

**Returns**: (async) `TwitterResponse<T>`

```ts
const response = await client.send({
  method: 'GET',
  url: 'https://api.twitter.com/2/tweets/search/all',
  query: { max_results: 200 },
  headers: { 'X-Custom-Header': 'True' },
});

response.data; // Twitter response body: { data: Tweet[], meta: {...} }
response.rateLimit.limit; // Ex: 900
```

#### .sendStream

**Args**: `IGetHttpRequestArgs`

**Returns**: (async) `TweetStream`

```ts
const stream = await client.sendStream({
  method: 'GET',
  url: 'https://api.twitter.com/2/tweets/sample/stream',
});
// For response handling, see streaming documentation
```

## Rate limiting

### Everywhere in this library

This library helps you to handle rate limiting.
When a request fails (with a Twitter response), it create a `ApiResponseError` instance and throw it.

If `ApiResponseErrorInstance.rateLimitError` is `true`, then you just hit the rate limit.
You have access to rate limit limits with `ApiResponseErrorInstance.rateLimit`:

```ts
import { ApiResponseError } from 'twitter-api-v2';

try {
  // Get a single tweet
  await client.v1.tweet('20');
} catch (error) {
  if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
    console.log(`You just hit the rate limit! Limit for this endpoint is ${error.rateLimit.limit} requests!`);
    console.log(`Request counter will reset at timestamp ${error.rateLimit.reset}.`);
  }
}
```

---

**Example**: You can automate this process with a waiter that will retry a failed request after the reset timer is over:

*Warning*: This method can be VERY ineffective, as it can wait up to 15 minutes (Twitter's usual rate limit reset time).
```ts
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(ms, resolve));
}

async function autoRetryOnRateLimitError<T>(callback: () => T | Promise<T>) {
  while (true) {
    try {
      return await callback();
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
        const resetTimeout = error.rateLimit.reset * 1000; // convert to ms time instead of seconds time
        const timeToWait = resetTimeout - Date.now();

        await sleep(timeToWait);
        continue;
      }

      throw error;
    }
  }
}

// Then use it...
await autoRetryOnRateLimitError(() => client.v1.tweet('20'));
```

### Special case of paginators

Paginators will automatically handle the rate limit when using `.fetchLast` or async iteration.
The `.fetchLast` or iteration will automatically ends when rate limit is hit.

Moreover, you can access current rate limit status for paginator's endpoint with the `.rateLimit` getter.
```ts
const paginator = await client.v1.homeTimeline();
console.log(paginator.rateLimit); // { limit: number, remaining: number, reset: number }
```

### Special case of HTTP methods helpers

> This is the only way to get rate limit information when a Twitter request succeeds.

If you use a HTTP method helper (`.get`, `.post`, ...), you can get a **full response** object that directly contains the rate limit information,
even if the request didn't fail!
```ts
const manualFullResponse = await client.v1.get<TweetV1TimelineResult>('statuses/home_timeline.json', { since_id: '20' }, { fullResponse: true });

// Response data
manualFullResponse.data; // TweetV1TimelineResult
// Rate limit information
manualFullResponse.rateLimit; // { limit: number, remaining: number, reset: number }
```
