# Available helpers

This is a comprehensive guide of all helpers available for the Twitter API on both versions v1.1 and v2.

<!-- vscode-markdown-toc -->
* [Helpers for includes of v2 API responses](#Helpersforincludesofv2APIresponses)
	* [Simple usage](#Simpleusage)
	* [Available helper methods](#Availablehelpermethods)
		* [Tweets](#Tweets)
		* [Users](#Users)
		* [Medias](#Medias)
		* [Polls](#Polls)
		* [Places](#Places)
		* [Lists](#Lists)
		* [Spaces](#Spaces)
	* [Usage without instanciation](#Usagewithoutinstanciation)
* [Extract errors in an array](#Extracterrorsinanarray)
* [Change image size of a profile picture](#Changeimagesizeofaprofilepicture)

<!-- vscode-markdown-toc-config
	numbering=false
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

## <a name='Helpersforincludesofv2APIresponses'></a>Helpers for includes of v2 API responses

In v2 API of Twitter, for sake of efficiency, "linked" metadata can be returned outside the data object.

For example, the pinned tweet of a fetched user is returned into `includes.tweets` array of the response,
and only if you specify `expansions: ['pinned_tweet_id']` in your request parameters.

To get the tweet object from a user, you need to handle possible `undefined` values and find the tweet in the array:
```ts
const user = response.data[0];
const pinnedTweetId = user.pinned_tweet_id;
const pinnedTweet = pinnedTweetId ? response.includes?.tweets?.find(t => t.id === pinnedTweetId) : undefined;

// use {pinnedTweet} if defined
```

This could be quite a pain if you handle multiple metas in once bunch of code.

### <a name='Simpleusage'></a>Simple usage

**This library includes an helper class for includes result** named `TwitterV2IncludesHelper`.
You can instanciate it by importing it from the package:

```ts
import { TwitterV2IncludesHelper } from 'twitter-api-v2';

// Just give the response containing { data, includes }, etc
const includes = new TwitterV2IncludesHelper(response);
```

It provides getters to all includes (`tweets`, `media`, `users`, `polls` and `places`), but all of them are fail-safe (guaranteed to be defined).

```ts
// response.includes?.tweets becomes
includes.tweets

// response.includes?.media becomes
includes.media

// etc.
```

### <a name='Availablehelpermethods'></a>Available helper methods

Needed expansions for a method to work are specified (*`like this`*).

#### <a name='Tweets'></a>Tweets

- `(getter) .tweets: TweetV2[]`: Access tweets stored into the includes
- `.tweetById(id: string): TweetV2`: Get a tweet by ID
- `.retweet(tweet: TweetV2): TweetV2`: Retweet associated with the given tweet (*`referenced_tweets.id`*)
- `.quote(tweet: TweetV2): TweetV2`: Quoted tweet associated with the given tweet (*`referenced_tweets.id`*)
- `.repliedTo(tweet: TweetV2): TweetV2`: Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*)
- `.author(tweet: TweetV2): UserV2`: Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*)
- `.repliedToAuthor(tweet: TweetV2): UserV2`: Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*)

#### <a name='Users'></a>Users

- `(getter) .users: UserV2[]`: Access users stored into the includes
- `.userById(id: string): UserV2`: Get a user by ID
- `.pinnedTweet(user: UserV2): TweetV2`: Pinned tweet of the given user (*`pinned_tweet_id`*)

#### <a name='Medias'></a>Medias

- `(getter) .media: MediaObjectV2[]`: Access medias stored into the includes
- `.medias(tweet: TweetV2): MediaObjectV2[]`: Get medias associated with the given tweet (*`attachments.media_keys`*)

#### <a name='Polls'></a>Polls

- `(getter) .polls: PollV2[]`: Access medias stored into the includes
- `.poll(tweet: TweetV2): PollV2`: Get poll associated with the given tweet (*`attachments.poll_ids`*)

#### <a name='Places'></a>Places

- `(getter) .places: PlaceV2[]`: Access medias stored into the includes
- `.place(tweet: TweetV2): PlaceV2`: Get place associated with the given tweet (*`geo.place_id`*)

#### <a name='Lists'></a>Lists

- `.listOwner(list: ListV2): UserV2`: Get list owner of the given list (*`owner_id`*)

#### <a name='Spaces'></a>Spaces

- `.spaceCreator(space: SpaceV2): UserV2`: Get creator of the given space (*`creator_id`*)
- `.spaceHosts(space: SpaceV2): UserV2[]`: Get current hosts of the given space (*`host_ids`*)
- `.spaceSpeakers(space: SpaceV2): UserV2[]`: Get current speakers of the given space (*`speaker_ids`*)
- `.spaceInvitedUsers(space: SpaceV2): UserV2[]`: Get current invited users of the given space (*`invited_user_ids`*)

#### Sample usage of helper methods

```ts
/// - Tweets -

// From a regular fetch
const tweets = await client.v2.tweets(['20', '1257577057862610951'], {
  'tweet.fields': ['author_id', 'source'],
  expansions: ['author_id', 'referenced_tweets.id', 'in_reply_to_user_id'],
});
const includes = new TwitterV2IncludesHelper(tweets);

for (const tweet of tweets.data) {
  const author = includes.author(tweet); // author_id

  const retweetedTweet = includes.retweet(tweet); // referenced_tweets.id
  const quotedTweet = includes.quote(tweet); // referenced_tweets.id

  const tweetRepliedTo = includes.repliedTo(tweet); // referenced_tweets.id
  const tweetRepliedToAuthor = includes.repliedToAuthor(tweet); // in_reply_to_user_id
}

// Paginators bundle an accessor to an helper instance inside their .includes getter
const jackTimeline = await client.v2.userTimeline('12', { expansions: ['attachments.media_keys', 'author_id'] });

for (const tweet of jackTimeline) {
  const mediasOfTweet = jackTimeline.includes.medias(tweet);
  const authorUser = jackTimeline.includes.author(tweet);
}


/// - Spaces-

const spacesBySearch = await client.v2.searchSpaces({
  query: 'twitter',
  state: 'live',
  expansions: ['invited_user_ids', 'creator_id'],
  'space.fields': ['title', 'invited_user_ids', 'creator_id'],
});

const includes = new TwitterV2IncludesHelper(spacesBySearch);
const invitedUsers = includes.spaceInvitedUsers(spacesBySearch.data[0]);
const creatorUser = includes.spaceCreator(spacesBySearch.data[0]);
```

### <a name='Usagewithoutinstanciation'></a>Usage without instanciation

You can use the helper without instanciate it, by using its `static` methods.
Every helper method is available under the form `methodName(responseObject, ...restParameter)`.

Examples:
```ts
// For includes.tweets
TwitterV2IncludesHelper.tweets(response)

// For includes.retweets(tweet)
TwitterV2IncludesHelper.retweets(response, tweet)

// For includes.medias(tweet)
TwitterV2IncludesHelper.medias(response, tweet)
```

## <a name='Extracterrorsinanarray'></a>Extract errors in an array

Get returned errors in a thrown `TwitterApiError` object.

**Method**: `TwitterApi.getErrors()`

**Arguments**:
  - `error: any`: Catched error

**Returns**: `(ErrorV1 | ErrorV2)[]`

**Example**
```ts
try {
  const homeTimeline = await client.v1.homeTimeline({ exclude_replies: true });
} catch (e) {
  // Request failed!
  const errors = TwitterApi.getErrors(e); // ErrorV1[]
  console.log('Received errors from v1 API', errors);
}
```

## <a name='Changeimagesizeofaprofilepicture'></a>Change image size of a profile picture

Extract another image size than obtained in `profile_image_url` or `profile_image_url_https` field of a user object.

**Method**: `TwitterApi.getProfileImageInSize()`

**Arguments**:
  - `imageUrl: string`: Link to image
  - `size: string`: Desired size, between `normal`, `bigger`, `mini` and `original`

**Returns**: `string`

**Example**
```ts
const user = await client.currentUser();

// Original profile img link
const originalProfileImage = TwitterApi.getProfileImageInSize(user.profile_image_url_https, 'original');
```
