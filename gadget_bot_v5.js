require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');
const { createSalesImage } = require('./create_image');
const { generateComment, formatProReview } = require('./gemini_chat'); // 追加
const { findTrendingProduct } = require('./trend_hunter');
const path = require('path');
const products = require('./products.json');

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

async function run() {
  try {
    console.log("Starting bot process (Ver.5 - Pro Analysis)...");

    let product = null;
    let isTrend = false;
    let tweetBody = "";

    // 1. トレンド検索 & 深層分析
    try {
        const trend = await findTrendingProduct();
        if (trend && trend.name) {
            product = {
                name: trend.name,
                // 画像生成用には具体的な数値がないと困るが、'Check!'等で逃げる
                price: "価格はCheck!", 
                discountRate: null,
                catchphrase: "AIガジェット分析速報",
                rakutenSearchUrl: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(trend.searchKeyword)}/`,
                amazonSearchKeyword: trend.searchKeyword,
                // ここが重要：AIが生成した詳細レビューを使う
                reviewComment: formatProReview(trend) 
            };
            isTrend = true;
        }
    } catch (e) {
        console.error("Trend hunting failed:", e);
    }

    // 2. フォールバック（既存リスト）
    if (!product) {
        console.log("Using fallback product list.");
        const randomIndex = Math.floor(Math.random() * products.length);
        const p = products[randomIndex];
        // 既存リストの場合も、簡易的にAIコメントを生成
        const comment = await generateComment(p.name, p.context);
        
        product = {
            ...p,
            reviewComment: comment // シンプルなコメント
        };
    }

    console.log(`Final Selection: ${product.name}`);

    // 3. 画像生成
    const imagePath = path.join(__dirname, 'sales_image.png');
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

    const tweetText = `【${isTrend ? 'ガチレビュー速報' : '本日のおすすめ'}】${product.name}

${product.reviewComment}

👇 価格・在庫チェック
Amazon: ${amazonAffiliateUrl}
楽天: ${rakutenAffiliateUrl}

#ガジェット #特価`;

    // 5. 投稿処理
    if (!process.env.CONSUMER_KEY) {
        console.log("Tweet Text:\n", tweetText);
        return;
    }

    const mediaId = await client.v1.uploadMedia(imagePath);
    const result = await client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] }
    });

    console.log("Tweet posted successfully! ID:", result.data.id);

  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
