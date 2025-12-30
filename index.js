const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const Parse = require('parse/node');

// ၁။ Server Setup (Keep-Alive အတွက်)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('SJ Dynamic Bot is Running!'));
app.listen(port, () => console.log(`✅ Server is on port ${port}`));

// ၂။ Parse Database Setup
Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_JS_KEY); 
Parse.serverURL = 'https://parseapi.back4app.com/';

// ၃။ Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID;

const bot = new Telegraf(botToken);

// ၄။ Admin မှ ပစ္စည်းအသစ်ထည့်ခြင်း (ပုံနှင့်စာတွဲပို့ရန်)
bot.on('photo', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;

    const caption = ctx.message.caption; // Format: category | name | price
    if (!caption || !caption.includes('|')) {
        return ctx.reply("⚠️ ပုံစံမှားနေပါသည်။ ပုံနှင့်အတူ 'category | name | price' ဟု ရေးပေးပါ။\nဥပမာ- vpn | Premium VPN | 5000");
    }

    try {
        const [category, name, price] = caption.split('|').map(s => s.trim());
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);

        // 'Item' Class ထဲသို့ သိမ်းဆည်းခြင်း
        const Item = Parse.Object.extend("Item");
        const newItem = new Item();
        await newItem.save({ category, name, price, imageUrl: fileLink.href });

        ctx.reply(`✅ သိမ်းဆည်းပြီးပါပြီ!\n📦 ${name} (${category}) ကို စာရင်းထဲသို့ ထည့်လိုက်ပါပြီ။`);
    } catch (err) { ctx.reply("❌ Database Error: " + err.message); }
});

// ၅။ ပစ္စည်းများ ပြန်ထုတ်ပြခြင်း Logic
const showProducts = async (ctx, cat) => {
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    query.equalTo("category", cat);
    const results = await query.find();

    if (results.length === 0) return ctx.reply("လတ်တလော ပစ္စည်းမရှိသေးပါ။");

    for (const item of results) {
        await ctx.replyWithPhoto(item.get("imageUrl"), {
            caption: `<b>🌐 ${item.get("name")}</b>\n💰 ဈေးနှုန်း: ${item.get("price")}`,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([[Markup.button.callback('အခုဝယ်ယူမည်', 'contact_admin')]])
        });
    }
};

const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_list'), Markup.button.callback('🖥️ POS System', 'pos_list')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin')]
]);

bot.start((ctx) => ctx.reply('SJ Web Development မှ ကြိုဆိုပါသည်။ ပစ္စည်းများကို ရွေးချယ်ပါ -', mainMenu));

bot.action('vpn_list', (ctx) => showProducts(ctx, 'vpn'));
bot.action('pos_list', (ctx) => showProducts(ctx, 'pos'));
bot.action('contact_admin', (ctx) => ctx.reply('Admin: @smartpossystem'));

bot.launch().then(() => console.log("🚀 Dynamic Bot is Online!"));
