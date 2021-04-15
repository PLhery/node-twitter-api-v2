import { TwitterApi } from '..';
import commander from 'commander';
import dotenv from 'dotenv';
import { getAccessClient, getAuthLink } from './utils';

const ENV = dotenv.config({ path: __dirname + '/../../.env' }).parsed!;

commander
  .option('--request-token <callback>', 'Ask for OAuth 1.0a request token for callback <callback>')
  .option('--access-token <verifier>', 'Ask for OAuth 1.0a access token with verifier <verifier>. Use access tokens from .env')
.parse(process.argv);

(async () => {
  if (commander.accessToken) {
    const client = await getAccessClient(commander.accessToken);
    console.log(client.getActiveTokens());
  }
  else if (commander.requestToken) {
    console.log(await getAuthLink(commander.requestToken));
  }
})().catch(e => {
  console.error('Unexcepted error:', e);
  console.error(TwitterApi.getErrors(e));
});
