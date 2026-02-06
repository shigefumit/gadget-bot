// trend_hunter.js
const RSSParser = require('rss-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const parser = new RSSParser();

// 監視するRSSフィード（ガジェット系ニュースサイト）
// ※ 実際はもっと多くのソースを使うと良い
const FEED_URLS = [
    'https://gizmodo.jp/index.xml',
    'https://japanese.engadget.com/rss.xml', 
    'https://www.lifehacker.jp/feed/index.xml',
    // 注: 多くのサイトはRSS全文配信していないので、タイトルと概要から判断する
];

async function findTrendingProduct() {
    console.log("🔍 Hunting for trends...");
    let articles = [];

    // 1. RSSから最新記事を取得
    for (const url of FEED_URLS) {
        try {
            const feed = await parser.parseURL(url);
            // 直近24時間の記事に絞る
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            
            const recentItems = feed.items.filter(item => {
                const pubDate = new Date(item.pubDate);
                return pubDate > oneDayAgo;
            }).slice(0, 5); // 各サイト最新5件

            articles.push(...recentItems);
        } catch (e) {
            console.warn(`Failed to fetch RSS from ${url}:`, e.message);
        }
    }

    if (articles.length === 0) {
        console.warn("⚠️ No recent articles found. Using fallback.");
        return null;
    }

    // 2. AIに「今紹介すべき商品」を選定させる
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required for trend hunting.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 記事リストをテキスト化
    const articlesText = articles.map((a, i) => 
        `[${i+1}] Title: ${a.title}\nSnippet: ${a.contentSnippet || a.content}\nLink: ${a.link}`
    ).join("\n\n");

    const prompt = `
    あなたはガジェット特化のセール速報Botです。
    以下の最新ニュース記事の中から、「今、Twitterで紹介したら最もバズりそうなガジェット商品」を1つ選んでください。
    
    選定基準:
    - 「セール」「発売開始」「新製品」「話題」などの要素があるもの
    - 具体的な商品名が特定できるもの
    - ソフトウェアや噂レベルの話は除外
    - Anker, CIO, Xiaomi, Apple, Sony, Logicool などの人気ブランドを優先

    記事リスト:
    ${articlesText}

    出力フォーマット（JSONのみ）:
    {
        "name": "具体的な商品名（型番含む）",
        "price": "記事に記載があれば価格（なければ '要チェック'）",
        "context": "なぜこれを選んだか、記事の内容に基づく紹介文（100文字以内）",
        "searchKeyword": "Amazon/楽天検索用のキーワード"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // JSONクリーニング (Markdown記法への対応)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const selected = JSON.parse(text);
        console.log("🎯 Trend Hunter Selected:", selected);
        return selected;

    } catch (e) {
        console.error("AI Trend Selection Error:", e);
        return null;
    }
}

module.exports = { findTrendingProduct };
