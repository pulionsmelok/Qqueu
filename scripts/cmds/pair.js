const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    aliases: ["pr"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Reply or random pair with perfect avatar fit"
        },
        category: "fun",
        guide: {
            en: "{pn} [reply to a message]"
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

      let targetID;
      let targetName = "";

      if (messageReply) {
        targetID = messageReply.senderID || messageReply.from?.id || messageReply.chat?.id;
      } else {
        try {
          const botInstance = api.telegram || api;
          if (typeof botInstance.getChatAdministrators === "function") {
            const admins = await botInstance.getChatAdministrators(threadID);
            const otherAdmins = admins.map(a => a.user.id).filter(id => id !== senderID);
            if (otherAdmins.length > 0) {
              targetID = otherAdmins[Math.floor(Math.random() * otherAdmins.length)];
            }
          }
        } catch (e) {}

        if (!targetID) {
          return api.sendMessage("❌ Onno karo sathe pair korte tar message-e reply din!", threadID, messageID);
        }
      }

      if (targetID === senderID) {
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

      targetName = await getUserName(targetID, messageReply);

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

      const canvas = createCanvas(1536, 791);
      const ctx = canvas.getContext("2d");

      const backgrounds = [
        "https://i.imgur.com/qDCLc3E.jpeg",
        "https://i.imgur.com/gkvKeKj.jpeg",
        "https://i.imgur.com/8ky9MND.jpeg",
        "https://i.imgur.com/sBNpB0Q.jpeg",
        "https://i.imgur.com/HdT9XBS.jpeg",
        "https://i.imgur.com/JT8bpRQ.jpeg"
      ];
      const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const [background, senderAvatar, targetAvatar] = await Promise.all([
        loadImage(randomBackground),
        getTelegramAvatar(senderID),
        getTelegramAvatar(targetID)
      ]);

      ctx.drawImage(background, 0, 0, 1536, 791);

      let leftAvatar = senderAvatar;
      let rightAvatar = targetAvatar;

      function drawCoverCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          x + size / 2,
          y + size / 2,
          size / 2,
          0,
          Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();

        const imgWidth = img.width;
        const imgHeight = img.height;
        let sWidth, sHeight, sX, sY;

        if (imgWidth > imgHeight) {
          sHeight = imgHeight;
          sWidth = imgHeight;
          sX = (imgWidth - imgHeight) / 2;
          sY = 0;
        } else {
          sWidth = imgWidth;
          sHeight = imgWidth;
          sX = 0;
          sY = (imgHeight - imgWidth) / 2;
        }

        ctx.drawImage(img, sX, sY, sWidth, sHeight, x, y, size, size);
        ctx.restore();
      }

      drawCoverCircle(ctx, leftAvatar, 108, 218, 380);
      drawCoverCircle(ctx, rightAvatar, 1061, 218, 380);

      const love = Math.floor(Math.random() * 101);
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "center";
      ctx.font = "bold 60px Arial";
      ctx.fillText(`${love}%`, 305, 710);
      ctx.fillText(`${love}%`, 1245, 710);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      
      const output = path.join(cacheDir, `pairv3_${senderID}_${targetID}.jpg`);
      await fs.writeFile(output, canvas.toBuffer("image/jpeg", { quality: 0.95 }));

      let loveText;
      if (love <= 20)
        loveText = "💔 𝓜𝓪𝔂𝓫𝓮 𝓯𝓪𝓽𝓮 𝓱𝓪𝓼 𝓸𝓽𝓱𝓮𝓻 𝓹𝓵𝓪𝓷𝓼.";
      else if (love <= 40)
        loveText = "🤍 𝓖𝓲𝓿𝓮 𝓲𝓽 𝓪 𝓵𝓲𝓽𝓽𝓵𝓮 𝓶𝓸𝓻𝓮 𝓽𝓲𝓶𝓮.";
      else if (love <= 60)
        loveText = "✨ 𝓣𝓱𝓮𝓻𝓮'𝓼 𝓪 𝓰𝓸𝓸𝓭 𝓬𝓸𝓷𝓷𝓮𝓬𝓽𝓲𝓸𝓷.";
      else if (love <= 80)
        loveText = "💖 𝓐 𝓫𝓮𝓪𝓾𝓽𝓲𝓯𝓾𝓵 𝓹𝓪𝓲𝓻.";
      else
        loveText = "💍 𝓐 𝓶𝓪𝓽𝓬𝓱 𝓶𝓪𝓭𝓮 𝓲𝓷 𝓱𝓮𝓪𝓿𝓮𝓷.";

      const messageBody = `╭─❖ 💞 𝐏𝐀𝐈𝐑 𝐑𝐄𝐒𝐔𝐋𝐓 💞 ❖─╮\n\n💖 𝐏𝐚𝐫𝐭𝐧𝐞𝐫 𝟏\n➜ ${senderName}\n\n💖 𝐏𝐚𝐫𝐭𝐧𝐞𝐫 𝟐\n➜ ${targetName}\n\n━━━━━━━━━━━━━━\n\n💘 𝐋𝐨𝐯𝐞 𝐌𝐞𝐭𝐞𝐫 :: ${love}%\n\n${loveText}\n\n🌹 𝓣𝓱𝓮 𝓼𝓽𝓪𝓻𝓼 𝓱𝓪𝓿𝓮\n𝓹𝓪𝓲𝓻𝓮𝓭 𝔂𝓸𝓾 𝓽𝓸𝓰𝓮𝓽𝓱𝓮𝓻.\n\n╰────────────────╯`;

      const botInstance = api.telegram || api;
      if (typeof botInstance.sendPhoto === "function") {
        await botInstance.sendPhoto(threadID, fs.createReadStream(output), { caption: messageBody }, { reply_to_message_id: messageID });
      } else if (typeof api.sendPhoto === "function") {
        await api.sendPhoto(threadID, output, { caption: messageBody }, messageID);
      } else {
        await api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(output)
        }, threadID, () => {}, messageID);
      }

      if (await fs.pathExists(output)) {
        await fs.unlink(output);
      }

    } catch (err) {
      console.error("Pair Error:", err);
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID || event.chat?.id, event.messageID || event.message_id);
    }
  }
};
