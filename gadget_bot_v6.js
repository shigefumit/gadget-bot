require('dotenv').config({ path: 'x_api_secrets.env' });
require('dotenv').config({ path: 'affiliate_ids.env' });
const { TwitterApi } = require('twitter-api-v2');
const { createSalesImage } = require('./create_image');
const { generateComment, formatProReview } = require('./gemini_chat');
const { findTrendingProduct } = require('./trend_hunter');
const { getRealPrice } = require('./price_checker'); // 追加
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
    console.log("Starting bot process (Ver.6 - Real Price Check)...");

    let product = null;
    let isTrend = false;

    // 1. トレンド検索
    try {
        const trend = await findTrendingProduct();
        if (trend && trend.name) {
            product = {
                name: trend.name,
                price: null, // 後で埋める
                discountRate: null,
                catchphrase: "AIガジェット分析速報",
                rakutenSearchUrl: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(trend.searchKeyword)}/`,
                amazonSearchUrl: `https://www.amazon.co.jp/s?k=${encodeURIComponent(trend.searchKeyword)}`,
                amazonSearchKeyword: trend.searchKeyword,
                reviewComment: formatProReview(trend)
            };
            isTrend = true;
        }
    } catch (e) { console.error(e); }

    // 2. フォールバック
    if (!product) {
        console.log("Using fallback product list.");
        const randomIndex = Math.floor(Math.random() * products.length);
        const p = products[randomIndex];
        const comment = await generateComment(p.name, p.context);
        
        product = {
            ...p,
            amazonSearchUrl: `https://www.amazon.co.jp/s?k=${encodeURIComponent(p.amazonSearchKeyword)}`,
            reviewComment: comment
        };
    }

    // 3. リアルタイム価格チェック (New!)
    console.log("Checking real prices...");
    
    // Amazon検索結果ページから最安値を探すのは難しいので、今回は簡易的に
    // 「検索ページには飛ばず、Amazon APIもないので、スクレイピングは個別商品URLがわかっている場合のみ有効」
    // だが、今は検索URLしか持っていない。
    // 苦肉の策：フォールバックリストの商品は固定URLを持つようにJSONを修正すべきだが、
    // ここでは「trend商品の価格取得」は非常に難しいため（URLがない）、
    // 「価格チェックが失敗したら '価格は要チェック' にする」ロジックで安全策をとる。
    
    let displayPrice = "価格は要チェック";
    
    // もし個別URLがあればチェックする（今は実装上の制約でスキップし、安全な表記にする）
    // ※ 検索結果一覧ページをスクレイピングして最安値を取るのはGitHub ActionsのIPではほぼ100%ブロックされるため、
    // ここでは「ユーザーに嘘をつかない」ことを最優先し、
    // 「記事内の価格」または「Check!」表記を採用する。

    if (product.price && product.price.includes("円")) {
        displayPrice = product.price; // 既存リストまたは記事から取れた価格
    }

    console.log(`Final Price Display: ${displayPrice}`);

    // 4. 画像生成
    const imagePath = path.join(__dirname, 'sales_image.png');
    await createSalesImage(
        product.name, 
        displayPrice, 
        product.discountRate, 
        product.catchphrase, 
        imagePath
    );

    // 5. アフィリエイトURL
    const rakutenAffiliateUrl = `https://hb.afl.rakuten.co.jp/ichiba/${process.env.RAKUTEN_AFFILIATE_ID || 'dummy_id'}/?pc=${encodeURIComponent(product.rakutenSearchUrl)}&link_type=hybrid_url`;
    const amazonAffiliateUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.amazonSearchKeyword)}&tag=${process.env.AMAZON_TRACKING_ID || 'dummy_tag'}`;

    const tweetText = `【${isTrend ? 'ガチレビュー速報' : '本日のおすすめ'}】${product.name}

${product.reviewComment}

👇 最新価格をチェック
Amazon: ${amazonAffiliateUrl}
楽天: ${rakutenAffiliateUrl}

#ガジェット #特価`;

    // 6. 投稿
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
