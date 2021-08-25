import 'mocha';
import { expect } from 'chai';
import { TwitterApi } from '../src';
import { getUserClient } from '../src/test/utils';

let client: TwitterApi;

describe('Tweets endpoints for v1.1 API', () => {
  before(() => {
    client = getUserClient();
  });

  it('.get - Get 2 tweets using raw HTTP method & specific endpoint', async () => {
    // Using raw HTTP method and URL
    const response1 = await client.get('https://api.twitter.com/1.1/search/tweets.json?q=@alkihis&count=2');
    // Using query parser
    const response2 = await client.v1.get('search/tweets.json', {
      q: 'alkihis',
      count: 2,
    });

    for (const response of [response1, response2]) {
      expect(response.statuses).to.have.length(2);
      const firstTweet = response.statuses[0];

      expect(firstTweet).to.haveOwnProperty('user');
      expect(firstTweet).to.haveOwnProperty('id_str');

      const firstUser = firstTweet.user;
      expect(firstUser).to.haveOwnProperty('id_str');
    }
  }).timeout(60 * 1000);

  it('.get - Get 2 tweets of a specific user', async () => {
    // Using raw HTTP method and URL
    const response1 = await client.get('https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=jack&count=2');
    // Using query parser
    const response2 = await client.v1.get('statuses/user_timeline.json', {
      screen_name: 'jack',
      count: 2,
    });

    for (const response of [response1, response2]) {
      expect(response).to.have.length(2);
      const firstTweet = response[0];

      expect(firstTweet).to.haveOwnProperty('user');
      expect(firstTweet).to.haveOwnProperty('id_str');

      const firstUser = firstTweet.user;
      expect(firstUser).to.haveOwnProperty('id_str');
      expect(firstUser).to.haveOwnProperty('screen_name');
      expect(firstUser.screen_name).to.equal('jack');
    }

  }).timeout(60 * 1000);

  it('.oembedTweet - Get a embed tweet', async () => {
    const embedTweet = await client.v1.oembedTweet('20');
    expect(embedTweet.html).to.be.a('string');
  }).timeout(60 * 1000);
});
