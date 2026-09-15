module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["tinfo", "tidinfo", "threadinfo"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Show current group/chat information"
        },
        category: "info",
        guide: {
            en: "[]"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ bot, event, args, message }) {
    try {
      const chatId =
        event?.chat?.id ||
        event?.message?.chat?.id ||
        event?.threadID ||
        event?.raw?.chat?.id;

      if (!chatId) {
        return message.reply("❌ Chat ID পাওয়া যায়নি।");
      }

      let chat = {};
      try {
        chat = await bot.getChat(chatId);
      } catch (e) {
        chat = event.chat || event.message?.chat || {};
      }

      const title = chat.title || chat.first_name || chat.username || "Private Chat";
      const type = chat.type || "private";
      const id = chat.id || chatId;
      const description = chat.description || null;
      const members = chat.members_count || null;
      let invite = null;

      if (chat.username) {
        invite = "https://t.me/" + chat.username;
      } else if (chat.invite_link) {
        invite = chat.invite_link;
      }

      let text = "╭──✦ [ 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎 ]\n";
      text += "├‣ 📛 Name: " + title + "\n";
      text += "├‣ 📂 Type: " + type + "\n";
      text += "├‣ 🆔 TID: `" + id + "`\n";

      if (members) {
        text += "├‣ 👥 Members: " + members + "\n";
      }

      if (description) {
        text += "├‣ 📝 Description: " + description.slice(0, 100) + (description.length > 100 ? "..." : "") + "\n";
      }

      if (invite) {
        text += "╰‣ 🔗 Invite: " + invite + "\n";
      }

      return message.reply(text);

    } catch (err) {
      console.log("❌ threadinfo error:", err.message);

      try {
        return message.reply("❌ Group info আনতে সমস্যা হয়েছে\nError: " + err.message);
      } catch (e) {
        console.log("Reply also failed:", e.message);
      }
    }
  }
};
