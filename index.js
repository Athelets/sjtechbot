const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const Parse = require('parse/node');

// ၁။ Server Setup (Keep-Alive)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('SJ Dynamic Bot is 24/7 Active!'));
app.listen(port, () => console.log(`✅ Server listening on port ${port}`));

// ၂။ Database Setup (Master Key မဖြစ်မနေလိုအပ်သည်)
Parse.initialize(
    process.env.PARSE_APP_ID, 
    process.env.PARSE_JS_KEY, 
    process.env.PARSE_MASTER_KEY
);
Parse.serverURL = 'https://parseapi.back4app.com/';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_CHAT_ID;

// ၃။ Database ထဲမှ Category အားလုံးကို ခလုတ်အဖြစ် အလိုအလျောက်ပြောင်းခြင်း
const getDynamicKeyboard = async () => {
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    
    try {
        const results = await query.find({ useMasterKey: true });
        const categories = [...new Set(results.map(item => item.get("category").toLowerCase()))];
        
        const buttons = categories.map(cat => [
            Markup.button.callback(`🛒 ${cat.toUpperCase()} ဝယ်ယူရန်`, `list_${cat}`)
        ]);
        
        buttons.push([Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin')]);
        return Markup.inlineKeyboard(buttons);
    } catch (e) {
        return Markup.inlineKeyboard([[Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin')]]);
    }
};

// ၄။ ပစ္စည်းများ ပြန်ထုတ်ပြခြင်း Logic (FileID ကို သုံးထားသည်)
const showProducts = async (ctx, cat) => {
    const Item = Parse.Object.extend("Item");
    const query = new Parse.Query(Item);
    query.equalTo("category", cat.toLowerCase());
    
    try {
        const results = await query.find({ useMasterKey: true });
        if (results.length === 0) return ctx.reply(`လတ်တလော ${cat} စာရင်းမရှိသေးပါ။`);

        for (const item of results) {
            // fileId ကို သုံး၍ ပုံပြန်ပို့ခြင်းဖြင့် 400 Error ကို ဖြေရှင်းသည်
            await ctx.replyWithPhoto(item.get("fileId"), {
                caption: `<b>🌐 ${item.get("name")}</b>\n💰 ဈေးနှုန်း: ${item.get("price")}`,
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([[Markup.button.callback('အခုဝယ်ယူမည်', 'contact_admin')]])
            });
        }
    } catch (e) { ctx.reply("❌ ပုံဖတ်လို့မရပါ (Database တွင် fileId column စစ်ပါ)။"); }
};

// ၅။ Bot Commands & Interactions
bot.start(async (ctx) => {
    const keyboard = await getDynamicKeyboard();
    ctx.reply('SJ Web Development မှ ကြိုဆိုပါတယ်။ ဝန်ဆောင်မှုများကို ရွေးချယ်ပါ -', keyboard);
});

// Category ခလုတ်များကို Regex ဖြင့် ဖမ်းယူခြင်း
bot.action(/^list_(.+)$/, async (ctx) => {
    const category = ctx.match[1];
    await showProducts(ctx, category);
});

// ၆။ Admin မှ ပစ္စည်းအသစ်ထည့်ခြင်း (file_id ကို သိမ်းဆည်းခြင်း)
bot.on('photo', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;
    const caption = ctx.message.caption;
    if (!caption || !caption.includes('|')) return ctx.reply("⚠️ ပုံစံ: category | name | price");

    try {
        const [category, name, price] = caption.split('|').map(s => s.trim());
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

        const Item = Parse.Object.extend("Item");
        const newItem = new Item();
        // imageUrl အစား fileId ကိုသာ သိမ်းပါ
        await newItem.save(
            { category: category.toLowerCase(), name, price, fileId: fileId }, 
            { useMasterKey: true }
        );

        ctx.reply(`✅ သိမ်းဆည်းပြီးပါပြီ! အခု /start ကို နှိပ်ပြီး ခလုတ်အသစ်ကို ကြည့်နိုင်ပါပြီ။`);
    } catch (err) { ctx.reply("❌ Error: " + err.message); }
});

bot.action('contact_admin', (ctx) => ctx.reply('Admin: @smartpossystem'));

bot.launch().then(() => console.log("🚀 Fully Dynamic Bot is Live!"));