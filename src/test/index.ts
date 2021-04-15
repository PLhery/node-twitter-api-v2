import { TwitterApi, ETwitterStreamEvent } from '..';
import commander from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';

const ENV = dotenv.config({ path: __dirname + '/../../.env' }).parsed!;

commander
  .option('--request-token <callback>', 'Ask for OAuth 1.0a request token for callback <callback>')
  .option('--access-token <verifier>', 'Ask for OAuth 1.0a access token with verifier <verifier>. Use access tokens from .env')
  .option('--classic', 'Run OAuth 1.0a tests')
  .option('--allow-write', 'Run write OAuth 1.0a tests (default: only read)')
  .option('--app-only', 'Run OAuth2 app-only tests')
  .option('--streaming', 'Run OAuth1.0a + 2 tests')
.parse(process.argv);

(async () => {
  if (commander.accessToken) {
    const client = await getAccessClient(commander.accessToken);
    console.log(client.getActiveTokens());
  }
  else if (commander.classic) {
    // OAuth 1.0a
    const client = new TwitterApi({
      appKey: ENV.CONSUMER_TOKEN!,
      appSecret: ENV.CONSUMER_SECRET!,
      accessToken: ENV.OAUTH_TOKEN!,
      accessSecret: ENV.OAUTH_SECRET!,
    });

    console.log(client);

    console.log(
      await client.get('https://api.twitter.com/1.1/search/tweets.json?q=@alkihis')
    );

    const roClient = client.readOnly;
    const rwClient = client.readWrite;

    console.log(
      'With v1',
      await client.v1.get('search/tweets.json', { q: 'alkihis' })
    );

    const path = '/Users/alki/Desktop/llolo.gif';

    console.log(
      'Upload media (from path)',
      await client.v1.uploadMedia(path)
    );

    console.log(
      'Upload media (from buffer)',
      await client.v1.uploadMedia(await fs.promises.readFile(path), { type: 'jpg' })
    );

    console.log(
      'Upload media (from fileHandle)',
      await client.v1.uploadMedia(await fs.promises.open(path, 'r'), { type: 'jpg' })
    );

    console.log(
      'Upload media (from numbered fileHandle)',
      await client.v1.uploadMedia(fs.openSync(path, 'r'), { type: 'jpg', maxConcurrentUploads: 1 })
    );

    // Send a tweet
    if (commander.allowWrite) {
      console.log(
        'Send tweet',
        await client.v1.tweet('Hello, this is a test.'),
      );

      // rwClient.v1.tweet; // ok
      // roClient.v1.tweet; // dont exist!
    }
  }
  else if (commander.appOnly) {
    // OAuth2
    const client = await getAppClient();

    // Bearer token
    // console.log(client.getActiveTokens())

    // Tweets
    console.log(
      'Tweets',
      await client.get('https://api.twitter.com/2/tweets?ids=20,1306166445135605761&expansions=author_id&tweet.fields=public_metrics&user.fields=name,public_metrics')
    );

    // Tweets
    console.log(
      'Tweets with v2',
      await client.v2.get('tweets', {
        ids: '20',
        expansions: 'author_id',
        'tweet.fields': 'public_metrics',
        'user.fields': 'name,public_metrics',
      })
    );

    // Search
    const nodeJs = await client.search('nodeJS');
    console.log('fetched tweets', nodeJs.tweets.length);

    await nodeJs.fetchNext();
    console.log(nodeJs.tweets.length);

    let i = 0;
    for await (const _ of nodeJs) {
      if (i > 1000) {
        console.log('Hit 1000 tweets', nodeJs.rateLimit);
        break;
      }

      i++;
    }
  }
  else if (commander.requestToken) {
    console.log(await getAuthLink(commander.requestToken));
  }
  else if (commander.streaming) {
    // OAuth 1.0a
    const clientOauth = new TwitterApi({
      appKey: ENV.CONSUMER_TOKEN!,
      appSecret: ENV.CONSUMER_SECRET!,
      accessToken: ENV.OAUTH_TOKEN!,
      accessSecret: ENV.OAUTH_SECRET!,
    });

    const streamv1Filter = await clientOauth.v1.filterStream({ track: 'gens' });

    await new Promise<void>((resolve, reject) => {
      let numberOfTweets = 0;

      // Awaits for a tweet
      streamv1Filter.on(ETwitterStreamEvent.ConnectionError, reject);
      streamv1Filter.on(ETwitterStreamEvent.ConnectionClosed, reject);
      streamv1Filter.on(ETwitterStreamEvent.Data, event => {
        console.log('v1 DATA received !', event?.id ?? event);
        numberOfTweets++;

        if (numberOfTweets >= 5) {
          resolve();
        }
      });
      streamv1Filter.on(ETwitterStreamEvent.DataKeepAlive, () => console.log('Received keep alive event'));
    });

    streamv1Filter.close();

    // OAuth2
    const clientBearer = await getAppClient();

    const streamv2Filter = await clientBearer.v2.getStream('tweets/sample/stream')
      .catch((err: any) => {
        return Promise.reject(err?.stack);
      });

    await new Promise<void>((resolve, reject) => {
      let numberOfTweets = 0;

      // Awaits for a tweet
      streamv2Filter.on(ETwitterStreamEvent.ConnectionError, reject);
      streamv2Filter.on(ETwitterStreamEvent.ConnectionClosed, reject);
      streamv2Filter.on(ETwitterStreamEvent.Data, event => {
        console.log('v2 DATA received !', event?.id ?? event);
        numberOfTweets++;

        if (numberOfTweets >= 5) {
          resolve();
        }
      });
      streamv2Filter.on(ETwitterStreamEvent.DataKeepAlive, () => console.log('Received keep alive event'));
    });

    streamv2Filter.close();
    console.log('New stream API ok.');
  }
})().catch(e => {
  console.error('Unexcepted error:', e);
  console.error(TwitterApi.getErrors(e));

  // if (typeof e === 'object')
  //   console.error(Object.getOwnPropertyDescriptors(e));
});

// Test auth 1.0a flow
function getAuthLink(callback: string) {
  let requestClient = new TwitterApi({
    appKey: ENV.CONSUMER_TOKEN!,
    appSecret: ENV.CONSUMER_SECRET!,
  });

  return requestClient.generateAuthLink(callback);
}

function getAccessClient(verifier: string) {
  let requestClient = new TwitterApi({
    appKey: ENV.CONSUMER_TOKEN!,
    appSecret: ENV.CONSUMER_SECRET!,
    accessToken: ENV.OAUTH_TOKEN!,
    accessSecret: ENV.OAUTH_SECRET!,
  });

  return requestClient.login(verifier);
}

function getAppClient() {
  let requestClient: TwitterApi;

  if (ENV.BEARER_TOKEN) {
    requestClient = new TwitterApi(ENV.BEARER_TOKEN);
    return Promise.resolve(requestClient);
  }
  else {
    requestClient = new TwitterApi({
      appKey: ENV.CONSUMER_TOKEN!,
      appSecret: ENV.CONSUMER_SECRET!,
    });
    return requestClient.appLogin();
  }
}
