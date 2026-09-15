const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "marry2",
    aliases: ["married2", "biya", "engage"], 
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Generate a propose image with avatars perfectly placed over characters’ heads."
        },
        category: "fun",
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

      let mentionedID;
      let mentionedName = "";

      if (messageReply) {
        mentionedID = messageReply.senderID || messageReply.from?.id;
        const f = messageReply.from?.first_name || "";
        const l = messageReply.from?.last_name || "";
        mentionedName = `${f} ${l}`.trim() || "User";
      } else {
        return api.sendMessage("❗ দয়া করে যাকে বিয়ে করবেন তার মেসেজে reply দিয়ে command দিন!", threadID, messageID);
      }

      if (!mentionedID) {
        return api.sendMessage("❗ Target user ID পাওয়া যায়নি!", threadID, messageID);
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

      const nameMentioned = mentionedName !== "User" ? mentionedName : await getUserName(mentionedID, messageReply);

      async function getTelegramAvatar(userID) {
        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getUserProfilePhotos === "function") {
            const photos = await botInstance.getUserProfilePhotos(userID, { limit: 1 });
            if (photos && photos.total_count > 0) {
              const fileId = photos.photos[0][0].file_id;
              const fileLink = await botInstance.getFileLink(fileId);
              return await Canvas.loadImage(fileLink);
            }
          }
        } catch (e) {}
        return await Canvas.loadImage("https://i.imgur.com/8BgCK2I.jpeg");
      }

      const [avatarImgSender, avatarImgMentioned, bg] = await Promise.all([
        getTelegramAvatar(senderID),
        getTelegramAvatar(mentionedID),
        Canvas.loadImage("https://i.postimg.cc/VvjW9DwJ/images-8.jpg")
      ]);

      const canvasWidth = 1280;
      const canvasHeight = 1280;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      const avatarSize = Math.floor(canvasWidth * 0.11);
      const girlHead = { x: 470, y: 310 }; 
      const boyHead = { x: 690, y: 200 }; 

      ctx.save();
      ctx.beginPath();
      ctx.arc(girlHead.x + avatarSize / 2, girlHead.y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImgMentioned, girlHead.x, girlHead.y, avatarSize, avatarSize);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(boyHead.x + avatarSize / 2, boyHead.y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImgSender, boyHead.x, boyHead.y, avatarSize, avatarSize);
      ctx.restore();

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);
      const imgPath = path.join(tmpDir, `${senderID}_${mentionedID}_marry.png`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      const text = senderID === mentionedID
        ? "নিজেকে নিজেকে বিয়ে করবে ? 😂💔"
        : `💍 ${senderName} এর বিয়ে ${nameMentioned}- এর সাথে 🥰🤍`;

      if (typeof api.sendPhoto === "function") {
        await api.sendPhoto(threadID, imgPath, { caption: text }, messageID);
      } else {
        await api.sendMessage({
          body: text,
          attachment: fs.createReadStream(imgPath)
        }, threadID, () => {}, messageID);
      }

      if (await fs.pathExists(imgPath)) {
        await fs.unlink(imgPath);
      }

      canvas.width = canvas.height = 0;
      global.gc && global.gc();

    } catch (err) {
      console.error("❌ Error in marry command:", err);
      api.sendMessage(`⚠️ কোনো সমস্যা হয়েছে!\n${err.message}`, event.threadID || event.chat?.id, event.messageID || event.message_id);
    }
  }
};
