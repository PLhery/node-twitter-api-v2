import { TwitterApi } from '..';
import dotenv from 'dotenv';
import { getAccessClient, getAuthLink } from './utils';

const ENV = dotenv.config({ path: __dirname + '/../../.env' }).parsed!;

(async () => {
  const argActive = (name: string) => process.argv.find(arg => arg.startsWith('--' + name));
  const argValue = (name: string) => {
    // Find active index
    const activeIndex = process.argv.findIndex(arg => arg.startsWith('--' + name));
    return process.argv[activeIndex + 1];
  };

  if (argActive('access-token')) {
    const client = await getAccessClient(argValue('access-token')!);
    console.log(client.getActiveTokens());
  }
  else if (argActive('request-token')) {
    console.log(await getAuthLink(argValue('request-token')!));
  }
})().catch(e => {
  console.error('Unexcepted error:', e);
  console.error(TwitterApi.getErrors(e));
});
