const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "kill",
    aliases: ["killed"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    countDown: 5,
    description: {
            en: "Generate a kidnap-themed image using user avatars on"
        },
        category: "FUN & SOCIAL",
        guide: {
            en: "{pn} @mention or reply"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, event, message, usersData }) {
    const senderID = event.senderID;
    let targetID = null;

    if (event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
    } else if (event.messageReply?.from?.id) {
      targetID = event.messageReply.from.id;
    } else if (Object.keys(event.mentions || {}).length) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      const uidMatch = event.body?.match(/\b\d{5,20}\b/);
      if (uidMatch) targetID = uidMatch[0];
    }

    if (!targetID) {
      return message.reply("❌ Please reply to someone's message");
    }

    try {
      const getTelegramAvatarUrl = async (userId) => {
        try {
          if (typeof api.getUserProfilePhotos === "function") {
            const photos = await api.getUserProfilePhotos(userId, { limit: 1 });
            if (photos && photos.total_count > 0) {
              const fileId = photos.photos[0][0].file_id;
              const file = await api.getFile(fileId);
              return `https://api.telegram.org/file/bot${api.token || api.options?.token || ""}/${file.file_path}`;
            }
          }
        } catch (e) {}
        return "https://i.imgur.com/7682JqX.png";
      };

      const [nameA, nameB, avatarUrlA, avatarUrlB] = await Promise.all([
        usersData?.getName(senderID).catch(() => "You") || Promise.resolve("You"),
        usersData?.getName(targetID).catch(() => "Friend") || Promise.resolve("Friend"),
        getTelegramAvatarUrl(senderID),
        getTelegramAvatarUrl(targetID)
      ]);

      const bgPool = ["https://i.imgur.com/B318OFJ.jpeg"];
      const bgUrl = bgPool[Math.floor(Math.random() * bgPool.length)];

      const [avatarA, avatarB, background] = await Promise.all([
        loadImage(avatarUrlA),
        loadImage(avatarUrlB),
        loadImage(bgUrl)
      ]);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");
      
      ctx.drawImage(background, 0, 0);

      const positions = [
        { x: 150, y: 130, r: 30 },
        { x: 360, y: 290, r: 30 }
      ];

      const placeAvatar = (img, pos) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, pos.x - pos.r, pos.y - pos.r, pos.r * 2, pos.r * 2);
        ctx.restore();
      };

      placeAvatar(avatarA, positions[0]);
      placeAvatar(avatarB, positions[1]);

      const cacheDir = path.join(__dirname, "tmp");
      await fs.ensureDir(cacheDir);

      const outPath = path.join(cacheDir, `${senderID}_${targetID}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer());

      await message.reply({
        body: `${nameA} is killing ${nameB} 💀`,
        attachment: fs.createReadStream(outPath)
      });

      fs.unlinkSync(outPath);

    } catch (err) {
      console.error(err);
      return message.reply("❌ Something went wrong while generating the image.");
    }
  }
};
