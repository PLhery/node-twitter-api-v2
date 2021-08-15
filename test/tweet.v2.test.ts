import 'mocha';
import { expect } from 'chai';
import { TwitterApi } from '../src';
import { getAppClient, getUserClient, sleepTest } from '../src/test/utils';

let client: TwitterApi;
let userClient = getUserClient();

describe('Tweets endpoints for v2 API', () => {
  before(async () => {
    client = await getAppClient();
  });

  it('.get - Get 2 tweets using raw HTTP method & specific endpoint', async () => {
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

  it('.search - Search and fetch tweets using tweet searcher and consume 200 tweets', async () => {
    const nodeJs = await client.v2.search('nodeJS');

    const originalLength = nodeJs.tweets.length;
    expect(nodeJs.tweets.length).to.be.greaterThan(0);

    await nodeJs.fetchNext();
    expect(nodeJs.tweets.length).to.be.greaterThan(originalLength);

    // Test if iterator correctly fetch tweets (silent)
    let i = 0;
    const ids = [];

    for await (const tweet of nodeJs) {
      ids.push(tweet.id);
      if (i > 200) {
        break;
      }

      i++;
    }

    // Check for duplicates
    expect(ids).to.have.length(new Set(ids).size);
  }).timeout(60 * 1000);

  it('.userTimeline/.userMentionTimeline - Fetch user & mention timeline and consume 150 tweets', async () => {
    const jackTimeline = await client.v2.userTimeline('12');

    const originalLength = jackTimeline.tweets.length;
    expect(jackTimeline.tweets.length).to.be.greaterThan(0);

    await jackTimeline.fetchNext();
    expect(jackTimeline.tweets.length).to.be.greaterThan(originalLength);

    const nextPage = await jackTimeline.next();
    expect(nextPage.tweets.map(t => t.id))
      .to.not.have.members(jackTimeline.tweets.map(t => t.id));

    // Test if iterator correctly fetch tweets (silent)
    let i = 0;
    const ids = [];

    for await (const tweet of jackTimeline) {
      ids.push(tweet.id);
      if (i > 150) {
        break;
      }

      i++;
    }

    // Check for duplicates
    expect(ids).to.have.length(new Set(ids).size);

    // Test mentions
    const jackMentions = await client.v2.userMentionTimeline('12', {
      'tweet.fields': ['author_id', 'in_reply_to_user_id'],
    });
    expect(jackMentions.tweets.length).to.be.greaterThan(0);
    expect(jackMentions.tweets.map(tweet => tweet.author_id)).to.not.include('12');
  }).timeout(60 * 1000);

  it('.singleTweet - Download a single tweet', async () => {
    const tweet = await client.v2.singleTweet('20');
    expect(tweet.data.text).to.equal('just setting up my twttr');
  }).timeout(60 * 1000);

  it('.tweets - Fetch a bunch of tweets', async () => {
    const tweets = await client.v2.tweets(['20', '1257577057862610951'], {
      'tweet.fields': ['author_id', 'source'],
    });
    expect(tweets.data).to.have.length(2);

    const first = tweets.data[0];
    expect(first.author_id).to.be.a('string');
    expect(first.source).to.be.a('string');
  }).timeout(60 * 1000);

  it('.like/.unlike - Like / unlike a single tweet', async () => {
    const me = await userClient.currentUser();
    const { data: { liked } } = await userClient.v2.like(me.id_str, '20');
    expect(liked).to.equal(true);

    await sleepTest(300);

    const { data: { liked: likedAfterUnlike } } = await userClient.v2.unlike(me.id_str, '20');
    expect(likedAfterUnlike).to.equal(false);
  }).timeout(60 * 1000);

  it('.tweetLikedBy - Get users that liked a tweet', async () => {
    const usersThatLiked = await userClient.v2.tweetLikedBy('20', { 'user.fields': ['created_at'] });
    expect(usersThatLiked.data).to.have.length.greaterThan(0);

    expect(usersThatLiked.data[0].created_at).to.be.a('string');
  }).timeout(60 * 1000);

  it('.tweetRetweetedBy - Get users that retweeted a tweet', async () => {
    const usersThatRt = await userClient.v2.tweetRetweetedBy('20', { 'user.fields': ['created_at'] });
    expect(usersThatRt.data).to.have.length.greaterThan(0);

    expect(usersThatRt.data[0].created_at).to.be.a('string');
  }).timeout(60 * 1000);
});
