import { TwitterApi } from '..';
import { getAccessClient, getAppClient, getAuthLink } from './utils';

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
  else if (argActive('app-client')) {
    // Test some basics requests
    const client = await getAppClient();
    const node = await client.search('nodeJS');
    await node.fetchNext();
  }
})().catch(e => {
  console.error('Unexcepted error:', e);
  console.error(TwitterApi.getErrors(e));
});
