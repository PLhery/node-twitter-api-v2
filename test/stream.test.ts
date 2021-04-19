import 'mocha';
import { expect } from 'chai';
import { TwitterApi, ETwitterStreamEvent, ApiResponseError } from '../src';
import { getAppClient, getUserClient } from '../src/test/utils';

// OAuth 1.0a
const clientOauth = getUserClient();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function retryUntilNoRateLimitError<T>(callback: () => Promise<T>, maxTime = 110 * 1000): Promise<T> {
  let retries = 0;
  const startTime = Date.now();
  const endTime = startTime + maxTime;

  while (true) {
    try {
      if (retries) {
        console.log('\tRetry', retries, 'started.');
      }
      if (endTime < Date.now()) {
        throw new Error('Timeout.');
      }

      return await callback();
    } catch (e) {
      if (e instanceof ApiResponseError && [420, 429].includes(e.code)) {
        // Randomly sleeps to allow other tests to end
        const seconds = randInt(2, 40);
        retries++;
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        continue;
      }

      // Error is not a rate limit error, throw it.
      throw e;
    }
  }
}

describe('Tweet stream API v1.1', () => {
  it('Should stream 3 tweets without any network error for statuses/filter using events', async () => {
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

    expect(numberOfTweets).to.equal(3);
  }).timeout(1000 * 120);
});

describe('Tweet stream API v2', () => {
  let clientBearer: TwitterApi;

  before(async () => {
    clientBearer = await getAppClient();
  });

  it('Should stream 3 tweets without any network error for sample/stream using async iterator', async () => {
    const streamv2Sample = await retryUntilNoRateLimitError(() => clientBearer.v2.getStream('tweets/sample/stream'));

    let numberOfTweets = 0;

    for await (const _ of streamv2Sample) {
      numberOfTweets++;

      if (numberOfTweets >= 3) {
        break;
      }
    }

    streamv2Sample.close();

    expect(numberOfTweets).to.equal(3);
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
