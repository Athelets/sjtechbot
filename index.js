const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ၁။ Express Server (Back4App Containers ကျန်းမာရေးစစ်ဆေးရန်)
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('SJ Selling Bot is Active!'));
app.listen(port, () => console.log(`✅ Server is listening on port ${port}`));

// ၂။ Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID;

if (!botToken) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN missing!");
    process.exit(1);
}
const bot = new Telegraf(botToken);

// ၃။ GitHub Raw Image Links (blob/ မပါစေရန် ပြင်ထားသည်)
const VPN_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';
const POS_IMAGE = 'https://raw.githubusercontent.com/Athelets/sjtechbot/main/images/vpn_banner.png';

const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 VPN ဝယ်ယူရန်', 'vpn_service'), Markup.button.callback('🖥️ POS System', 'pos_service')],
    [Markup.button.callback('📞 ဆက်သွယ်ရန်', 'contact_admin'), Markup.button.callback('💳 ငွေပေးချေမှု', 'payment_info')]
]);

bot.start((ctx) => ctx.reply('SJ Web Development မှ ကြိုဆိုပါတယ်။ ဝန်ဆောင်မှုများကို ရွေးချယ်နိုင်ပါသည် -', mainMenu));

// VPN Service with Error Handling
bot.action('vpn_service', async (ctx) => {
    try {
        await ctx.replyWithPhoto(VPN_IMAGE, {
            caption: `<b>🌐 VPN ဝန်ဆောင်မှု</b>\nဝယ်ယူရန် Admin ကို ဆက်သွယ်ပါ။`,
            parse_mode: 'HTML',
            ...mainMenu
        });

        // Admin Notification (Catch block ထည့်ထားသဖြင့် Chat Not Found ဖြစ်လည်း Bot မသေပါ)
        if (ADMIN_ID) {
            bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order Alert!</b>\n👤 User: @${ctx.from.username || ctx.from.id}\n📦 Item: VPN`, { parse_mode: 'HTML' })
                .catch(err => console.error("❌ Admin စာပို့မရပါ (Chat Not Found)။ Bot ကို Start လုပ်ထားရန် လိုသည်။"));
        }
    } catch (e) { console.error("Action Error:", e.message); }
});

// POS Service
bot.action('pos_service', async (ctx) => {
    try {
        await ctx.replyWithPhoto(POS_IMAGE, {
            caption: `<b>🖥️ Smart POS System</b>\nဖုန်း: 09757541448`,
            parse_mode: 'HTML',
            ...mainMenu
        });

        if (ADMIN_ID) {
            bot.telegram.sendMessage(ADMIN_ID, `🔔 <b>Order Alert!</b>\n👤 User: @${ctx.from.username || ctx.from.id}\n📦 Item: POS`, { parse_mode: 'HTML' })
                .catch(err => console.error("❌ Admin စာပို့မရပါ (Chat Not Found)"));
        }
    } catch (e) { console.error("Action Error:", e.message); }
});

bot.action('contact_admin', (ctx) => ctx.reply('👨‍💻 Admin: @smartpossystem\nဖုန်း: 09757541448', mainMenu));
bot.action('payment_info', (ctx) => ctx.reply('💳 KPay: 09757541448 \n(ငွေလွှဲပြီးလျှင် Screenshot ပို့ပေးပါ)', mainMenu));

// ၄။ Bot Launch (တစ်ကြိမ်သာ ရေးရပါမည်)
bot.launch()
    .then(() => console.log("🚀 Selling Bot is Online!"))
    .catch(err => console.error("Launch Error:", err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));