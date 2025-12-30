const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const Parse = require('parse/node');

const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Fully Dynamic Bot is Running!'));
app.listen(port, () => console.log(`🚀 Server on port ${port}`));

// ၁။ Database Setup (Master Key ပါဝင်ရန်)
Parse.initialize(
    process.env.PARSE_APP_ID, 
    process.env.PARSE_JS_KEY, 
    process.env.PARSE_MASTER_KEY
);
Parse.serverURL = 'https://parseapi.back4app.com/';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_CHAT_ID;

// ၂။ Database ထဲမှ Category အားလုံးကို ခလုတ်အဖြစ် ပြောင်းလဲပေးသည့် Function
const getDynamicKeyboard = async () => {
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    
    try {
        const results = await query.find({ useMasterKey: true });
        // ရှိသမျှ Category အားလုံးကို ယူပြီး Duplicate (ထပ်နေသည်များ) ကို ဖယ်ထုတ်သည်
        const categories = [...new Set(results.map(item => item.get("category").toLowerCase()))];
        
        // Category တစ်ခုချင်းစီအတွက် ခလုတ်များ တည်ဆောက်သည်
        const buttons = categories.map(cat => [
            Markup.button.callback(`🛒 ${cat.toUpperCase()} ဝယ်ယူရန်`, `list_${cat}`)
        ]);
        
        // အောက်ဆုံးတွင် ဆက်သွယ်ရန် ခလုတ်ကို ထည့်သည်
        buttons.push([Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin')]);
        
        return Markup.inlineKeyboard(buttons);
    } catch (e) {
        console.error("Menu Error:", e.message);
        return Markup.inlineKeyboard([[Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin')]]);
    }
};

// ၃။ ပစ္စည်းများ ပြန်ထုတ်ပြခြင်း Logic
const showProducts = async (ctx, cat) => {
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    query.equalTo("category", cat.toLowerCase());
    
    try {
        const results = await query.find({ useMasterKey: true });
        if (results.length === 0) return ctx.reply(`လတ်တလော ${cat} စာရင်းမရှိသေးပါ။`);

        for (const item of results) {
            await ctx.replyWithPhoto(item.get("imageUrl"), {
                caption: `<b>🌐 ${item.get("name")}</b>\n💰 ဈေးနှုန်း: ${item.get("price")}`,
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([[Markup.button.callback('အခုဝယ်ယူမည်', 'contact_admin')]])
            });
        }
    } catch (e) { ctx.reply("❌ Error: " + e.message); }
};

// ၄။ Bot Commands & Actions
bot.start(async (ctx) => {
    const keyboard = await getDynamicKeyboard();
    ctx.reply('SJ Web Development မှ ကြိုဆိုပါတယ်။ ဝန်ဆောင်မှုများကို ရွေးချယ်ပါ -', keyboard);
});

// ခလုတ်အားလုံးကို dynamic ဖတ်ရန် regex သုံးခြင်း
bot.action(/^list_(.+)$/, async (ctx) => {
    const category = ctx.match[1];
    await showProducts(ctx, category);
});

// ၅။ Admin မှ ပစ္စည်းအသစ်ထည့်ခြင်း
bot.on('photo', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;
    const caption = ctx.message.caption;
    if (!caption || !caption.includes('|')) return ctx.reply("⚠️ ပုံစံ: category | name | price");

    try {
        const [category, name, price] = caption.split('|').map(s => s.trim());
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);

        const Item = Parse.Object.extend("Item");
        const newItem = new Item();
        await newItem.save({ category: category.toLowerCase(), name, price, imageUrl: fileLink.href }, { useMasterKey: true });

        ctx.reply(`✅ သိမ်းဆည်းပြီးပါပြီ! အခု /start ကို နှိပ်ပြီး ခလုတ်အသစ်ကို ကြည့်နိုင်ပါပြီ။`);
    } catch (err) { ctx.reply("❌ Error: " + err.message); }
});

bot.action('contact_admin', (ctx) => ctx.reply('Admin: @smartpossystem'));

bot.launch().then(() => console.log("🚀 Fully Dynamic Bot Online!"));