const axios = require("axios");

module.exports = {
  config: {
    name: "cr7",
    aliases: ["ronaldo"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Random Cristiano Ronaldo picture"
        },
        category: "fun",
        guide: {
            en: "/cr7"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async ({ bot, event, message }) => {
    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;
    if (!chatId) return;

    const links = [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cristiano_Ronaldo.jpg",
      "https://i.imgur.com/gwAuLMT.jpg",
      "https://i.imgur.com/MuuhaJ4.jpg",
      "https://i.imgur.com/6t0R8fs.jpg",
      "https://i.imgur.com/7RTC4W5.jpg",
      "https://i.imgur.com/VTi2dTP.jpg",
      "https://i.imgur.com/gdXJaK9.jpg",
      "https://i.imgur.com/VqZp7IU.jpg",
      "https://i.imgur.com/9pio8Lb.jpg",
      "https://i.imgur.com/iw714Ym.jpg",
      "https://i.imgur.com/zFbcrjs.jpg",
      "https://i.imgur.com/e0td0K9.jpg",
      "https://i.imgur.com/gsJWOmA.jpg",
      "https://i.imgur.com/lU8CaT0.jpg",
      "https://i.imgur.com/mmZXEYl.jpg",
      "https://i.imgur.com/d2Ot9pW.jpg",
      "https://i.imgur.com/iJ1ZGwZ.jpg",
      "https://i.imgur.com/isqQhNQ.jpg",
      "https://i.imgur.com/GoKEy4g.jpg",
      "https://i.imgur.com/TjxTUsl.jpg",
      "https://i.imgur.com/VwPPL03.jpg",
      "https://i.imgur.com/45zAhI7.jpg",
      "https://i.imgur.com/n3agkNi.jpg",
      "https://i.imgur.com/F2mynhI.jpg",
      "https://i.imgur.com/XekHaDO.jpg"
    ];

    let loading = null;
    try {
      loading = await bot.sendMessage("Loading CR7 Picture... Please Wait ⏰", chatId);

      const shuffledLinks = [...links].sort(() => Math.random() - 0.5);
      let sent = false;
      let lastError = null;

      for (const imgURL of shuffledLinks.slice(0, 3)) {
        try {
          const res = await axios({
            url: imgURL,
            method: "GET",
            responseType: "stream",
            maxContentLength: 10 * 1024 * 1024,
            headers: { "User-Agent": "Mozilla/5.0" },
            validateStatus: status => status >= 200 && status < 300
          });
          if (!res?.data) throw new Error("Invalid image response");

          await bot.sendPhoto(chatId, res.data, {
            caption:
              "╭━━━❮ ⚽ CRISTIANO RONALDO ❯━━━╮\n" +
              "├‣ 🇵🇹 CR7 Profile\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ 👑 DEV : SK SIDDIK\n" +
              "╰━━━━━━━━━━━━━━━━━━━━━━╯"
          });
          sent = true;
          break;
        } catch (err) {
          lastError = err;
          console.log("⚠️ CR7 image failed:", err?.message || err);
        }
      }
      if (!sent) throw lastError || new Error("All image links failed");
    } catch (err) {
      console.error("❌ cr7 error:", err?.message || err);
      try {
        await bot.sendMessage(chatId, "❌ CR7 image load failed, please try again!");
      } catch (sendErr) {}
    } finally {
      if (loading?.messageID || loading?.message_id) {
        try {
          await bot.deleteMessage(chatId, loading.messageID || loading.message_id);
        } catch {}
      }
    }
  }
};
