# Paginators

Most of the endpoints returning a paginable collection (user timeline, tweet search, home timeline, ...) returns a sub class of `TwitterPaginator`.

By default, instance is built with the initial response data, and you have access to method to fetch automatically next page(s).
```ts
const homeTimeline = await client.v1.homeTimeline();
```

## Iterate over the fetched tweets

You can use either `.tweets` (in paginators that returns tweets)
or iterate with native `Symbol.iterator`.

```ts
const fetchedTweets = homeTimeline.tweets; // Tweet(V1)(V2)[]

// or iterate with for-of
for (const fetchedTweet of homeTimeline) {
  // do something with fetchedTweet
}
```

## Download next page

You can fetch the next page of the collection with the method `.fetchNext()`.
```ts
await homeTimeline.fetchNext();
```
Items will be added to current instance and next calls to `.tweets` or `Symbol.iterator` will include **previously fetched tweets and new tweets**.

## Get next page as a new instance

Alternatively, you can use `.next()` to fetch a next page and get it as a separator instance.
```ts
const timelinePage2 = await homeTimeline.next();
```
Next page items will be only available on `timelinePage2.tweets` or through `timelinePage2[Symbol.iterator]`. New instance will **not** have items of previous page.

## Fetch until rate limit hits

If you want to fetch the maximum of tweets or iterate though the whole possible collection, you can use async iterator or `.fetchLast()`.

```ts
// Will fetch 1000 more tweets (automatically split into separate requests),
// except if the rate limit is hit or if no more results are available
await homeTimeline.fetchLast(1000);
```

Alternatively, you can achieve this behaviour with async iterators:
```ts
// Note presence of 'await' here
for await (const tweet of homeTimeline) {
  // Iterate until rate limit is hit
  // or API calls returns no more results
}
```

## v2 meta, includes

For tweets endpoints that returns `meta`s and `includes` in their payload, `v2` paginators supports them (and merge them into a unique container :D),
just use `Paginator.meta` or `Paginator.includes`.

```ts
const mySearch = await client.v2.search('nodeJS');

for await (const tweet of mySearch) {
  const availableMeta = mySearch.meta;
  const availableIncludes = mySearch.includes;

  // availableMeta and availableIncludes are filled with .meta and .includes
  // fetched at the time you were reading this tweet
  // Once the next page is automatically fetched, they can be updated!
}
```

## Previous page

On paginators that supports it, you can get previous pages with `.previous()` and `.fetchPrevious()`.

Their behaviour is comparable as `.next()` and `.fetchNext()`.
