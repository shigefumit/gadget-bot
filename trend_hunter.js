// trend_hunter.js
const RSSParser = require('rss-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const parser = new RSSParser();

const FEED_URLS = [
    'https://gizmodo.jp/index.xml',
    'https://japanese.engadget.com/rss.xml', 
    'https://www.lifehacker.jp/feed/index.xml',
    'https://www.roomie.jp/feed/index.xml'
];

async function findTrendingProduct() {
    console.log("🔍 Hunting for trends with Deep Analysis...");
    let articles = [];

    // 1. RSS取得
    for (const url of FEED_URLS) {
        try {
            const feed = await parser.parseURL(url);
            const now = new Date();
            // 過去24時間（テスト時は48時間に緩和してもいいかも）
            const timeWindow = 24 * 60 * 60 * 1000; 
            
            const recentItems = feed.items.filter(item => {
                return (now - new Date(item.pubDate)) < timeWindow;
            }).slice(0, 3);

            articles.push(...recentItems);
        } catch (e) {
            console.warn(`Failed to fetch RSS from ${url}:`, e.message);
        }
    }

    if (articles.length === 0) {
        return null;
    }

    // 2. AIによる詳細分析（比較・メリデメ抽出）
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const articlesText = articles.map((a, i) => 
        `[${i+1}] Title: ${a.title}\nSnippet: ${a.contentSnippet || a.content}\nLink: ${a.link}`
    ).join("\n\n");

    const prompt = `
    あなたはプロのガジェットレビュアーBotです。
    以下のニュース記事から「今紹介すべきガジェット」を1つ選び、詳細なJSONデータを生成してください。

    選定条件:
    - 具体的なハードウェア製品であること（アプリや噂はNG）
    - セール情報や新製品情報であること

    出力するJSONの形式:
    {
        "name": "商品名（正確に）",
        "searchKeyword": "Amazon検索用キーワード",
        "pros": ["良い点1", "良い点2"], 
        "cons": ["悪い点1（価格が高い、重いなど）"],
        "priceComment": "価格に関するコメント（例: 'Amazonで〇〇円！楽天より安いかも' や '通常より20%OFFの衝撃価格' など。記事から読み取れなければ一般的な相場感でOK）",
        "reviewSummary": "毒舌かつ本音の総評（80文字以内）"
    }
    
    記事リスト:
    ${articlesText}
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);
        console.log("🎯 Selected Trend:", data.name);
        return data;
    } catch (e) {
        console.error("AI Analysis Failed:", e);
        return null;
    }
}

module.exports = { findTrendingProduct };
