require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// テスト商品（Sony α7 IV）
const item = {
  name: "Sony α7 IV ボディ ILCE-7M4",
  price_amazon: "328,000円",
  price_rakuten: "335,000円",
  url_amazon: `https://www.amazon.co.jp/dp/B09J8T49F5?tag=${process.env.AMAZON_TRACKING_ID}`,
  // 楽天APIを使わない簡易リンク生成（URLエンコード修正済み）
  url_rakuten: `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID}/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmapcamera%2F4548736133730%2F&link_type=hybrid_url`
};

// 1ツイート目（メイン）
const tweet1 = `【カメラ速報】Sony α7 IV 在庫あり！📸

フルサイズミラーレスの最適解。写真も動画もこれ1台。

🟠 Amazon: ${item.price_amazon}
🔴 楽天: ${item.price_rakuten} (ポイント考慮でお得かも?)

👇 Amazon
${item.url_amazon}
👇 楽天
${item.url_rakuten}

#Sony #α7IV #カメラ #ガジェット`;

// 2ツイート目（豆知識・リプ）
const tweet2 = `💡 α7 IVの豆知識
「ブリージング補正」機能が優秀です。動画撮影時、ピント位置を変えても画角が変わる「呼吸」現象を電子的に補正してくれます。

VlogやCinematicな映像を撮るなら、この機能があるだけでクオリティが段違いですよ！🎥`;

async function postThread() {
  try {
    // 1つ目を投稿
    const result1 = await client.v2.tweet(tweet1);
    console.log('Tweet 1 success:', result1.data.id);

    // 2つ目をそれにぶら下げる（リプライ）
    const result2 = await client.v2.reply(tweet2, result1.data.id);
    console.log('Tweet 2 success (Reply):', result2.data.id);

  } catch (e) {
    console.error('Tweet failed:', e);
  }
}

postThread();