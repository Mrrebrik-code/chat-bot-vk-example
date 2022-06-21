const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const { createClient } = require('@supabase/supabase-js');
const shortId = require("shortid");
const config = require('./config.json');

const bot = new VkBot(config.tokens['vk-bot-token']);
const supabase = createClient(config.tokens.supabaseApi, config.tokens.supabasePublicAnonKey);


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

const markupMenuToDelete = Markup.keyboard(['Да, удалить', 'Отмена',], { columns: 2 }).inline();
const markupMenuToStart = Markup.keyboard
([
  [
    Markup.button('/get-id', 'primary'),
    Markup.button('/create-chat', 'primary'),
    Markup.button('/join-chat', 'primary'),
  ],
  [
    Markup.button('/register', 'positive'),
    Markup.button('/delete', 'negative'),
  ],
]);

const markupMenuToChat = Markup.keyboard
([
  [
    Markup.button('/leave-chat', 'negative'),
  ]
]);

function generate(n) {
    var add = 1,
      max = 12 - add;
  
    if (n > max) {
      return generate(max) + generate(n - max);
    }
  
    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically 
    var number = Math.floor(Math.random() * (max - min + 1)) + min;
  
    return ("" + number).substring(add);
  }

const createChat = new Scene('create-chat',
    async (ctx) =>{
        await ctx.reply("Придумайте пароль для анонимной комнаты:")
        await ctx.scene.next();
    },
    async (ctx) =>{
        const passwordToRoom = ctx.message.text;
        const randomIdRoom = generate(6);
        const isCreateRoomChat = await createRoomToDatabase(passwordToRoom, ctx.message.from_id, randomIdRoom);
        console.log(isCreateRoomChat);
        await ctx.scene.leave();
    }
);

const joinChat = new Scene('join-chat',
    async (ctx) =>{
        await ctx.reply("Введите инфикатор комнаты:")
        await ctx.scene.next();
    },
    async (ctx) =>{
        const idRoom = ctx.message.text;
        const isCheckedRoomId = await tryIdRoomToDatabase(idRoom);
        if(isCheckedRoomId == true){
            ctx.session.idRoomChat = idRoom;
            await ctx.reply("Мы нашли комнату с таким инфикатором!");
            await ctx.reply("Введите пароль для подключения:");
            await ctx.scene.next();
        }
        else{
            await ctx.reply("Комнаты с таким индификатор нет!");
            await ctx.reply("Пожалуйста, попробуйте еще раз ввести индификатор комнаты:");
        }
    },
    async (ctx) =>{
        const passwordRoom = ctx.message.text;
        const isLoginedToRoomChat = await joinToRoomChat(ctx.session.idRoomChat, passwordRoom, ctx.message.from_id);

        if(isLoginedToRoomChat == true){
            await ctx.reply("Вы успешно вошли в комнату!");

            const idAdmin = await getIdAdminUser(ctx.session.idRoomChat)
            ctx.session.adminUserId = idAdmin;

            const nicknameAdmin = await getUserNicknameToId(idAdmin);

            await ctx.reply(`Можете писать сообщения для ${nicknameAdmin}[Id: ${idAdmin}]`);

            await ctx.scene.next();
        }
        else{
            await ctx.reply(`Пароль не подходит для комнаты с индификатором: ${ctx.session.idRoomChat}.`);
            await ctx.reply('Введите правильный пароль:');
        }
    },
    async (ctx) =>{
       bot.sendMessage(ctx.session.adminUserId, ctx.message.text);
    }
);

async function getIdAdminUser(roomId){
    let room = await supabase.from('chats-bot-vk').select('id, adminUserId').eq('id', roomId);
    return room.data[0].adminUserId;
}

async function getUserNicknameToId(userid){
    let room = await supabase.from('user-bot-vk').select('id, nickname').eq('id', userid);
    return room.data[0].nickname;
}


async function createRoomToDatabase(password, adminUserId, roomId){
    let room = await supabase
            .from('chats-bot-vk')
            .insert(
            [ 
                { 
                    id: roomId,
                    name: 'empty', 
                    password: password,
                    adminUserId: adminUserId,
                }
            ]);

    return room.data.length != 0;
}

async function tryIdRoomToDatabase(roomId){
    let room = await supabase.from('chats-bot-vk').select('id').eq('id', roomId);
    return room.data.length != 0;
}

async function joinToRoomChat(roomChatId, password, userId){

    let roomData = await supabase.from('chats-bot-vk').select('password').eq('id', roomChatId);
    if(roomData.data[0].password == password){
        let room = await supabase
            .from('chats-bot-vk')
            .update({ 'userId': userId })
            .match({ 'id': roomChatId })

        return true;
    }
    else{
        return false;
    }
    
}

const deleteScene = new Scene('delete', 
    async (ctx) =>{
        const isChecked = await tryUserDatabase(ctx.message.from_id);
        if(isChecked == true){
            //await ctx.reply("Вы уверены что действительно хотите удалить аккаунт из нашей базы данных?");
            await ctx.reply('Вы уверены что действительно хотите удалить аккаунт из нашей базы данных?', null, markupMenuToDelete);
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
    deleteScene,
    createChat,
    joinChat
);

bot.use(session.middleware());
bot.use(stage.middleware());

bot.command('/start', async (ctx) => {
    console.log("start");
    try {
      //await ctx.reply('Добро пожаловать! Данный бот является тестовым!');
      ctx.reply('Добро пожаловать! Это Бот, который сможет предоставить аноноимный чат для вас и ваших знакомых!>', null, markupMenuToStart);
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

bot.command('/create-chat', async (ctx) =>{
    await ctx.scene.enter('create-chat');
});

bot.command('/join-chat', async (ctx) =>{
    await ctx.scene.enter('join-chat');
});


bot.startPolling((err) => {
    if (err) {
      console.error(err);
    }
  });