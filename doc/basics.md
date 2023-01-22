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

Instantiate with your wanted authentication method.

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

// OAuth2 (app-only or user context)
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

## Authentication

Please see [Authentication part](./auth.md) of the doc.

### Get current user

#### v1 API

If you want to access currently the logged user inside v1 API (= you're logged with OAuth 1.0a/OAuth2 user-context),
you can use the method `.currentUser()`.

This a shortcut to `.v1.verifyCredentials()` with a **cache that store user to avoid multiple API calls**.
Its returns a `UserV1` object.

#### v2 API

If you want to access the currently logged user inside v2 API,
you can use the method `.currentUserV2()`.

This a shortcut to `.v2.me()` with a **cache that store user to avoid multiple API calls**.
Its returns a `UserV2Result` object.

## Use the versioned API clients - URL prefixes

By default, `twitter-api-v2` doesn't know which version of the API you want to use (because it supports both!).

For this reason, we allow you to choose which version you want to use: `v1` or `v2`!
```ts
const v1Client = client.v1;
const v2Client = client.v2;

// We also think of users who test v2 labs endpoints :)
const v2LabsClient = client.v2.labs;
```

Using the versioned client **auto-prefix requests** with default prefixes
(for v1: `https://api.twitter.com/1.1/`, for v2: `https://api.twitter.com/2/`,
for labs v2: `https://api.twitter.com/labs/2/`)
and this gives you access to endpoint-wrapper methods!

## Use the endpoint-wrapper methods

See the [documentation for v1 client API](./v1.md) or [documentation for v2 client API](./v2.md).

## Make requests behind a proxy

If your network connection is behind a proxy and you don't be able to make requests with the default configuration, you can use a custom HTTP agent to configure this behavior.

```ts
// Note: this package is an external package, it isn't bundled with Node.
import * as HttpProxyAgent from 'https-proxy-agent';

// HTTPS proxy to connect to
// twitter-api-v2 will always use HTTPS
const proxy = process.env.HTTP_PROXY || 'https://1.1.1.1:3000';

// create an instance of the `HttpProxyAgent` class with the proxy server information
const httpAgent = new HttpProxyAgent(proxy);

// Instantiate helper with the agent
const client = new TwitterApi('<bearerToken>', { httpAgent });
```
