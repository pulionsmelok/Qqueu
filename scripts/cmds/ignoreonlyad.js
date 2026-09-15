const fs = require("fs-extra");

function getConfig() {
	global.GoatBot.config.adminOnly = global.GoatBot.config.adminOnly || {};
	if (!Array.isArray(global.GoatBot.config.adminOnly.ignoreCommand))
		global.GoatBot.config.adminOnly.ignoreCommand = [];
	return global.GoatBot.config;
}

function resolveCommand(name) {
	const key = String(name || "").trim().toLowerCase();
	if (!key) return null;
	const commands = global.GoatBot.commands;
	return commands.get(key) || commands.get(global.GoatBot.aliases?.get(key)) || null;
}

function canonicalName(name) {
	return resolveCommand(name)?.config?.name?.toLowerCase() || String(name || "").trim().toLowerCase();
}

module.exports = {
	config: {
    name: "ignoreonlyad",
        aliases: ["ignoreadonly", "ignoreonlyadmin", "ignoreadminonly"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Cho phép lệnh được dùng khi adminonly đang bật",
            en: "Allow selected commands to work while adminonly is enabled",
            bn: "Allow selected কমান্ডগুলো এ work while adminonly is enabled"
        },
        category: "owner",
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
			commandAlreadyInList: "❌ Command \"%1\" is already in the ignore list.",
			commandAdded: "✅ Added command \"%1\" to the adminonly ignore list.",
			commandNotInList: "❌ Command \"%1\" is not in the ignore list.",
			commandDeleted: "✅ Removed command \"%1\" from the adminonly ignore list.",
			ignoreList: "📑 Adminonly ignore list:\n%1"
		},
		bn: {
			missingCommandNameToAdd: "⚠️ অনুগ্রহ করে লিখুন a কমান্ড নাম.",
			missingCommandNameToDelete: "⚠️ অনুগ্রহ করে লিখুন a কমান্ড নাম.",
			commandNotFound: "❌ কমান্ড \"%1\" was পাওয়া যায়নি.",
			commandAlreadyInList: "❌ কমান্ড \"%1\" is ইতোমধ্যে in the ignore তালিকা.",
			commandAdded: "✅ যোগ করা হয়েছে কমান্ড \"%1\" এ the adminonly ignore তালিকা.",
			commandNotInList: "❌ কমান্ড \"%1\" is not in the ignore তালিকা.",
			commandDeleted: "✅ সরিয়ে দেওয়া হয়েছে কমান্ড \"%1\" থেকে the adminonly ignore তালিকা.",
			ignoreList: "📑 Adminonly ignore তালিকা:\n%1"
		},
		vi: {
			missingCommandNameToAdd: "⚠️ Vui lòng nhập tên lệnh.",
			missingCommandNameToDelete: "⚠️ Vui lòng nhập tên lệnh.",
			commandNotFound: "❌ Không tìm thấy lệnh \"%1\".",
			commandAlreadyInList: "❌ Lệnh \"%1\" đã có trong danh sách.",
			commandAdded: "✅ Đã thêm lệnh \"%1\" vào danh sách bỏ qua adminonly.",
			commandNotInList: "❌ Lệnh \"%1\" không có trong danh sách.",
			commandDeleted: "✅ Đã xóa lệnh \"%1\" khỏi danh sách.",
			ignoreList: "📑 Danh sách bỏ qua adminonly:\n%1"
		}
	},
	onStart: async function ({ args, message, getLang }) {
		const config = getConfig();
		const list = config.adminOnly.ignoreCommand;
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
			await fs.writeJson(global.client.dirConfig, config, { spaces: 2 });
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
			await fs.writeJson(global.client.dirConfig, config, { spaces: 2 });
			return message.reply(getLang("commandDeleted", name));
		}
		return message.SyntaxError();
	}
};
