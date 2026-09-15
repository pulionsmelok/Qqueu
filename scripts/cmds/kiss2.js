const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "kiss2",
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Kiss someone using reply or UID"
        },
        category: "love",
        guide: {
            en: "{p}{n} | Reply to a message | {p}{n} [uid]"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const threadID = event.threadID || event.chat?.id;
      const senderID = event.senderID || event.from?.id;
      const messageID = event.messageID || event.message_id;
      const messageReply = event.messageReply || event.reply_to_message;

      let mentionID;
      if (messageReply) {
        mentionID = messageReply.senderID || messageReply.from?.id || messageReply.chat?.id;
      } else if (args[0]) {
        mentionID = args[0];
      }

      if (!mentionID) {
        return api.sendMessage("Please reply to a message or provide a UID! 🌧️", threadID, messageID);
      }

      if (mentionID === senderID) {
        return api.sendMessage("You cannot kiss yourself! 😂", threadID, messageID);
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

      let senderName = "You";
      if (usersData && typeof usersData.getName === "function") {
        try { senderName = await usersData.getName(senderID); } catch (e) {}
      }
      if (senderName === "You" || !senderName) {
        if (event.from) {
          senderName = `${event.from.first_name || ""} ${event.from.last_name || ""}`.trim() || "You";
        }
      }

      const mentionName = await getUserName(mentionID, messageReply);

      const backgroundUrl = "https://i.ibb.co/jjhvv0j/74e00c6d62a7.jpg";

      const [bgImg, avatarSender, avatarMention] = await Promise.all([
        loadImage(backgroundUrl),
        getTelegramAvatar(senderID),
        getTelegramAvatar(mentionID)
      ]);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const senderPos = { x: 240, y: 190, r: 40 };
      const mentionPos = { x: 340, y: 250, r: 40 };

      ctx.save();
      ctx.beginPath();
      ctx.arc(senderPos.x, senderPos.y, senderPos.r, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.drawImage(avatarSender, senderPos.x - senderPos.r, senderPos.y - senderPos.r, senderPos.r * 2, senderPos.r * 2);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(mentionPos.x, mentionPos.y, mentionPos.r, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.drawImage(avatarMention, mentionPos.x - mentionPos.r, mentionPos.y - mentionPos.r, mentionPos.r * 2, mentionPos.r * 2);
      ctx.restore();

      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const cachePath = path.join(cacheDir, `kiss_${Date.now()}.png`);
      await fs.writeFile(cachePath, canvas.toBuffer());

      const bodyText = `${senderName} kissed ${mentionName} 💋`;

      if (typeof api.sendPhoto === "function") {
        await api.sendPhoto(threadID, cachePath, { caption: bodyText }, messageID);
      } else {
        await api.sendMessage({
          body: bodyText,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {}, messageID);
      }

      if (await fs.pathExists(cachePath)) {
        await fs.unlink(cachePath);
      }

    } catch (error) {
      console.error("An error occurred in kiss2 command:", error);
      api.sendMessage("An error occurred while processing the image.", event.threadID || event.chat?.id, event.messageID || event.message_id);
    }
  }
};
