// price_checker.js
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

async function getRealPrice(url, site) {
    if (!url) return null;
    
    console.log(`🕵️ Checking price on ${site}...`);
    let browser = null;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // ユーザーエージェント偽装 (Bot対策回避)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        let price = null;

        if (site === 'amazon') {
            // Amazonの価格セレクタ (変動することがあるので複数試す)
            const selectors = [
                '.a-price-whole', 
                '#priceblock_ourprice', 
                '#priceblock_dealprice',
                '.a-color-price'
            ];
            for (const sel of selectors) {
                const el = await page.$(sel);
                if (el) {
                    const text = await page.evaluate(element => element.textContent, el);
                    if (text) {
                        price = text.replace(/[^0-9]/g, ''); // 数字のみ抽出
                        break;
                    }
                }
            }
        } else if (site === 'rakuten') {
            // 楽天の価格セレクタ
            const selectors = ['.price2', '.price', '#price2'];
            for (const sel of selectors) {
                const el = await page.$(sel);
                if (el) {
                    const text = await page.evaluate(element => element.textContent, el);
                    if (text) {
                        price = text.replace(/[^0-9]/g, '');
                        break;
                    }
                }
            }
        }

        if (price) {
            console.log(`✅ Found price: ${price}円`);
            return parseInt(price); // 数値として返す
        } else {
            console.warn(`⚠️ Could not find price element on ${site}`);
            return null;
        }

    } catch (e) {
        console.error(`❌ Price check failed for ${site}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { getRealPrice };
