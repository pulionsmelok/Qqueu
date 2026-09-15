const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'pair3',
    aliases: ['pr3', 'pair 3'],
    version: "1.5.0",
    author: 'SK-SIDDIK-KHAN',
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Pair With your Love via reply or random"
        },
        category: 'media',
        guide: {
            en: '{p}pair4 or reply to someone'
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

      let targetUserID;
      let targetUserName = "";

      if (messageReply) {
        targetUserID = messageReply.senderID || messageReply.from?.id || messageReply.chat?.id;
      } else {
        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getChatAdministrators === "function") {
            const admins = await botInstance.getChatAdministrators(threadID);
            const otherAdmins = admins.map(a => a.user.id).filter(id => id !== senderID);
            if (otherAdmins.length > 0) {
              targetUserID = otherAdmins[Math.floor(Math.random() * otherAdmins.length)];
            }
          }
        } catch (e) {}

        if (!targetUserID) {
          return api.sendMessage("⚠️ Group-e random pair korar jonno kowke pawa jayni! Karoner message-e reply diye command din.", threadID, messageID);
        }
      }

      if (targetUserID === senderID) {
        return api.sendMessage("❌ Nijer sathe nije pair korte parben na!", threadID, messageID);
      }

      async function getUserName(userID, replyObj) {
        if (usersData && typeof usersData.getName === "function") {
          try {
            const name = await usersData.getName(userID);
            if (name && name !== "User") return name;
          } catch (e) {}
        }
        if (replyObj && replyObj.from) {
          const f = replyObj.from.first_name || "";
          const l = replyObj.from.last_name || "";
          const full = `${f} ${l}`.trim();
          if (full) return full;
        }
        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getChatMember === "function") {
            const member = await botInstance.getChatMember(threadID, userID);
            const user = member.user || member;
            const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
            if (full) return full;
          }
        } catch (e) {}
        return "User";
      }

      let senderName = "You";
      if (usersData && typeof usersData.getName === "function") {
        try { senderName = await usersData.getName(senderID); } catch (e) {}
      }
      if (senderName === "You" || !senderName) {
        if (event.from) {
          senderName = `${event.from.first_name || ""} ${event.from.last_name || ""}`.trim() || "You";
        }
      }

      targetUserName = await getUserName(targetUserID, messageReply);

      const getTelegramAvatar = async (uid) => {
        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getUserProfilePhotos === "function") {
            const photos = await botInstance.getUserProfilePhotos(uid, { limit: 1 });
            if (photos && photos.total_count > 0) {
              const fileId = photos.photos[0][0].file_id;
              const fileLink = await botInstance.getFileLink(fileId);
              return await loadImage(fileLink);
            }
          }
        } catch (err) {}
        return await loadImage("https://i.imgur.com/8BgCK2I.jpeg");
      };

      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const backgroundUrls = [
        "https://files.catbox.moe/jtv65q.png",
        "https://files.catbox.moe/pzya3s.png",
        "https://files.catbox.moe/e08jbf.png"
      ];
      const randomBg = backgroundUrls[Math.floor(Math.random() * backgroundUrls.length)];
      
      const [background, sIdImage, pairPersonImage] = await Promise.all([
        loadImage(randomBg),
        getTelegramAvatar(senderID),
        getTelegramAvatar(targetUserID)
      ]);

      ctx.drawImage(background, 0, 0, width, height);

      function drawCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(ctx, sIdImage, 385, 40, 170);
      drawCircle(ctx, pairPersonImage, width - 213, 190, 170);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const outputPath = path.join(cacheDir, `pair_${senderID}_${targetUserID}.png`);

      await fs.writeFile(outputPath, canvas.toBuffer("image/png"));

      const lovePercent = Math.floor(Math.random() * 101);
      let loveMessage;
      if (lovePercent <= 20) {
        loveMessage = "💔 𝘖𝘩 𝘯𝘰! 𝘕𝘰𝘵 𝘢 𝘨𝘰𝘰𝘥 𝘮𝘢𝘵𝘤𝘩...";
      } else if (lovePercent <= 40) {
        loveMessage = "🤔 𝘔𝘢𝘺𝘣𝘦 𝘯𝘦𝘦𝘥 𝘮𝘰𝘳𝘦 𝘵𝘪𝘮𝘦 𝘵𝘰𝘨𝘦𝘵𝘩𝘦𝘳?";
      } else if (lovePercent <= 60) {
        loveMessage = "✨ 𝘎𝘰𝘰𝘥 𝘱𝘰𝘵𝘦𝘯𝘵𝘪𝘢𝘭 𝘩𝘦𝘳𝘦!";
      } else if (lovePercent <= 80) {
        loveMessage = "💖 𝘈𝘸𝘸, 𝘵𝘩𝘢𝘵'𝘴 𝘴𝘰 𝘴𝘸𝘦𝘦𝘵!";
      } else {
        loveMessage = "😍 𝘗𝘌𝘙𝘍𝘌𝘊𝘛 𝘔𝘈𝘛𝘊𝘏! 𝘚𝘰𝘶𝘭𝘮𝘢𝘵𝘦𝘴!";
      }

      const messageBody = `💘 𝗖𝗼𝘂𝗽𝗹𝗲 𝗔𝗹𝗲𝗿𝘁 💘\n\n🖤 𝘗𝘢𝘪𝘳:\n• ${senderName}\n• ${targetUserName}\n\n💞 𝘓𝘰𝘷𝘦 𝘔𝘦𝘵𝘦𝘳: ${lovePercent}%\n\n${loveMessage}\n\n🌸 𝘏𝘰𝘱𝘦 𝘺𝘰𝘶 𝘵𝘸𝘰 𝘩𝘢𝘷𝘦 𝘣𝘦𝘢𝘶𝘵𝘪𝘧𝘶𝘭 𝘮𝘰𝘮𝘦𝘯𝘵𝘴!`;

      if (typeof api.sendPhoto === "function") {
        await api.sendPhoto(threadID, outputPath, { caption: messageBody }, messageID);
      } else {
        await api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(outputPath)
        }, threadID, () => {}, messageID);
      }

      if (await fs.pathExists(outputPath)) {
        await fs.unlink(outputPath);
      }

    } catch (error) {
      console.error("Pair4 Error:", error);
      api.sendMessage("❌ An error occurred while trying to find a match.\n" + error.message, event.threadID || event.chat?.id, event.messageID || event.message_id);
    }
  }
};
