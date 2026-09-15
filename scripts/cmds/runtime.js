const startTime = Date.now();

module.exports = {
  config: {
    name: "runtme",
        aliases: ["rtime"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Check bot uptime"
        },
        category: "system",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async ({ bot, event, args, message}) => {
    try {
      const chatId = event.chat?.id;
      if (!chatId) return;
      const diff = Date.now() - startTime;
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const text = `
╭━━━━━━━━━━━━━╮
┃ ⏳ 𝐀𝐜𝐭𝐢𝐯𝐞 𝐓𝐢𝐦𝐞
┣━━━━━━━━━━━━━
┃ 📅 ${days} Day(s)
┃ ⏰ ${hours} Hour(s)
┃ ⏱️ ${minutes} Minute(s)
┃ ⌛ ${seconds} Second(s)
┣━━━━━━━━━━━━━
┃ 🤖 Status: Online ✅
╰━━━━━━━━━━━━━╯
`;
      await bot.sendMessage(chatId, text, {
        reply_to_message_id: event.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bot Owner",
                url: "https://t.me/busy1here"
              }
            ]
          ]
        }
      });
    } catch (err) {
      console.log("❌ uptime error:", err.message);
      if (event.chat?.id) {
        await bot.sendMessage(
          event.chat.id,
          "❌ Failed to get bot uptime"
        );
      }
    }
  }
};
