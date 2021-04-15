# Twitter API V2

Twitter api V1 and V2 client for node

## How to use

```typescript
import TwitterApi, { TwitterErrors } from 'twitter-api-v2';

// bearer token auth (with V2)
const twitterClient = new TwitterApi('<YOUR_APP_USER_TOKEN>');

// token auth
const twitterClient = new TwitterApi({
   appKey: '<YOUR-TWITTER-APP-TOKEN>',
   appSecret: '<YOUR-TWITTER-APP-SECERT>',
   accessToken: '<YOUR-TWITTER-APP-TOKEN>',
   accessSecret: '<YOUR-TWITTER-APP-SECERT>',
 });

// link auth
const twitterClient = new TwitterApi({
  appKey: '<YOUR-TWITTER-APP-TOKEN>',
  appSecret: '<YOUR-TWITTER-APP-SECERT>',
});

const authLink = await twitterClient.generateAuthLink();
// ... redirected to https://website.com?oauth_token=XXX&oauth_verifier=XXX
const { usertoken, userSecret } = twitterClient.login('<THE_OAUTH_VERIFIER>');

// Tell typescript it's a readonly app
const twitterClient = new TwitterApi(xxx).readOnly;

// Play with the built in methods

const user = await twitterClient.v2.userByUsername('plhery');
const followers = await twitterClient.v2.followers(user.data.id);
await twitterClient.v1.tweet('Hello, this is a test.');
await twitterClient.v1.uploadMedia(await fs.promises.readFile(path), { type: 'jpg' })

// the search utils

const results = await twitterClient.v2.search('hello');
console.log(results.tweets); // 10 tweets
await results.fetchNext(100);
await results.fetchNext(100);
console.log(results.tweets, results.rateLimit); // 210 tweets

// Or manually call the API
await twitterClient.v2.get('tweets/search/recent', {query: 'nodeJS', max_results: '100'});
const tweets = await twitterClient.get('https://api.twitter.com/2/tweets/search/recent?query=nodeJS&max_results=100');
```

## Why?

- The main libraries (twit/twitter) were not updated in a while

- I don't think a Twitter library need many dependencies

They caused me some frustration:
- They don't support video upload in a simple way
- They don't explain well the "link" auth process
- They don't support yet Twitter API V2
- They could have more helpers (for pagination, rate limit, ...)
- Typings could make the difference between read/write app

## Goals:

- [x] bearer token auth
- [x] token auth
- [x] link auth
- [x] read/write/DM aware typing
- [x] get/post methods
- [x] custom http methods
- [x] streaming
- [ ] Twitter API V2 tweets methods
- [x] Twitter API V2 users methods
- [ ] Auto pagination
- [ ] Error code enums

```typescript
import TwitterApi, { TwitterErrors } from 'twitter-api-v2';

// bearer token auth (with V2)
const twitterClient = new TwitterApi(tokens);

const authLink = await twitterClient.generateAuthLink();
// ... redirected to https://website.com?oauth_token=XXX&oauth_verifier=XXX
const { usertoken, userSecret } = twitterClient.login('<THE_OAUTH_TOKEN>', '<THE_OAUTH_VERIFIER>');

// Search for tweets
const tweets = await twitterClient.tweets.search('nodeJS', { max_results: 100 });

// Auto-paginate
// (also checks if rate limits will be enough after the first request)
const manyTweets = await twitterClient.tweets.search('nodeJS').fetchLast(10000);

// Manage errors
try {
  const manyTweets = await twitterClient.tweets.search('nodeJS').fetchLast(100000000);
} catch (e) {
  if (e.errorCode === TwitterErrors.RATE_LIMIT_EXCEEDED) {
    console.log('please try again later!');
  } else {
    throw e;
  }
}
```

## Streaming

This lib supports streaming for v1 and v2 API.

### Using streaming

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
```

### Specific API v1.1 implementations

API v1.1 streaming-related endpoints works only with classic OAuth1.0a authentification.

#### Filter endpoint

Method: **`v1.filterStream`**.

Endpoint: `statuses/filter.json`.

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

#### Sample endpoint

Method: **`v1.sampleStream`**.

Endpoint: `statuses/sample.json`.

Level: **Read-only**.

```ts
const client = ...; // (create a OAuth 1.0a client)

const stream = await client.v1.sampleStream();

// Event data will be tweets of v1 API.
```

### Specific API v2 implementations

API v2 streaming-related endpoints works only with Bearer OAuth2 authentification.

#### Search endpoint

Method: **`v2.searchStream`**.

Endpoint: `tweets/search/stream`.

Level: **Read-only**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

const stream = await client.v2.searchStream();

// Event data will be tweets of v2 API.
```

#### Search endpoint - Get applied rules

Method: **`v2.streamRules`**.

Endpoint: `tweets/search/stream/rules (GET)`.

Level: **Read-only**.

Returns: **`StreamingV2GetRulesResult`**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

const rules = await client.v2.streamRules();

// Log every rule ID
console.log(rules.data.map(rule => rule.id));
```

#### Search endpoint - Add or delete rules

Method: **`v2.updateStreamRules`**.

Endpoint: `tweets/search/stream/rules (POST)`.

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

#### Sample endpoint

Method: **`v2.sampleStream`**.

Endpoint: `tweets/sample/stream`.

Level: **Read-only**.

```ts
const client = ...; // (create a Bearer OAuth2 client)

const stream = await client.v2.sampleStream();

// Event data will be tweets of v2 API.
```

### Make a custom request

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
