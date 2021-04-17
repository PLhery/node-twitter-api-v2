# Twitter API v2

Strongly typed, full-featured, right protected, versatile yet powerful Twitter API v1.1 and v2 client for Node.js.

## Goals

Here's the feature highlights of `twitter-api-v2`:

### Basics:
- Support for v1.1 and **v2 of Twitter API**
- Make signed HTTP requests to Twitter with every Twitter required auth type:
  - classic **OAuth 1.0a** authentification for user-context endpoints
  - **OAuth2 Bearer token** for app-only endpoints
  - **Basic** HTTP Authorization, required for some auth endpoints or Entreprise API
- Helpers for numerous HTTP request methods (`GET`, `POST`, `PUT`, `DELETE` and `PATCH`),
  that handle query string parse & format, automatic body formatting and more
- High-class support for stream endpoints, with easy data consumption and auto-reconnect on stream errors

### Request helpers:
- Automatic paginator for endpoints like user and tweet timelines,
  allowing payload consumption with modern asynchronous iterators until your rate-limit is hit
- Convenient methods for authentication - generate auth links and ask for tokens to your users will be a breeze
- Media upload with API v1.1, including **long video & subtitles support**,  automatic media type detection,
  **chunked upload** and support for **concurrent uploads**
- Dedicated methods that wraps API v1.1 & v2 endpoints, with **typed arguments** and fully **typed responses**
  *(WIP - not all public endpoints are available)*
- Bundled parsing of rate limit headers

### Type-safe first:
- **Typings for tweet, user, media entities (and more) are bundled in this package!**
- Type-safe wrapping of dedicated methods in 3 right level: *DM*/*Read-write*/*Read-only* (just like Twitter API do!) -
  you can declare a read-only client - you will only see the methods associated with read-only endpoints


And last but not least, fully powered by native `Promise`s.

## How to use

Install it through your favorite package manager:
```bash
yarn add twitter-api-v2
# or
npm i twitter-api-v2
```


```ts
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
const { accessToken, accessSecret } = twitterClient.login('<THE_OAUTH_VERIFIER>');

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
- [x] Twitter API V2 tweets methods
- [x] Twitter API V2 users methods
- [x] Auto pagination
- [ ] Error code enums

```ts
import TwitterApi, { TwitterErrors } from 'twitter-api-v2';

// bearer token auth (with V2)
const twitterClient = new TwitterApi(tokens);

const authLink = await twitterClient.generateAuthLink();
// ... redirected to https://website.com?oauth_token=XXX&oauth_verifier=XXX
const { accessToken, accessSecret } = twitterClient.login('<THE_OAUTH_TOKEN>', '<THE_OAUTH_VERIFIER>');

// Search for tweets
const tweets = await twitterClient.v2.search('nodeJS', { max_results: 100 });

// Auto-paginate
// (also checks if rate limits will be enough after the first request)
const manyTweets = await twitterClient.v2.search('nodeJS').fetchLast(10000);

// Manage errors
try {
  const manyTweets = await twitterClient.v2.search('nodeJS').fetchLast(100000000);
} catch (e) {
  if (e.errorCode === TwitterErrors.RATE_LIMIT_EXCEEDED) {
    console.log('please try again later!');
  } else {
    throw e;
  }
}
```

## Authentification

Lost between the different ways to auth inside Twitter API?
Don't know how to implement 3-legged OAuth flow?

See [Authentification part](./auth.md) to know more and have a comprehensive guide a every Twitter authentification process.

## Streaming

APIs dedicated to streaming are available in [Streaming part](./doc/streaming.md).
