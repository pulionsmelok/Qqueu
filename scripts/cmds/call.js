const OWNER_ID = "6734899387";

if (!global.callBridge) global.callBridge = new Map();

function normalizeMediaType(type) {
  type = String(type || "file").toLowerCase();
  if (["png", "jpg", "jpeg", "webp"].includes(type)) return "photo";
  if (type === "gif" || type === "animated_image") return "animation";
  if (type === "document") return "document";
  if (type === "voice") return "voice";
  return type;
}

function getMediaAttachments(event) {
  const out = [];
  const seen = new Set();

  const list = event?.attachments || [];

  for (const item of list) {
    if (!item) continue;
    const fileId = item.fileID || item.file_id || null;
    const url = item.url || null;
    if (!fileId && !url) continue;

    const key = String(fileId || url);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      type: normalizeMediaType(item.type),
      fileId,
      url,
      filename: item.filename || item.name || undefined
    });
  }

  const msg = event?.raw || event?.message || event;
  if (msg) {
    if (msg.photo?.length) {
      const last = msg.photo[msg.photo.length - 1];
      const key = String(last.file_id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: "photo", fileId: last.file_id });
      }
    }
    if (msg.video?.file_id) {
      const key = String(msg.video.file_id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: "video", fileId: msg.video.file_id });
      }
    }
    if (msg.voice?.file_id) {
      const key = String(msg.voice.file_id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: "voice", fileId: msg.voice.file_id });
      }
    }
    if (msg.audio?.file_id) {
      const key = String(msg.audio.file_id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: "audio", fileId: msg.audio.file_id });
      }
    }
    if (msg.document?.file_id) {
      const key = String(msg.document.file_id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: "document", fileId: msg.document.file_id });
      }
    }
    if (msg.animation?.file_id) {
      const key = String(msg.animation.file_id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: "animation", fileId: msg.animation.file_id });
      }
    }
  }

  return out;
}

function getText(event) {
  return String(
    event?.body ||
    event?.text ||
    event?.caption ||
    event?.raw?.text ||
    event?.raw?.caption ||
    ""
  ).trim();
}

async function sendOneMedia(api, chatId, media, caption) {
  const value = media.fileId || media.url;
  if (!value) return api.sendMessage(chatId, caption || "");

  const options = {};
  if (caption) options.caption = caption;

  try {
    switch (media.type) {
      case "photo":
        return await api.sendPhoto(chatId, value, options);

      case "video":
        return await api.sendVideo(chatId, value, options);

      case "voice":
        if (typeof api.sendVoice === "function") {
          return await api.sendVoice(chatId, value, options);
        }
        if (typeof api.call === "function") {
          const fields = { chat_id: String(chatId), voice: value };
          if (caption) fields.caption = caption;
          return await api.call("sendVoice", fields);
        }
        return await api.sendAudio(chatId, value, options);

      case "audio":
        return await api.sendAudio(chatId, value, options);

      case "animation":
        if (typeof api.sendAnimation === "function") {
          return await api.sendAnimation(chatId, value, options);
        }
        if (typeof api.call === "function") {
          const fields = { chat_id: String(chatId), animation: value };
          if (caption) fields.caption = caption;
          return await api.call("sendAnimation", fields);
        }
        return await api.sendDocument(chatId, value, options);

      case "document":
      default:
        return await api.sendDocument(chatId, value, options);
    }
  } catch (err) {
    console.log("sendOneMedia error:", err.message);
    return api.sendDocument(chatId, value, options);
  }
}

async function sendMedia(api, chatId, mediaList, caption) {
  const media = Array.isArray(mediaList) ? mediaList : mediaList ? [mediaList] : [];
  
  if (!media.length) {
    return api.sendMessage(chatId, caption || "");
  }

  let first = null;
  for (let i = 0; i < media.length; i++) {
    const sent = await sendOneMedia(api, chatId, media[i], i === 0 ? caption : "");
    if (!first) first = sent;
  }
  return first;
}

function bridgeSet(messageId, data) {
  if (!messageId) return;
  global.callBridge.set(String(messageId), { ...data });
}

module.exports = {
  config: {
    name: "call",
    aliases: ["report", "contact", "support", "called"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    
    
    usePrefix: true,
    countDown: 5,
    description: {
            en: "Report to Owner + Two-way reply (Photo/Video/Voice/Audio/Document)"
        },
        category: "system",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, chatId, args, message, userId, event }) {
    const raw = event?.raw || event || {};
    const media = getMediaAttachments(event);
    const reason =
      (args || []).join(" ").trim() ||
      getText(event) ||
      "📞 User called support (No reason provided)";

    try {
      const senderName =
        event?.from?.first_name || event?.from?.username || "Unknown";
      const chatTitle = event?.chat?.title || "Private Chat";

      const report =
        `╭─[ NEW REPORT ]─╮\n` +
        `│ 👤 User: ${senderName}\n` +
        `│ 🆔 UID: ${userId}\n` +
        `├─────────────────\n` +
        `│ 👥 Group: ${chatTitle}\n` +
        `│ 🆔 TID: ${chatId}\n` +
        `├─────────────────\n` +
        `│ 💬 Reason: ${reason}\n` +
        `╰─────────────────\n` +
        `│ ↩️ Reply to this message to reply user\n` +
        `╰─────────────────\n` +
        `🤖 𝐒𝐈𝐃𝐃𝐈𝐊-𝐁𝐎𝐓`;

      const sent = await sendMedia(api, OWNER_ID, media, report);

      bridgeSet(sent?.message_id || sent?.messageID, {
        userThread: String(chatId),
        userId: String(userId),
        ownerId: String(OWNER_ID)
      });

      return api.sendMessage(
        chatId,
        `╭─[ SUCCESS ✅ ]─╮\n` +
          `│ Report sent to Owner\n` +
          `├─────────────────\n` +
          `│ 📝 Reason: ${reason}\n` +
          `│ ♻️ Owner reply দিলে এখানে আসবে\n` +
          `╰─────────`,
        raw.message_id ? { reply_to_message_id: raw.message_id } : {}
      );
    } catch (e) {
      return api.sendMessage(chatId, `❌ Failed: ${e.message}`);
    }
  },

  onChat: async function ({ api, chatId, userId, event, msg }) {
    try {
      const current = event || msg || {};
      if (!current || current.from?.is_bot) return;

      const reply = current.reply_to_message || current.messageReply || null;
      const replyId = reply?.message_id || reply?.messageID;
      if (!replyId) return;

      const data = global.callBridge.get(String(replyId));
      if (!data) return;

      const body = getText(current);
      const media = getMediaAttachments(current); // এখন শুধু নতুন মিডিয়া

      if (
        String(userId) === String(OWNER_ID) &&
        String(chatId) === String(OWNER_ID)
      ) {
        const text =
          `╭─[ OWNER REPLY ]─╮\n` +
          `│ ${body || "📎 Media"}\n` +
          `├─────────────────\n` +
          `│ ↩️ Reply to this message to continue\n` +
          `╰─────────────────\n` +
          `🤖 𝐒𝐈𝐃𝐃𝐈𝐊-𝐁𝐎𝐓`;

        const sent = await sendMedia(api, data.userThread, media, text);
        bridgeSet(sent?.message_id || sent?.messageID, data);
        return;
      }

      if (String(chatId) !== String(data.userThread)) return;

      const senderName =
        current.from?.first_name || current.from?.username || "User";

      const text =
        `╭─[ USER REPLY ]─╮\n` +
        `│ 👤 ${senderName}\n` +
        `│ 🆔 ${userId}\n` +
        `├─────────────────\n` +
        `│ 💬 ${body || "📎 Media"}\n` +
        `╰─────────────────\n` +
        `↩️ Reply to continue`;

      const sent = await sendMedia(api, OWNER_ID, media, text);
      bridgeSet(sent?.message_id || sent?.messageID, data);
    } catch (e) {
      console.log("CALL ERROR:", e.message);
    }
  }
};