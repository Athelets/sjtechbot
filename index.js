const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('SJ Selling Bot is Live!'));
app.listen(port, () => console.log(`✅ Server listening on port ${port}`));

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN missing!");
    process.exit(1);
}
const bot = new Telegraf(botToken);

// --- မှန်ကန်သော GitHub Raw Links (blob/ ကို ဖျက်ထားပါသည်) ---
const VPN_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';
const POS_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';

const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_service'), Markup.button.callback('🖥️ POS System', 'pos_service')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin'), Markup.button.callback('💳 ငွေပေးချေမှု', 'payment_info')]
]);

bot.start((ctx) => {
    ctx.reply('မင်္ဂလာပါ။ SJ Web Development မှ ကြိုဆိုပါတယ်။ ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုများကို အောက်ပါ Menu တွင် ရွေးချယ်နိုင်ပါသည် -', mainMenu);
});

bot.action('vpn_service', (ctx) => {
    ctx.replyWithPhoto(VPN_IMAGE, {
        caption: `<b>🌐 VPN ဝန်ဆောင်မှုများ</b>\n\n• 1 Month: <code>5,000 MMK</code>\n• 6 Months: <code>25,000 MMK</code>\n\n✅ Speed & Stability စိတ်ချရသည်။`,
        parse_mode: 'HTML',
        ...mainMenu
    });
});

bot.action('pos_service', (ctx) => {
    ctx.replyWithPhoto(POS_IMAGE, {
        caption: `<b>🖥️ Smart POS System</b>\n\n• Offline Mode ပါဝင်သည်။\n• Bluetooth Printing ရသည်။\n\n📞 ဖုန်း: <code>09757541448</code>`,
        parse_mode: 'HTML',
        ...mainMenu
    });
});

bot.action('contact_admin', (ctx) => {
    ctx.reply('👨‍💻 Admin: @smartpossystem\nဖုန်း: 09757541448', mainMenu);
});

bot.action('payment_info', (ctx) => {
    ctx.reply('💳 ငွေပေးချေရန် -\n- KPay: 09757541448 \n(ငွေလွှဲပြီးလျှင် Screenshot ပို့ပေးပါ)', mainMenu);
});

// Launch Bot
bot.launch()
    .then(() => console.log("🚀 Selling Bot is Online!"))
    .catch(err => console.error("Launch Error:", err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));