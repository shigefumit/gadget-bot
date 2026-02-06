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
  name: "Xiaomi Redmi Pad Pro",
  catchphrase: "4万円台の怪物！12インチ大画面でこの価格は衝撃。動画もゲームも大迫力！",
  rakutenSearchUrl: "https://search.rakuten.co.jp/search/mall/Redmi+Pad+Pro/",
  amazonSearchKeyword: "Redmi Pad Pro",
  trivia: "💡 豆知識\nXiaomiの『HyperOS』搭載で、スマホとの連携もバッチリ。\n大画面でエンタメを楽しむなら、今一番の選択肢かも！🎥✨ #Xiaomi #RedmiPadPro #ガジェット",
  hashtags: "#Xiaomi #RedmiPadPro #タブレット #ガジェット #コスパ"
};

// Generate Affiliate Links
// Using encodeURIComponent for safety
const rakutenAffiliateUrl = `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID || 'dummy_id'}/?pc=${encodeURIComponent(product.rakutenSearchUrl)}&link_type=hybrid_url`;
const amazonAffiliateUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}&tag=${process.env.AMAZON_TRACKING_ID || 'dummy_tag'}`;

// Tweet 1: Main
const tweet1 = `【トレンド速報】${product.name} 📱
${product.catchphrase}

価格と在庫を今すぐチェック👇

🔴 楽天市場
${rakutenAffiliateUrl}

🟠 Amazon
${amazonAffiliateUrl}

${product.hashtags}`;

// Tweet 2: Trivia
const tweet2 = product.trivia;

async function run() {
  try {
    console.log("Posting thread...");
    // Check if keys are present
    if (!process.env.CONSUMER_KEY) {
        throw new Error("Missing CONSUMER_KEY in x_api_secrets.env");
    }

    const result = await client.v2.tweetThread([tweet1, tweet2]);
    console.log("Thread posted successfully!");
    console.log("First Tweet ID:", result[0].data.id);
  } catch (e) {
    console.error("Error posting thread:", e);
    if (e.data) {
        console.error("API Error Data:", JSON.stringify(e.data, null, 2));
    }
    process.exit(1);
  }
}

run();
