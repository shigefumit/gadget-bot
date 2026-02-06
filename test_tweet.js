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
    const tweet = await client.v2.tweet('AI Agentのセットアップ完了！これから爆速で情報をお届けします。 🚀 #test ' + Date.now());
    console.log('Tweet success:', tweet);
  } catch (e) {
    console.error('Tweet failed:', e);
  }
}

tweet();