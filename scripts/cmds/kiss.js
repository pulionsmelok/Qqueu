const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "kiss",
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "A fun command to create a kiss picture"
        },
        category: "fun",
        guide: {
            en: "{pn} (reply to user)"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ event, api, usersData }) {
    try {
      const threadID = event.threadID || event.chat?.id;
      const senderID = event.senderID || event.from?.id;
      const messageID = event.messageID || event.message_id;
      const messageReply = event.messageReply || event.reply_to_message;

      let targetID;
      if (messageReply) {
        targetID = messageReply.senderID || messageReply.from?.id;
      } else {
        return api.sendMessage("কাকে চুমু দিবে? তার মেসেজে রিপ্লাই দাও!", threadID, messageID);
      }

      if (!targetID) {
        return api.sendMessage("Target user ID পাওয়া যায়নি!", threadID, messageID);
      }

      if (targetID === senderID) {
        return api.sendMessage("নিজের সাথে নিজে kiss করতে পারবে না! 😂", threadID, messageID);
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
        return "Friend";
      }

      const bg = await loadImage("https://i.imgur.com/VniSzhD.png"); 
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0);

      const [targetAvatar, senderAvatar] = await Promise.all([
        getTelegramAvatar(targetID),
        getTelegramAvatar(senderID)
      ]);

      ctx.save();
      ctx.beginPath();
      ctx.arc(340, 120, 60, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(targetAvatar, 280, 60, 120, 120);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(500, 70, 60, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(senderAvatar, 440, 10, 120, 120);
      ctx.restore();

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);
      const output = path.join(tmpDir, `kiss_${senderID}_${targetID}.png`);
      await fs.writeFile(output, canvas.toBuffer("image/png"));

      let senderName = "You";
      if (usersData && typeof usersData.getName === "function") {
        try { senderName = await usersData.getName(senderID); } catch (e) {}
      }
      if (senderName === "You" || !senderName) {
        if (event.from) {
          senderName = `${event.from.first_name || ""} ${event.from.last_name || ""}`.trim() || "You";
        }
      }

      const targetName = await getUserName(targetID, messageReply);
      const bodyText = `❤️ Kiss time! \n${senderName} gave a kiss to ${targetName}! 💋`;

      if (typeof api.sendPhoto === "function") {
        await api.sendPhoto(threadID, output, { caption: bodyText }, messageID);
      } else {
        await api.sendMessage({
          body: bodyText,
          attachment: fs.createReadStream(output)
        }, threadID, () => {}, messageID);
      }

      if (await fs.pathExists(output)) {
        await fs.unlink(output);
      }

    } catch (err) {
      console.error("❌ Error in kiss command:", err);
      api.sendMessage(`⚠️ কোনো সমস্যা হয়েছে!\n${err.message}`, event.threadID || event.chat?.id, event.messageID || event.message_id);
    }
  }
};
