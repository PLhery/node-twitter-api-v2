# Available helpers

This is a comprehensive guide of all helpers available for the Twitter API on both versions v1.1 and v2.

**Helpers are static methods available only on imported `TwitterApi` object from the package, not from its instances**.

## Extract errors in an array

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

## Change image size of a profile picture

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
