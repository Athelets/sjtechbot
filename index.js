require('dotenv').config();
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

// ၁။ Express Server (B4A အတွက် မဖြစ်မနေလိုအပ်သည်)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot is Live!'));
app.listen(port, () => console.log(`Server listening on port ${port}`));

// ၂။ API Keys များ စစ်ဆေးခြင်း
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!botToken || !geminiKey) {
    console.error("❌ ERROR: API Keys များ Dashboard တွင် မထည့်ရသေးပါ။");
    process.exit(1); 
}

const bot = new Telegraf(botToken);
const genAI = new GoogleGenerativeAI(geminiKey);

// ၃။ Gemini Model Setup (Model name ကို models/ ထည့်ရေးထားသည်)
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

bot.start((ctx) => ctx.reply('မင်္ဂလာပါ။ Gemini AI Bot အဆင်သင့်ရှိပါပြီ။'));

bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        await ctx.reply(response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
        ctx.reply("ခေတ္တစောင့်ဆိုင်းပေးပါ။ Model ကို ရှာမတွေ့ခြင်း သို့မဟုတ် API Key အမှားရှိနိုင်ပါသည်။");
    }
});

// ၄။ Bot Launch (Error 409 Conflict မဖြစ်အောင် catch လုပ်ထားသည်)
bot.launch()
    .then(() => console.log("✅ Bot is online!"))
    .catch((err) => console.error("❌ Launch Error:", err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));