const axios = require("axios");

module.exports = {
  config: {
    name: "messi",
    aliases: [],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Random Lionel Messi picture"
        },
        category: "fun",
        guide: {
            en: "/messi"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async ({ bot, event, message }) => {
    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;
    if (!chatId) return;

    const links = [
      "https://i.imgur.com/gC6I.jpg",
      "https://i.imgur.com/wxxHuAG.jpg",
      "https://i.imgur.com/GwOCq59.jpg",
      "https://i.imgur.com/oM0jc4i.jpg",
      "https://i.imgur.com/dJ0OUef.jpg",
      "https://i.imgur.com/iurRGPT.jpg",
      "https://i.imgur.com/jogjche.jpg",
      "https://i.imgur.com/TiyhKjG.jpg",
      "https://i.imgur.com/AwlBM23.jpg",
      "https://i.imgur.com/9OLSXZD.jpg",
      "https://i.imgur.com/itscmiy.jpg",
      "https://i.imgur.com/FsnCelU.jpg",
      "https://i.imgur.com/c7BCwDF.jpg",
      "https://i.imgur.com/3cnR6xh.jpg",
      "https://i.imgur.com/TZqepnU.jpg",
      "https://i.imgur.com/kYxEPrD.jpg",
      "https://i.imgur.com/9ZjD5nX.jpg",
      "https://i.imgur.com/YWyI4hP.jpg"
    ];

    let loading = null;
    try {
      loading = await bot.sendMessage("Loading Messi Picture... Please Wait ⏰", chatId);

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
              "╭━━━❮ ⚽ LIONEL MESSI ❯━━━╮\n" +
              "├‣ 🇦🇷 Messi Profile\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ 👑 DEV : SK SIDDIK\n" +
              "╰━━━━━━━━━━━━━━━━━━━╯"
          });
          sent = true;
          break;
        } catch (err) {
          lastError = err;
          console.log("⚠️ Messi image failed:", err?.message || err);
        }
      }
      if (!sent) throw lastError || new Error("All image links failed");
    } catch (err) {
      console.error("❌ messi error:", err?.message || err);
      try {
        await bot.sendMessage(chatId, "❌ Messi image load failed, please try again!");
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
