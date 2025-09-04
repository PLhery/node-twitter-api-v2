import 'mocha';
import { expect } from 'chai';
import { TwitterApi } from '../src';
import { getAppClient } from '../src/test/utils';

let client: TwitterApi;

describe.skip('Community endpoints for v2 API', () => {
  before(async () => {
    client = await getAppClient();
  });

  it('.community - Lookup community details', async () => {
    const community = await client.v2.community('1');

    expect(community.data.id).to.be.a('string');
    expect(community.data.name).to.be.a('string');
    // Newly documented fields
    expect(community.data.description).to.be.a('string');
    expect(community.data.private).to.be.a('boolean');
    expect(community.data.member_count).to.be.a('number');
  }).timeout(60 * 1000);
});
