const fs=require("fs-extra");
const path=require("path");
const JSON_PATH=path.join(__dirname,"Siddik","gclock.json");
const LOCK_PERMISSIONS={
  can_send_messages:false,
  can_send_audios:false,
  can_send_documents:false,
  can_send_photos:false,
  can_send_videos:false,
  can_send_video_notes:false,
  can_send_voice_notes:false,
  can_send_polls:false,
  can_send_other_messages:false,
  can_add_web_page_previews:false,
  can_change_info:false,
  can_invite_users:true,
  can_pin_messages:false,
  can_manage_topics:false
};
const OPEN_PERMISSIONS={
  can_send_messages:true,
  can_send_audios:true,
  can_send_documents:true,
  can_send_photos:true,
  can_send_videos:true,
  can_send_video_notes:true,
  can_send_voice_notes:true,
  can_send_polls:true,
  can_send_other_messages:true,
  can_add_web_page_previews:true,
  can_change_info:false,
  can_invite_users:true,
  can_pin_messages:false,
  can_manage_topics:false
};

function loadData(){
  try{
    if(!fs.existsSync(JSON_PATH))return{};
    return JSON.parse(fs.readFileSync(JSON_PATH,"utf8")||"{}");
  }catch{
    return{};
  }
}

function saveData(data){
  fs.ensureDirSync(path.dirname(JSON_PATH));
  fs.writeFileSync(JSON_PATH,JSON.stringify(data,null,2));
}

async function setChatPermissions(api,chatId,permissions){
  return api.call("setChatPermissions",{
    chat_id:String(chatId),
    permissions:JSON.stringify(permissions),
    use_independent_chat_permissions:true
  });
}

async function restrictUser(api,chatId,userId){
  return api.restrictChatMember(chatId,userId,{
    can_send_messages:false,
    can_send_audios:false,
    can_send_documents:false,
    can_send_photos:false,
    can_send_videos:false,
    can_send_video_notes:false,
    can_send_voice_notes:false,
    can_send_polls:false,
    can_send_other_messages:false,
    can_add_web_page_previews:false
  });
}

async function isAdmin(api,chatId,userId){
  try{
    const admins=await api.getChatAdministrators(chatId);
    return admins.some(x=>String(x.user?.id)===String(userId));
  }catch{
    return false;
  }
}

function getUserIdFromEvent(event){
  return String(
    event.senderID||
    event.from?.id||
    event.sender?.id||
    event.user?.id||
    ""
  );
}

function getMessageId(event){
  return Number(
    event.messageID||
    event.message_id||
    event.message?.message_id||
    0
  );
}

module.exports={
  config:{
    name:"gclock",
    aliases:["grouplock","lockgc"],
    version:"1.5.0",
    author:"SK-SIDDIK-KHAN",
    countDown:3,
    role:{
      onStart:1,
      onChat:0
    },
    usePrefix:true,
    description: {
            en: "Lock and unlock group chat"
        },
        category: "group",
        guide: {
            en: "{pn} on\n"+
        "{pn} off\n"+
        "{pn} status"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart:async function({event,args,message,api}){
    const chatId=String(
      event.threadID||
      event.chat?.id||
      ""
    );
    const action=String(
      args?.[0]||
      ""
    ).toLowerCase();
    if(!chatId)
      return message.reply(
        "┌────────────⭓\n"+
        "│ ❌ 𝐆𝐂𝐋𝐎𝐂𝐊 𝐄𝐑𝐑𝐎𝐑\n"+
        "├────────────\n"+
        "│ └‣ Group ID not found.\n"+
        "└────────────⭓"
      );
    let chat;
    try{
      chat=await api.getChat(chatId);
    }catch(err){
      return message.reply(
        "┌────────────⭓\n"+
        "│ ❌ 𝐆𝐂𝐋𝐎𝐂𝐊 𝐄𝐑𝐑𝐎𝐑\n"+
        "├────────────\n"+
        "│ ├‣ Cannot access this group.\n"+
        `│ └‣ ⚠️ ${err?.message||"Unknown error"}\n`+
        "└────────────⭓"
      );
    }
    if(!["group","supergroup"].includes(chat?.type)){
      return message.reply(
        "┌────────────⭓\n"+
        "│ ❌ 𝐆𝐑𝐎𝐔𝐏 𝐎𝐍𝐋𝐘\n"+
        "├────────────\n"+
        "│ └‣ This command only works in groups.\n"+
        "└────────────⭓"
      );
    }
    let admins;
    try{
      admins=await api.getChatAdministrators(chatId);
    }catch{
      return message.reply(
        "┌────────────⭓\n"+
        "│ ❌ 𝐆𝐂𝐋𝐎𝐂𝐊 𝐄𝐑𝐑𝐎𝐑\n"+
        "├────────────\n"+
        "│ └‣ Cannot get group administrators.\n"+
        "└────────────⭓"
      );
    }
    const botId=String(
      api.getCurrentUserID?.()||
      ""
    );
    const botAdmin=admins.find(
      x=>String(x.user?.id)===botId
    );
    if(!botAdmin){
      return message.reply(
        "┌────────────⭓\n"+
        "│ ❌ 𝐁𝐎𝐓 𝐈𝐒 𝐍𝐎𝐓 𝐀𝐃𝐌𝐈𝐍\n"+
        "├────────────\n"+
        "│ ├‣ 🤖 Make the bot an administrator.\n"+
        "│ └‣ 🔐 Give the bot required permissions.\n"+
        "└────────────⭓"
      );
    }
    if(
      botAdmin.status!=="creator"&&
      botAdmin.can_restrict_members!==true
    ){
      return message.reply(
        "┌────────────⭓\n"+
        "│ ⚠️ 𝐏𝐄𝐑𝐌𝐈𝐒𝐒𝐈𝐎𝐍 𝐌𝐈𝐒𝐒𝐈𝐍𝐆\n"+
        "├────────────\n"+
        "│ ├‣ 🔐 Restrict Members\n"+
        "│ └‣ Give this permission to the bot.\n"+
        "└────────────⭓"
      );
    }
    const data=loadData();
    if(action==="on"||action==="lock"){
      if(data[chatId]?.locked){
        return message.reply(
          "┌────────────⭓\n"+
          "│ 🔒 𝐆𝐑𝐎𝐔𝐏 𝐀𝐋𝐑𝐄𝐀𝐃𝐘 𝐋𝐎𝐂𝐊𝐄𝐃\n"+
          "├────────────\n"+
          "│ └‣ Group is already locked.\n"+
          "└────────────⭓"
        );
      }
      try{
        await setChatPermissions(
          api,
          chatId,
          LOCK_PERMISSIONS
        );
        data[chatId]={
          locked:true,
          lockedAt:new Date().toISOString()
        };
        saveData(data);
        return message.reply(
          "┌────────────⭓\n"+
          "│ 🔒 𝐆𝐑𝐎𝐔𝐏 𝐋𝐎𝐂𝐊𝐄𝐃\n"+
          "├────────────\n"+
          "│ ├‣ 👤 Members cannot send msg\n"+
          "│ ├‣ 🛡️ Admins can still talk.\n"+
          "│ └‣ 🤖 Bot can still use commands.\n"+
          "└────────────⭓"
        );
      }catch(err){
        return message.reply(
          "┌────────────⭓\n"+
          "│ ❌ 𝐆𝐂𝐋𝐎𝐂𝐊 𝐅𝐀𝐈𝐋𝐄𝐃\n"+
          "├────────────\n"+
          `│ └‣ ⚠️ ${err?.message||"Unknown error"}\n`+
          "└────────────⭓"
        );
      }
    }
    if(action==="off"||action==="unlock"){
      if(!data[chatId]?.locked){
        try{
          await setChatPermissions(
            api,
            chatId,
            OPEN_PERMISSIONS
          );
        }catch{}
        return message.reply(
          "┌────────────⭓\n"+
          "│ 🔓 𝐆𝐑𝐎𝐔𝐏 𝐀𝐋𝐑𝐄𝐀𝐃𝐘 𝐔𝐍𝐋𝐎𝐂𝐊𝐄𝐃\n"+
          "├────────────\n"+
          "│ └‣ Group is already unlocked.\n"+
          "└────────────⭓"
        );
      }
      try{
        await setChatPermissions(
          api,
          chatId,
          OPEN_PERMISSIONS
        );
        delete data[chatId];
        saveData(data);
        return message.reply(
          "┌────────────⭓\n"+
          "│ 🔓 𝐆𝐑𝐎𝐔𝐏 𝐔𝐍𝐋𝐎𝐂𝐊𝐄𝐃\n"+
          "├────────────\n"+
          "│ ├‣ 👥 Members can talk again.\n"+
          "│ └‣ 🛡️ Admins can talk.\n"+
          "└────────────⭓"
        );
      }catch(err){
        return message.reply(
          "┌────────────⭓\n"+
          "│ ❌ 𝐔𝐍𝐋𝐎𝐂𝐊 𝐅𝐀𝐈𝐋𝐄𝐃\n"+
          "├────────────\n"+
          `│ └‣ ⚠️ ${err?.message||"Unknown error"}\n`+
          "└────────────⭓"
        );
      }
    }
    if(action==="status"){
      const locked=!!data[chatId]?.locked;
      return message.reply(
        "┌────────────⭓\n"+
        "│ 🔐 𝐆𝐂𝐋𝐎𝐂𝐊 𝐒𝐓𝐀𝐓𝐔𝐒\n"+
        "├────────────\n"+
        `│ ├‣ 📌 Status: ${locked?"🔒 ON":"🔓 OFF"}\n`+
        `│ ├‣ 👤 Members: ${locked?"🚫 BLOCKED":"✅ ALLOWED"}\n`+
        "│ └‣ 🛡️ Admins: ✅ ALLOWED\n"+
        "└────────────⭓"
      );
    }
    return message.reply(
      "┌────────────⭓\n"+
      "│ 🔐 𝐆𝐂𝐋𝐎𝐂𝐊 𝐔𝐒𝐀𝐆𝐄\n"+
      "├────────────\n"+
      "│ ├‣ 🔒 gclock on\n"+
      "│ ├‣ 🔓 gclock off\n"+
      "│ └‣ 📊 gclock status\n"+
      "└────────────⭓"
    );
  },
  onChat:async function({event,api}){
    const chatId=String(
      event.threadID||
      event.chat?.id||
      ""
    );
    if(!chatId)return;
    const data=loadData();
    if(!data[chatId]?.locked)return;
    const userId=getUserIdFromEvent(event);
    if(!userId)return;
    const admin=await isAdmin(
      api,
      chatId,
      userId
    );
    if(admin)return;
    try{
      await restrictUser(
        api,
        chatId,
        userId
      );
    }catch{}
    const messageId=getMessageId(event);
    if(messageId){
      try{
        await api.deleteMessage(
          chatId,
          messageId
        );
      }catch{}
    }
  }
};
