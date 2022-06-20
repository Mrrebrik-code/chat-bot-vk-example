const VkBot = require('node-vk-bot-api');

const token = "vk1.a.RkxqWessN1asBBs449nKg9Y4XGZE4VU71Ykbm0KIcPw9jIosLbMnZAaRjobZkfM0m_Kp4YBAZA7-pA_WoTV2F2YNfICPa5sF-6Ic6N0cq56PGOhtmxQbFDzAECMcGICA5LtG5LQjqO-Up2qzqpR5ZWXLJdd_XQlJSJLntfn5Pz4Q3Wf0OwFnzapCgcsmMZJx";
const bot = new VkBot(token);

bot.command('/start', (ctx) => {
  ctx.reply('Hello!');
});

bot.startPolling();