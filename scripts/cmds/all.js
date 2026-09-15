module.exports = {
  config: {
    name: "all",
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 1,
    usePrefix: true,
    description: {
      en: "Tag all known members in your group chat",
      bn: "গ্রুপের পরিচিত সকল মেম্বারকে মেনশন করুন"
    },
    category: "box chat",
    guide: {
      en: "{pn} [content]",
      bn: "{pn} [বার্তা]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    if (!event.isGroup) return message.reply("❌ This command can only be used in a group.");

    const chatId = String(event.threadID);
    const members = new Map();
    const cached = api?.chatMembers?.get?.(chatId);
    if (cached instanceof Map) {
      for (const [id, user] of cached) {
        if (id && user) members.set(String(id), user);
      }
    }

    try {
      const admins = await api.getChatAdministrators(chatId);
      for (const item of admins || []) {
        const u = item?.user;
        if (!u?.id) continue;
        members.set(String(u.id), {
          id: String(u.id),
          name: [u.first_name, u.last_name].filter(Boolean).join(" ") || (u.username ? `@${u.username}` : `User ${u.id}`),
          username: u.username
        });
      }
    } catch (_) {}

    // Always include the sender if available.
    if (event.senderID && !members.has(String(event.senderID))) {
      const u = event.from || {};
      members.set(String(event.senderID), {
        id: String(event.senderID),
        name: [u.first_name, u.last_name].filter(Boolean).join(" ") || (u.username ? `@${u.username}` : `User ${event.senderID}`),
        username: u.username
      });
    }

    if (!members.size) {
      return message.reply("❌ No cached group members are available yet. Ask members to send a message first, then try again.");
    }

    const content = args.join(" ").trim();
    const lines = [];
    if (content) lines.push(content, "");

    const mentions = [];
    let index = 1;
    for (const [id, user] of members) {
     
      const name = String(user.name || (user.username ? `@${user.username}` : `User ${id}`)).trim() || `User ${id}`;
      const tag = `@${name.replace(/^@/, "")}`;
      lines.push(`${index}. ${tag}`);
      mentions.push({ id, tag });
      index++;
    }

    await message.reply({
      body: lines.join("\n"),
      mentions
    });
  }
};
