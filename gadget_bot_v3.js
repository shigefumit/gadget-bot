require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');
const { createSalesImage } = require('./create_image');
const { generateComment, generateReply } = require('./gemini_chat');
const path = require('path');
const fs = require('fs');
const products = require('./products.json');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// ランダムに商品を選ぶ
function getRandomProduct() {
    const randomIndex = Math.floor(Math.random() * products.length);
    return products[randomIndex];
}

async function run() {
  try {
    console.log("Starting bot process (Ver.3 - AI & Random)...");

    // 1. 商品選択
    const product = getRandomProduct();
    console.log(`Selected Product: ${product.name}`);

    // 2. AIでコメント生成
    console.log("Generating AI comment...");
    const aiComment = await generateComment(product.name, product.context);
    console.log(`AI Comment: ${aiComment}`);

    // 3. 画像生成
    const imagePath = path.join(__dirname, 'sales_image.png');
    console.log("Generating image...");
    await createSalesImage(
        product.name, 
        product.price, 
        product.discountRate, 
        product.catchphrase, 
        imagePath
    );

    // 4. ツイート作成
    const rakutenAffiliateUrl = `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID || 'dummy_id'}/?pc=${encodeURIComponent(product.rakutenSearchUrl)}&link_type=hybrid_url`;
    const amazonAffiliateUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}&tag=${process.env.AMAZON_TRACKING_ID || 'dummy_tag'}`;

    const tweetText = `【${product.discountRate ? product.discountRate + 'OFF' : 'セール速報'}】${product.name}

${product.price}

👇 今すぐチェック
Amazon: ${amazonAffiliateUrl}
楽天: ${rakutenAffiliateUrl}

💬 ${aiComment}

#ガジェット #特価`;

    // 5. 投稿処理
    if (!process.env.CONSUMER_KEY) {
        console.warn("⚠️ API keys missing. Dry run mode.");
        console.log("Tweet Text:\n", tweetText);
        return;
    }

    console.log("Uploading media...");
    const mediaId = await client.v1.uploadMedia(imagePath);
    console.log("Media uploaded! ID:", mediaId);

    console.log("Posting tweet...");
    const result = await client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] }
    });

    console.log("Tweet posted successfully!");
    console.log("Tweet ID:", result.data.id);
    
    // (Future Work: リプライ監視とAI返信は、常駐プロセスか定期実行の別ジョブにする必要がある)

  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
