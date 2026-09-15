const axios = require("axios");

module.exports = {
  config: {
    name: "gojol",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Command description"
        },
        category: "media",
        guide: {
            en: "/gojol"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async ({ event, bot, message, args }) => {
    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;
    if (!chatId) return;
    try {
      const loading = await bot.sendMessage(
        "Loading Islamic Gojol... Please Wait ⏰",
        chatId
      );
      const links = [
        "https://drive.google.com/uc?id=1xjyq3BrlW3bGrp8y7eedQSuddCbdvLMN",
        "https://drive.google.com/uc?id=1CCQqJVqvFsgyAd4ZjZB0BJ3lGN4Kc2l2",
        "https://drive.google.com/uc?id=1xnht0PdBt9DnLGzW7GmJUTsTIJnxxByo",
        "https://drive.google.com/uc?id=1CDCa4AlqErr1b7JRNWL62AP0WtdjlSOE",
        "https://drive.google.com/uc?id=1yK0A3lyIJoPRp6g3UjNrC31n0yLfc1Ht",
        "https://drive.google.com/uc?id=1ySwrEG6xVqPdY5BcBP8I3YFCUOX4jV9e",
        "https://drive.google.com/uc?id=1CESeRi5Ue4HR6GSDfYJrREGGcsvYJvAB"
      ];
      const audioURL =
        links[Math.floor(Math.random() * links.length)];
      const response = await axios({
        method: "GET",
        url: audioURL,
        responseType: "arraybuffer",
        maxContentLength: 50 * 1024 * 1024,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });
      await bot.sendAudio(chatId, Buffer.from(response.data), {
        caption:
          "╭━━━❮ 🎵 ISLAMIC GOJOL ❯━━━╮\n" +
          "├‣ 🕌 Islamic Gojol\n" +
          "├‣ 👑 DEV : SK SIDDIK\n" +
          "╰━━━━━━━━━━━━━━━╯"
      });
      try {
        await bot.deleteMessage(
          chatId,
          loading.message_id
        );
      } catch {}
    } catch (err) {
      console.error(
        "❌ gojol error:",
        err.message
      );
      try {
        await bot.sendMessage(
          `❌ Failed to load audio!\n${err.message}`,
          chatId
        );
      } catch {}
    }
  }
};
