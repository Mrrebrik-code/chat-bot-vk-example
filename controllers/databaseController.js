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
            
    return user.data.length != 0;
}

async function tryUserDatabase(userId){
    let user = await supabase.from('user-bot-vk').select('id').eq('id', userId);

    return user.data.length != 0;
}

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
        let room = await supabase.from('chats-bot-vk').update({ 'userId': userId }).match({ 'id': roomChatId })
        return true;
    }

    return false;
}

async function deleteUserFromDatabase(userId){
    const { data, error } = await supabase.from('user-bot-vk').delete().eq('id', userId);

    return error == null;
}