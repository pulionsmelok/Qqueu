module.exports = {
  config: {
    name: "setgcpic",
        aliases: ["changegcpic", "gcpic", "gcphoto"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 1,
        usePrefix: true,
    description: {
            en: "Change group photo with confirmation"
        },
        category: "admin",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ event, api, args, message, chatId, userId, ctx }) {
    if (!message.isGroup) {
      return message.reply('❌ This command can only be used in groups.');
    }
    const adminList = await api.getChatAdministrators(chatId);
    const isAdmin = adminList.some(admin => String(admin.user.id) === String(userId));
    const isBotAdmin = (global.GoatBot.config.adminBot || global.GoatBot.config.adminUID || []).map(String).includes(String(userId));
    if (!isAdmin && !isBotAdmin) {
      return message.reply('⚠️ Only group admins can use this command.');
    }
    const botInfo = global.botInfo || await api.getMe();
    const botMember = adminList.find(admin => String(admin.user.id) === String(botInfo.id));
    const botIsAdmin = !!botMember;
    if (!botIsAdmin) {
      return message.reply('❌ Bot needs admin rights to change group photo.');
    }
    const msg = event.reply_to_message || event;
    let photoFileId = null;
    if (msg.photo && msg.photo.length > 0) {
      photoFileId = msg.photo[msg.photo.length - 1].file_id;
    } else if (event.reply_to_message?.photo && event.reply_to_message.photo.length > 0) {
      photoFileId = event.reply_to_message.photo[event.reply_to_message.photo.length - 1].file_id;
    }
    if (!photoFileId) {
      return message.reply(
        `❌ Please send or reply to a photo to set as group picture.\n\n` +
        `💡 Usage:\n` +
        `1. Reply to a photo with ${global.GoatBot.config.prefix}setgcpic\n` +
        `2. Send ${global.GoatBot.config.prefix}setgcpic with a photo`
      );
    }
    const chat = await api.getChat(chatId);
    const confirmText = `🖼️ Change Group Photo?\n\n` +
      `📂 Group: ${chat.title}\n\n` +
      `⚠️ This will change the group photo for all members.\n` +
      `Click the button below to confirm.`;
    const keyboard = message.Markup.inlineKeyboard([
      [
        message.Markup.button.callback('✅ Confirm', `confirm_gcpic_${chatId}`),
        message.Markup.button.callback('❌ Cancel', `cancel_gcpic_${chatId}`)
      ]
    ]);
    global.onCallback.set(`confirm_gcpic_${chatId}`, {
      commandName: 'setgcpic',
      photoFileId: photoFileId,
      userId: userId,
      chatId: chatId
    });
    global.onCallback.set(`cancel_gcpic_${chatId}`, {
      commandName: 'setgcpic',
      userId: userId,
      chatId: chatId
    });
    return message.reply(confirmText, keyboard);
  },
  onCallback: async function ({ event, api, message, ctx, bot}) {
    const data = String(event.data || event.callbackData || event.callback_query?.data || '').trim();
    const userId = String(event.from?.id || event.userID || event.senderID || '');
    const chatIdMatch = data.match(/_(-?\d+)$/);
    if (!chatIdMatch) return;
    const chatId = chatIdMatch[1];
    const callbackData = global.onCallback.get(data);
    if (!callbackData) {
      return ctx.answerCbQuery('❌ This action has expired!', { show_alert: true });
    }
    if (String(callbackData.userId) !== String(userId)) {
      return ctx.answerCbQuery('⚠️ Only the person who initiated this can confirm!', { show_alert: true });
    }
    if (data.startsWith('confirm_gcpic_')) {
      try {
        const adminList = await api.getChatAdministrators(chatId);
        const botInfo = global.botInfo || await api.getMe();
        const botMember = adminList.find(admin => String(admin.user.id) === String(botInfo.id));
        if (!botMember) {
          global.onCallback.delete(data);
          await ctx.editMessageText('❌ Bot lost admin rights! Cannot change group photo.');
          return ctx.answerCbQuery('❌ Bot needs admin rights!', { show_alert: true });
        }
        const photoFileId = callbackData.photoFileId;
        await api.setChatPhoto(chatId, photoFileId);
        global.onCallback.delete(data);
        global.onCallback.delete(`cancel_gcpic_${chatId}`);
        await ctx.editMessageText(
          `✅ Group Photo Changed!\n\n` +
          `📂 Group: ${(await api.getChat(chatId)).title}\n` +
          `👤 Changed by: ${event.from.first_name}`
        );
        await ctx.answerCbQuery('✅ Group photo changed successfully!');
      } catch (error) {
        global.onCallback.delete(data);
        await ctx.editMessageText(`❌ Error changing group photo: ${error.message}`);
        await ctx.answerCbQuery('❌ Failed to change photo!', { show_alert: true });
      }
    }
    if (data.startsWith('cancel_gcpic_')) {
      global.onCallback.delete(`confirm_gcpic_${chatId}`);
      global.onCallback.delete(data);
      await ctx.editMessageText('❌ Group photo change cancelled.');
      await ctx.answerCbQuery('❌ Cancelled!');
    }
  }
};
