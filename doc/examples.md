# Examples

## Quick yet comprehensive example usage

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


## Full examples

### Streaming: Bot that listens for tweets that mention them, and replies with a reversed tweet content

```ts
const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
const me = await client.currentUser();

// Erase previous rules
const rules = await client.v2.streamRules();
if (rules.data.length) {
  await client.v2.updateStreamRules({
    delete: { ids: rules.data.map(rule => rule.id) },
  });
}

// Add my search rule
await client.v2.updateStreamRules({
  add: [{ value: '@' + me.screen_name }],
});

const stream = await client.v2.searchStream({
  'tweet.fields': ['in_reply_to_user_id'],
});

for await (const { data: tweet } of stream) {
  // If the bot is not directly mentionned, ignore
  if (tweet.in_reply_to_user_id !== me.id_str) {
    continue;
  }

  // Remove the beginning mentions
  const realText = tweet.text.replace(/^@\w+ (@\w+ )*/, '');
  const reversedText = realText.split('').reverse().join('');

  client.v1.reply(reversedText, tweet.id)
    .catch((err: Error) => console.log(err.message));
}
```

***WIP — TODO***

See [the v1.1 comprehensive documentation](./doc/v1.md)
and [the v2 comprehensive documentation](./doc/v2.md) for more examples with each available endpoint.

All returned types and parameters only reflect available data on Twitter API documentation. For each implemented endpoint,
you have a link to documentation available in JSDoc comment.
