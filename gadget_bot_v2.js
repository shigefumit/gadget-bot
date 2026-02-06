require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');
const { createSalesImage } = require('./create_image');
const path = require('path');
const fs = require('fs');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// --- 設定 ---
// TODO: これらのデータは外部ソース（スクレイピング結果など）から動的に取得するように変更予定
const product = {
  name: "Xiaomi Redmi Pad Pro",
  price: "41,800円", // 実際は動的に取得
  discountRate: "15%", // あれば設定、なければ null
  catchphrase: "12インチ大画面で動画もゲームも！",
  rakutenSearchUrl: "https://search.rakuten.co.jp/search/mall/Redmi+Pad+Pro/",
  amazonSearchKeyword: "Redmi Pad Pro",
  myReview: "正直、iPad無印買うならこっち。画面のデカさが正義。スピーカーも4つあって動画専用機として最強すぎた。", // 人間味のある一言
  hashtags: "#ガジェット #特価 #Xiaomi"
};

// Generate Affiliate Links
const rakutenAffiliateUrl = `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID || 'dummy_id'}/?pc=${encodeURIComponent(product.rakutenSearchUrl)}&link_type=hybrid_url`;
const amazonAffiliateUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}&tag=${process.env.AMAZON_TRACKING_ID || 'dummy_tag'}`;

// Tweet 1: Main (9割テンプレ)
const tweetText = `【${product.discountRate ? product.discountRate + 'OFF' : 'セール速報'}】${product.name}

${product.price}

👇 詳細はこちら
Amazon: ${amazonAffiliateUrl}
楽天: ${rakutenAffiliateUrl}

💬 ${product.myReview}

${product.hashtags}`;

async function run() {
  try {
    console.log("Starting bot process...");

    // 1. 画像生成
    const imagePath = path.join(__dirname, 'sales_image.png');
    console.log("Generating image...");
    await createSalesImage(
        product.name, 
        product.price, 
        product.discountRate, 
        product.catchphrase, 
        imagePath
    );

    // 2. 画像アップロード
    if (!process.env.CONSUMER_KEY) {
        console.warn("⚠️ API keys missing. Skipping upload/tweet (Dry run mode).");
        console.log("Generated Text:\n", tweetText);
        return;
    }

    console.log("Uploading media...");
    const mediaId = await client.v1.uploadMedia(imagePath);
    console.log("Media uploaded! ID:", mediaId);

    // 3. ツイート投稿 (画像付き)
    console.log("Posting tweet...");
    const result = await client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] }
    });

    console.log("Tweet posted successfully!");
    console.log("Tweet ID:", result.data.id);
    
    // 4. (オプション) リプライで補足情報などをぶら下げるならここ

  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
