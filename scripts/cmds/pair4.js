const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair4",
    aliases: ["pr4", "pairs4"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Random & Reply Pair System"
        },
        category: "love",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, event, usersData }) {
    try {
      const threadID = event.threadID || event.chat?.id;
      const senderID = event.senderID || event.from?.id;
      const messageID = event.messageID || event.message_id;
      const messageReply = event.messageReply || event.reply_to_message;

      if (!threadID) {
        return console.error("Pair Error: threadID / chatId paoa jayni!");
      }

      let targetID;
      let targetName = "";

      if (messageReply) {
        targetID = messageReply.senderID || messageReply.from?.id || messageReply.chat?.id || messageReply.from_id;
      } else {
        return api.sendMessage(
          "⚠️ Onno karo sathe pair korte hole tar message-e reply diye command din!",
          threadID,
          messageID
        );
      }

      if (!targetID) {
        targetID = messageReply.from?.id;
      }

      if (targetID === senderID) {
        return api.sendMessage("❌ Nijer sathe nije pair korte parben na!", threadID, messageID);
      }

      async function getUserName(userID, replyObj) {
        if (usersData && typeof usersData.getName === "function") {
          try {
            const name = await usersData.getName(userID);
            if (name && name !== "User" && name !== "Facebook User") return name;
          } catch (e) {}
        }

        if (replyObj) {
          if (replyObj.senderName) return replyObj.senderName;
          if (replyObj.from) {
            const f = replyObj.from.first_name || "";
            const l = replyObj.from.last_name || "";
            const full = `${f} ${l}`.trim();
            if (full) return full;
            if (replyObj.from.username) return `@${replyObj.from.username}`;
          }
          if (replyObj.chat) {
            const f = replyObj.chat.first_name || replyObj.chat.title || "";
            if (f) return f;
          }
        }

        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getChatMember === "function") {
            const member = await botInstance.getChatMember(threadID, userID);
            const user = member.user || member;
            const f = user.first_name || "";
            const l = user.last_name || "";
            const full = `${f} ${l}`.trim();
            if (full) return full;
            if (user.username) return `@${user.username}`;
          }
          if (typeof botInstance.getChat === "function") {
            const chat = await botInstance.getChat(userID);
            const f = chat.first_name || chat.title || "";
            if (f) return f;
          }
        } catch (e) {}

        return "User";
      }

      let senderName = "You";
      if (usersData && typeof usersData.getName === "function") {
        try { senderName = await usersData.getName(senderID); } catch (e) {}
      }
      if (senderName === "You" || !senderName) {
        if (event.senderName) senderName = event.senderName;
        else if (event.from) {
          const f = event.from.first_name || "";
          const l = event.from.last_name || "";
          senderName = `${f} ${l}`.trim() || event.from.username || "You";
        }
      }

      targetName = await getUserName(targetID, messageReply);

      async function getTelegramProfilePic(userId) {
        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getUserProfilePhotos === "function") {
            const photos = await botInstance.getUserProfilePhotos(userId, { limit: 1 });
            if (photos && photos.total_count > 0) {
              const fileId = photos.photos[0][0].file_id;
              const fileLink = await botInstance.getFileLink(fileId);
              return await loadImage(fileLink);
            }
          }
        } catch (err) {}
        return await loadImage("https://i.imgur.com/8BgCK2I.jpeg");
      }

      const bg = await loadImage("https://i.imgur.com/8BgCK2I.jpeg");
      const [img1, img2] = await Promise.all([
        getTelegramProfilePic(senderID),
        getTelegramProfilePic(targetID)
      ]);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0);

      const drawPic = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      const x1 = 80, y1 = 60, size1 = 145;   
      const x2 = 510, y2 = 210, size2 = 150; 

      drawPic(img1, x1, y1, size1);
      drawPic(img2, x2, y2, size2);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const pathImg = path.join(cacheDir, `pair_${senderID}_${targetID}.png`);

      await fs.writeFile(pathImg, canvas.toBuffer("image/png"));

      const stylishBody = `✨ 🎉 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 🎉 ✨\n\n💖 ━━━ [ 👩‍❤️‍👨 ] ━━━ 💖\n\n🥰 ${senderName}\n ❤️ 𝗫 ❤️\n😍 ${targetName}\n\n💖 ━━━ [ 👩‍❤️‍👨 ] ━━━ 💖\n\n🌸 𝗠𝗮𝘆 𝘁𝗵𝗶𝘀 𝗯𝗼𝗻𝗱 𝗯𝗲 𝗳𝗼𝗿𝗲𝘃𝗲𝗿 𝗯𝗲𝗮𝘂𝘁𝗶𝗳𝘂𝗹! 🦋`;

      if (typeof api.sendPhoto === "function") {
        await api.sendPhoto(threadID, pathImg, { caption: stylishBody }, messageID);
      } else {
        await api.sendMessage({
          body: stylishBody,
          attachment: fs.createReadStream(pathImg)
        }, threadID, () => {}, messageID);
      }

      if (await fs.pathExists(pathImg)) {
        await fs.unlink(pathImg);
      }

    } catch (e) {
      console.error("Pair Command Error:", e);
      api.sendMessage("❌ Kichu ekta somossa hoiche!", event.threadID || event.chat?.id, event.messageID || event.message_id);
    }
  }
};
