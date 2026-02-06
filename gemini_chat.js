// gemini_chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 通常のコメント生成（フォールバック用）
async function generateComment(productName, context) {
  if (!process.env.GEMINI_API_KEY) return context;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  ガジェット商品「${productName}」について、Twitter投稿用の短くパンチの効いた紹介文を書いて。
  文脈: ${context}
  条件: 100文字以内、絵文字少なめ、断定口調。
  `;
  
  try {
    const res = await model.generateContent(prompt);
    return res.response.text().trim();
  } catch (e) {
    return context;
  }
}

// 比較・分析コメントのフォーマット生成
function formatProReview(trendData) {
    const pros = trendData.pros.map(p => `✅ ${p}`).join('\n');
    const cons = trendData.cons.map(c => `⚠️ ${c}`).join('\n');
    
    return `${trendData.reviewSummary}

${pros}
${cons}

💰 ${trendData.priceComment}`;
}

module.exports = { generateComment, formatProReview };
