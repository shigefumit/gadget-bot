require('dotenv').config({ path: 'x_api_secrets.env' });
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

async function tweet() {
  try {
    // v1.1 endpoint trial
    const tweet = await client.v1.tweet('AI Agent setup complete! 🚀 #test ' + Date.now());
    console.log('Tweet success (v1):', tweet);
  } catch (e) {
    console.error('Tweet failed (v1):', e.data || e);
  }
}

tweet();