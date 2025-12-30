const { Telegraf, Markup, session } = require('telegraf');
const express = require('express');
const Parse = require('parse/node');

// ၁။ Server Setup
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Premium SJ Bot is Active!'));
app.listen(port, () => console.log(`🚀 Server on port ${port}`));

// ၂။ Database Setup
Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_JS_KEY, process.env.PARSE_MASTER_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_CHAT_ID;
bot.use(session()); // Order process အတွက် session သုံးသည်

// ၃။ Helper Functions
const saveUser = async (ctx) => {
    const UserStore = Parse.Object.extend("UserStore");
    const query = new Parse.Query(UserStore);
    query.equalTo("userId", ctx.from.id.toString());
    const exists = await query.first({ useMasterKey: true });
    if (!exists) {
        const newUser = new UserStore();
        await newUser.save({ userId: ctx.from.id.toString(), username: ctx.from.username }, { useMasterKey: true });
    }
};

const getDynamicKeyboard = async () => {
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    const results = await query.find({ useMasterKey: true });
    const categories = [...new Set(results.map(item => item.get("category").toLowerCase()))];
    const buttons = categories.map(cat => [Markup.button.callback(`🛒 ${cat.toUpperCase()} ဝယ်ယူရန်`, `list_${cat}`)]);
    buttons.push([Markup.button.callback('📞 Admin ဆက်သွယ်ရန်', 'contact_admin')]);
    return Markup.inlineKeyboard(buttons);
};

// ၄။ Bot Commands
bot.start(async (ctx) => {
    await saveUser(ctx);
    const keyboard = await getDynamicKeyboard();
    ctx.reply(`မင်္ဂလာပါ ${ctx.from.first_name} 🙏\nSJ Web Development မှ ကြိုဆိုပါတယ်။ ရှယ်ဝန်ဆောင်မှုများကို အောက်တွင် ရွေးချယ်နိုင်ပါသည် -`, keyboard);
});

// Admin အတွက် Broadcast စနစ်
bot.command('broadcast', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;
    const msg = ctx.message.text.replace('/broadcast', '').trim();
    if (!msg) return ctx.reply("⚠️ ပုံစံ: /broadcast ကြော်ငြာစာသား");

    const UserStore = Parse.Object.extend("UserStore");
    const query = new Parse.Query(UserStore);
    const users = await query.find({ useMasterKey: true });

    let count = 0;
    for (const user of users) {
        try {
            await bot.telegram.sendMessage(user.get("userId"), `📢 <b>SJ Tech သတင်းလွှာ</b>\n\n${msg}`, { parse_mode: 'HTML' });
            count++;
        } catch (e) { console.error("Send error to:", user.get("userId")); }
    }
    ctx.reply(`✅ လူပေါင်း ${count} ဦးထံသို့ ကြော်ငြာပို့ပြီးပါပြီ။`);
});

// ၅။ ပစ္စည်းများ ပြသခြင်းနှင့် စီမံခြင်း
bot.action(/^list_(.+)$/, async (ctx) => {
    const category = ctx.match[1];
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    query.equalTo("category", category.toLowerCase());
    const results = await query.find({ useMasterKey: true });

    if (results.length === 0) return ctx.reply("လတ်တလော စာရင်းမရှိသေးပါ။");

    for (const item of results) {
        const buttons = [[Markup.button.callback('💳 အခုဝယ်မည်', `buy_${item.id}`)]];
        if (ctx.from.id.toString() === ADMIN_ID) {
            buttons.push([Markup.button.callback('🗑️ ပစ္စည်းဖျက်မည်', `del_${item.id}`)]);
        }

        await ctx.replyWithPhoto(item.get("fileId"), {
            caption: `<b>💎 ${item.get("name")}</b>\n💰 ဈေးနှုန်း: <b>${item.get("price")}</b>\n📦 Category: #${item.get("category")}`,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(buttons)
        });
    }
});

// ပစ္စည်းဖျက်ခြင်း (Admin Only)
bot.action(/^del_(.+)$/, async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;
    try {
        const Item = Parse.Object.extend("Item");
        const query = new Parse.Query(Item);
        const item = await query.get(ctx.match[1], { useMasterKey: true });
        await item.destroy({ useMasterKey: true });
        ctx.answerCbQuery("✅ ဖျက်ပြီးပါပြီ");
        ctx.editMessageCaption("❌ ဤပစ္စည်းကို စာရင်းမှ ဖျက်လိုက်ပါပြီ။");
    } catch (e) { ctx.reply("Error: " + e.message); }
});

// ၆။ Order Checkout Flow
bot.action(/^buy_(.+)$/, async (ctx) => {
    const Item = Parse.Object.extend("Item");
    const item = await new Parse.Query(Item).get(ctx.match[1], { useMasterKey: true });
    ctx.session = { step: 'ASK_NAME', item: item.get("name"), price: item.get("price") };
    ctx.reply(`🛒 <b>${item.get("name")}</b> ကို ဝယ်ယူရန်အတွက် သင်၏ အမည် ကို ရိုက်ပေးပါ -`, { parse_mode: 'HTML' });
});

bot.on('text', async (ctx) => {
    if (!ctx.session || !ctx.session.step) return;

    if (ctx.session.step === 'ASK_NAME') {
        ctx.session.name = ctx.message.text;
        ctx.session.step = 'ASK_PHONE';
        ctx.reply("📱 ဆက်သွယ်ရန် ဖုန်းနံပါတ် ရိုက်ပေးပါ -");
    } else if (ctx.session.step === 'ASK_PHONE') {
        ctx.session.phone = ctx.message.text;
        ctx.session.step = 'ASK_PAYMENT';
        ctx.reply("💳 KPay: 09757541448 သို့ ငွေလွှဲပြီး ငွေလွှဲပြေစာ (Screenshot) ပို့ပေးပါ -");
    }
});

bot.on('photo', async (ctx) => {
    if (ctx.session && ctx.session.step === 'ASK_PAYMENT') {
        const screenShot = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        
        // Admin ထံသို့ Order Voucher ပို့ခြင်း
        await bot.telegram.sendPhoto(ADMIN_ID, screenShot, {
            caption: `🔥 <b>ORDER အသစ်ရပါပြီ!</b>\n\n📦 ပစ္စည်း: ${ctx.session.item}\n💰 ဈေးနှုန်း: ${ctx.session.price}\n👤 အမည်: ${ctx.session.name}\n📞 ဖုန်း: ${ctx.session.phone}\n🆔 User: @${ctx.from.username || ctx.from.id}`,
            parse_mode: 'HTML'
        });

        ctx.reply("✅ အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။ Admin မှ ခဏအတွင်း အကြောင်းပြန်ပေးပါလိမ့်မည်။ ကျေးဇူးတင်ပါသည်။", await getDynamicKeyboard());
        ctx.session = null;
    } else if (ctx.from.id.toString() === ADMIN_ID) {
        // Admin မှ ပစ္စည်းအသစ်တင်သည့် အပိုင်း (ယခင်အတိုင်း)
        const caption = ctx.message.caption;
        if (!caption || !caption.includes('|')) return;
        const [category, name, price] = caption.split('|').map(s => s.trim());
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const Item = Parse.Object.extend("Item");
        const newItem = new Item();
        await newItem.save({ category: category.toLowerCase(), name, price, fileId }, { useMasterKey: true });
        ctx.reply(`✅ ${name} ကို စာရင်းသွင်းပြီးပါပြီ။`);
    }
});

bot.action('contact_admin', (ctx) => ctx.reply('👨‍💻 Admin တိုက်ရိုက်ဆက်သွယ်ရန်: @smartpossystem'));

bot.launch().then(() => console.log("🚀 Premium Dynamic Bot is Online!"));