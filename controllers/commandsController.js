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