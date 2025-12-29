const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

// ၁။ Express Server Setup (B4A Health Check အတွက် မဖြစ်မနေလိုအပ်ပါသည်)
const app = express();
const port = process.env.PORT || 8080; 

app.get('/', (req, res) => res.send('Gemini Bot is Live and Running!'));
app.listen(port, () => {
    console.log(`✅ Server is listening on port ${port}`);
});

// ၂။ Environment Variables စစ်ဆေးခြင်း
// သတိပြုရန် - .env ဖိုင် ဆောက်စရာမလိုပါ။ B4A Dashboard Settings ထဲတွင်သာ ထည့်ပါ။
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

console.log("Checking Environment Variables...");
if (!botToken) console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is missing in B4A Dashboard!");
if (!geminiKey) console.error("❌ ERROR: GEMINI_API_KEY is missing in B4A Dashboard!");

// ၃။ Bot နှင့် AI ကို Initialize လုပ်ခြင်း
if (botToken && geminiKey) {
    const bot = new Telegraf(botToken);
    const genAI = new GoogleGenerativeAI(geminiKey);

    // Model နာမည်ကို models/ ပါအောင် အတိအကျရေးပါ (404 Error မတက်အောင်ဖြစ်သည်)
    const model = genAI.getGenerativeModel({ 
        model: "models/gemini-1.5-flash" 
    });

    // Start Command
    bot.start((ctx) => ctx.reply('မင်္ဂလာပါ။ Gemini AI Bot အဆင်သင့်ရှိပါပြီ။ ဘာကူညီပေးရမလဲခင်ဗျာ?'));

    // စာသားများကို Gemini ဖြင့် တုံ့ပြန်ခြင်း
    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const result = await model.generateContent(ctx.message.text);
            const response = await result.response;
            await ctx.reply(response.text());
        } catch (error) {
            console.error("Gemini Error:", error.message);
            // 404 Error ဖြစ်ပါက API Key ကို ပြန်စစ်ရန် သတိပေးခြင်း
            ctx.reply("တောင်းပန်ပါတယ်၊ အမှားတစ်ခုရှိနေလို့ပါ။ (API Key သို့မဟုတ် Model Name ကို စစ်ဆေးပါ)");
        }
    });

    // ၄။ Bot Launch (Conflict Error 409 မဖြစ်အောင် ကိုင်တွယ်ခြင်း)
    bot.launch()
        .then(() => console.log("🚀 Telegram Bot is successfully launched!"))
        .catch((err) => {
            if (err.message.includes('409')) {
                console.error("❌ Conflict 409: သင့်စက် (Local) ထဲက Bot ကို အရင်ပိတ်ပေးပါ။");
            } else {
                console.error("❌ Launch Error:", err.message);
            }
        });

    // ပုံမှန်အတိုင်း ပိတ်နိုင်ရန်
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

} else {
    console.error("❌ Bot ကို Launch မလုပ်နိုင်ပါ။ Keys များ မပြည့်စုံပါ။");
}