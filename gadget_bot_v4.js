require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');
const { createSalesImage } = require('./create_image');
const { generateComment } = require('./gemini_chat');
const { findTrendingProduct } = require('./trend_hunter');
const path = require('path');
const products = require('./products.json'); // Fallback用

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

async function run() {
  try {
    console.log("Starting bot process (Ver.4 - Trend Hunter)...");

    let product = null;
    let isTrend = false;

    // 1. トレンド検索を試みる
    try {
        const trend = await findTrendingProduct();
        if (trend && trend.name) {
            product = {
                name: trend.name,
                price: trend.price,
                discountRate: null, // RSSからは正確に取れないことが多いのでnull
                catchphrase: "今話題の注目ガジェット！",
                rakutenSearchUrl: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(trend.searchKeyword)}/`,
                amazonSearchKeyword: trend.searchKeyword,
                context: trend.context
            };
            isTrend = true;
        }
    } catch (e) {
        console.error("Trend hunting failed:", e);
    }

    // 2. 失敗したらフォールバック（既存リストからランダム）
    if (!product) {
        console.log("Using fallback product list.");
        const randomIndex = Math.floor(Math.random() * products.length);
        product = products[randomIndex];
    }

    console.log(`Final Selection: ${product.name} (Trend: ${isTrend})`);

    // 3. AIでコメント生成 (Trendの場合は記事内容をコンテキストにする)
    console.log("Generating AI comment...");
    const aiComment = await generateComment(product.name, product.context);
    
    // 4. 画像生成
    const imagePath = path.join(__dirname, 'sales_image.png');
    // Trend商品の場合は価格が不正確な場合があるので、表示を工夫する
    // createSalesImage側も少し修正が必要だが、一旦そのまま渡す（'要チェック'などがそのまま描画される）
    await createSalesImage(
        product.name, 
        product.price, 
        product.discountRate, 
        product.catchphrase, 
        imagePath
    );

    // 5. アフィリエイトリンク生成
    const rakutenAffiliateUrl = `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID || 'dummy_id'}/?pc=${encodeURIComponent(product.rakutenSearchUrl)}&link_type=hybrid_url`;
    const amazonAffiliateUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}&tag=${process.env.AMAZON_TRACKING_ID || 'dummy_tag'}`;

    const tweetText = `【${isTrend ? 'トレンド速報' : '本日のおすすめ'}】${product.name}

${product.price}

👇 詳細はこちら
Amazon: ${amazonAffiliateUrl}
楽天: ${rakutenAffiliateUrl}

💬 ${aiComment}

#ガジェット #特価 ${isTrend ? '#ニュース' : ''}`;

    // 6. 投稿処理
    if (!process.env.CONSUMER_KEY) {
        console.log("Tweet Text:\n", tweetText);
        return;
    }

    const mediaId = await client.v1.uploadMedia(imagePath);
    const result = await client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] }
    });

    console.log("Tweet posted successfully!");
    console.log("Tweet ID:", result.data.id);

  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
