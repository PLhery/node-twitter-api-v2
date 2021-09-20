# Basics

> *For convenience, all the code examples in this documentation will be presented in TypeScript.*
> Feel free to convert them to regular JavaScript. If you don't use a transpiler,
> you might need to replace `import`s by `require()` calls.

## Client basics

### Create a client

Import the default export `TwitterApi` variable from `twitter-api-v2` module.

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
// Create a client with an already known bearer token
const appOnlyClient = new TwitterApi('bearerToken');
// OR - you can also create a app-only client from your consumer keys -
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

## Use the versionned API clients - URL prefixes

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

## Use the endpoint-wrapper methods

See the [documentation for v1 client API](./v1.md) or [documentation for v2 client API](./v2.md).
