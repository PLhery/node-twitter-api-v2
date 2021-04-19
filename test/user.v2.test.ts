import 'mocha';
import { expect } from 'chai';
import { TwitterApi, TwitterApiReadOnly, TwitterApiReadWrite } from '../src';
import { getAppClient, getUserClient } from '../src/test/utils';

let client: TwitterApi;
let roClient: TwitterApiReadOnly;
let rwClient: TwitterApiReadWrite;
let userClient: TwitterApi;

describe('Users endpoints for v2 API', () => {
  before(async () => {
    client = await getAppClient();
    roClient = client.readOnly;
    rwClient = client.readWrite;
    userClient = getUserClient();
  });

  it('.user/.users - Get users by ID', async () => {
    const jack = await roClient.v2.user('12', {
      'expansions': ['pinned_tweet_id'],
      'tweet.fields': ['source', 'lang'],
      'user.fields': 'username',
    });

    expect(jack.data).to.be.a('object');
    expect(jack.data.id).to.equal('12');
    expect(jack.data.username.toLowerCase()).to.equal('jack');

    if (jack.data.pinned_tweet_id) {
      expect(jack.includes!).to.be.a('object');
      expect(jack.includes!.tweets).to.have.length.greaterThan(0);
      expect(jack.includes!.tweets![0]).to.haveOwnProperty('source');
      expect(jack.includes!.tweets![0]).to.haveOwnProperty('lang');
    }

    const users = await roClient.v2.users(['12', '14561327']);
    expect(users.data).to.have.length(2);
  }).timeout(60 * 1000);

  it('.userByUsername/.usersByUsernames - Get users by screen names', async () => {
    const jack = await roClient.v2.userByUsername('jack', {
      'expansions': ['pinned_tweet_id'],
      'tweet.fields': ['source', 'lang'],
      'user.fields': 'username',
    });

    expect(jack.data).to.be.a('object');
    expect(jack.data.id).to.equal('12');
    expect(jack.data.username.toLowerCase()).to.equal('jack');

    if (jack.data.pinned_tweet_id) {
      expect(jack.includes!).to.be.a('object');
      expect(jack.includes!.tweets).to.have.length.greaterThan(0);
      expect(jack.includes!.tweets![0]).to.haveOwnProperty('source');
      expect(jack.includes!.tweets![0]).to.haveOwnProperty('lang');
    }

    const users = await roClient.v2.usersByUsernames(['jack', 'dhh']);
    expect(users.data).to.have.length(2);
  }).timeout(60 * 1000);

  it('.followers/.following - Get relationships of user', async () => {
    const followersOfJack = await roClient.v2.followers('12', {
      'expansions': ['pinned_tweet_id'],
      'tweet.fields': ['source', 'lang'],
      'user.fields': 'username',
    });

    expect(followersOfJack.data).to.be.a('array');
    expect(followersOfJack.data).to.have.length.greaterThan(0);

    if (followersOfJack.includes?.tweets?.length) {
      expect(followersOfJack.includes.tweets).to.have.length.greaterThan(0);
      expect(followersOfJack.includes.tweets[0]).to.haveOwnProperty('source');
      expect(followersOfJack.includes.tweets[0]).to.haveOwnProperty('lang');
    }

    const followingsOfJack = await roClient.v2.following('12', {
      'expansions': ['pinned_tweet_id'],
      'tweet.fields': ['source', 'lang'],
      'user.fields': 'username',
    });

    expect(followingsOfJack.data).to.be.a('array');
    expect(followingsOfJack.data).to.have.length.greaterThan(0);

    if (followingsOfJack.includes?.tweets?.length) {
      expect(followingsOfJack.includes.tweets).to.have.length.greaterThan(0);
      expect(followingsOfJack.includes.tweets[0]).to.haveOwnProperty('source');
      expect(followingsOfJack.includes.tweets[0]).to.haveOwnProperty('lang');
    }
  }).timeout(60 * 1000);

  it('.follow/.unfollow - Follow/unfollow a user', async () => {
    const { readOnly, readWrite } = userClient;

    const currentUser = await readOnly.currentUser();
    // Follow then unfollow jack
    const followInfo = await readWrite.v2.follow(currentUser.id_str, '12');
    expect(followInfo.data.following).to.equal(true);

    // Sleep 2 seconds
    await new Promise(resolve => setTimeout(resolve, 1000 * 2));

    // Unfollow jack
    const unfollowInfo = await readWrite.v2.unfollow(currentUser.id_str, '12');
    expect(unfollowInfo.data.following).to.equal(false);
  }).timeout(60 * 1000);

  it('.block/.unblock - Block/unblock a user', async () => {
    const { readOnly, readWrite } = userClient;

    const currentUser = await readOnly.currentUser();
    // Block jack
    const blockInfo = await readWrite.v2.block(currentUser.id_str, '12');
    expect(blockInfo.data.blocking).to.equal(true);

    // Sleep 2 seconds
    await new Promise(resolve => setTimeout(resolve, 1000 * 2));

    // unblock jack
    const unblockInfo = await readWrite.v2.unblock(currentUser.id_str, '12');
    expect(unblockInfo.data.blocking).to.equal(false);
  }).timeout(60 * 1000);
});


// describe('', () => {
//   it('', async () => {

//   }).timeout(60 * 1000);
// });
