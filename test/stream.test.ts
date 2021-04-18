import 'mocha';
import { expect } from 'chai';
import dotenv from 'dotenv';
import { TwitterApi, ETwitterStreamEvent } from '../src';
import { getAppClient } from '../src/test/utils';

const ENV = dotenv.config({ path: __dirname + '/../.env' }).parsed!;

// OAuth 1.0a
const clientOauth = new TwitterApi({
  appKey: ENV.CONSUMER_TOKEN!,
  appSecret: ENV.CONSUMER_SECRET!,
  accessToken: ENV.OAUTH_TOKEN!,
  accessSecret: ENV.OAUTH_SECRET!,
});

describe('Tweet stream API v1.1', () => {
  it('Should stream 5 tweets without any network error for statuses/filter', async () => {
    const streamv1Filter = await clientOauth.v1.filterStream({ track: 'JavaScript' });

    const numberOfTweets = await new Promise<number>((resolve, reject) => {
      let numberOfTweets = 0;

      // Awaits for a tweet
      streamv1Filter.on(ETwitterStreamEvent.ConnectionError, reject);
      streamv1Filter.on(ETwitterStreamEvent.ConnectionClosed, reject);
      streamv1Filter.on(ETwitterStreamEvent.Data, event => {
        numberOfTweets++;

        if (numberOfTweets >= 5) {
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

  beforeEach(async () => {
    // Sometimes, Twitter sends a 429 if stream close then open is executed
    // in a short period of time.
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('Should stream 5 tweets without any network error for sample/stream', async () => {
    const streamv2Filter = await clientBearer.v2.getStream('tweets/sample/stream');

    const numberOfTweets = await new Promise<number>((resolve, reject) => {
      let numberOfTweets = 0;

      // Awaits for a tweet
      streamv2Filter.on(ETwitterStreamEvent.ConnectionError, reject);
      streamv2Filter.on(ETwitterStreamEvent.ConnectionClosed, reject);
      streamv2Filter.on(ETwitterStreamEvent.Data, event => {
        numberOfTweets++;

        if (numberOfTweets >= 5) {
          resolve(numberOfTweets);
        }
      });
      streamv2Filter.on(ETwitterStreamEvent.DataKeepAlive, () => console.log('Received keep alive event'));
    }).finally(() => {
      streamv2Filter.close();
    });

    expect(numberOfTweets).to.equal(5);
  }).timeout(1000 * 120);

  it('In 15 seconds, should have the same tweets registred by async iterator and event handler', async () => {
    const streamv2Filter = await clientBearer.v2.sampleStream();

    const eventTweetIds = [] as string[];
    const itTweetIds = [] as string[];

    await Promise.race([
      // 30 seconds timeout
      new Promise(resolve => setTimeout(resolve, 15 * 1000)),
      (async function() {
        streamv2Filter.on(ETwitterStreamEvent.Data, tweet => eventTweetIds.push(tweet.data.id));

        for await (const tweet of streamv2Filter) {
          itTweetIds.push(tweet.data.id);
        }
      })(),
    ]);

    streamv2Filter.close();

    expect(eventTweetIds).to.have.length(itTweetIds.length);
    expect(eventTweetIds.every(id => itTweetIds.includes(id))).to.be.true;
  }).timeout(1000 * 120);
});
