require('dotenv').config();
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const express = require('express');

// ၁။ Express Server Setup (B4A Port Check အတွက် မဖြစ်မနေလိုအပ်ပါသည်)
const app = express();
const port = process.env.PORT || 8080; 

app.get('/', (req, res) => res.send('Gemini AI Bot is Running...'));
app.listen(port, () => console.log(`Server is listening on port ${port}`));

// ၂။ API Keys များ စစ်ဆေးခြင်း
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!botToken || !geminiKey) {
    console.error("Error: Environment Variables များ မပြည့်စုံပါ။");
    process.exit(1);
}

const bot = new Telegraf(botToken);
const genAI = new GoogleGenerativeAI(geminiKey);

// ၃။ Gemini Model Config (Gemini 1.5 Flash သည် ပုံရော စာပါ ဖတ်နိုင်ပြီး ပိုမြန်ပါသည်)
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "သင်သည် ဖော်ရွေသော မြန်မာ AI တစ်ဦးဖြစ်သည်။ လူသားတစ်ဦးကဲ့သို့ နေ့စဉ်သုံး မြန်မာစကားပြောပုံစံဖြင့် ယဉ်ကျေးပျူငှာစွာ ဖြေကြားပေးပါ။"
});

// ပုံကို Base64 ပြောင်းပေးသည့် Helper Function
async function fileToGenerativePart(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return {
        inlineData: {
            data: Buffer.from(response.data).toString("base64"),
            mimeType: "image/jpeg",
        },
    };
}

// ၄။ Bot Commands
bot.start((ctx) => ctx.reply('မင်္ဂလာပါ။ ကျွန်တော်က Gemini AI Bot ပါ။ စာဖြစ်ဖြစ်၊ ပုံဖြစ်ဖြစ် ပို့ပြီး မေးမြန်းနိုင်ပါတယ်။'));

// ၅။ စာသား မေးမြန်းမှုများကို ကိုင်တွယ်ခြင်း
bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const userPrompt = ctx.message.text;

        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        await ctx.reply(response.text());

    } catch (error) {
        console.error("--- ERROR DETAIL ---");
        console.error(error.message);
        
        if (error.message.includes("location is not supported")) {
            ctx.reply("တောင်းပန်ပါတယ်၊ လက်ရှိ Location မှာ Gemini သုံးလို့မရပါ။ B4A ပေါ်တင်လိုက်လျှင် အဆင်ပြေသွားပါလိမ့်မည်။");
        } else {
            ctx.reply("မှားယွင်းမှုတစ်ခု ရှိနေပါတယ်။ ခဏနေမှ ပြန်စမ်းကြည့်ပါဦး။");
        }
    }
});

// ၆။ ပုံ မေးမြန်းမှုများကို ကိုင်တွယ်ခြင်း
bot.on('photo', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        
        // အကြီးဆုံးပုံကို ယူခြင်း
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        const imagePart = await fileToGenerativePart(fileLink.href);
        const prompt = ctx.message.caption || "ဒီပုံလေးကို မြန်မာလို ရှင်းပြပေးပါ";

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        await ctx.reply(response.text());

    } catch (error) {
        console.error("--- PHOTO ERROR ---");
        console.error(error.message);
        ctx.reply("ပုံကို ဖတ်တဲ့အခါ အမှားတစ်ခု ရှိနေပါတယ်။");
    }
});

// Bot ကို စတင်ခြင်း
bot.launch().then(() => {
    console.log("✅ Gemini AI Bot is running on Back4App...");
});

// Safe Shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));