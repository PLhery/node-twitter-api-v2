# Examples

Those examples are valid for both v1.1 and v2 of Twitter API.

Presented examples are **not exhaustive**. Every endpoint wrappers are available in [the v1.1 comprehensive documentation](./v1.md), [the v2 comprehensive documentation](./v2.md) and [the stream-related comprehensive documentation](./streaming.md).

All the used entities (classes, interfaces, enums...) are imported from `twitter-api-v2` package.

All returned types and parameters only reflect available data on Twitter API documentation.
For each implemented endpoint, you have a link to documentation available in JSDoc comment.

**Note:** Top-level use of `await` is not available in most of Node.js usage. You might need to wrap `await`s into async functions. See [MDN related documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

## Create a client

### With user credentials (act as a logged user)

This kind of auth is needed for endpoint mentionned with `"OAuth 1.0a User context"` in Twitter documentation.
Usually, this is used to act on behalf of a user.

Access token and access secret are obtained through [the 3-legged auth flow](./auth.md).

```ts
const client = new TwitterApi({
  appKey: '<YOUR-TWITTER-APP-TOKEN>',
  appSecret: '<YOUR-TWITTER-APP-SECERT>',
  accessToken: '<YOUR-TWITTER-ACCESS-TOKEN>',
  accessSecret: '<YOUR-TWITTER-ACCESS-SECERT>',
});
// NOTE: accessToken and accessSecret are not required if you want to generate OAuth login links.
```

### With app-only credentials

This kind of auth is accepted on Twitter endpoints with `"OAuth 2.0 Bearer token"` (or Application context) mentionned in documentation.

```ts
const client = new TwitterApi('<YOUR-TWITTER-BEARER-TOKEN>');
```

### Select the right level of your client

Twitter API v2 let you customize the right-level of your client. This should match your app-level defined in Twitter Apps portal.
This doesn't enforce anything at request level, but it will filter listed endpoint wrappers by your IDE through code suggestions.

```ts
// By default, client are created with the max right-level (Read+Write+DMs)
const client = new TwitterApi('<YOUR-TWITTER-BEARER-TOKEN>');

// Read+Write level
const rwClient = client.readWrite;

// Read-only level
const roClient = client.readOnly;
```

## Tweets

### Fetch and navigate through home timeline

Download tweets of home timeline and consume them with a paginator.

```ts
// Home timeline is available in v1 API, so use .v1 prefix
const homeTimeline = await client.v1.homeTimeline();

// Current page is in homeTimeline.tweets
console.log(homeTimeline.tweets.length, 'fetched.');

const nextHomePage = await homeTimeline.next();
console.log('Fetched tweet IDs in next page:', nextHomePage.tweets.map(tweet => tweet.id_str));
```

### Post a new tweet with multiple images

```ts
// First, post all your images to Twitter
const mediaIds = await Promise.all([
  // file path
  client.v1.uploadMedia('./my-image.jpg'),
  // from a buffer, for example obtained with an image modifier package
  client.v1.uploadMedia(Buffer.from(rotatedImage), { type: 'png' }),
]);

// mediaIds is a string[], can be given to .tweet
await client.v1.tweet('My tweet text with two images!', { media_ids: mediaIds });
```

### Reply to a tweet with a video that have subtitles

```ts
// A video which is more than 15MB must be uploaded with 'longmp4'
const mediaIdVideo = await client.v1.uploadMedia('./test-video.mp4', { type: 'longmp4' });
const mediaIdSubtitles = await client.v1.uploadMedia('./test-video-subtitles.srt');

// Associate subtitles and video
await client.v1.createMediaSubtitles(mediaIdVideo, [{ language_code: 'en', display_name: 'English', media_id: mediaIdSubtitles }]);

// Reply
await client.v1.reply('Look at my video!', tweetIdToReply, { media_ids: mediaIdVideo });
```

### Stream tweets in real time

Listen for a bunch of words using v2 stream filter API.

```ts
// Get and delete old rules if needed
const rules = await client.v2.streamRules();
if (rules.data?.length) {
  await client.v2.updateStreamRules({
    delete: { ids: rules.data.map(rule => rule.id) },
  });
}

// Add our rules
await client.v2.updateStreamRules({
  add: [{ value: 'JavaScript' }, { value: 'NodeJS' }],
});

const stream = await client.v2.searchStream({
  'tweet.fields': ['referenced_tweets', 'author_id'],
  expansions: ['referenced_tweets.id'],
});
// Enable auto reconnect
stream.autoReconnect = true;

stream.on(ETwitterStreamEvent.Data, async tweet => {
  // Ignore RTs or self-sent tweets
  const isARt = tweet.data.referenced_tweets?.some(tweet => tweet.type === 'retweeted') ?? false;
  if (isARt || tweet.data.author_id === meAsUser.id_str) {
    return;
  }

  // Reply to tweet
  await client.v1.reply('Did you talk about JavaScript? love it!', tweet.data.id);
});
```

## Users

### Search users

```ts
const foundUsers = await client.v1.searchUsers('alki');

// use an async for-of to iterate over the multiple result pages!
for await (const user of foundUsers) {
  console.log('User matching search:', user.screen_name);
}
```

### Update profile banner

```ts
// Upload from a path (the same sources as .uploadMedia are accepted)
await client.v1.updateAccountProfileBanner('./new-banner.png', { width: 450, height: 150, offset_left: 20 });
const updatedProfile = await client.currentUser();
const allBannerSizes = await client.v1.userProfileBannerSizes({ user_id: updatedProfile.id_str });

console.log('New banner! Max size at URL:', allBannerSizes.sizes['1500x500'].url);
```

### List pending follow requests

```ts
const pendingRequests = await client.v1.friendshipsIncoming();
const hydratedUsers = await client.v1.users({ user_id: pendingRequests.ids.slice(0, 100) });

for (const user of hydratedUsers) {
  console.log(user.screen_name, 'wants to follow you!');
}
```

## Direct messages

### Send a direct message with an image

```ts
const imgMediaId = await client.v1.uploadMedia('./test-image.mp4', { target: 'dm' });

await client.v1.sendDm({
  recipient_id: '12',
  text: 'Hello, have a great day :)',
  attachment: { type: 'media', media: { id: imgMediaId } },
});
```

### Set a welcome direct message

```ts
const welcomeDm = await client.v1.newWelcomeDm('Welcome DM hello :)', { text: 'Welcome to our chat! Please tell us whats happening.' });

// This will handle all the boilerplate for you:
await client.v1.setWelcomeDm(welcomeDm[EDirectMessageEventTypeV1.WelcomeCreate].id);
```

## Auth flow

You can see a [real-life example of a 3-legged auth flow here](https://github.com/alkihis/twitter-api-v2-user-oauth-flow-example).

See also [authentification documentation](./auth.md) for examples and explainations about Twitter auth flow.

### Generate a auth link and get access tokens

```ts
// Create a partial client for auth links
const client = new TwitterApi({ appKey: '<YOUR-TWITTER-APP-TOKEN>', appSecret: '<YOUR-TWITTER-APP-SECERT>' });
const authLink = await client.generateAuthLink('oob');
// Redirect your client to authLink.url
console.log('Please go to', authLink.url);

// ... user redirected to https://your-website.com?oauth_token=XXX&oauth_verifier=XXX after user app validation
// Create a temporary client with previous-step tokens
const connecterClient = new TwitterApi({
  appKey: '<YOUR-TWITTER-APP-TOKEN>',
  appSecret: '<YOUR-TWITTER-APP-SECERT>',
  accessToken: authLink.oauth_token,
  accessSecret: authLink.oauth_token_secret,
});
// Validate verifier to get definitive access token & secret
const { accessToken, accessSecret } = connecterClient.login('<THE_OAUTH_VERIFIER>');

console.log('Access token and secret for logged client:', accessToken, accessSecret);
```

## HTTP wrappers

You can directly use HTTP wrappers to make custom requests.
Requests under `.v1` are prefixed with `https://api.twitter.com/1.1/`, and under `.v2` are prefixed with `https://api.twitter/2/`.

It means that if you need to use a different domain, for example `https://upload.twitter.com/1.1/`, you **must specify it manually** (see below).

### Make a GET HTTP request to a Twitter endpoint

```ts
// With default prefix
const result = await client.v2.get('tweets/search/recent', { query: 'nodeJS', max_results: 100 });
console.log(result.data); // TweetV2[]

// With custom prefix
const mediaStatus = await client.v1.get<MediaStatusV1Result>(
  'media/upload.json',
  { command: 'STATUS', media_id: '20' },
  { prefix: 'https://upload.twitter.com/1.1/' },
);
console.log('Media is ready:', mediaStatus.processing_info.state === 'succeeded');
```

### Build a POST query with a custom body

By default, `twitter-api-v2` tries to auto-detect the body format needed for the desired endpoint.
But if this doesn't work (fe Twitter error of invalid body format), you can build a request with a fixed body format.

`forceBodyMode` property accepts:
- `url` for URL-encoded bodies (most of v1.1 endpoints)
- `form-data` for multipart/form-data encoded bodies (endpoints with file upload)
- `json` for JSON-encoded bodies (v1.1 DMs & v2 endpoints)
- `raw` if you've already encoded the body (the body **must be a `Buffer`**)

```ts
// Manually upload a media with media/upload endpoint
await client.v1.post(
  'media/upload.json',
  { command: 'APPEND', media_id: '20', segment_index: '0', media: fs.readFileSync('./media.jpg') },
  { prefix: 'https://upload.twitter.com/1.1/', forceBodyMode: 'form-data' },
);
```
