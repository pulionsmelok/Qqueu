const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

function formatBalance(num) {
  num = Number(num) || 0;
  if (num >= 1e15) return (num / 1e15).toFixed(2).replace(/\.00$/, "") + "q";
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, "") + "t";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "b";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "m";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "k";
  return num.toFixed(0);
}

function roundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

async function getTelegramAvatar(bot, userID) {
  try {
    const photos = await bot.getUserProfilePhotos(userID, { limit: 1 });
    if (!photos?.photos?.[0]?.length) return null;
    const photo = photos.photos[0][photos.photos[0].length - 1];
    const fileLink = await bot.getFileLink(photo.file_id);
    const response = await axios({ url: fileLink, method: "GET", responseType: "arraybuffer"});
    return await loadImage(response.data);
  } catch (err) {
    console.log("Telegram Avatar Load Failed:", err.message);
    return null;
  }
}

async function drawCard({ bot, userID, userName, balance }) {
  const formatted = "$" + formatBalance(balance);
  const width = 850, height = 520;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#0f2027"); grad.addColorStop(0.5, "#1c4966"); grad.addColorStop(1, "#2a7ab0");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, width, height, 30, true);
  const shine = ctx.createLinearGradient(0, 0, width, height);
  shine.addColorStop(0, "rgba(255,255,255,0.06)"); shine.addColorStop(0.4, "rgba(255,255,255,0)"); shine.addColorStop(1, "rgba(255,255,255,0.04)");
  ctx.fillStyle = shine;
  roundRect(ctx, 0, 0, width, height, 30, true);
  ctx.font = "bold 34px Arial"; ctx.fillStyle = "#ffffff";
  ctx.fillText("GOAT NATIONAL BANK", 60, 80);
  ctx.font = "16px Arial"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("PREMIUM ECONOMY CARD", 60, 105);
  const chipGrad = ctx.createLinearGradient(60, 140, 150, 205);
  chipGrad.addColorStop(0, "#f4d97a"); chipGrad.addColorStop(1, "#c9982f");
  ctx.fillStyle = chipGrad;
  roundRect(ctx, 60, 145, 90, 60, 10, true);
  ctx.font = "28px monospace"; ctx.fillStyle = "#ffffff";
  ctx.fillText("1234  5678  9012  8456", 60, 250);
  ctx.font = "16px Arial"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("VALID THRU", 60, 295);
  ctx.font = "bold 22px Arial"; ctx.fillStyle = "#ffffff";
  ctx.fillText("12/29", 60, 322);
  ctx.font = "bold 24px Arial";
  const safeName = userName ? String(userName).toUpperCase() : "CARD HOLDER";
  const maxNameWidth = 360;
  let nameToShow = safeName;
  while (ctx.measureText(nameToShow).width > maxNameWidth && nameToShow.length > 0) {
    nameToShow = nameToShow.slice(0, -1);
  }
  if (nameToShow !== safeName) nameToShow = nameToShow.trim() + "…";
  ctx.fillText(nameToShow, 60, 380);
  const boxX = 440, boxY = 240, boxW = 350, boxH = 190;
  const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
  boxGrad.addColorStop(0, "rgba(255,255,255,0.22)"); boxGrad.addColorStop(1, "rgba(255,255,255,0.10)");
  ctx.fillStyle = boxGrad;
  roundRect(ctx, boxX, boxY, boxW, boxH, 25, true);
  ctx.textAlign = "center";
  ctx.font = "18px Arial"; ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("AVAILABLE BALANCE", boxX + boxW / 2, boxY + 45);
  let fontSize = 50;
  const maxTextWidth = boxW - 40;
  do {
    ctx.font = `bold ${fontSize}px Arial`;
    if (ctx.measureText(formatted).width <= maxTextWidth) break;
    fontSize -= 2;
  } while (fontSize > 18);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(formatted, boxX + boxW / 2, boxY + 120);
  ctx.textAlign = "left";
  const avatar = await getTelegramAvatar(bot, userID);
  if (avatar) {
    const size = 100, x = width - size - 50, y = 45;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  return canvas.toBuffer("image/png");
}

async function getTargetUser({ bot, event, args = [], usersData }) {
  if (event.reply_to_message?.from?.id) {
    const user = event.reply_to_message.from;
    return { id: Number(user.id), name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `User ${user.id}` };
  }
  if (Array.isArray(event.entities)) {
    const textMention = event.entities.find(e => e.type === "text_mention" && e.user?.id);
    if (textMention?.user?.id) {
      const user = textMention.user;
      return { id: Number(user.id), name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `User ${user.id}` };
    }
  }
  const raw = String(args[args.length - 1] || "").trim();
  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    if (Number.isSafeInteger(id) && id > 0) {
      try {
        const member = await bot.getChatMember(event.chat.id, id);
        if (member?.user?.id) {
          const user = member.user;
          return { id: Number(user.id), name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `User ${user.id}` };
        }
      } catch (err) {}
    }
  }
  const usernameArg = raw.replace(/^@+/, "").toLowerCase();
  if (usernameArg && !/^\d+$/.test(usernameArg) && usersData?.getAll) {
    try {
      const users = await usersData.getAll();
      const found = users.find(u => String(u.username || u.data?.username || "").replace(/^@+/, "").toLowerCase() === usernameArg);
      if (found) {
        const id = found.userID || found.id;
        if (id) return { id: Number(id), name: found.name || found.firstName || `User ${id}` };
      }
    } catch (err) {
      console.log("Username lookup failed:", err.message);
    }
  }
  return null;
}
const config = {
    name: "balance",
  aliases: ["ball","bal"],
  version: "1.5.0",
  author: "SK-SIDDIK-KHAN",
  countDown: 5,
  role: 0,
  usePrefix: true,
    description: {
            en: "Show balance card or transfer money"
        },
        category: "economy",
        guide: {
            en: "{pn}\n{pn} @user\n{pn} transfer <amount> @user\nYou can also reply to a user's message."
        }
};
module.exports = { config,
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
    onStart: async function ({ bot, event, args, message, usersData }) {
  const chatId = event.chat?.id;
  const messageId = event.message_id;
  if (!chatId) return;
  try {
    if (args[0] && args[0].toLowerCase() === "transfer") {
      const amount = parseInt(args[1], 10);
      if (!Number.isFinite(amount) || amount <= 0) {
        return message.reply("❌ Please enter a valid amount.\n\nExample:\n/balance transfer 10000 @friend\n\nOr reply to a user's message.");
      }
      const targetID = await getTargetUser({ bot, event, args: args.slice(2), usersData });
      if (!targetID) {
        return message.reply("❌ Who do you want to send money to?\n\nMention the user, enter their ID, or reply to their message.");
      }
      const senderID = Number(event.from?.id || event.senderID);
      if (Number(targetID.id) === Number(senderID)) {
        return message.reply("❌ You can't transfer money to yourself.");
      }
      const senderData = await usersData.get(senderID);
      const senderBalance = Number(senderData?.money) || 0;
      if (senderBalance < amount) {
        return message.reply(`❌ Insufficient balance.\n\n💰 Your balance: $${formatBalance(senderBalance)}`);
      }
      const receiverData = await usersData.get(targetID.id);
      const receiverBalance = Number(receiverData?.money) || 0;
      await usersData.set(senderID, { money: senderBalance - amount });
      await usersData.set(targetID.id, { money: receiverBalance + amount });
      const senderName = senderData?.name || event.from?.first_name || "User";
      const receiverName = targetID.name || receiverData?.name || "User";
      await bot.sendMessage(chatId, `✅ <b>Transfer Successful!</b>\n\n👤 ${senderName} ➝ ${receiverName}\n💸 Amount: $${formatBalance(amount)}\n\n💰 Your new balance: $${formatBalance(senderBalance - amount)}`, { parse_mode: "HTML", reply_to_message_id: messageId });
      return;
    }
    const senderID = Number(event.from?.id || event.senderID);
    const targetUser = await getTargetUser({ bot, event, args, usersData });
    const targetID = targetUser?.id || senderID;
    const userData = await usersData.get(targetID);
    const balance = Number(userData?.money) || 0;
    const userName = targetUser?.name || userData?.name || event.from?.first_name || "CARD HOLDER";
    const buffer = await drawCard({ bot, userID: targetID, userName, balance });
    await bot.sendPhoto(chatId, buffer, {
      caption: `💳 <b>${userName}</b>\n💰 Balance: <b>$${formatBalance(balance)}</b>`,
      parse_mode: "HTML",
      reply_to_message_id: messageId
    });
  } catch (err) {
    console.error("❌ Balance command error:", err);
    await bot.sendMessage(chatId, "❌ Something went wrong while running the balance command.", { reply_to_message_id: messageId });
  }
}};