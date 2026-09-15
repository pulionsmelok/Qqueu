const fs = require("fs");
const path = require("path");
const axios = require("axios");
const JSON_PATH = path.join(__dirname, "Siddik", "muted_users.json");
const loadMuted = () => {
  try {
    if (!fs.existsSync(JSON_PATH)) {
      const dir = path.dirname(JSON_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify({}, null, 2));
      return {};
    }
    return JSON.parse(fs.readFileSync(JSON_PATH, "utf8") || "{}");
  } catch {
    return {};
  }
};
const saveMuted = (data) => {
  try {
    const dir = path.dirname(JSON_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
  } catch {}
};

function parseTime(args) {
  if (!args || args.length === 0) return null;
  const text = args.join(" ").toLowerCase();
  let match = text.match(/(?:m\s*(\d+)|(\d+)\s*m)/);
  if (match) {
    const min = parseInt(match[1] || match[2]);
    return {
      type: "m",
      value: min,
      seconds: min * 60,
      text: `${min} Minutes`
    };
  }
  match = text.match(/(?:h\s*(\d+)|(\d+)\s*h)/);
  if (match) {
    const hr = parseInt(match[1] || match[2]);
    return {
      type: "h",
      value: hr,
      seconds: hr * 3600,
      text: `${hr} Hours`
    };
  }
  return null;
}

async function getTargetUser({
  event,
  api,
  args = [],
  chatId,
  db = global.db
}) {
  if (event.reply_to_message?.from?.id) {
    const u = event.reply_to_message.from;
    return {
      id: Number(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || `User ${u.id}`,
      username: u.username || null
    };
  }
  const textMention = Array.isArray(event.entities)
    ? event.entities.find(e => e.type === "text_mention" && e.user?.id)
    : null;
  if (textMention?.user?.id) {
    const u = textMention.user;
    return {
      id: Number(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || `User ${u.id}`,
      username: u.username || null
    };
  }
  let raw = String(args[0] || "").trim();
  if (!raw) return null;
  raw = raw.replace(/^@+/, "");
  if (!raw || /^(m|h)$/i.test(raw)) return null;
  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    try {
      const member = await api.getChatMember(chatId, id);
      const u = member?.user;
      if (!u?.id) return null;
      return {
        id: Number(u.id),
        name: [u.first_name, u.last_name].filter(Boolean).join(" ") || `User ${u.id}`,
        username: u.username || null
      };
    } catch {
      return null;
    }
  }
  const wanted = raw.toLowerCase();
  try {
    if (db?.getAllUsers) {
      const users = await db.getAllUsers();
      const found = users.find(
        u => String(u.username || "").replace(/^@/, "").toLowerCase() === wanted
      );
      if (found?.id) {
        const id = Number(found.id);
        if (Number.isSafeInteger(id) && id > 0) {
          try {
            const member = await api.getChatMember(chatId, id);
            const u = member?.user;
            if (u?.id) {
              return {
                id: Number(u.id),
                name:
                  [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                  found.firstName ||
                  `User ${u.id}`,
                username: u.username || found.username || null
              };
            }
          } catch {}
        }
      }
    }
  } catch {}
  return null;
}

async function verifyTargetMember(api, chatId, target) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const member = await api.getChatMember(chatId, Number(target.id));
      const status = String(member?.status || "").toLowerCase();
      if (status === "left" || status === "kicked") {
        return { ok: false, member };
      }
      if (status === "restricted" && member?.is_member === false) {
        return { ok: false, member };
      }
      if (!member?.user?.id) {
        return { ok: false, member };
      }
      return { ok: true, member };
    } catch (e) {
      lastError = e;
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }
  }
  return { ok: false, error: lastError };
}

async function checkBotPermissions(api, chatId, botId) {
  try {
    const member = await api.getChatMember(chatId, botId);
    if (!member) {
      return {
        ok: false,
        text:
          "┌────────────⭓\n" +
          "│ ⚠️ 𝐏𝐄𝐑𝐌𝐈𝐒𝐒𝐈𝐎𝐍 𝐄𝐑𝐑𝐎𝐑\n" +
          "├────────────\n" +
          "│ 🤖 Bot Admin status could not be verified.\n" +
          "│ 🔐 Please make the bot an Admin.\n" +
          "└────────────⭓"
      };
    }
    const status = String(member.status || "").toLowerCase();
    if (status === "creator") {
      return { ok: true };
    }
    if (status !== "administrator") {
      return {
        ok: false,
        text:
          "┌────────────⭓\n" +
          "│ ⚠️ 𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐃\n" +
          "├────────────\n" +
          "│ 🤖 Bot is not an Admin.\n" +
          "│ 🔐 Please make the bot an Admin.\n" +
          "│ 🛡️ Enable Restrict Users permission.\n" +
          "└────────────⭓"
      };
    }
    if (member.can_restrict_members !== true) {
      return {
        ok: false,
        text:
          "┌────────────⭓\n" +
          "│ ⚠️ 𝐏𝐄𝐑𝐌𝐈𝐒𝐒𝐈𝐎𝐍 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐃\n" +
          "├────────────\n" +
          "│ 🤖 Bot is already an Admin.\n" +
          "│ 🔐 But Restrict Users permission is OFF.\n" +
          "├────────────\n" +
          "│ ⚙️ Group Settings\n" +
          "│ ➜ Administrators\n" +
          "│ ➜ Select Bot\n" +
          "│ ➜ Enable Restrict Users\n" +
          "└────────────⭓"
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      text:
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐏𝐄𝐑𝐌𝐈𝐒𝐒𝐈𝐎𝐍 𝐄𝐑𝐑𝐎𝐑\n" +
        "├────────────\n" +
        "│ 🤖 Please make the bot an Admin.\n" +
        "│ 🔐 Enable Restrict Users permission.\n" +
        "└────────────⭓"
    };
  }
}

function formatMuteError(err) {
  const raw = String(err?.message || err || "Unknown error");
  const upper = raw.toUpperCase();
  if (
    upper.includes("PARTICIPANT_ID_INVALID") ||
    upper.includes("USER_ID_INVALID")
  ) {
    return (
      "The target user is not a member of this group " +
      "or Telegram rejected the user ID. " +
      "Please reply to the user's message and use /mute."
    );
  }
  if (
    upper.includes("CHAT_ADMIN_REQUIRED") ||
    upper.includes("BOT_ADMIN")
  ) {
    return "The bot must be an Admin with Restrict Users permission.";
  }
  if (
    upper.includes("RIGHT_FORBIDDEN") ||
    upper.includes("FORBIDDEN") ||
    upper.includes("NOT_ENOUGH_RIGHTS")
  ) {
    return (
      "The bot does not have enough Admin permissions. " +
      "Please enable Restrict Users."
    );
  }
  return raw;
}

module.exports = {
  config: {
    name: "mute",
    aliases: ["unmute", "mutelist", "mlist", "mute_list"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 1,
    usePrefix: true,
    description: {
            en: "Mute/Unmute with time, reply, mention, UID and list"
        },
        category: "moderation",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({
    event,
    api,
    args,
    message,
    chatId,
    userId,
    ctx,
    db
  }) {
    if (!message.isGroup) {
      return message.reply(
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐌𝐔𝐓𝐄 𝐄𝐑𝐑𝐎𝐑\n" +
        "├────────────\n" +
        "│ ❌ This command can only be used in a group.\n" +
        "└────────────⭓"
      );
    }
    if (message.chatType !== "supergroup") {
      return message.reply(
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐒𝐔𝐏𝐄𝐑𝐆𝐑𝐎𝐔𝐏 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐃\n" +
        "├────────────\n" +
        "│ ❌ Mute/Restrict works only in Telegram Supergroups.\n" +
        "│ 🔄 Please convert this group to a Supergroup.\n" +
        "└────────────⭓"
      );
    }
    const botId = ctx?.botInfo?.id;
    if (botId) {
      const permission = await checkBotPermissions(api, chatId, botId);
      if (!permission.ok) {
        return message.reply(permission.text, { parse_mode: "Markdown" });
      }
    }
    const text = (event.text || event.caption || "").toLowerCase();
    const isUnmute = text.includes("unmute");
    const isList = text.includes("list") || args[0]?.toLowerCase() === "list";
    if (
      isList ||
      event.text?.toLowerCase().endsWith("mutelist") ||
      event.text?.toLowerCase().endsWith("mlist")
    ) {
      const muted = loadMuted();
      const list = muted[chatId] || [];
      if (list.length === 0) {
        return message.reply(
          "┌────────────⭓\n" +
          "│ 🔇 𝐌𝐔𝐓𝐄𝐃 𝐔𝐒𝐄𝐑𝐒\n" +
          "├────────────\n" +
          "│ ✅ No users are currently muted.\n" +
          "└────────────⭓"
        );
      }
      let response =
        "┌────────────⭓\n" +
        "│ 🔇 𝐌𝐔𝐓𝐄𝐃 𝐔𝐒𝐄𝐑𝐒\n" +
        "├────────────\n";
      list.forEach((u, i) => {
        response +=
          `│ 👤 ${i + 1}. **Name:** ${u.name}\n` +
          `│ 🆔 **UID:** \`${u.id}\`\n` +
          `│ ⏰ **Time:** ${u.time}\n` +
          `│ ⏳ **Duration:** ${u.duration || "Lifetime"}\n`;
        if (u.expire) {
          response += `│ 🔓 **Expire:** ${u.expire}\n`;
        }
        response += "├────────────\n";
      });
      response += `│ 📊 **Total:** ${list.length} Users\n└────────────⭓`;
      try {
        const chat = await api.getChat(chatId);
        if (chat.photo?.big_file_id) {
          const file = await api.getFile(chat.photo.big_file_id);
          const url = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
          const res = await axios.get(url, { responseType: "arraybuffer" });
          const imageBuffer = Buffer.from(res.data);
          return await api.sendPhoto(chatId, imageBuffer, {
            caption: response,
            parse_mode: "Markdown"
          });
        }
      } catch {}
      return api.sendMessage(
        {
          body: response,
          parse_mode: "Markdown"
        },
        chatId
      );
    }
    const timeData = parseTime(args);
    let targetArgs = [...args];
    if (timeData) {
      const filtered = [];
      for (let i = 0; i < args.length; i++) {
        const a = String(args[i]).toLowerCase();
        const next = String(args[i + 1] || "");
        if ((a === "m" || a === "h") && /^\d+$/.test(next)) {
          i++;
          continue;
        }
        if (/^\d+[mh]$/.test(a)) {
          continue;
        }
        filtered.push(args[i]);
      }
      targetArgs = filtered;
    }
    let target = await getTargetUser({
      event,
      api,
      args: targetArgs,
      chatId,
      db
    });
    if (!target && event.reply_to_message?.from) {
      target = await getTargetUser({
        event,
        api,
        args: [],
        chatId,
        db
      });
    }
    if (!target) {
      return message.reply(
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐌𝐔𝐓𝐄 𝐔𝐒𝐀𝐆𝐄\n" +
        "├────────────\n" +
        "│ 🔇 /mute (reply) - Lifetime\n" +
        "│ ⏱️ /mute m 50 (reply) - 50 Minutes\n" +
        "│ ⏱️ /mute h 24 (reply) - 24 Hours\n" +
        "│ 👤 /mute @username m 30\n" +
        "│ 🆔 /mute 123456 h 5\n" +
        "│ 🔊 /unmute (reply/@/uid)\n" +
        "│ 📋 /mutelist\n" +
        "└────────────⭓"
      );
    }
    if (String(target.id) === String(userId)) {
      return message.reply(
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐌𝐔𝐓𝐄 𝐄𝐑𝐑𝐎𝐑\n" +
        "├────────────\n" +
        "│ ❌ You cannot mute yourself.\n" +
        "└────────────⭓"
      );
    }
    if (String(target.id) === String(ctx?.botInfo?.id)) {
      return message.reply(
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐌𝐔𝐓𝐄 𝐄𝐑𝐑𝐎𝐑\n" +
        "├────────────\n" +
        "│ 🤖 You cannot mute the bot.\n" +
        "└────────────⭓"
      );
    }
    const targetCheck = await verifyTargetMember(api, chatId, target);
    if (!targetCheck.ok) {
      const detail = targetCheck.error
        ? formatMuteError(targetCheck.error)
        : "The target user is not currently a member of this group.";
      return message.reply(
        "┌────────────⭓\n" +
        "│ ⚠️ 𝐓𝐀𝐑𝐆𝐄𝐓 𝐄𝐑𝐑𝐎𝐑\n" +
        "├────────────\n" +
        `│ ❌ ${detail}\n` +
        "└────────────⭓"
      );
    }
    const currentTime = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka"
    });
    if (isUnmute) {
      try {
        await api.restrictChatMember(chatId, target.id, {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_invite_users: true
        });
        let muted = loadMuted();
        if (muted[chatId]) {
          muted[chatId] = muted[chatId].filter(
            u => String(u.id) !== String(target.id)
          );
          saveMuted(muted);
        }
        return message.reply(
          "┌────────────⭓\n" +
          "│ 🔊 𝐔𝐍𝐌𝐔𝐓𝐄 𝐈𝐍𝐅𝐎\n" +
          "├────────────\n" +
          `│ 👤 **Name:** ${target.name}\n` +
          `│ 🆔 **UID:** \`${target.id}\`\n` +
          "│ ✅ **Status:** Unmuted Successfully\n" +
          "└────────────⭓",
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        return message.reply(
          "┌────────────⭓\n" +
          "│ ❌ 𝐔𝐍𝐌𝐔𝐓𝐄 𝐅𝐀𝐈𝐋𝐄𝐃\n" +
          "├────────────\n" +
          `│ ${formatMuteError(e)}\n` +
          "├────────────\n" +
          "│ 🤖 Make sure the bot is Admin.\n" +
          "│ 🔐 Enable Restrict Users permission.\n" +
          "└────────────⭓"
        );
      }
    }
    try {
      const admins = await api.getChatAdministrators(chatId);
      if (admins.some(a => String(a.user.id) === String(target.id))) {
        return message.reply(
          "┌────────────⭓\n" +
          "│ ⚠️ 𝐌𝐔𝐓𝐄 𝐁𝐋𝐎𝐂𝐊𝐄𝐃\n" +
          "├────────────\n" +
          "│ 👤 The target user is a Group Admin.\n" +
          "│ 🛡️ Admin users cannot be muted.\n" +
          "└────────────⭓"
        );
      }
    } catch {}
    try {
      let restrictObj = { can_send_messages: false };
      let expireText = "Lifetime";
      let expireTime = null;
      if (timeData) {
        const until_date = Math.floor(Date.now() / 1000) + timeData.seconds;
        restrictObj.until_date = until_date;
        expireText = timeData.text;
        expireTime = new Date(
          Date.now() + timeData.seconds * 1000
        ).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
      }
      await api.restrictChatMember(chatId, target.id, restrictObj);
      let muted = loadMuted();
      if (!muted[chatId]) muted[chatId] = [];
      muted[chatId] = muted[chatId].filter(
        u => String(u.id) !== String(target.id)
      );
      muted[chatId].push({
        id: target.id,
        name: target.name,
        username: target.username || "",
        time: currentTime,
        expire: expireTime || "Never",
        duration: expireText
      });
      saveMuted(muted);
      if (timeData) {
        setTimeout(async () => {
          try {
            await api.restrictChatMember(chatId, target.id, {
              can_send_messages: true,
              can_send_media_messages: true,
              can_send_polls: true,
              can_send_other_messages: true,
              can_add_web_page_previews: true
            });
            let m = loadMuted();
            if (m[chatId]) {
              m[chatId] = m[chatId].filter(
                u => String(u.id) !== String(target.id)
              );
              saveMuted(m);
            }
            await api.sendMessage(
              {
                body:
                  "┌────────────⭓\n" +
                  "│ 🔊 𝐀𝐔𝐓𝐎 𝐔𝐍𝐌𝐔𝐓𝐄\n" +
                  "├────────────\n" +
                  `│ 👤 **Name:** ${target.name}\n` +
                  `│ 🆔 **UID:** \`${target.id}\`\n` +
                  `│ ⏳ **Duration:** ${expireText}\n` +
                  "│ ✅ **Mute time has ended.**\n" +
                  "└────────────⭓",
                parse_mode: "Markdown"
              },
              chatId
            ).catch(() => {});
          } catch {}
        }, timeData.seconds * 1000);
      }
      return message.reply(
        "┌────────────⭓\n" +
        "│ 🔇 𝐌𝐔𝐓𝐄 𝐈𝐍𝐅𝐎\n" +
        "├────────────\n" +
        `│ 👤 **Name:** ${target.name}\n` +
        `│ 🆔 **UID:** \`${target.id}\`\n` +
        `│ ⏰ **Time:** ${currentTime}\n` +
        `│ ⏳ **Duration:** ${expireText}\n` +
        (expireTime ? `│ 🔓 **Unmute:** ${expireTime}\n` : "") +
        "├────────────\n" +
        "│ ✅ **Muted Successfully**\n" +
        "└────────────⭓",
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      return message.reply(
        "┌────────────⭓\n" +
        "│ ❌ 𝐌𝐔𝐓𝐄 𝐅𝐀𝐈𝐋𝐄𝐃\n" +
        "├────────────\n" +
        `│ ${formatMuteError(err)}\n` +
        "├────────────\n" +
        "│ 🤖 Make sure the bot is Admin.\n" +
        "│ 🔐 Enable Restrict Users permission.\n" +
        "└────────────⭓"
      );
    }
  }
};
