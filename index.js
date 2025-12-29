require('dotenv').config();
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express'); // Express ထပ်ထည့်ပါ

const app = express();
const port = process.env.PORT || 3000;

// Render အတွက် Dummy Web Server
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Render ပေါ်မှာဆိုရင် ဒီ model နာမည်က အလုပ်လုပ်ပါလိမ့်မယ်
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const result = await model.generateContent(ctx.message.text);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error(error);
        ctx.reply("Error: " + error.message);
    }
});

bot.launch();