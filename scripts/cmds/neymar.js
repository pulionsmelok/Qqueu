const axios = require("axios");

module.exports = {
  config: {
    name: "neymar",
    aliases: [],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Random Neymar Jr picture"
        },
        category: "fun",
        guide: {
            en: "/neymar"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async ({ bot, event, message }) => {
    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;
    if (!chatId) return;

    const links = [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Neymar_Jr_Portrait_(149008871).jpeg",
      "https://i.imgur.com/arWjsNg.jpg",
      "https://i.imgur.com/uJYvMR0.jpg",
      "https://i.imgur.com/A3MktQ4.jpg",
      "https://i.imgur.com/wV8YHHp.jpg",
      "https://i.imgur.com/14sAFjM.jpg",
      "https://i.imgur.com/EeAi2G6.jpg",
      "https://i.imgur.com/fUZbzhJ.jpg",
      "https://i.imgur.com/bUjGSCX.jpg",
      "https://i.imgur.com/4KZvLbO.jpg",
      "https://i.imgur.com/gBEAsYZ.jpg",
      "https://i.imgur.com/baKOat0.jpg",
      "https://i.imgur.com/4Z0ERpD.jpg",
      "https://i.imgur.com/h2ReDUe.jpg",
      "https://i.imgur.com/KQPalvi.jpg",
      "https://i.imgur.com/VRALDic.jpg",
      "https://i.imgur.com/Z3qGkZa.jpg",
      "https://i.imgur.com/etyPi7B.jpg",
      "https://i.imgur.com/tMxLEwl.jpg",
      "https://i.imgur.com/OwEdlZo.jpg",
      "https://i.imgur.com/UHAo39t.jpg",
      "https://i.imgur.com/aV4EVT9.jpg",
      "https://i.imgur.com/zdC8yiG.jpg",
      "https://i.imgur.com/JI7tjsr.jpg",
      "https://i.imgur.com/fFuPCrM.jpg",
      "https://i.imgur.com/XIaAXju.jpg",
      "https://i.imgur.com/yyIJwPH.jpg",
      "https://i.imgur.com/MyGcsJM.jpg",
      "https://i.imgur.com/UXjh4R1.jpg",
      "https://i.imgur.com/QGrvMZL.jpg"
    ];

    let loading = null;
    try {
      loading = await bot.sendMessage("Loading Neymar Picture... Please Wait ⏰", chatId);

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
              "╭━━━❮ ⚽ NEYMAR JR ❯━━━╮\n" +
              "├‣ 🇧🇷 Neymar Profile\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ 👑 DEV : SK SIDDIK\n" +
              "╰━━━━━━━━━━━━━━━━━━━╯"
          });
          sent = true;
          break;
        } catch (err) {
          lastError = err;
          console.log("⚠️ Neymar image failed:", err?.message || err);
        }
      }
      if (!sent) throw lastError || new Error("All image links failed");
    } catch (err) {
      console.error("❌ neymar error:", err?.message || err);
      try {
        await bot.sendMessage(chatId, "❌ Neymar image load failed, please try again!");
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
