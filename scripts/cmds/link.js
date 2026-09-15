module.exports = {
  config: {
    name: "tglink",
        aliases: ["linktg"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Command description"
        },
        category: "utility",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({
    message,
    event,
    args,
    api
  }) {
    try {
      let userId = event?.from?.id;
      if (event?.reply_to_message?.from?.id) {
        userId = event.reply_to_message.from.id;
      }
      if (
        args &&
        args.length > 0 &&
        /^\d+$/.test(args[0])
      ) {
        userId = args[0];
      }
      if (!userId) {
        return message.reply(
          "❌ User not found."
        );
      }
      const user = await api.getChat(
        String(userId)
      );
      if (user?.username) {
        const profileUrl =
          `https://t.me/${user.username}`;
        return message.reply(profileUrl);
      }
      return message.reply(
        `❌ This user does not have a public Telegram username.\n\nUser ID: ${userId}`
      );
    } catch (error) {
      console.error(
        "link command error:",
        error.message
      );
      return message.reply(
        "❌ Telegram profile link could not be found."
      );
    }
  }
};
