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
  it('Should stream 5 tweets without any network error for sample/stream', async () => {
    const clientBearer = await getAppClient();
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
  }).timeout(1000 * 20);
});
