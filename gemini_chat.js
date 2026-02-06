// gemini_chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateComment(productName, context) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY is missing. Using fallback comment.");
    return context; // Fallback to static context
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  あなたはガジェット好きの毒舌レビュアーです。
  以下の商品について、Twitter（X）で投稿するための「短くて人間味のある、少し毒舌または本音の感想」を140文字以内で作成してください。
  
  商品名: ${productName}
  事前情報: ${context}
  
  条件:
  - 宣伝っぽさを消す
  - 「〜です」「〜ます」ではなく「〜だ」「〜である」や口語体を使う
  - 買うべきか、買わないべきか、誰に向いているかをハッキリ言う
  - 絵文字は1つか2つまで
  - ハッシュタグは不要
  - 引用符などで囲わず、テキストだけを出力すること
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return context; // Error fallback
  }
}

async function generateReply(replyText) {
    if (!process.env.GEMINI_API_KEY) return null;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    あなたはガジェット情報のBotアカウントを運営していますが、中身はガジェットオタクの人間として振る舞っています。
    ユーザーからの以下のリプライに対して、即レスするような短くてフレンドリーな返信を書いてください。

    ユーザーのリプライ: "${replyText}"

    条件:
    - 敬語は崩してOK（フレンドリーに）
    - 質問には簡潔に答える
    - 共感する
    - 60文字以内
    - ハッシュタグ不要
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Reply Error:", error);
        return null;
    }
}

module.exports = { generateComment, generateReply };
