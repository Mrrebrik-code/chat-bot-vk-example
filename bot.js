const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Scene = require('node-vk-bot-api/lib/scene');
const { createClient } = require('@supabase/supabase-js');

const apiSupabase = "https://opslbkbxnzgfapmztpuh.supabase.co";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2xia2J4bnpnZmFwbXp0cHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDkxODgwMTgsImV4cCI6MTk2NDc2NDAxOH0.4l58i9tDErg90QLlPFL-5tfXm3ajJy7MOobvTCRH2GA";
const token = "vk1.a.RkxqWessN1asBBs449nKg9Y4XGZE4VU71Ykbm0KIcPw9jIosLbMnZAaRjobZkfM0m_Kp4YBAZA7-pA_WoTV2F2YNfICPa5sF-6Ic6N0cq56PGOhtmxQbFDzAECMcGICA5LtG5LQjqO-Up2qzqpR5ZWXLJdd_XQlJSJLntfn5Pz4Q3Wf0OwFnzapCgcsmMZJx";

const bot = new VkBot(token);
const supabase = createClient(apiSupabase, publicAnonKey);


async function saveDatabaseUser(userId, nickname){
    let user = await  supabase
            .from('user-bot-vk')
            .insert(
            [ 
                { 
                    id: userId, 
                    nickname: nickname, 
                }
            ]);
    if(user.data.length != 0){
        return true;
    }
    else{
        return false;
    }
}

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

async function tryUserDatabase(userId){
    let user = await supabase.from('user-bot-vk').select('id').eq('id', userId);
    return user.data.length != 0;
}

const registerScene = new Scene('register',
    async (ctx) => {
        const isChecked = await tryUserDatabase(ctx.message.from_id);
        console.log(isChecked);
        if( isChecked == true){
            ctx.reply("Добрый день, Вы уже зарегистрированы!");
            ctx.scene.leave()
        }
        else{
            ctx.reply("Введите ваш никнейм");
            ctx.scene.next();
        }
    },
    (ctx) =>{
        ctx.session.nickname = ctx.message.text;
        
        ctx.reply(`Хорошо, данный никнейм -> [${ctx.session.nickname}] - будет отображаться в чате для все пользователей!`);
        var isSave = saveDatabaseUser(ctx.message.from_id, ctx.session.nickname);

        if(isSave){
            ctx.reply('Ваши данные успешно сохранены в базу данных!');
        }
        else{
            ctx.reply('На стороне сервера произошел сбой. Данные не сохранены :(');
        }
        ctx.scene.leave();
    },
);

const session = new Session();
const stage = new Stage
(
    scene,
    registerScene
);

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

bot.command('/register', async (ctx) =>{
    ctx.scene.enter('register');
});


bot.startPolling();