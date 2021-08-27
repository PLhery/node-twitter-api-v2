import 'mocha';
import { expect } from 'chai';
import { TwitterApi } from '../src';
import { getUserClient } from '../src/test/utils';

let client: TwitterApi;

describe('Account endpoints for v1.1 API', () => {
  before(() => {
    client = getUserClient();
  });

  it('.accountSettings/.updateAccountSettings/.updateAccountProfile - Change account settings & profile', async () => {
    const user = await client.currentUser();
    const settings = await client.v1.accountSettings();

    expect(settings.language).to.be.a('string');

    const testBio = 'Hello, test bio ' + String(Math.random());
    await client.v1.updateAccountProfile({ description: testBio });

    const modifiedUser = await client.currentUser(true);
    expect(modifiedUser.description).to.equal(testBio);

    await client.v1.updateAccountProfile({ description: user.description as string });

    await client.v1.updateAccountSettings({ lang: 'en' });
    const updatedSettings = await client.v1.accountSettings();
    expect(updatedSettings.language).to.eq('en');

    await client.v1.updateAccountSettings({ lang: settings.language });
  }).timeout(60 * 1000);
});
