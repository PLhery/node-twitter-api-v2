import 'mocha';
import { expect } from 'chai';
import { TwitterApi, ETwitterStreamEvent, ApiResponseError } from '../src';
import { getAppClient, getUserClient } from '../src/test/utils';

// OAuth 1.0a
const clientOauth = getUserClient();

async function retryUntilNoRateLimitError<T>(callback: () => Promise<T>): Promise<T> {
  while (true) {
    try {
      return await callback();
    } catch (e) {
      if (e instanceof ApiResponseError && [420, 429].includes(e.code)) {
        // Sleeps for 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Error is not a rate limit error, throw it.
      throw e;
    }
  }
}

describe('Tweet stream API v1.1', () => {
  it('Should stream 3 tweets without any network error for statuses/filter', async () => {
    const streamv1Filter = await retryUntilNoRateLimitError(() => clientOauth.v1.filterStream({ track: 'JavaScript' }));

    const numberOfTweets = await new Promise<number>((resolve, reject) => {
      let numberOfTweets = 0;

      // Awaits for a tweet
      streamv1Filter.on(ETwitterStreamEvent.ConnectionError, reject);
      streamv1Filter.on(ETwitterStreamEvent.ConnectionClosed, reject);
      streamv1Filter.on(ETwitterStreamEvent.Data, event => {
        numberOfTweets++;

        if (numberOfTweets >= 3) {
          resolve(numberOfTweets);
        }
      });
      streamv1Filter.on(ETwitterStreamEvent.DataKeepAlive, () => console.log('Received keep alive event'));
    }).finally(() => {
      streamv1Filter.close();
    });

    expect(numberOfTweets).to.equal(5);
  }).timeout(1000 * 60);
});

describe('Tweet stream API v2', () => {
  let clientBearer: TwitterApi;

  before(async () => {
    clientBearer = await getAppClient();
  });

  it('Should stream 3 tweets without any network error for sample/stream', async () => {
    const streamv2Filter = await retryUntilNoRateLimitError(() => clientBearer.v2.getStream('tweets/sample/stream'));

    const numberOfTweets = await new Promise<number>((resolve, reject) => {
      let numberOfTweets = 0;

      // Awaits for a tweet
      streamv2Filter.on(ETwitterStreamEvent.ConnectionError, reject);
      streamv2Filter.on(ETwitterStreamEvent.ConnectionClosed, reject);
      streamv2Filter.on(ETwitterStreamEvent.Data, event => {
        numberOfTweets++;

        if (numberOfTweets >= 3) {
          resolve(numberOfTweets);
        }
      });
      streamv2Filter.on(ETwitterStreamEvent.DataKeepAlive, () => console.log('Received keep alive event'));
    }).finally(() => {
      streamv2Filter.close();
    });

    expect(numberOfTweets).to.equal(5);
  }).timeout(1000 * 120);

  it('In 10 seconds, should have the same tweets registred by async iterator and event handler', async () => {
    const streamV2 = await retryUntilNoRateLimitError(() => clientBearer.v2.sampleStream());

    const eventTweetIds = [] as string[];
    const itTweetIds = [] as string[];

    await Promise.race([
      // 10 seconds timeout
      new Promise(resolve => setTimeout(resolve, 10 * 1000)),
      (async function() {
        streamV2.on(ETwitterStreamEvent.Data, tweet => eventTweetIds.push(tweet.data.id));

        for await (const tweet of streamV2) {
          itTweetIds.push(tweet.data.id);
        }
      })(),
    ]);

    streamV2.close();

    expect(eventTweetIds).to.have.length(itTweetIds.length);
    expect(eventTweetIds.every(id => itTweetIds.includes(id))).to.be.true;
  }).timeout(1000 * 120);
});
