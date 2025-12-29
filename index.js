const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ၁။ Server Setup (Back4App Containers အတွက်)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('SJ Selling Bot is Active!'));
app.listen(port, () => console.log(`✅ Server listening on port ${port}`));

// ၂။ Bot Setup & Environment Variables
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID; // @userinfobot မှရသော သင့် ID ကို Dashboard တွင်ထည့်ပါ

if (!botToken) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN missing!");
    process.exit(1);
}

const bot = new Telegraf(botToken);

// ၃။ GitHub Raw Image Links (blob/ မပါစေရန် သတိပြုပါ)
const VPN_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';
const POS_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';

// ၄။ ပင်မ Menu (Main Menu)
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_service'), Markup.button.callback('🖥️ POS System', 'pos_service')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin'), Markup.button.callback('💳 ငွေပေးချေမှု', 'payment_info')]
]);

bot.start((ctx) => {
    ctx.reply(`မင်္ဂလာပါ။ SJ Web Development မှ ကြိုဆိုပါတယ်။\n\nကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုများကို အောက်ပါ Menu တွင် ရွေးချယ်နိုင်ပါသည် -`, mainMenu);
});

// ၅။ Services နှင့် Admin Notification Logic

// VPN Service
bot.action('vpn_service', async (ctx) => {
    await ctx.replyWithPhoto(VPN_IMAGE, {
        caption: `<b>🌐 VPN ဝန်ဆောင်မှုများ</b>\n\n• 1 Month: <code>5,000 MMK</code>\n• 6 Months: <code>25,000 MMK</code>\n\n✅ Speed & Stability စိတ်ချရသည်။\n\nဝယ်ယူရန် Admin ကို ဆက်သွယ်ပါ။`,
        parse_mode: 'HTML',
        ...mainMenu
    });

    // Admin ဆီသို့ Notification ပို့ခြင်း
    if (ADMIN_ID) {
        const user = ctx.from.username ? `@${ctx.from.username}` : ctx.from.id;
        bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order Alert!</b>\n\n👤 ဝယ်ယူသူ: ${user}\n📦 ပစ္စည်း: <b>VPN Service</b>`, { parse_mode: 'HTML' });
    }
});

// POS Service
bot.action('pos_service', async (ctx) => {
    await ctx.replyWithPhoto(POS_IMAGE, {
        caption: `<b>🖥️ Smart POS System</b>\n\n• Offline Mode ပါဝင်သည်။\n• Bluetooth Printing ရသည်။\n\n📞 အသေးစိတ်သိလိုပါက: <code>09757541448</code>`,
        parse_mode: 'HTML',
        ...mainMenu
    });

    // Admin ဆီသို့ Notification ပို့ခြင်း
    if (ADMIN_ID) {
        const user = ctx.from.username ? `@${ctx.from.username}` : ctx.from.id;
        bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order Alert!</b>\n\n👤 ဝယ်ယူသူ: ${user}\n📦 ပစ္စည်း: <b>POS System</b>`, { parse_mode: 'HTML' });
    }
});

bot.action('contact_admin', (ctx) => {
    ctx.reply('👨‍💻 Admin နှင့် တိုက်ရိုက်စကားပြောရန် -\nTelegram: @smartpossystem\nဖုန်း: 09757541448', mainMenu);
});

bot.action('payment_info', (ctx) => {
    ctx.reply('💳 ငွေပေးချေရန် -\n- KPay: 09757541448 \n(ငွေလွှဲပြီးလျှင် Screenshot ပို့ပေးပါ)', mainMenu);
});

// ၆။ Bot Launch
bot.launch()
    .then(() => console.log("🚀 Selling Bot is Online!"))
    .catch(err => {
        if (err.message.includes('409')) {
            console.error("❌ Conflict 409: သင့်စက်ထဲက Bot ကို အရင်ပိတ်ပေးပါ။");
        } else {
            console.error("❌ Launch Error:", err.message);
        }
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));