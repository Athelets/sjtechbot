const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ၁။ Express Server (Bot ကို အမြဲနိုးနေစေရန် Ping လုပ်မည့်နေရာ)
const app = express();
const port = process.env.PORT || 8080;

// ကျန်းမာရေးစစ်ဆေးရန် Endpoint (UptimeRobot အတွက်)
app.get('/', (req, res) => {
    res.send('✅ SJ Bot is Strictly Online 24/7!');
});

app.listen(port, () => {
    console.log(`🚀 Server is listening on port ${port}`);
});

// ၂။ Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID;

if (!botToken) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN missing in Dashboard!");
    process.exit(1);
}

const bot = new Telegraf(botToken);

// ၃။ ပုံများ၏ Link (GitHub Raw - blob/ ဖယ်ထားသည်)
const VPN_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';
const POS_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';

// ၄။ Menu Buttons
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_service'), Markup.button.callback('🖥️ POS System', 'pos_service')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin'), Markup.button.callback('💳 ငွေပေးချေမှု', 'payment_info')]
]);

// ၅။ Bot Commands & Actions
bot.start((ctx) => {
    ctx.reply('မင်္ဂလာပါ။ SJ Web Development Bot မှ ကြိုဆိုပါတယ်။', mainMenu);
});

// VPN Action
bot.action('vpn_service', async (ctx) => {
    try {
        await ctx.replyWithPhoto(VPN_IMAGE, {
            caption: `<b>🌐 VPN ဝန်ဆောင်မှု</b>\n• 1 Month: 5,000 MMK\n\nဝယ်ယူရန် Admin ကို ဆက်သွယ်ပါ။`,
            parse_mode: 'HTML',
            ...mainMenu
        });

        // Admin Notification with Catch block (Bot မသေစေရန်)
        if (ADMIN_ID) {
            bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order Alert!</b>\n📦 Item: VPN Service\n👤 User: @${ctx.from.username || ctx.from.id}`, { parse_mode: 'HTML' })
                .catch(err => console.error("❌ Admin စာပို့မရပါ (Bot ကို Start လုပ်ထားရန်လိုသည်)"));
        }
    } catch (e) { console.error("VPN Action Error:", e.message); }
});

// POS Action
bot.action('pos_service', async (ctx) => {
    try {
        await ctx.replyWithPhoto(POS_IMAGE, {
            caption: `<b>🖥️ Smart POS System</b>\n• Bluetooth Printing ရသည်။\n\n📞 ဖုန်း: 09757541448`,
            parse_mode: 'HTML',
            ...mainMenu
        });

        if (ADMIN_ID) {
            bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order Alert!</b>\n📦 Item: POS System\n👤 User: @${ctx.from.username || ctx.from.id}`, { parse_mode: 'HTML' })
                .catch(err => console.error("❌ Admin စာပို့မရပါ"));
        }
    } catch (e) { console.error("POS Action Error:", e.message); }
});

bot.action('contact_admin', (ctx) => ctx.reply('👨‍💻 Admin: @smartpossystem\nဖုန်း: 09757541448', mainMenu));
bot.action('payment_info', (ctx) => ctx.reply('💳 KPay: 09757541448 \n(ငွေလွှဲပြီးလျှင် Screenshot ပို့ပေးပါ)', mainMenu));

// ၆။ Bot Launch
bot.launch()
    .then(() => console.log("🚀 Selling Bot is Online & Ready!"))
    .catch(err => console.error("Launch Error:", err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));