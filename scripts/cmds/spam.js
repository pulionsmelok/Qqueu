module.exports = {
  config: {
    name: "spam",
    aliases: ["spm"],
    author: "SK-SIDDIK-KHAN",
    version: "1.5.0",
    countDown: 5,
    role: 2,
    usePrefix: true,
    description: {
            en: "Long emoji spam for testing"
        },
        category: "fun",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, chatId, event }) {
    try {
      const emojis = Array(30).fill("💣").join("\n");
      await api.sendMessage(emojis, chatId);
    } catch (err) {
      console.error(`[SPAM ERROR]: ${err.message}`);
      await api.sendMessage(`❌ Error: ${err.message}`, chatId).catch(() => {});
    }
  }
};