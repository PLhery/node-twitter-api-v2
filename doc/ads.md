# Twitter Ads API (beta)

The `twitter-api-v2` package includes experimental support for the Twitter Ads API.

> **Beta note:** endpoint-specific helpers are not yet implemented. Use generic HTTP helpers such as `.get`, `.post`, `.put`, etc.

## Authentication & Base URL

The Ads API uses the same OAuth flows as the main client. Create a `TwitterApi` instance with your credentials and access the Ads client through `client.ads`.

The client automatically prefixes requests with the appropriate Ads API base URL, so you don't need to manage the base URL yourself.

```ts
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({ /* your app credentials */ });

// Access the Ads API
const adsClient = client.ads;

// Access the Ads Sandbox API
const sandbox = client.ads.sandbox;

// Use generic HTTP helpers
const accounts = await adsClient.get('accounts');
```

The sandbox client uses the Ads sandbox base URL internally as well.
