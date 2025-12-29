const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ၁။ Server Setup (Back4App အတွက် မဖြစ်မနေလိုအပ်သည်)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Selling Bot is Running!'));
app.listen(port, () => console.log(`Server listening on port ${port}`));

// ၂။ Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN missing!");
    process.exit(1);
}
const bot = new Telegraf(botToken);

// ၃။ ပင်မ Menu (Main Menu)
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_service'), Markup.button.callback('🖥️ POS System', 'pos_service')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin'), Markup.button.callback('💳 ငွေပေးချေမှု', 'payment_info')]
]);

bot.start((ctx) => {
    ctx.reply('မင်္ဂလာပါ။ SJ Web Development မှ ကြိုဆိုပါတယ်။ ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုများကို အောက်ပါ Menu တွင် ရွေးချယ်နိုင်ပါသည် -', mainMenu);
});

// ၄။ ခလုတ်နှိပ်မှုများကို ကိုင်တွယ်ခြင်း (Actions)
bot.action('vpn_service', (ctx) => {
    ctx.reply('🌐 VPN ဝန်ဆောင်မှုများ -\n- 1 Month: 5,000 MMK\n- 6 Months: 25,000 MMK\n\nဝယ်ယူရန် Admin ကို ဆက်သွယ်ပါ။', mainMenu);
});

bot.action('pos_service', (ctx) => {
    ctx.reply('🖥️ POS System (Restaurant / Retail) -\n- Offline Mode ပါဝင်သည်။\n- Bluetooth Printing ရသည်။\n\nအသေးစိတ်သိလိုပါက ဖုန်း 09757541448 ကို ဆက်သွယ်ပါ။', mainMenu);
});

bot.action('contact_admin', (ctx) => {
    ctx.reply('👨‍💻 Admin နှင့် တိုက်ရိုက်စကားပြောရန် -\nTelegram: @smartpossystem\nဖုန်း: 09757541448', mainMenu);
});

bot.action('payment_info', (ctx) => {
    ctx.reply('💳 ငွေပေးချေရန် -\n- KPay: 09757541448 \n(ငွေလွှဲပြီးလျှင် Screenshot ပို့ပေးပါ)', mainMenu);
});

// ၅။ Bot Launch
bot.launch()
    .then(() => console.log("🚀 Selling Bot is Online!"))
    .catch(err => console.error("Launch Error:", err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));