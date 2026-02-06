require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const product = {
  name: "Keychron K3",
  catchphrase: "ミニマルで極上の打鍵感。新作ロープロファイルキーボード！",
  rakutenSearchUrl: "https://search.rakuten.co.jp/search/mall/Keychron+K3/",
  amazonSearchKeyword: "Keychron K3",
  trivia: "💡 ガジェット豆知識\nKeychron K3は「ロープロファイル」かつ「メカニカル」なのが特徴。\n薄型で手首への負担が少ないのに、しっかりとした打鍵感が味わえます⌨️\nデスク周りをスッキリさせたい人に最適です！"
};

// Generate Affiliate Links (using placeholders if env vars missing, but purely relying on envs)
// Note: Rakuten ID needs to be valid. If missing, the link might be broken, but we assume the env file works.
const rakutenAffiliateUrl = process.env.RAKUTEN_AFFILIATE_ID 
  ? `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(product.rakutenSearchUrl)}&link_type=hybrid_url`
  : product.rakutenSearchUrl;

const amazonAffiliateUrl = process.env.AMAZON_TRACKING_ID
  ? `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}&tag=${process.env.AMAZON_TRACKING_ID}`
  : `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}`;

// Tweet 1: Main
const tweet1 = `【トレンド発見】${product.name} が話題！📈
${product.catchphrase}

👇在庫をチェック
🟠 Amazon
${amazonAffiliateUrl}

🔴 楽天市場
${rakutenAffiliateUrl}

#Keychron #キーボード #ガジェット #デスク周り`;

// Tweet 2: Trivia
const tweet2 = product.trivia;

async function run() {
  try {
    console.log("Posting trend tweet for:", product.name);
    // Use tweetThread for multiple tweets, or just tweet if only one.
    // We have 2 tweets here.
    const result = await client.v2.tweetThread([tweet1, tweet2]);
    console.log("Success! Tweet ID:", result[0].data.id);
  } catch (e) {
    console.error("Error posting tweet:", e);
    // Don't exit with error code to avoid crashing the agent loop, just log it.
    console.log("Failed to post."); 
  }
}

run();
