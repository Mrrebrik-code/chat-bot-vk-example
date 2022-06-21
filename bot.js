const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
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

async function tryUserDatabase(userId){
    let user = await supabase.from('user-bot-vk').select('id').eq('id', userId);
    return user.data.length != 0;
}

const registerScene = new Scene('register',
    async (ctx) => {
        const isChecked = await tryUserDatabase(ctx.message.from_id);
        if(isChecked == true){
            ctx.reply("Добрый день, Вы уже зарегистрированы!");
            ctx.scene.leave()
        }
        else{
            ctx.reply("Введите ваш никнейм:");
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

const deleteScene = new Scene('delete', 
    async (ctx) =>{
        const isChecked = await tryUserDatabase(ctx.message.from_id);
        if(isChecked == true){
            //await ctx.reply("Вы уверены что действительно хотите удалить аккаунт из нашей базы данных?");
            await ctx.reply('Вы уверены что действительно хотите удалить аккаунт из нашей базы данных?', null, Markup
            .keyboard([
              'Да, удалить',
              'Отмена',
            ], { columns: 2 })
            .inline(),
          );
            await ctx.reply("Восстановить удаленный аккаунт - не возможно!");
            await ctx.scene.next();
        }
        else{
            await ctx.reply("Вы еще не зарегестрированы чтобы использовать функционал бота!");
            await ctx.reply("Напишите /register для регистрации аккаунта.");
            await ctx.scene.leave();
        }
    },
    async (ctx) =>{
        if(ctx.message.text == "Да, удалить"){
            await ctx.reply("Идет процес удаления...")
            const isChecked = await deleteUserFromDatabase(ctx.message.from_id);

            if(isChecked == true){
                await ctx.reply("Вы успешно удалены из базы данных!");
                await ctx.scene.leave();
            }
            else{
                await ctx.reply("На стороне сервера произошел сбой. Сейчас мы не можем вас удалить. Попробуйте позже...");
                await ctx.scene.leave();
            }
        }
        else if(ctx.message.text == "Отмена"){
            await ctx.reply("Удаление отменено! Мы рады что Вы с нами!");
            await ctx.scene.leave();
        }
        else{
            await ctx.scene.leave();
        }
        
    },

);

async function deleteUserFromDatabase(userId){
    const { data, error } = await supabase
    .from('user-bot-vk')
    .delete()
    .eq('id', userId);

    if(error == null){
        return true;
    }
    else{
        return false;
    }
}

const session = new Session();
const stage = new Stage
(
    registerScene,
    deleteScene
);

bot.use(session.middleware());
bot.use(stage.middleware());

bot.command('/start', async (ctx) => {
    console.log("start");
    try {
      //await ctx.reply('Добро пожаловать! Данный бот является тестовым!');
      ctx.reply('Добро пожаловать! Это Бот, который сможет предоставить аноноимный чат для вас и ваших знакомых!>', null, Markup
    .keyboard([
      [
        Markup.button('/get-id', 'primary'),
        Markup.button('/create-chat', 'primary'),
        Markup.button('/join-chat', 'primary'),
      ],
      [
        Markup.button('/register', 'positive'),
        Markup.button('/delete', 'negative'),
      ],
    ]));
    } catch (e) {
      console.error(e);
    }
  });

bot.command('/get-id', async (ctx) =>{
    const isChecked = await tryUserDatabase(ctx.message.from_id);
    if(isChecked == true){
        await ctx.reply(`Ваш индификатор: ${ctx.message.from_id}`);
        await ctx.scene.leave();
    }
    else{
        await ctx.reply("Вы еще не зарегестрированы чтобы использовать функционал бота!");
        await ctx.reply("Напишите /register для регистрации аккаунта.");
        await ctx.scene.leave();
    }
   
});

bot.command('/delete', async (ctx) =>{
    //console.log( `User to id: ${ctx.message.from_id} delete account from database`);
    ctx.scene.enter('delete');
});

bot.command('/register', async (ctx) =>{
    ctx.scene.enter('register');
});


bot.startPolling((err) => {
    if (err) {
      console.error(err);
    }
  });