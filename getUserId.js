import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'XXX',
  appSecret: 'XXX',
  accessToken: 'XXX',
  accessSecret: 'XXX',
});

async function getUserId() {
  try {
    const user = await client.v2.userByUsername('USERNAME');
    console.log('USER ID:', user.data.id);
  } catch (error) {
    console.error('Errore nel recupero USER_ID:', error);
  }
}

getUserId();
