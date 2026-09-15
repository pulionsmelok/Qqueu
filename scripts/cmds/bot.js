const axios = require("axios");

const PRIMARY_API = "https://noobs-api.top/dipto";
const SECONDARY_API = "https://baby-apisx.vercel.app";

function looksLikeErrorPayload(raw) {
  if (!raw || typeof raw !== "object") return true;
  if (raw.error) return true;

  const text = `${raw.reply ?? ""} ${raw.message ?? ""}`;
  return /cannot read propert|undefined|is not a function|internal server error|^error:/i.test(text);
}

function normalize(raw) {
  return {
    ...raw,
    reply: raw.reply ?? "🤔 I couldn't come up with a reply.",
    message: raw.message ?? "✅ Done."
  };
}

async function fetchWithFallback(endpoint) {
  let primaryError;

  try {
    const res = await axios.get(`${PRIMARY_API}${endpoint}`, {
      timeout: 10000
    });

    if (
      res.data &&
      typeof res.data === "object" &&
      !looksLikeErrorPayload(res.data)
    ) {
      return normalize(res.data);
    }

    primaryError = new Error(
      `Primary API returned a bad payload: ${JSON.stringify(res.data)}`
    );
  } catch (e) {
    primaryError = e;
  }

  try {
    const res = await axios.get(`${SECONDARY_API}${endpoint}`, {
      timeout: 10000
    });

    if (
      res.data &&
      typeof res.data === "object" &&
      !looksLikeErrorPayload(res.data)
    ) {
      return normalize(res.data);
    }

    throw new Error(
      `Secondary API returned a bad payload: ${JSON.stringify(res.data)}`
    );
  } catch (e) {
    console.log("baby: primary failed ->", primaryError?.message);
    console.log("baby: secondary failed ->", e.message);
    throw new Error(
      "Both baby APIs are currently unavailable. Please try again later."
    );
  }
}

const utils = {
  monospace: (text) => {
    if (typeof text !== "string" || !text) {
      return text ?? "🤔 No reply received.";
    }

    const monospaceMap = {
      A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙",
      G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝", K: "𝗞", L: "𝗟",
      M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
      S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫",
      Y: "𝗬", Z: "𝗭",
      a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳",
      g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹",
      m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿",
      s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅",
      y: "𝘆", z: "𝘇",
      0: "𝟶", 1: "𝟭", 2: "𝟮", 3: "𝟯", 4: "𝟰",
      5: "𝟱", 6: "𝟲", 7: "𝟳", 8: "𝟴", 9: "𝟵"
    };

    return text
      .split("")
      .map((char) => monospaceMap[char] || char)
      .join("");
  },

  realMention: (name, uid, message) => {
    return {
      body: `『 ${name} 』\n\n${message}`,
      mentions: [{ tag: name, id: uid }]
    };
  }
};

const triggers = [
  "baby",
  "bby",
  "bot",
  "jan",
  "babu",
  "janu",
  "বট"
];

async function sendAttachmentReply(api, event, commandName) {
  const attType = event.attachments?.[0]?.type;

  let endpoint = null;

  if (attType === "sticker") {
    endpoint = "sticker";
  } else if (
    attType === "photo" ||
    attType === "animated_image"
  ) {
    endpoint = "picture";
  }

  if (!endpoint) return false;

  try {
    const raw = (
      await axios.get(
        `${SECONDARY_API}/baby/${endpoint}?senderID=${event.senderID}`,
        { timeout: 10000 }
      )
    ).data;

    if (looksLikeErrorPayload(raw)) return false;

    const data = normalize(raw);

    await api.sendMessage(
      data.reply,
      event.threadID,
      (error, info) => {
        if (info?.messageID && global.GoatBot?.onReply) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }
      },
      event.messageID
    );

    return true;
  } catch (error) {
    console.error("Attachment API Error:", error.message);
    return false;
  }
}

module.exports = {
  config: {
    name: "baby",
    aliases: ["bby"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 0,
    role: 0,
    description: {
            en: "AI chatting bot"
        },
        category: "CHATTING",
        guide: {
            en: "{pn} [anyMessage]"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, event, args }) {
    const commandName = this.config.name;
    const body = args.join(" ").toLowerCase();

    try {
      if (!args[0]) {
        if (event.attachments?.length > 0) {
          const handled = await sendAttachmentReply(
            api,
            event,
            commandName
          );

          if (handled) return;
        }

        const ran = [
          "বল রে সোনা কী বলবি 🫦",
          "হুম শোনো বলো 👀",
          "ডাকলি কেন শুনি? 🍼"
        ];

        return api.sendMessage(
          ran[Math.floor(Math.random() * ran.length)],
          event.threadID,
          () => {},
          event.messageID
        );
      }

      const data = await fetchWithFallback(
        `/baby?text=${encodeURIComponent(body)}&senderID=${event.senderID}&threadID=${event.threadID}&font=1`
      );

      const replyText = utils.monospace(data.reply);

      return api.sendMessage(
        replyText,
        event.threadID,
        (error, info) => {
          if (info?.messageID && global.GoatBot?.onReply) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
          }
        },
        event.messageID
      );
    } catch (e) {
      console.error("Baby onStart Error:", e);

      return api.sendMessage(
        "❌ | Baby API is currently unavailable. Please try again later.",
        event.threadID,
        () => {},
        event.messageID
      );
    }
  },

  onReply: async function ({ api, event }) {
    const commandName = this.config.name;

    try {
      if (event.type !== "message_reply") return;

      if (event.attachments?.length > 0) {
        const handled = await sendAttachmentReply(
          api,
          event,
          commandName
        );

        if (handled) return;
      }

      const text = event.body?.toLowerCase() || "";

      const data = await fetchWithFallback(
        `/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}&threadID=${event.threadID}&font=1`
      );

      const replyText = utils.monospace(data.reply);

      return api.sendMessage(
        replyText,
        event.threadID,
        (error, info) => {
          if (info?.messageID && global.GoatBot?.onReply) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
          }
        },
        event.messageID
      );
    } catch (err) {
      console.error("Baby onReply Error:", err);

      return api.sendMessage(
        `❌ | Error: ${err.message}`,
        event.threadID,
        () => {},
        event.messageID
      );
    }
  },

  onChat: async function ({ api, event, usersData }) {
    const commandName = this.config.name;

    try {
      const body = event.body
        ? event.body.toLowerCase()
        : "";

      const hasTrigger = triggers.some((trigger) =>
        body.startsWith(trigger)
      );

      if (!hasTrigger) return;

      if (event.attachments?.length > 0) {
        const handled = await sendAttachmentReply(
          api,
          event,
          commandName
        );

        if (handled) return;
      }

      const arr = body.replace(/^\S+\s*/, "");
      const uid = event.senderID;

      let senderName = "User";

      try {
        senderName =
          (await usersData.getName(uid)) || "User";
      } catch {
        senderName = "User";
      }

      if (!arr) {
        const baseReplies = [
          "তোর তো বিয়ে হয় নাই বেবি পাইলি কই-🤦🏻",
          "পরকিয়া করছোছ নাকি শালা-🥲🤧",
          "তোকে ছাড়া বড় মন খারাপ লাগে 💔",
          "তোরে খুব মিস করছি জানিস? 🥺",
          "ডিসটার্ব করিস না জামাই আদর করতেছে-🌚💋",
          "এত ডাকিস না এমন থাপ্পর দিমু পেন্টে মুইতা দিবি-😾👋🏻",
          "বেবি ডাকিস না 🍼 খাওয়া-😒👍🏻",
          "কি ডাকোস কেন টাকা শেষ নাকি-🌚🤌🏻",
          "পিনিক ধরেছে যখন বটকে না ডেকে লেবু খান তখন🍋🐸",
          "ভিডিও কল দিব নাকি সোনা 🌚🫦",
          "আম্মু ডাক শালা 😾🦶🏻",
          "বেবি না ডাইকা গার্লফ্রেন্ড খুজে দে-🙃🫶🏻",
          "ডাকিস না তারেক জিয়ার সাথে মিটিংয়ে আছি 😒🖐🏻",
          "বস ডাক বস😾✌🏻",
          "বেবি ডাকিস না পরে কোলে উঠে অন্য কিছু খেতে মন চাইবে🌚💋"
        ];

        const mentionObj = utils.realMention(
          senderName,
          uid,
          baseReplies[
            Math.floor(Math.random() * baseReplies.length)
          ]
        );

        return await api.sendMessage(
          mentionObj,
          event.threadID,
          (error, info) => {
            if (
              info?.messageID &&
              global.GoatBot?.onReply
            ) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName,
                type: "reply",
                messageID: info.messageID,
                author: event.senderID
              });
            }
          },
          event.messageID
        );
      }

      const data = await fetchWithFallback(
        `/baby?text=${encodeURIComponent(arr)}&senderID=${uid}&threadID=${event.threadID}&font=1`
      );

      const replyText = utils.monospace(data.reply);

      return await api.sendMessage(
        replyText,
        event.threadID,
        (error, info) => {
          if (
            info?.messageID &&
            global.GoatBot?.onReply
          ) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
          }
        },
        event.messageID
      );
    } catch (err) {
      console.error("onChat Error:", err);
    }
  },

  onEvent: function (args) {
    return this.onChat(args);
  }
};