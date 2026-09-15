module.exports = {
  config: {
    name: "tag",
    aliases: [],
    author: "SK-SIDDIK-KHAN",
    version: "1.5.0",
    countDown: 3,
    role: 0,
    
    
    usePrefix: true,
    description: {
            en: "Tag (mention) a user by reply or name in group/supergroup"
        },
        category: "utility",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async ({ event, message, args }) => {
    try {
      if (event.chat.type === "private") {
        return await message.reply(
          "❌ This command can only be used in groups or supergroups."
        );
      }

      let mentionText;
      let tagText;

      if (event.reply_to_message && event.reply_to_message.from) {
        const user = event.reply_to_message.from;
        const fullName =
          user.first_name + (user.last_name ? " " + user.last_name : "");

        mentionText = `[${fullName}](tg://user?id=${user.id})`;
        tagText = args.length ? args.join(" ") : "👋 You’ve been tagged!";
      } else if (args.length > 0) {
        const name = args.join(" ");
        mentionText = name;
        tagText = "👋 " + name;
      } else {
        return await message.reply(
          "❌ Please reply to someone or provide a name.\nExample:\n`/tag @user` or reply `/tag`"
        );
      }

      await message.reply(`${mentionText}\n${tagText}`, {
        parse_mode: "Markdown"
      });
    } catch (error) {
      console.error("Error in tag command:", error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};