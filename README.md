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

// Manually call the API
const tweets = await twitterClient.v2.get('tweets/search/recent', {query: 'nodeJS', max_results: '100'});
const tweets = await twitterClient.v1.tweet('Hello, this is a test.'),
const tweets = await twitterClient.v1.uploadMedia(await fs.promises.readFile(path), { type: 'jpg' })
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
- [ ] Twitter API V2 tweets methods
- [ ] Twitter API V2 users methods
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
} catch(e) {
  if (e.errorCode === TwitterErrors.RATE_LIMIT_EXCEEDED) {
    console.log('please try again later!');
  } else {
    throw e;
  }
}
```