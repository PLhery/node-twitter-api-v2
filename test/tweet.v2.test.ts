import 'mocha';
import { expect } from 'chai';
import { TwitterApi } from '../src';
import { getAppClient } from '../src/test/utils';

let client: TwitterApi;

describe('Tweets endpoints for v2 API', () => {
  before(async () => {
    client = await getAppClient();
  });

  it('Get 2 tweets using raw HTTP method & specific endpoint', async () => {
    // Using raw HTTP method and URL
    const response1 = await client.get('https://api.twitter.com/2/tweets?ids=20,1306166445135605761&expansions=author_id&tweet.fields=public_metrics&user.fields=name,public_metrics');
    // Using query parser
    const response2 = await client.v2.get('tweets', {
      ids: '20,1306166445135605761',
      expansions: 'author_id',
      'tweet.fields': 'public_metrics',
      'user.fields': 'name,public_metrics',
    });

    for (const response of [response1, response2]) {
      expect(response.data.length).to.equal(2);
      const firstTweet = response.data[0];

      expect(firstTweet).to.haveOwnProperty('author_id');
      expect(firstTweet).to.haveOwnProperty('public_metrics');

      const includes = response.includes?.users;
      const firstInclude = includes[0];
      expect(includes).to.have.length(2);
      expect(firstInclude).to.haveOwnProperty('name');
    }

  }).timeout(60 * 1000);

  it('Search and fetch tweets using tweet searcher', async () => {
    const nodeJs = await client.search('nodeJS');

    const originalLength = nodeJs.tweets.length;
    expect(nodeJs.tweets.length).to.be.greaterThan(0);

    await nodeJs.fetchNext();
    expect(nodeJs.tweets.length).to.be.greaterThan(originalLength);

    // Test if iterator correctly fetch tweets (silent)
    let i = 0;
    for await (const _ of nodeJs) {
      if (i > 1000) {
        break;
      }

      i++;
    }
  }).timeout(60 * 1000);
});


// describe('', () => {
//   it('', async () => {

//   }).timeout(60 * 1000);
// });
