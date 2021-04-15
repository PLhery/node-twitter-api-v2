import { API_V1_1_PREFIX } from '../globals';
import TwitterApiv1ReadOnly from './client.v1.read';
import { FinalizeMediaResult, InitMediaResult, SendTweetParams, UploadMediaParams } from './types.v1';
import fs from 'fs';

const UPLOAD_PREFIX = 'https://upload.twitter.com/1.1/';
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

  /**
   * Post a new tweet.
   */
  public tweet(status: string, payload: Partial<SendTweetParams> = {}) {
    return this.post('statuses/update.json', { status, ...payload });
  }

  /**
   * Reply to an existing tweet.
   */
  public reply(status: string, in_reply_to_status_id: string, payload: Partial<SendTweetParams> = {}) {
    return this.tweet(status, {
      auto_populate_reply_metadata: true,
      in_reply_to_status_id,
      ...payload,
    });
  }

  /**
   * Upload a media (JPG/PNG/GIF/MP4) to Twitter and return the media_id to use in tweet send.
   * 
   * @param file If `string`, filename is supposed. 
   * A `Buffer` is a raw file. 
   * `fs.promises.FileHandle` or `number` are file pointers.
   * 
   * @param options.type File type (Enum 'jpg' | 'longmp4' | 'mp4' | 'png' | 'gif').
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
   */
  public async uploadMedia(file: string | Buffer | fs.promises.FileHandle | number, options: Partial<UploadMediaParams> = {}) {
    let fileSize: number;
    let fileHandle: fs.promises.FileHandle | number | Buffer;
    let mimeType: string;
    let mediaCategory: string;
    const chunkLength = options.chunkLength ?? (1024 * 1024);
    const type = options.type;

    // Get the file handle (if not buffer)
    try {
      if (typeof file === 'string') {
        fileHandle = await fs.promises.open(file, 'r');
      }
      else if (typeof file === 'number') {
        fileHandle = file;
      }
      else if (typeof file === 'object' && !(file instanceof Buffer)) {
        fileHandle = file;
      }
      else if (!(file instanceof Buffer)) {  
        throw new Error('Given file is not valid, please check its type.');
      }
      else {
        fileHandle = file;
      }
  
      // Get the file size
      if (typeof fileHandle === 'number') {
        const stats = await new Promise((resolve, reject) => {
          fs.fstat(fileHandle as number, (err, stats) => {
            if (err) reject(err);
            resolve(stats);
          });
        }) as fs.Stats;
  
        fileSize = stats.size;
      }
      else if (fileHandle instanceof Buffer) {
        fileSize = fileHandle.length;
      }
      else {
        fileSize = (await fileHandle.stat()).size;
      }
  
      // Get the mimetype
      if (typeof file === 'string' && !type) {
        mimeType = this.getMimeByName(file);
      }
      else if (typeof type === 'string') {
        if (type === 'gif') mimeType = 'image/gif';
        if (type === 'jpg') mimeType = 'image/jpeg';
        if (type === 'png') mimeType = 'image/png';
        if (type === 'mp4' || type === 'longmp4') mimeType = 'video/mp4';
        else mimeType = type;
      }
      else {
        throw new Error('You must specify type if file is a file handle or Buffer.');
      }
  
      // Get the media category
      if (type === 'longmp4') {
        mediaCategory = 'amplify_video';
      }
      else {
        mediaCategory = this.getMediaCategoryByMime(mimeType);
      }
  
      // Finally! We can send INIT message.
      const mediaData = await this.post<InitMediaResult>(
        UPLOAD_ENDPOINT,
        {
          command: 'INIT',
          total_bytes: fileSize,
          media_type: mimeType,
          media_category: mediaCategory,
          additional_owners: options.additionalOwners,
        },
        {
          prefix: UPLOAD_PREFIX,
        },
      );
  
      // Upload the media chunk by chunk
      await this.mediaChunkedUpload(fileHandle, chunkLength, mediaData.media_id_string, options.maxConcurrentUploads);
  
      // Finalize media
      let fullMediaData = await this.post<FinalizeMediaResult>(
        UPLOAD_ENDPOINT,
        {
          command: 'FINALIZE',
          media_id: mediaData.media_id_string,
        },
        {
          prefix: UPLOAD_PREFIX,
        },
      );
  
      // Video is ready, return media_id
      if (!fullMediaData.processing_info || fullMediaData.processing_info.state === 'succeeded') {
        return fullMediaData.media_id_string;
      }
  
      // Must wait if video is still computed
      while (true) {
        fullMediaData = await this.get(
          UPLOAD_ENDPOINT,
          {
            command: 'STATUS',
            media_id: mediaData.media_id_string,
          },
          {
            prefix: UPLOAD_PREFIX,
          },
        );
  
        if (!fullMediaData.processing_info || fullMediaData.processing_info.state === 'succeeded') {
          return fullMediaData.media_id_string;
        }
  
        if (fullMediaData.processing_info.state === 'failed') {
          throw new Error('Failed to process the media.');
        }
  
        if (fullMediaData.processing_info.check_after_secs) {
          const secs = fullMediaData.processing_info.check_after_secs;
          // Await for secs seconds
          await new Promise(resolve => setTimeout(resolve, secs * 1000));
        }
        else {
          // No info; Await for 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        }
      }
    } finally {
      // Close file if any
      if (typeof file === 'number') {
        fs.close(file, () => {});
      }
      else if (typeof fileHandle! === 'object' && !(fileHandle instanceof Buffer)) {
        fileHandle.close();
      }
    }
  }

  protected async mediaChunkedUpload(
    fileHandle: Buffer | number | fs.promises.FileHandle,
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

    [readBuffer, nread] = await this.readNextPartOf(fileHandle, chunkLength, offset, buffer);
    offset += nread;

    // Handle max concurrent uploads
    const currentUploads = new Set<Promise<any>>();

    // Read buffer until file is completely read
    while (nread) {
      // base64 encode (binary is a pain with https.request)
      const encoded = readBuffer.slice(0, nread).toString('base64');

      // Sent part if part has something inside
      if (encoded) {
        const request = this.post(
          UPLOAD_ENDPOINT,
          {
            command: 'APPEND',
            media_id: mediaId,
            segment_index: chunkIndex,
            media_data: encoded,
          },
          { prefix: UPLOAD_PREFIX },
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

      [readBuffer, nread] = await this.readNextPartOf(fileHandle, chunkLength, offset, buffer);
      offset += nread;
    }

    await Promise.all([...currentUploads]);
  }

  protected async readNextPartOf(file: number | Buffer | fs.promises.FileHandle, chunkLength: number, bufferOffset = 0, buffer?: Buffer) : Promise<[Buffer, number]> {
    if (file instanceof Buffer) {
      const rt = file.slice(bufferOffset, bufferOffset + chunkLength);
      return [rt, rt.length];
    }

    if (!buffer) {
      throw new Error('Well, we will need a buffer to store file content.');
    }

    let bytesRead: number;

    if (typeof file === 'number') {
      bytesRead = await new Promise((resolve, reject) => {
        fs.read(file as number, buffer, 0, chunkLength, bufferOffset, (err, nread) => {
          if (err) reject(err);
          resolve(nread);
        });
      });
    }
    else {
      const res = await file.read(buffer, 0, chunkLength, bufferOffset);
      bytesRead = res.bytesRead;
    }

    return [buffer, bytesRead];
  }

  protected getMimeByName(name: string) {
    if (name.endsWith('.jpeg') || name.endsWith('.jpg')) return 'image/jpeg';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.gif')) return 'image/gif';
    if (name.endsWith('.mpeg4') || name.endsWith('.mp4')) return 'video/mp4';
    
    return 'image/jpeg';
  }

  protected getMediaCategoryByMime(name: string) {
    if (name === 'video/mp4') return 'tweet_video';
    if (name === 'image/gif') return 'tweet_gif';
    else return 'tweet_image';
  }
}
