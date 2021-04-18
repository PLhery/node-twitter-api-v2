import 'mocha';
import { expect } from 'chai';
import dotenv from 'dotenv';
import { TwitterApi } from '../src';

dotenv.config({ path: __dirname + '/../.env' });

// OAuth 1.0a
const clientWithoutUser = new TwitterApi({
  appKey: process.env.CONSUMER_TOKEN!,
  appSecret: process.env.CONSUMER_SECRET!,
});

describe('Authentification API', () => {
  it('.generateAuthLink - Create a auth link', async () => {
    const tokens = await clientWithoutUser.generateAuthLink('oob');

    expect(tokens.oauth_token).to.be.a('string');
    expect(tokens.oauth_token_secret).to.be.a('string');
    expect(tokens.oauth_callback_confirmed).to.be.equal('true');
    expect(tokens.url).to.be.a('string');
  }).timeout(1000 * 120);
});
