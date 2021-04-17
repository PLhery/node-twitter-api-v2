# Authentification

This part will guide you through the multiple steps of Twitter API authentification process
inside `twitter-api-v2` package.

Please first see the [Basics](./basics.md) to know how to create a client with your application keys.

***First***, you must know which type of authentification you want to use.

- User authentification (3-legged OAuth 1.0a flow, see [User-wide authentification flow](#user-wide-authentification-flow))
- App-only authentification (Bearer token, see [Application-only authentification flow](#application-only-authentification-flow))
- Basic authentification (couple of username+password, see [Basic authentification flow](#basic-authentification-flow))

## User-wide authentification flow

Many endpoints on the Twitter developer platform use the OAuth 1.0a method to act on behalf of a Twitter account.
For example, if you have a Twitter developer app, you can make API requests on behalf of any Twitter account as long as that user authenticates your app.

This method is **fairly the most complex** of authentification flow options, but it is, at least for now, the **most used method across Twitter API**.

It is named "3-legged" because it is splitted in 3 parts:
- You (the app/server) generate a auth link that is clickable by a external user, and gives you *temporary* access tokens
- The user clicks on the link, approves the application, it gives you a verifier token
- You use the *temporary* access tokens and verifier token to obtain **user-specific** *persistent* access tokens

**NOTE**
> - If you're building a server that serves content for users,
>   you need to "remember" (store) some data between the first two steps,
>   so be sure you have a available session-like store (file/memory/Redis/...) to share data across same-user requests.
> - Between steps 1 & 2, users are redirected to official Twitter website. That means you need to have ***either***:
>   - A dedicated page in your website meant to "welcome back" users that have been sent to Twitter (this is called **oauth callback**)
>   - A dedicated input field where users can input a *PIN code* when they accepted you app on Twitter

### Create the auth link

You need to have a client instanciated with your **consumer keys** from Twitter.
```ts
const client = new TwitterApi({ appKey: CONSUMER_KEY, appSecret: CONSUMER_SECRET });
```

To create the authentification link, use `client.generateAuthLink()` method.
**If you choose to redirect users to your website after authentification, you need to provide a callback URL here.**
```ts
const authLink = await client.generateAuthLink(CALLBACK_URL);

// By default, oauth/authenticate are used for auth links, you can change with linkMode
// property in second parameter to 'authorize' to use oauth/authorize
const authLink = await client.generateAuthLink(CALLBACK_URL, { linkMode: 'authorize' });

// Use URL generated
const ... = authLink.url;
```

**IMPORTANT**: You need to store `authLink.oauth_token` and `authLink.oauth_token_secret` somewhere,
because you will need them for step 2.

### Collect temporary access tokens and get persistent tokens

#### Case 1: User has been redirected to your callback URL
When Twitter redirects to your page, it provides two query string parameters: `oauth_token` and `oauth_verifier`.

**NOTE**: If the user refuses app access, `oauth_verifier` will not be provided.

You need to extract those tokens, find the linked `oauth_token_secret` from given `oauth_token` (using your session store!),
then ask for persistent tokens.

Create a client with these tokens as access token, then call `client.login(oauth_verified)` to create a logged client.

An example flow will be written here using the **express** framework, feel free to adapt to your case.

```ts
app.get('/callback', (req, res) => {
  // Exact tokens from query string
  const { oauth_token, oauth_verifier } = req.query;
  // Get the saved oauth_token_secret from session
  const { oauth_token_secret } = req.session;

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send('You denied the app or your session expired!');
  }

  // Obtain the persistent tokens
  // Create a client from temporary tokens
  const client = new TwitterApi({
    appKey: CONSUMER_KEY,
    appSecret: CONSUMER_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  client.login(oauth_verifier)
    .then(({ client: loggedClient, accessToken, accessSecret }) => {
      // loggedClient is an authentificated client in behalf of some user
      // Store accessToken & accessSecret somewhere
    })
    .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});
```

#### Case 2: You choose to use a PIN

You need to extract the given PIN and use it as `oauth_verifier`.

Create a client with previously obtain tokens (during link generation step) as access token,
then call `client.login(given_pin)` to create a logged client.

```ts
// Obtain the persistent tokens
// Create a client from temporary tokens
const client = new TwitterApi({
  appKey: CONSUMER_KEY,
  appSecret: CONSUMER_SECRET,
  accessToken: oauth_token, // oauth token from previous step (link generation)
  accessSecret: oauth_token_secret, // oauth token secret from previous step (link generation)
});

// Give the PIN to client.login()
const { client: loggedClient, accessToken, accessSecret } = await client.login(GIVEN_USER_PIN);
// loggedClient is an authentificated client in behalf of some user
// Store accessToken & accessSecret somewhere
```

### Finally, get the full logged user object

You can use the method `.currentUser()` on your client.

This a shortcut to `.v1.verifyCredentials()` with a **cache that store user to avoid multiple API calls**.
Its returns a `UserV1` object.

## Application-only authentification flow

App-only flow use a single OAuth 2.0 Bearer Token that authenticates requests on behalf of your developer App.
As this method is specific to the App, it does not involve any users.
This method is typically for developers that need read-only access to public information.

You can instanciate a Twitter API client with two ways:
- If you already know your Bearer token (you can obtain it in the developer portal), you can use it directly in the constructor as a `string`:
```ts
const client = new TwitterApi(MY_BEARER_TOKEN);
```
- Otherwise, if you've stored your consumers (key & secret, the same needed for OAuth 1.0a flow), you can use them to obtain a fresh Bearer token:
```ts
const consumerClient = new TwitterApi({ appKey: CONSUMER_KEY, appSecret: CONSUMER_SECRET });
// Obtain app-only client
const client = await consumerClient.appLogin();
```

## Basic authentification flow

Mainly for **Twitter enterprise APIs**, that require the use of HTTP Basic Authentication.
You must pass a valid email address and password combination for each request.
The email and password combination are the same ones that you will use to access the enterprise API console, and can be editted from within this console.

Use this combination to create your Twitter API client:
```ts
const client = new TwitterApi({ username: MY_USERNAME, password: MY_PASSWORD });
```
