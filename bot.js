const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Scene = require('node-vk-bot-api/lib/scene');


const token = "vk1.a.RkxqWessN1asBBs449nKg9Y4XGZE4VU71Ykbm0KIcPw9jIosLbMnZAaRjobZkfM0m_Kp4YBAZA7-pA_WoTV2F2YNfICPa5sF-6Ic6N0cq56PGOhtmxQbFDzAECMcGICA5LtG5LQjqO-Up2qzqpR5ZWXLJdd_XQlJSJLntfn5Pz4Q3Wf0OwFnzapCgcsmMZJx";
const bot = new VkBot(token);




const scene = new Scene('test',
    (ctx) => {
        ctx.scene.next();
        ctx.reply("Тестовое собщение 1");

    },
    (ctx) => {
        ctx.scene.leave(); 
        ctx.reply("Тестовое собщение 1");

    },
);

const session = new Session();
const stage = new Stage(scene);

bot.use(session.middleware());
bot.use(stage.middleware());

bot.command('/test', (ctx) => {
    ctx.scene.enter('test');
});

bot.command('/start', async (ctx) => {
    try {
      await ctx.reply('Добро пожаловать! Данный бот является тестовым!');
    } catch (e) {
      console.error(e);
    }
  });

bot.command('/get-id', async (ctx) =>{
    await ctx.reply(`Ваш индификатор: ${ctx.message.from_id}`);
});


bot.startPolling();