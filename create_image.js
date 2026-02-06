const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// フォントの登録 (必要に応じて)
// registerFont('path/to/font.ttf', { family: 'CustomFont' });

async function createSalesImage(productName, price, discountRate, catchphrase, outputPath) {
  const width = 1200;
  const height = 675; // 16:9 for Twitter
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景色 (目立つ色: 例えば鮮やかな赤や黄色、またはブランドカラー)
  // ここではGrokのアドバイス「価格を赤で目立たせる」に従い、
  // 背景は白ベースですっきりさせ、文字でインパクトを出す構成にします。
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // アクセントの枠線
  ctx.lineWidth = 20;
  ctx.strokeStyle = '#D32F2F'; // 濃い赤
  ctx.strokeRect(0, 0, width, height);

  // 帯 (ヘッダー)
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(0, 0, width, 120);
  
  // ヘッダーテキスト
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 60px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡️ 激安速報 ⚡️', width / 2, 60);

  // 商品名 (中央、大きく)
  ctx.fillStyle = '#212121'; // 濃いグレー
  ctx.font = 'bold 50px "Arial", sans-serif';
  // 長い場合は折り返す処理が必要だが、ここでは簡易的に縮小
  let fontSize = 50;
  while (ctx.measureText(productName).width > width - 100) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
  }
  ctx.fillText(productName, width / 2, 220);

  // 価格 (赤で超デカく！)
  ctx.fillStyle = '#D32F2F';
  ctx.font = 'bold 160px "Arial", sans-serif';
  ctx.fillText(price, width / 2, 400);

  // 割引率 (存在する場合、右上にバッジっぽく)
  if (discountRate) {
      const badgeX = width - 250;
      const badgeY = 250;
      const radius = 100;
      
      ctx.fillStyle = '#FFEB3B'; // 黄色
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D32F2F';
      ctx.font = 'bold 60px "Arial", sans-serif';
      ctx.fillText(discountRate, badgeX, badgeY);
      ctx.font = 'bold 30px "Arial", sans-serif';
      ctx.fillText('OFF', badgeX, badgeY + 40);
  }

  // キャッチフレーズ (下部に)
  ctx.fillStyle = '#424242';
  ctx.font = 'bold 40px "Arial", sans-serif';
  ctx.fillText(catchphrase, width / 2, 580);

  // 画像の保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Image saved to ${outputPath}`);
  return outputPath;
}

module.exports = { createSalesImage };
