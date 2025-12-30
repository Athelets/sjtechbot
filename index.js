const { Telegraf, Markup, session } = require('telegraf');
const express = require('express');
const Parse = require('parse/node');

// ၁။ Server Setup
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Premium SJ Bot is 24/7 Live!'));
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));

// ၂။ Database Setup
Parse.initialize(
    process.env.PARSE_APP_ID, 
    process.env.PARSE_JS_KEY, 
    process.env.PARSE_MASTER_KEY
);
Parse.serverURL = 'https://parseapi.back4app.com/';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_CHAT_ID;
bot.use(session());

// ၃။ Global Error Handler (Bot တစ်ခုလုံး မရပ်သွားစေရန်)
bot.catch((err, ctx) => {
    console.error(`❌ Global Error for ${ctx.updateType}:`, err.message);
    ctx.reply("⚠️ ခေတ္တချို့ယွင်းချက်ရှိနေပါသည်။ ခဏအကြာမှ ပြန်စမ်းကြည့်ပါ။").catch(() => {});
});

// ၄။ Helper Functions
const saveUser = async (ctx) => {
    try {
        const UserStore = Parse.Object.extend("UserStore");
        const query = new Parse.Query(UserStore);
        query.equalTo("userId", ctx.from.id.toString());
        const exists = await query.first({ useMasterKey: true });
        if (!exists) {
            const newUser = new UserStore();
            await newUser.save({ userId: ctx.from.id.toString(), username: ctx.from.username }, { useMasterKey: true });
        }
    } catch (e) { console.error("UserStore Error:", e.message); }
};

const getDynamicKeyboard = async () => {
    const Item = Parse.Object.extend("Item");
    const results = await new Parse.Query(Item).find({ useMasterKey: true });
    const categories = [...new Set(results.map(i => i.get("category").toLowerCase()))];
    const buttons = categories.map(cat => [Markup.button.callback(`🛒 ${cat.toUpperCase()} ဝယ်ယူရန်`, `list_${cat}`)]);
    buttons.push([Markup.button.callback('📞 Admin ဆက်သွယ်ရန်', 'contact_admin')]);
    return Markup.inlineKeyboard(buttons);
};

// ၅။ Bot Commands
bot.start(async (ctx) => {
    await saveUser(ctx);
    const keyboard = await getDynamicKeyboard();
    ctx.reply(`မင်္ဂလာပါ ${ctx.from.first_name} 🙏\nဝန်ဆောင်မှုများကို အောက်တွင် ရွေးချယ်ပါ -`, keyboard);
});

// Category ခလုတ်များ
bot.action(/^list_(.+)$/, async (ctx) => {
    try {
        await ctx.answerCbQuery(); // Callback query ကို ချက်ချင်းအကြောင်းပြန်ရန်
        const category = ctx.match[1];
        const Item = Parse.Object.extend("Item");
        const results = await new Parse.Query(Item).equalTo("category", category.toLowerCase()).find({ useMasterKey: true });

        if (results.length === 0) return ctx.reply("လတ်တလော စာရင်းမရှိသေးပါ။");

        for (const item of results) {
            const buttons = [[Markup.button.callback('💳 အခုဝယ်မည်', `buy_${item.id}`)]];
            if (ctx.from.id.toString() === ADMIN_ID) buttons.push([Markup.button.callback('🗑️ ဖျက်ရန်', `del_${item.id}`)]);

            await ctx.replyWithPhoto(item.get("fileId"), {
                caption: `<b>💎 ${item.get("name")}</b>\n💰 ဈေးနှုန်း: ${item.get("price")}`,
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(buttons)
            });
        }
    } catch (e) { console.error("Action Error:", e.message); }
});

// ပစ္စည်းဖျက်ခြင်း (Admin Only)
bot.action(/^del_(.+)$/, async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return ctx.answerCbQuery("No Permission");
    try {
        const item = await new Parse.Query(Parse.Object.extend("Item")).get(ctx.match[1], { useMasterKey: true });
        await item.destroy({ useMasterKey: true });
        await ctx.answerCbQuery("✅ ဖျက်ပြီးပါပြီ");
        await ctx.editMessageCaption("❌ ဤပစ္စည်းကို ဖျက်လိုက်ပါပြီ။");
    } catch (e) { console.error(e.message); }
});

// Checkout Flow (Buy Button)
bot.action(/^buy_(.+)$/, async (ctx) => {
    try {
        await ctx.answerCbQuery();
        const item = await new Parse.Query(Parse.Object.extend("Item")).get(ctx.match[1], { useMasterKey: true });
        ctx.session = { step: 'ASK_NAME', item: item.get("name"), price: item.get("price") };
        ctx.reply(`🛒 <b>${item.get("name")}</b> အတွက် သင်၏ အမည် ရိုက်ပေးပါ -`, { parse_mode: 'HTML' });
    } catch (e) { console.error(e.message); }
});

// Text & Order Handling
bot.on('text', async (ctx) => {
    if (ctx.session?.step === 'ASK_NAME') {
        ctx.session.name = ctx.message.text;
        ctx.session.step = 'ASK_PHONE';
        return ctx.reply("📱 ဆက်သွယ်ရန် ဖုန်းနံပါတ် ရိုက်ပေးပါ -");
    } 
    if (ctx.session?.step === 'ASK_PHONE') {
        ctx.session.phone = ctx.message.text;
        ctx.session.step = 'ASK_PAYMENT';
        return ctx.reply("💳 KPay: 09757541448 သို့ ငွေလွှဲပြီး Screenshot ပို့ပေးပါ -");
    }
    // Admin Broadcast Command
    if (ctx.from.id.toString() === ADMIN_ID && ctx.message.text.startsWith('/broadcast')) {
        const msg = ctx.message.text.replace('/broadcast', '').trim();
        if (!msg) return ctx.reply("⚠️ /broadcast စာသား");
        const users = await new Parse.Query(Parse.Object.extend("UserStore")).find({ useMasterKey: true });
        users.forEach(u => bot.telegram.sendMessage(u.get("userId"), `📢 <b>SJ Tech News</b>\n\n${msg}`, { parse_mode: 'HTML' }).catch(()=>{}));
        ctx.reply("✅ ပို့ပြီးပါပြီ။");
    }
});

// Payment Screenshot & Admin Product Upload
bot.on('photo', async (ctx) => {
    if (ctx.session?.step === 'ASK_PAYMENT') {
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        await bot.telegram.sendPhoto(ADMIN_ID, fileId, {
            caption: `🔥 <b>ORDER!</b>\n📦: ${ctx.session.item}\n💰: ${ctx.session.price}\n👤: ${ctx.session.name}\n📞: ${ctx.session.phone}`,
            parse_mode: 'HTML'
        });
        ctx.session = null;
        return ctx.reply("✅ အော်ဒါတင်ပြီးပါပြီ။ Admin မှ မကြာမီ ဆက်သွယ်ပါမည်။");
    }
    // Admin Upload
    if (ctx.from.id.toString() === ADMIN_ID && ctx.message.caption?.includes('|')) {
        try {
            const [category, name, price] = ctx.message.caption.split('|').map(s => s.trim());
            const Item = Parse.Object.extend("Item");
            await new Item().save({ category: category.toLowerCase(), name, price, fileId: ctx.message.photo[ctx.message.photo.length - 1].file_id }, { useMasterKey: true });
            ctx.reply(`✅ ${name} သွင်းပြီးပါပြီ။`);
        } catch (e) { ctx.reply("Error: " + e.message); }
    }
});

bot.action('contact_admin', (ctx) => ctx.reply('👨‍💻 Admin: @smartpossystem'));

bot.launch().then(() => console.log("🚀 Premium SJ Bot Online!"));