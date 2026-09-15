const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");

const backgrounds = [
  "https://i.imgur.com/28OfsDZ.jpeg"
];

module.exports = {
  config: {
    name: "kidnap",
    aliases: ["kdnp"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    countDown: 5,
    description: {
            en: "Generate a kidnap-themed image using tagged user avatars on"
        },
        category: "fun",
        guide: {
            en: "{pn} @mention | reply | uid"
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
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.body) {
      const match = event.body.match(/\b\d{5,20}\b/);
      if (match) targetID = match[0];
    }

    if (!targetID) {
      return message.reply("❌ Please reply");
    }

    try {
      let name1 = "You";
      let name2 = "Friend";

      if (usersData && typeof usersData.getName === "function") {
        try {
          const n1 = await usersData.getName(senderID);
          if (n1) name1 = n1;
        } catch (e) {}

        try {
          const n2 = await usersData.getName(targetID);
          if (n2) name2 = n2;
        } catch (e) {}
      }

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

      const [avatar1Url, avatar2Url] = await Promise.all([
        getTelegramAvatarUrl(senderID),
        getTelegramAvatarUrl(targetID)
      ]);

      const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const [img1, img2, bgImg] = await Promise.all([
        Canvas.loadImage(avatar1Url),
        Canvas.loadImage(avatar2Url),
        Canvas.loadImage(bg)
      ]);

      const canvas = Canvas.createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0);

      const p1 = { x: 510, y: 110, r: 50 };
      const p2 = { x: 270, y: 200, r: 50 };

      const draw = (img, pos) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, pos.x - pos.r, pos.y - pos.r, pos.r * 2, pos.r * 2);
        ctx.restore();
      };

      draw(img1, p1);
      draw(img2, p2);

      const file = path.join(__dirname, "tmp", `${senderID}_${targetID}.png`);
      await fs.ensureDir(path.dirname(file));
      fs.writeFileSync(file, canvas.toBuffer());

      await message.reply({
        body: `${name1} кι∂ηαρpє∂ ${name2} 👺`,
        attachment: fs.createReadStream(file)
      });

      fs.unlinkSync(file);

    } catch (err) {
      console.error(err);
      message.reply("❌ Something went wrong while generating the image.");
    }
  }
};
