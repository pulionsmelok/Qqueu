const DEFAULT_PATH = "data.ignoreCommandToOnlyAdminBox";

function resolveCommand(name) {
	const key = String(name || "").trim().toLowerCase();
	if (!key) return null;
	return global.GoatBot.commands.get(key) || global.GoatBot.commands.get(global.GoatBot.aliases?.get(key)) || null;
}

function canonicalName(name) {
	return resolveCommand(name)?.config?.name?.toLowerCase() || String(name || "").trim().toLowerCase();
}

module.exports = {
	config: {
    name: "ignoreonlyadbox",
        aliases: ["ignoreadboxonly", "ignoreadminboxonly"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Cho phép chọn lệnh được dùng khi onlyadminbox đang bật",
            en: "Allow selected commands to work while onlyadminbox is enabled",
            bn: "Allow selected কমান্ডগুলো এ work while onlyadminbox is enabled"
        },
        category: "box chat",
        guide: {
            vi: "{pn} add <command> | {pn} del <command> | {pn} list",
            en: "{pn} add <command> | {pn} del <command> | {pn} list",
            bn: "{pn} যোগ <কমান্ড> | {pn} del <কমান্ড> | {pn} তালিকা"
        }
},
	langs: {
		en: {
			missingCommandNameToAdd: "⚠️ Please enter a command name.",
			missingCommandNameToDelete: "⚠️ Please enter a command name.",
			commandNotFound: "❌ Command \"%1\" was not found.",
			commandAlreadyInList: "❌ Command \"%1\" is already allowed.",
			commandAdded: "✅ Added \"%1\" to the onlyadminbox ignore list.",
			commandNotInList: "❌ Command \"%1\" is not in the list.",
			commandDeleted: "✅ Removed \"%1\" from the onlyadminbox ignore list.",
			ignoreList: "📑 This group's onlyadminbox ignore list:\n%1"
		},
		bn: {
			missingCommandNameToAdd: "⚠️ অনুগ্রহ করে লিখুন a কমান্ড নাম.",
			missingCommandNameToDelete: "⚠️ অনুগ্রহ করে লিখুন a কমান্ড নাম.",
			commandNotFound: "❌ কমান্ড \"%1\" was পাওয়া যায়নি.",
			commandAlreadyInList: "❌ কমান্ড \"%1\" is ইতোমধ্যে allowed.",
			commandAdded: "✅ যোগ করা হয়েছে \"%1\" এ the onlyadminbox ignore তালিকা.",
			commandNotInList: "❌ কমান্ড \"%1\" is not in the তালিকা.",
			commandDeleted: "✅ সরিয়ে দেওয়া হয়েছে \"%1\" থেকে the onlyadminbox ignore তালিকা.",
			ignoreList: "📑 This গ্রুপ's onlyadminbox ignore তালিকা:\n%1"
		},
		vi: {
			missingCommandNameToAdd: "⚠️ Vui lòng nhập tên lệnh.",
			missingCommandNameToDelete: "⚠️ Vui lòng nhập tên lệnh.",
			commandNotFound: "❌ Không tìm thấy lệnh \"%1\".",
			commandAlreadyInList: "❌ Lệnh \"%1\" đã có trong danh sách.",
			commandAdded: "✅ Đã thêm \"%1\" vào danh sách bỏ qua onlyadminbox.",
			commandNotInList: "❌ Lệnh \"%1\" không có trong danh sách.",
			commandDeleted: "✅ Đã xóa \"%1\" khỏi danh sách.",
			ignoreList: "📑 Nhóm này đang bỏ qua onlyadminbox cho:\n%1"
		}
	},
	onStart: async function ({ args, message, threadsData, event, getLang }) {
		const threadID = event.threadID;
		let list = await threadsData.get(threadID, DEFAULT_PATH, []);
		if (!Array.isArray(list)) list = [];
		list = list.map(String);
		const action = String(args[0] || "").toLowerCase();
		const rawName = args[1];
		if (action === "list")
			return message.reply(getLang("ignoreList", list.length ? list.join(", ") : "(empty)"));
		if (["add", "set", "+"].includes(action)) {
			if (!rawName) return message.reply(getLang("missingCommandNameToAdd"));
			const command = resolveCommand(rawName);
			if (!command) return message.reply(getLang("commandNotFound", rawName));
			const name = canonicalName(rawName);
			if (list.includes(name)) return message.reply(getLang("commandAlreadyInList", name));
			list.push(name);
			await threadsData.set(threadID, list, DEFAULT_PATH);
			return message.reply(getLang("commandAdded", name));
		}
		if (["del", "delete", "remove", "rm", "-d", "-"].includes(action)) {
			if (!rawName) return message.reply(getLang("missingCommandNameToDelete"));
			const command = resolveCommand(rawName);
			if (!command) return message.reply(getLang("commandNotFound", rawName));
			const name = canonicalName(rawName);
			const index = list.indexOf(name);
			if (index === -1) return message.reply(getLang("commandNotInList", name));
			list.splice(index, 1);
			await threadsData.set(threadID, list, DEFAULT_PATH);
			return message.reply(getLang("commandDeleted", name));
		}
		return message.SyntaxError();
	}
};
