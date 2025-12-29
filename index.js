const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ၁။ Express Server (Back4App Containers ကျန်းမာရေး စစ်ဆေးရန်)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('SJ Selling Bot is Active!'));
app.listen(port, () => console.log(`✅ Server is listening on port ${port}`));

// ၂။ Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID;

if (!botToken) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN missing in Dashboard!");
    process.exit(1);
}

const bot = new Telegraf(botToken);

// ၃။ Image Links (GitHub Raw format)
const VPN_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';
const POS_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';

// ၄။ Menu Buttons
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_service'), Markup.button.callback('🖥️ POS System', 'pos_service')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin'), Markup.button.callback('💳 ငွေပေးချေမှု', 'payment_info')]
]);

// ၅။ Bot Commands & Actions
bot.start((ctx) => {
    ctx.reply('မင်္ဂလာပါ။ SJ Web Development မှ ကြိုဆိုပါတယ်။', mainMenu);
});

// VPN Action
bot.action('vpn_service', async (ctx) => {
    await ctx.replyWithPhoto(VPN_IMAGE, {
        caption: `<b>🌐 VPN ဝန်ဆောင်မှု</b>\n• 1 Month: 5,000 MMK\n\nဝယ်ယူရန် Admin ကို ဆက်သွယ်ပါ။`,
        parse_mode: 'HTML',
        ...mainMenu
    });
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order:</b> VPN Service\n👤 User: ${ctx.from.username || ctx.from.id}`, { parse_mode: 'HTML' });
    }
});

// POS Action
bot.action('pos_service', async (ctx) => {
    await ctx.replyWithPhoto(POS_IMAGE, {
        caption: `<b>🖥️ Smart POS System</b>\n• ဖုန်း: 09757541448`,
        parse_mode: 'HTML',
        ...mainMenu
    });
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order:</b> POS System\n👤 User: ${ctx.from.username || ctx.from.id}`, { parse_mode: 'HTML' });
    }
});

bot.action('contact_admin', (ctx) => ctx.reply('👨‍💻 Admin: @smartpossystem', mainMenu));
bot.action('payment_info', (ctx) => ctx.reply('💳 KPay: 09757541448', mainMenu));

// ၆။ Bot Launch (တစ်ကြိမ်သာ ရေးရပါမည်)
bot.launch()
    .then(() => console.log("🚀 Selling Bot is Online!"))
    .catch(err => console.error("Launch Error:", err.message));

// Exit Handlers
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));