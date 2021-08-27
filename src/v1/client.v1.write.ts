import { API_V1_1_PREFIX, API_V1_1_UPLOAD_PREFIX } from '../globals';
import TwitterApiv1ReadOnly from './client.v1.read';
import {
  MediaStatusV1Result,
  InitMediaV1Result,
  MediaMetadataV1Params,
  MediaSubtitleV1Param,
  SendTweetV1Params,
  TUploadableMedia,
  TweetV1,
  UploadMediaV1Params,
  UserV1,
  ReportSpamV1Params,
  AccountSettingsV1,
  AccountSettingsV1Params,
  ProfileBannerUpdateV1Params,
  ProfileImageUpdateV1Params,
  AccountProfileV1Params,
  FriendshipV1,
  FriendshipUpdateV1Params,
} from '../types';
import * as fs from 'fs';
import { getFileHandle, getFileSizeFromFileHandle, getMediaCategoryByMime, getMimeType, readFileIntoBuffer, readNextPartOf, sleepSecs, TFileHandle } from './media-helpers.v1';

const UPLOAD_ENDPOINT = 'media/upload.json';

/**
 * Base Twitter v1 client with read/write rights.
 */
export default class TwitterApiv1ReadWrite extends TwitterApiv1ReadOnly {
  protected _prefix = API_V1_1_PREFIX;

  /**
   * Get a client with only read rights.
   */
  public get readOnly() {
    return this as TwitterApiv1ReadOnly;
  }

  /* Tweet API */

  /**
   * Post a new tweet.
   */
  public tweet(status: string, payload: Partial<SendTweetV1Params> = {}) {
    const queryParams: Partial<SendTweetV1Params> = {
      status,
      tweet_mode: 'extended',
      ...payload,
    };

    return this.post<TweetV1>('statuses/update.json', queryParams);
  }

  /**
   * Reply to an existing tweet.
   */
  public reply(status: string, in_reply_to_status_id: string, payload: Partial<SendTweetV1Params> = {}) {
    return this.tweet(status, {
      auto_populate_reply_metadata: true,
      in_reply_to_status_id,
      ...payload,
    });
  }

  /**
   * Delete an existing tweet belonging to you.
   * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-destroy-id
   */
  public deleteTweet(tweetId: string) {
    return this.post<TweetV1>(`statuses/destroy/${tweetId}.json`, { tweet_mode: 'extended' });
  }

  /* User API */

  /**
   * Report the specified user as a spam account to Twitter.
   * Additionally, optionally performs the equivalent of POST blocks/create on behalf of the authenticated user.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/mute-block-report-users/api-reference/post-users-report_spam
   */
  public reportUserAsSpam(options: ReportSpamV1Params) {
    return this.post<UserV1>('users/report_spam.json', { tweet_mode: 'extended', ...options });
  }

  /**
   * Turn on/off Retweets and device notifications from the specified user.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/follow-search-get-users/api-reference/post-friendships-update
   */
  public updateFriendship(options: Partial<FriendshipUpdateV1Params>) {
    return this.post<FriendshipV1>('friendships/update.json', options);
  }

  /* Account API */

  /**
   * Update current account settings for authenticating user.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-settings
   */
  public updateAccountSettings(options: Partial<AccountSettingsV1Params>) {
    return this.post<AccountSettingsV1>('account/settings.json', options);
  }

  /**
   * Sets some values that users are able to set under the "Account" tab of their settings page.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile
   */
  public updateAccountProfile(options: Partial<AccountProfileV1Params>) {
    return this.post<UserV1>('account/update_profile.json', options);
  }

  /**
   * Uploads a profile banner on behalf of the authenticating user.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_banner
   */
  public async updateAccountProfileBanner(file: TUploadableMedia, options: Partial<ProfileBannerUpdateV1Params> = {}) {
    const queryParams = {
      banner: await readFileIntoBuffer(file),
      ...options,
    };
    return this.post<void>('account/update_profile_banner.json', queryParams, { forceBodyMode: 'form-data' });
  }

  /**
   * Updates the authenticating user's profile image.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_image
   */
  public async updateAccountProfileImage(file: TUploadableMedia, options: Partial<ProfileImageUpdateV1Params> = {}) {
    const queryParams = {
      tweet_mode: 'extended',
      image: await readFileIntoBuffer(file),
      ...options,
    };
    return this.post<UserV1>('account/update_profile_image.json', queryParams, { forceBodyMode: 'form-data' });
  }

  /**
   * Removes the uploaded profile banner for the authenticating user.
   * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-remove_profile_banner
   */
  public removeAccountProfileBanner() {
    return this.post<void>('account/remove_profile_banner.json');
  }

  /* Media upload API */

  /**
   * This endpoint can be used to provide additional information about the uploaded media_id.
   * This feature is currently only supported for images and GIFs.
   * https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-metadata-create
   */
  public createMediaMetadata(mediaId: string, metadata: Partial<MediaMetadataV1Params>) {
    return this.post<void>(
      'media/metadata/create.json',
      { media_id: mediaId, ...metadata },
      { prefix: API_V1_1_UPLOAD_PREFIX, forceBodyMode: 'json' },
    );
  }

  /**
   * Use this endpoint to associate uploaded subtitles to an uploaded video. You can associate subtitles to video before or after Tweeting.
   * **To obtain subtitle media ID, you must upload each subtitle file separately using `.uploadMedia()` method.**
   *
   * https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-subtitles-create
   */
  public createMediaSubtitles(mediaId: string, subtitles: MediaSubtitleV1Param[]) {
    return this.post<void>(
      'media/subtitles/create.json',
      { media_id: mediaId, media_category: 'TweetVideo', subtitle_info: { subtitles } },
      { prefix: API_V1_1_UPLOAD_PREFIX, forceBodyMode: 'json' },
    );
  }

  /**
   * Use this endpoint to dissociate subtitles from a video and delete the subtitles. You can dissociate subtitles from a video before or after Tweeting.
   * https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-subtitles-delete
   */
  public deleteMediaSubtitles(mediaId: string, ...languages: string[]) {
    return this.post<void>(
      'media/subtitles/delete.json',
      {
        media_id: mediaId,
        media_category: 'TweetVideo',
        subtitle_info: { subtitles: languages.map(lang => ({ language_code: lang })) },
      },
      { prefix: API_V1_1_UPLOAD_PREFIX, forceBodyMode: 'json' },
    );
  }

  /**
   * Upload a media (JPG/PNG/GIF/MP4/WEBP) or subtitle (SRT) to Twitter and return the media_id to use in tweet/DM send.
   *
   * @param file If `string`, filename is supposed.
   * A `Buffer` is a raw file.
   * `fs.promises.FileHandle` or `number` are file pointers.
   *
   * @param options.type File type (Enum 'jpg' | 'longmp4' | 'mp4' | 'png' | 'gif' | 'srt' | 'webp').
   * If filename is given, it could be guessed with file extension, otherwise this parameter is mandatory.
   * If type is not part of the enum, it will be used as mime type.
   *
   * Type `longmp4` is **required** is you try to upload a video higher than 140 seconds.
   *
   * @param options.chunkLength Maximum chunk length sent to Twitter. Default goes to 1 MB.
   *
   * @param options.additionalOwners Other user IDs allowed to use the returned media_id. Default goes to none.
   *
   * @param options.maxConcurrentUploads Maximum uploaded chunks in the same time. Default goes to 3.
   *
   * @param options.target Target type `tweet` or `dm`. Defaults to `tweet`.
   * You must specify it if you send a media to use in DMs.
   */
  public async uploadMedia(file: TUploadableMedia, options: Partial<UploadMediaV1Params> = {}) {
    const chunkLength = options.chunkLength ?? (1024 * 1024);

    const { fileHandle, mediaCategory, fileSize, mimeType } = await this.getUploadMediaRequirements(file, options);

    // Get the file handle (if not buffer)
    try {
      // Finally! We can send INIT message.
      const mediaData = await this.post<InitMediaV1Result>(
        UPLOAD_ENDPOINT,
        {
          command: 'INIT',
          total_bytes: fileSize,
          media_type: mimeType,
          media_category: mediaCategory,
          additional_owners: options.additionalOwners,
          shared: options.shared ? true : undefined,
        },
        { prefix: API_V1_1_UPLOAD_PREFIX },
      );

      // Upload the media chunk by chunk
      await this.mediaChunkedUpload(fileHandle, chunkLength, mediaData.media_id_string, options.maxConcurrentUploads);

      // Finalize media
      const fullMediaData = await this.post<MediaStatusV1Result>(
        UPLOAD_ENDPOINT,
        {
          command: 'FINALIZE',
          media_id: mediaData.media_id_string,
        },
        { prefix: API_V1_1_UPLOAD_PREFIX },
      );

      if (fullMediaData.processing_info && fullMediaData.processing_info.state !== 'succeeded') {
        // Must wait if video is still computed
        await this.awaitForMediaProcessingCompletion(fullMediaData);
      }

      // Video is ready, return media_id
      return fullMediaData.media_id_string;
    } finally {
      // Close file if any
      if (typeof file === 'number') {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        fs.close(file, () => {});
      }
      else if (typeof fileHandle! === 'object' && !(fileHandle instanceof Buffer)) {
        fileHandle.close();
      }
    }
  }

  protected async awaitForMediaProcessingCompletion(fullMediaData: MediaStatusV1Result) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      fullMediaData = await this.mediaInfo(fullMediaData.media_id_string);

      if (!fullMediaData.processing_info || fullMediaData.processing_info.state === 'succeeded') {
        // Ok, completed!
        return;
      }

      if (fullMediaData.processing_info.state === 'failed') {
        throw new Error('Failed to process the media.');
      }

      if (fullMediaData.processing_info.check_after_secs) {
        // Await for given seconds
        await sleepSecs(fullMediaData.processing_info.check_after_secs);
      }
      else {
        // No info; Await for 5 seconds
        await sleepSecs(5);
      }
    }
  }

  protected async getUploadMediaRequirements(file: TUploadableMedia, { type, target }: Partial<UploadMediaV1Params> = {}) {
    // Get the file handle (if not buffer)
    let fileHandle: TFileHandle;

    try {
      fileHandle = await getFileHandle(file);

      // Get the mimetype
      const mimeType = getMimeType(file, type);

      // Get the media category
      let mediaCategory: string;

      if (type === 'longmp4') {
        mediaCategory = 'amplify_video';
      } else {
        mediaCategory = getMediaCategoryByMime(mimeType, target ?? 'tweet');
      }

      return {
        fileHandle,
        mediaCategory,
        fileSize: await getFileSizeFromFileHandle(fileHandle),
        mimeType,
      };
    } catch (e) {
      // Close file if any
      if (typeof file === 'number') {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        fs.close(file, () => {});
      }
      else if (typeof fileHandle! === 'object' && !(fileHandle instanceof Buffer)) {
        fileHandle.close();
      }

      throw e;
    }
  }

  protected async mediaChunkedUpload(
    fileHandle: TFileHandle,
    chunkLength: number,
    mediaId: string,
    maxConcurrentUploads = 3,
  ) {
    // Send chunk by chunk
    let chunkIndex = 0;

    if (maxConcurrentUploads < 1) {
      throw new RangeError('Bad maxConcurrentUploads parameter.');
    }

    // Creating a buffer for doing file stuff (if we don't have one)
    const buffer = fileHandle instanceof Buffer ? undefined : Buffer.alloc(chunkLength);
    // Sliced/filled buffer returned for each part
    let readBuffer: Buffer;
    // Needed to know when we should stop reading the file
    let nread: number;
    // Needed to use the buffer object (file handles always "remembers" file position)
    let offset = 0;

    [readBuffer, nread] = await readNextPartOf(fileHandle, chunkLength, offset, buffer);
    offset += nread;

    // Handle max concurrent uploads
    const currentUploads = new Set<Promise<any>>();

    // Read buffer until file is completely read
    while (nread) {
      const mediaBufferPart = readBuffer.slice(0, nread);

      // Sent part if part has something inside
      if (mediaBufferPart.length) {
        const request = this.post(
          UPLOAD_ENDPOINT,
          {
            command: 'APPEND',
            media_id: mediaId,
            segment_index: chunkIndex,
            media: mediaBufferPart,
          },
          { prefix: API_V1_1_UPLOAD_PREFIX },
        );

        currentUploads.add(request);
        request.then(() => {
          currentUploads.delete(request);
        });

        chunkIndex++;
      }

      if (currentUploads.size >= maxConcurrentUploads) {
        // Await for first promise to be finished
        await Promise.race([...currentUploads]);
      }

      [readBuffer, nread] = await readNextPartOf(fileHandle, chunkLength, offset, buffer);
      offset += nread;
    }

    await Promise.all([...currentUploads]);
  }
}
