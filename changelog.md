1.12.3
-------
- Feat: .favoriteTimeline for API v1 #296 (thanks to @AuroraDysis)
- Feat: duration_millis property for v1 medias (thanks to @RyoshiKayo)
- Feat: source_user_id and source_user_id_str missing properties in MediaEntityV1 (thanks to @AuroraDysis)

1.12.2
------
- Feat: .homeTimeline for API v2 #288

1.12.1
------
- Fix: missing id prop of TweetEntityMentionV2 #274 (@lima-eduardo)
- Fix: add place_id to SendTweetV1Params #287 (@viniciuskneves)

1.12.0
------
- Feat: Update plugin API to support response overloading on error #248
- Feat: `.quote` method to create a retweet with comment (quoted tweet) in `v1` and `v2` #260 (@jonah-saltzman)

1.11.3
------
- Feat: New spaces features: `topic_ids` and `ended_at` on space object, `/spaces/:id/buyers` endpoint #237
- Feat: New bookmarks API #237
- Feat: New Quoted tweets endpoint #237
- Feat: Allow v2.search to be used without query parameter #252
- Fix: Usertimeline v1 endpoint .done property value is false #238
- Feat: `sort_order` parameter #246 (@nolbuzanis)
- Fix: Better error message for failed media uploads #244 (@nolbuzanis)

1.11.2
------
- Fix: .meta is not correctly typed in paginators #231
- Fix: Catched promise is rejected without ability of catching it later when a request fails and a plugin is used #229

1.11.1
------
- Feat: Support error hooks in plugins #226 #227
- Fix: Bypass Twitter v2 incoherence by converting `start_time` to a valid `since_id` when `until_id` is used in paginators #197 #228
- Feat: Getter for DM images `.v1.downloadDmImage` to download images hosted on `ton.twitter.com` protected by OAuth 1.0a

1.11.0
------
- Feat: Support plugins (more features coming soon as plugins!)
- Feat: Compression level can now be specified explicitly
- Refactor: `.v1.uploadMedia()` now accept `options.mimeType` and `options.longVideo` as argument, in replacement of `options.type` (which is now deprecated)
- Fix: OAuth2 scope incorrectly encoded #184

1.10.3
------
- Feat: Native support of gzip compression for streaming endpoints
- Feat: Native support of brotli (25% more compressed than gzip) compression for non-streaming endpoints, when available

1.10.2
------
- Feat: Native support of gzip/deflate compression for non-streaming endpoints

1.10.1
------
- Fix: Crash when a v2 paginator is empty and response does not contains a `.meta` property #177
- Fix: "Memory leak" when response are abruptly closed by Twitter or OS, because no close/error listener on response object was attributed

1.10.0
------
- Feat: Pagination support for `tweets/:id/liking_users` and `tweets/:id/retweeted_by` #165
- Feat: Support custom Node HTTP agents #149
- Doc: Better example for `.v2.me()` and fix typos #160 #164 (thanks to @rbochenek and @ShubhamKushwah)

1.9.1
-----
- Fix: Use next_token instead of until_id if pagination token available #152

1.9.0
-----
- Feat: Helpers for v2 includes
- Feat: Support for custom debug loggers
- Fix: Errors accessor to get API errors in paginators #145
- Fix: Correctly update .includes/.meta/.errors in paginators when using async iterator #142
- Fix: Incorrect HTTP method for GET lists #147 #148
- Doc: Better doc & examples for OAuth 2.0 user-context

1.8.1
-----
- Feat: Add every GET lists v2 endpoints

1.8.0
-----
- Feat: Add OAuth2 user-context support
- Feat: Add users/me v2 endpoint wrapper

1.7.2
-----
- Fix: Paginator can return multiple times the same results in some conditions
- Feat: .done property for paginators, to know when a next page is fetchable

1.7.1
-----
- Fix: wrong type for optional parameter images in TweetEntityUrlV2

1.7.0
-----
- Feat: Create tweet v2 endpoint (thanks to @sudo-kaizen) #110
- Feat: Delete tweet v2 endpoint (thanks to @sudo-kaizen) #111
- Feat: Tweet thread and reply to a tweet v2
- Fix: BREAKING: Explicitly specify userId on userMutingUsers (thanks to @mika-f) #114

1.6.5
-----
- Fix: Increase retry timeout on stream reconnection

1.6.4
-----
- Fix: Reject stream reconnection if a reconnect process is already started

1.6.3
-----
- Fix: Streams will know correctly reject `.connect` `Promise` on connection error if `autoReconnect` is `false`

1.6.2
-----
- Feat: Streams do now support auto-reconnection for the initial connection attempt

1.6.1
-----
- Feat: New option for creating streams, `autoConnect` that is `true` by default ; Setting the value to `false` will cause the `TweetStream` object to be returned immediately (not in a `Promise`), because connection isn't awaited #92
- Fix: `autoReconnectRetries`: Setting this params to `Infinity` no longer causes the stream reconnection attempts to be delayed to next event loop turn #92
- Fix: Use `https.request(options)` instead of `https.request(url, options)`, because some people has outdated dependencies that overwrite native Node's exported function and break its signature #94 #96
- Feat: Next retry timeout computation can be customized by using `.nextRetryTimeout` property of `TweetStream` instance, that is function taking a `tryOccurence` and returning the number of milliseconds to wait before trying to reconnect

1.6.0
-----
- Feat: List v2 muted users endpoint #89
- Feat: Manage v2 lists endpoints
- Feat: Support user-flow with OAuth2 (beta - not documented yet)
- Fix: Incorrect typing for createMediaMetadata #93

1.5.2
-----
- Feat: Tweet thread helper #76 #79
- Fix: Explicit max_results parameters should now work properly in paginators #74 #84
- Fix: Endpoints with parameterized URLs now registers properly rate-limit data in cache store

1.5.1
-----
- Fix: Fix return type for v1.1 'tweets' wrapper #72

1.5.0
-----
- Feat: v1.1 List endpoints, GET and POST, with doc, paginators and typings #70
- Feat: Save rate limit information for last request of each endpoint #70
- Doc: Documentation improvements for uploading media #68 #70
- Doc: Fixed parameter name #67

1.4.1
-----
- Fix: Incorrect type union in MessageCreateAttachmentV1 & MessageCreateLocationV1
- Doc: Added real-life examples
- Doc: Add Twitter doc link to .tweet/.reply

1.4.0
-----
- Feat: Add every oauth/authenticate parameters #54 - thanks to @tbhmens
- Fix: Set allowSyntheticDefaultImport to false to improve compat #57 - thanks to @PLHery
- Feat: Add missing tweet.field items in type enumeration #60 - thanks to @filippkowalski
- Doc: Add info about error handling #61
- Feat: Endpoint wrappers for v2 Spaces endpoints #62
- Feat: Endpoint wrappers for v2 Batch Compliance endpoints #62
- Feat: Types & wrappers for account, friendships, users and tweets v1.1 endpoints #64
- Fix: Incorrect encoding of '*' character in query strings #63 #64

1.3.0
-----
- Doc: Improve rate-limit documentation #47 #32
- Feat: Public Direct Messages (DMs) 1.1 endpoints support: wrappers, typings, docs and tests #48
- Feat: New 05/06/07-2021 v2 endpoints wrappers #50
- Feat: Paginator mode for .following/.followers for v2 #50
- Fix: Many fixes for tweet streams auto-reconnect, handle connection errors more smoothly #50
- Feat: New events for tweet streams, that includes lost connection and reconnections #50
- Feat: Handle stream errors deliveries in a dedicated .DataError event (for v2 tweet streams) #50
- Fix: Corrections for body-mode auto-detection (mainly for manual API requests) #53

1.2.0
-----
- Fix: fetchLast was throwing an error with timelines #43
- Feat: Add .meta and .includes in v2 paginators #35 #46
- Feat: Add some missing attributes to tweetEntity typings #42

1.1.1
-----
- Fix: in streams, the KeepAlive was not emitted #33

1.1.0
-----
- Add the new v2 likes endpoint
- Fix: add some missing media types

1.0.0
-----
First Stable Version
- More tests, way more documentation
- Add every missing v2 endpoints
- Remove the two dependencies (form-data and oauth)
- Improve error management
- Fix issues with node12
- Fix issues with the auth API

0.4.0
-----
- Add V1 and V2 streaming V2 endpoints
- Add V2 followers and following endpoints
- Refactor / various fixes

0.3.0
-----
- Add the four API v2 user endpoints
- Improve type definitions
- Minor v2 search refactor

0.2.3
-----
- Fix npm package (was not built)

0.2.1
-----
- Export typescript definitions

0.2.0
-----
- Link and Oauth auth
- PUT/PATCH/DELETE
- improve get/post methods (build query strings, v1/v2 urls, ...)
- read/write/DMs segmentation
- native media chunked upload, with simultaneous send of file parts

0.1.0
-----
- First foundations