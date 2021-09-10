# Rate limiting

## Get last rate limit info

### Using endpoint wrappers

You can obtain lastly collected information of rate limit for each already used endpoint.

First, you need to know **which endpoint URL is concerned by the used endpoint wrapper**, for example,
for `.v1.tweets`, it is `statuses/lookup.json`. The endpoint is always specified in the lib documentation.

Use the endpoint URL to know:
- The last received status of rate limiting with `.getLastRateLimitStatus`
- If the stored rate limit information has expired with `.isRateLimitStatusObsolete`
- If you hit the rate limit the last time you called this endpoint, with `.hasHitRateLimit`

```ts
// Usage of statuses/lookup.json
const tweets = await client.v1.tweets(['20', '30']);

// Don't forget to add .v1, otherwise you need to prefix
// your endpoint URL with https://api.twitter.com/... :)
console.log(client.v1.getLastRateLimitStatus('statuses/lookup.json'));
// => { limit: 900, remaining: 899, reset: 1631015719 }

console.log(client.v1.isRateLimitStatusObsolete('statuses/lookup.json'));
// => false if 'reset' property mentions a timestamp in the future

console.log(client.v1.hasHitRateLimit('statuses/lookup.json'));
// => false if 'remaining' property is > 0
```

### Special case of HTTP methods helpers

If you use a HTTP method helper (`.get`, `.post`, ...), you can get a **full response** object that directly contains the rate limit information,
even if the request didn't fail!
```ts
const manualFullResponse = await client.v1.get<TweetV1TimelineResult>('statuses/home_timeline.json', { since_id: '20' }, { fullResponse: true });

// Response data
manualFullResponse.data; // TweetV1TimelineResult
// Rate limit information
manualFullResponse.rateLimit; // { limit: number, remaining: number, reset: number }
```

## Handle errors - Everywhere in this library

This library helps you to handle rate limiting.
When a request fails (with a Twitter response), it create a `ApiResponseError` instance and throw it.

If `ApiResponseErrorInstance.rateLimitError` is `true`, then you just hit the rate limit.
You have access to rate limit limits with `ApiResponseErrorInstance.rateLimit`:

```ts
import { ApiResponseError } from 'twitter-api-v2';

try {
  // Get a single tweet
  await client.v1.tweet('20');
} catch (error) {
  if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
    console.log(`You just hit the rate limit! Limit for this endpoint is ${error.rateLimit.limit} requests!`);
    console.log(`Request counter will reset at timestamp ${error.rateLimit.reset}.`);
  }
}
```

---

**Example**: You can automate this process with a waiter that will retry a failed request after the reset timer is over:

*Warning*: This method can be VERY ineffective, as it can wait up to 15 minutes (Twitter's usual rate limit reset time).
```ts
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(ms, resolve));
}

async function autoRetryOnRateLimitError<T>(callback: () => T | Promise<T>) {
  while (true) {
    try {
      return await callback();
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
        const resetTimeout = error.rateLimit.reset * 1000; // convert to ms time instead of seconds time
        const timeToWait = resetTimeout - Date.now();

        await sleep(timeToWait);
        continue;
      }

      throw error;
    }
  }
}

// Then use it...
await autoRetryOnRateLimitError(() => client.v1.tweet('20'));
```

## Special case of paginators

Paginators will automatically handle the rate limit when using `.fetchLast` or async iteration.
The `.fetchLast` or iteration will automatically ends when rate limit is hit.

Moreover, you can access current rate limit status for paginator's endpoint with the `.rateLimit` getter.
```ts
const paginator = await client.v1.homeTimeline();
console.log(paginator.rateLimit); // { limit: number, remaining: number, reset: number }
```
