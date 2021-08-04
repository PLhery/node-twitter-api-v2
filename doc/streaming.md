# Streaming

This lib supports streaming for v1 and v2 API.

## Using streaming

For both V1 and V2 APIs, streaming methods returns a `TweetStream` object.

Each event of `TweetStream` is stored into a TypeScript `enum`.

```ts
import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } from 'twitter-api-v2';

const client = new TwitterApi(); // (create a client)

let stream: TweetStream;
try {
  // For example, can be any stream function
  stream = await client.v1.sampleStream();
} catch (e) {
  // e is either a TwitterApiRequestError or a TwitterApiError
  if (e.type === ETwitterApiError.Request) {
    // Thrown if request fails (network error).
    console.log('Request failed.', e.requestError);
  }
  else if (e.type === ETwitterApiError.Response) {
    // Thrown if Twitter responds with a bad HTTP status
    console.log(
      'Twitter didnt accept your request. HTTP code:',
      e.code,
      ', parsed response data:',
      e.data,
    );
  }
}

// Awaits for a tweet
stream.on(
  // Emitted when Node.js {response} emits a 'error' event (contains its payload).
  ETwitterStreamEvent.ConnectionError,
  err => console.log('Connection error!', err),
);

stream.on(
  // Emitted when Node.js {response} is closed by remote or using .close().
  ETwitterStreamEvent.ConnectionClosed,
  () => console.log('Connection has been closed.'),
);

stream.on(
  // Emitted when a Twitter payload (a tweet or not, given the endpoint).
  ETwitterStreamEvent.Data,
  eventData => console.log('Twitter has sent something:', eventData),
);

stream.on(
  // Emitted when a Twitter sent a signal to maintain connection active
  ETwitterStreamEvent.DataKeepAlive,
  () => console.log('Twitter has a keep-alive packet.'),
);

// Be sure to close the stream where you don't want to consume data anymore from it
stream.close();

// -- Alternative usage --

// You can also use async iterator to iterate over tweets!
for await (const { data } of stream) {
  console.log('This is my tweet:', data);
}
```

## Specific API v1.1 implementations

API v1.1 streaming-related endpoints works only with classic OAuth1.0a authentification.

### Filter endpoint

Method: **`v1.filterStream`**.

Endpoint: `statuses/filter.json`.

Reference: https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/api-reference/post-statuses-filter

Level: **Read-only**.

```ts
const client = ...; // (create a OAuth 1.0a client)

const streamFilter = await client.v1.filterStream({
  // See FilterStreamParams interface.
  track: 'JavaScript',
  follow: [1842984n, '1850485928354'],
});

// Event data will be tweets of v1 API.
```

### Sample endpoint

Method: **`v1.sampleStream`**.

Endpoint: `statuses/sample.json`.

Reference: https://developer.twitter.com/en/docs/twitter-api/v1/tweets/sample-realtime/api-reference/get-statuses-sample

Level: **Read-only**.

```ts
const client = ...; // (create a OAuth 1.0a client)

const stream = await client.v1.sampleStream();

// Event data will be tweets of v1 API.
```

## Specific API v2 implementations

API v2 streaming-related endpoints works only with Bearer OAuth2 authentification.

### Search endpoint

Method: **`v2.searchStream`**.

Endpoint: `tweets/search/stream`.

Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream

Level: **Read-only**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

const stream = await client.v2.searchStream();

// Event data will be tweets of v2 API.
```

### Search endpoint - Get applied rules

Method: **`v2.streamRules`**.

Endpoint: `tweets/search/stream/rules (GET)`.

Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream-rules

Level: **Read-only**.

Returns: **`StreamingV2GetRulesResult`**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

const rules = await client.v2.streamRules();

// Log every rule ID
console.log(rules.data.map(rule => rule.id));
```

### Search endpoint - Add or delete rules

Method: **`v2.updateStreamRules`**.

Endpoint: `tweets/search/stream/rules (POST)`.

Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/post-tweets-search-stream-rules

Level: **Read-write**.

Takes: **`StreamingV2UpdateRulesParams`**.
Returns: **`StreamingV2UpdateRulesResult`**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

// Add rules
const addedRules = await client.v2.updateStreamRules({
  add: [
    { value: 'JavaScript', tag: 'js' },
    { value: 'TypeScript', tag: 'ts' },
  ],
});

// Delete rules
const deleteRules = await client.v2.updateStreamRules({
  delete: {
    ids: ['281646', '1534843'],
  },
});
```

### Sample endpoint

Method: **`v2.sampleStream`**.

Endpoint: `tweets/sample/stream`.

Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/sampled-stream/api-reference/get-tweets-sample-stream

Level: **Read-only**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

const stream = await client.v2.sampleStream();

// Event data will be tweets of v2 API.
```

## Make a custom request

If you know endpoint and parameters (or you don't want them to be parsed),
you can make raw requests using shortcuts by HTTP methods:
- `getStream()`
- `postStream()`
- `putStream()`
- `deleteStream()`
- `patchStream()`
or using raw request handler:
- `sendStream()`

NOTE: **Be careful to select the good API prefix for version 1.1. 1.1 does not use the same URL for classic endpoints and streaming endpoints**.
You can access quicky to an instance with the streaming prefix using `v1.stream`.

```ts
// For v1
const streamFilter = await client.v1.stream.getStream('statuses/filter.json', { track: 'JavaScript,TypeScript' });
// For v2
const sampleFilterv2 = await client.v2.getStream('tweets/sample/stream');
```

## `TweetStream` reference

### Methods / properties

- `.autoReconnect: boolean` / defaults `false` / Set this to `true` to enable experimental reconnect feature.
- `.autoReconnectRetries: number` / default `5` / If `autoReconnect` is `true`, maximum tries made until give up. Each try is spaced by `min((attempt ** 2) * 1000, 25000)` milliseconds.
- `.keepAliveTimeoutMs: number` / default `120000` (2 minutes) / Defined whenever connection should be automatically closed if nothing is received from Twitter during this time (it should not happend in any situation, because Twitter sends keep-alive packets). **Can be set to `Infinity` to disable this feature**.
- `.close()`: Emits `ConnectionClosed` event and terminates connection.
- `.destroy()`: Same as `close()`, but unbind all registred event listeners before.
- `.clone(): Promise<TweetStream>`: Returns a new `TweetStream` with the same request parameters, with the same event listeners bound.
- `.reconnect(): Promise<void>`: Tries to make a new request to Twitter with the same original parameters. If successful, continue streaming with new response.

### Events

All events are part of enum `ETwitterStreamEvent` exported by the package.

- `.ConnectionError`: Emitted with the `err` parameter given by `request.on('error')` or `response.on('error')` handlers.
- `.ConnectionClosed`: Emitted when `.close()` is called or when the connection is manually closed by distant server.
- `.ConnectionLost`: When nothing is received from Twitter during `.keepAliveTimeoutMs` milliseconds, emit this event and start either close or reconnection process.
- `.ReconnectAttempt`: Emitted **before** a reconnect attempt is made (payload: attempt `number`).
- `.Reconnected`: Emitted when a reconnection attempt succeeds.
- `.ReconnectError`: Emitted when a auto-reconnect try attempt has failed. Event data is a `number` representing the number of times the request has been **re-made** (starts from `0`).
- `.ReconnectLimitExceeded`: Emitted when `.autoReconnectRetries` limit exceeds.
- `.DataKeepAlive`: Emitted when Twitter sends a `\r\n` to maintain connection open.
- `.Data`: Emitted with stream data, when Twitter sends something.
- `.TweetParseError`: When the thing sent by Twitter cannot be JSON-parsed. Contains the parse error.
- `.Error`: Emitted either when a `.ConnectionError` or a `.TweetParseError` occurs. Contains `{ type: .ConnectionError | .TweetParseError, error: any }`.
