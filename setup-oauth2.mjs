import { TwitterApi } from './dist/cjs/index.js';
import 'dotenv/config';

console.log('🔐 TWITTER OAUTH 2.0 SETUP FOR TESTING');
console.log('======================================');

// Check if this is the token exchange step
const command = process.argv[2];
const authCode = process.argv[3];
const codeVerifier = process.argv[4];

if (command === 'exchange' && authCode && codeVerifier) {
  // Step 2: Exchange authorization code for access token
  exchangeCodeForToken(authCode, codeVerifier);
} else {
  // Step 1: Generate authorization URL
  generateAuthorizationUrl();
}

function generateAuthorizationUrl() {
  console.log('\n📋 PREREQUISITES:');
  console.log('1. Twitter Developer Account with an app created');
  console.log('2. App configured as "Web App" (not Native App)');
  console.log('3. CLIENT_ID, CLIENT_SECRET, and CALLBACK_URL in your .env file');
  console.log('4. Same callback URL added to your Twitter app settings');

  // Check credentials - all required
  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.CALLBACK_URL) {
    console.log('\n❌ ERROR: Missing required environment variables');
    console.log('\nCreate a .env file with:');
    console.log('CLIENT_ID=your_oauth2_client_id');
    console.log('CLIENT_SECRET=your_oauth2_client_secret');
    console.log('CALLBACK_URL=your_callback_url');
    console.log('\nThen add the same callback URL to your Twitter app settings!');
    return;
  }

  const callbackUrl = process.env.CALLBACK_URL;

  try {
    const client = new TwitterApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    });

    const { url, codeVerifier } = client.generateOAuth2AuthLink(
      callbackUrl,
      { scope: ['tweet.read', 'users.read', 'users.email', 'offline.access'] }
    );

    console.log('\n🔗 STEP 1: Visit this authorization URL:');
    console.log('─'.repeat(60));
    console.log(url);
    console.log('─'.repeat(60));

    console.log('\n👆 What will happen:');
    console.log('• You\'ll be redirected to Twitter to sign in');
    console.log('• Twitter will ask you to authorize the app');
    console.log(`• You'll be redirected to: ${callbackUrl}?code=...`);
    console.log('• The page will show "This site can\'t be reached" - that\'s OK!');

    console.log('\n⚡ STEP 2: After authorization, IMMEDIATELY run:');
    console.log(`node setup-oauth2.mjs exchange YOUR_CODE "${codeVerifier}"`);

    console.log('\n⚠️  IMPORTANT:');
    console.log('• Copy the "code" parameter from the redirect URL');
    console.log('• Run the exchange command IMMEDIATELY (codes expire in ~30 seconds)');
    console.log('• Don\'t include the full URL, just the code parameter');

    console.log('\n📧 SCOPES INCLUDED:');
    console.log('• tweet.read - Read tweets');
    console.log('• users.read - Read user information');
    console.log('• users.email - Access confirmed email (key feature!)');
    console.log('• offline.access - Get refresh token');

  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

async function exchangeCodeForToken(authCode, codeVerifier) {
  console.log('\n⚡ EXCHANGING CODE FOR ACCESS TOKEN...');

  // Check that CALLBACK_URL is set
  if (!process.env.CALLBACK_URL) {
    console.log('\n❌ ERROR: CALLBACK_URL is required in .env file');
    return;
  }

  const callbackUrl = process.env.CALLBACK_URL;

  const client = new TwitterApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  try {
    const startTime = Date.now();

    const { client: loggedClient, accessToken, refreshToken, expiresIn } =
      await client.loginWithOAuth2({
        code: authCode,
        codeVerifier,
        redirectUri: callbackUrl,
      });

    const duration = Date.now() - startTime;

    console.log(`\n🎉 SUCCESS! (${duration}ms)`);
    console.log('═'.repeat(50));

    // Test the token immediately
    console.log('\n🧪 Testing access...');
    const user = await loggedClient.v2.me({
      'user.fields': ['verified', 'verified_type', 'confirmed_email'],
    });

    console.log(`✅ Authenticated as: @${user.data.username}`);
    console.log(`✅ Verified: ${user.data.verified} (${user.data.verified_type || 'none'})`);

    if (user.data.confirmed_email) {
      console.log(`✅ Email access: ${user.data.confirmed_email}`);
    } else {
      console.log('ℹ️  Email not returned (check app permissions)');
    }

    console.log('\n📋 ADD TO YOUR .env FILE:');
    console.log('─'.repeat(40));
    console.log(`OAUTH2_ACCESS_TOKEN=${accessToken}`);
    if (refreshToken) {
      console.log(`OAUTH2_REFRESH_TOKEN=${refreshToken}`);
    }
    console.log('─'.repeat(40));

    console.log(`\n⏰ Token expires in: ${Math.round(expiresIn / 3600)} hours`);

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Add the tokens to your .env file');
    console.log('2. Run your OAuth 2.0 tests: npm run mocha \'test/oauth2.user.v2.test.ts\'');
    console.log('3. Start using OAuth 2.0 with email access in your app!');

  } catch (error) {
    console.log('\n❌ TOKEN EXCHANGE FAILED:', error.message);

    if (error.message.includes('authorization code')) {
      console.log('\n💡 COMMON ISSUES:');
      console.log('• Code expired (they expire in ~30 seconds)');
      console.log('• Code already used (each code works only once)');
      console.log('• Wrong code copied');
      console.log('\n🔄 Try again: node setup-oauth2.mjs');
    }
  }
}