require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' }); // ID読み込み
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// テスト用の商品（しげさんのID入り）
// 本来はAPIで検索しますが、まずは手動作成したリンクでテストします
const sampleItem = {
  name: "Apple iPad (第9世代) 10.2インチ Wi-Fiモデル 64GB - スペースグレイ",
  price: "49,800円",
  // 楽天のリンク生成ロジック（簡易版）
  url: `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID}/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fapple%2Fipad_9th_wifi_64gb_spacegray%2F&link_type=hybrid_url`
};

const tweetText = `【テスト投稿】
ガジェットBotの稼働テスト中！

🍎 ${sampleItem.name}
価格: ${sampleItem.price}

👇詳細はこちら
${sampleItem.url}

#Apple #iPad #ガジェット #セール`;

async function tweet() {
  try {
    const tweet = await client.v2.tweet(tweetText);
    console.log('Tweet success:', tweet);
  } catch (e) {
    console.error('Tweet failed:', e);
  }
}

tweet();