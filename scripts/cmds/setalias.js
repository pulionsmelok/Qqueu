module.exports = {
	config: {
    name: "setalias",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Thêm tên gọi khác cho 1 lệnh bất kỳ trong nhóm của bạn",
            en: "Add an alias for any command in your group",
            bn: "Add an alias জন্য any কমান্ড in আপনার গ্রুপ"
        },
        category: "config",
        guide: {
            vi: "  Lệnh dùng để thêm/xóa tên gọi khác cho 1 lệnh nào đó để tiện sử dụng trong nhóm chat của bạn"
        			+ "\n   {pn} add <tên gọi khác> <tên lệnh>: dùng để thêm tên gọi khác cho lệnh trong nhóm chat của bạn"
        			+ "\n   {pn} add <tên gọi khác> <tên lệnh> -g: dùng để thêm tên gọi khác cho lệnh trong toàn hệ thống (chỉ admin bot)"
        			+ "\nVí dụ:\n    {pn} add ctrk customrankcard"
        			+ "\n\n   {pn} [remove | rm] <tên gọi khác> <tên lệnh>: dùng để xóa tên gọi khác của lệnh trong nhóm chat của bạn"
        			+ "\n   {pn} [remove | rm] <tên gọi khác> <tên lệnh> -g: dùng để xóa tên gọi khác của lệnh trong toàn hệ thống (chỉ admin bot)"
        			+ "\nVí dụ:\n    {pn} rm ctrk customrankcard"
        			+ "\n\n   {pn} list: dùng để xem danh sách tên gọi khác của các lệnh trong nhóm bạn"
        			+ "\n   {pn} list -g: dùng để xem danh sách tên gọi khác của các lệnh trong nhóm bạn",
            en: "  This command is used to add/remove alias for any command in your group"
        			+ "\n   {pn} add <alias> <command>: add an alias for the command in your group"
        			+ "\n   {pn} add <alias> <command> -g: add an alias for the command in the whole system (only bot admin)"
        			+ "\nExample:\n    {pn} add ctrk customrankcard"
        			+ "\n\n   {pn} [remove | rm] <alias> <command>: remove an alias for the command in your group"
        			+ "\n   {pn} [remove | rm] <alias> <command> -g: remove an alias for the command in the whole system (only bot admin)"
        			+ "\nExample:\n    {pn} rm ctrk customrankcard"
        			+ "\n\n   {pn} list: list all alias for commands in your group"
        			+ "\n   {pn} list -g: list all alias for commands in the whole system",
            bn: "  This কমান্ড is used এ যোগ/অপসারণ alias জন্য any কমান্ড in আপনার গ্রুপ"
        			+ "\n   {pn} যোগ <alias> <কমান্ড>: যোগ an alias জন্য the কমান্ড in আপনার গ্রুপ"
        			+ "\n   {pn} যোগ <alias> <কমান্ড> -g: যোগ an alias জন্য the কমান্ড in the whole system (only bot admin)"
        			+ "\nExample:\n    {pn} যোগ ctrk customrankcard"
        			+ "\n\n   {pn} [অপসারণ | rm] <alias> <কমান্ড>: অপসারণ an alias জন্য the কমান্ড in আপনার গ্রুপ"
        			+ "\n   {pn} [অপসারণ | rm] <alias> <কমান্ড> -g: অপসারণ an alias জন্য the কমান্ড in the whole system (only bot admin)"
        			+ "\nExample:\n    {pn} rm ctrk customrankcard"
        			+ "\n\n   {pn} তালিকা: তালিকা all alias জন্য কমান্ডগুলো in আপনার গ্রুপ"
        			+ "\n   {pn} তালিকা -g: তালিকা all alias জন্য কমান্ডগুলো in the whole system"
        }
},
	langs: {
		vi: {
			commandNotExist: "❌ Lệnh \"%1\" không tồn tại",
			aliasExist: "❌ Tên gọi \"%1\" đã tồn tại cho lệnh \"%2\" trong hệ thống",
			addAliasSuccess: "✅ Đã thêm tên gọi \"%1\" cho lệnh \"%2\" trong hệ thống",
			noPermissionAdd: "❌ Bạn không có quyền thêm tên gọi \"%1\" cho lệnh \"%2\" trong hệ thống",
			aliasIsCommand: "❌ Tên gọi \"%1\" trùng với tên lệnh khác trong hệ thống bot",
			aliasExistInGroup: "❌ Tên gọi \"%1\" đã tồn tại cho lệnh \"%2\" trong nhóm này",
			addAliasToGroupSuccess: "✅ Đã thêm tên gọi \"%1\" cho lệnh \"%2\" trong nhóm chat của bạn",
			aliasNotExist: "❌ Tên gọi \"%1\" không tồn tại trong lệnh \"%2\"",
			removeAliasSuccess: "✅ Đã xóa tên gọi \"%1\" cho lệnh \"%2\" trong hệ thống",
			noPermissionDelete: "❌ Bạn không có quyền xóa tên gọi \"%1\" cho lệnh \"%2\" trong hệ thống",
			noAliasInGroup: "❌ Lệnh \"%1\" không có tên gọi khác nào trong nhóm của bạn",
			removeAliasInGroupSuccess: "✅ Đã xóa tên gọi \"%1\" khỏi lệnh \"%2\" trong nhóm chat của bạn",
			aliasList: "📜 Danh sách tên gọi khác của các lệnh trong hệ thống:\n%1",
			noAliasInSystem: "⚠️ Hiện tại không có tên gọi nào trong hệ thống",
			notExistAliasInGroup: "⚠️ Nhóm bạn chưa cài đặt tên gọi khác cho lệnh nào cả",
			aliasListInGroup: "📜 Danh sách tên gọi khác của các lệnh trong nhóm chat của bạn:\n%1"
		},
		en: {
			commandNotExist: "❌ Command \"%1\" does not exist",
			aliasExist: "❌ Alias \"%1\" already exists for command \"%2\" in the system",
			addAliasSuccess: "✅ Added alias \"%1\" for command \"%2\" in the system",
			noPermissionAdd: "❌ You do not have permission to add alias \"%1\" for command \"%2\" in the system",
			aliasIsCommand: "❌ Alias \"%1\" is the same as another command in the system",
			aliasExistInGroup: "❌ Alias \"%1\" already exists for command \"%2\" in this group",
			addAliasToGroupSuccess: "✅ Added alias \"%1\" for command \"%2\" in your group chat",
			aliasNotExist: "❌ Alias \"%1\" does not exist for command \"%2\"",
			removeAliasSuccess: "✅ Removed alias \"%1\" for command \"%2\" in the system",
			noPermissionDelete: "❌ You do not have permission to remove alias \"%1\" for command \"%2\" in the system",
			noAliasInGroup: "❌ Command \"%1\" does not have any other alias in your group",
			removeAliasInGroupSuccess: "✅ Removed alias \"%1\" for command \"%2\" in your group chat",
			aliasList: "📜 List of other aliases for commands in the system:\n%1",
			noAliasInSystem: "⚠️ There are no aliases in the system",
			notExistAliasInGroup: "⚠️ Your group has not set any other aliases for commands",
			aliasListInGroup: "📜 List of other aliases for commands in your group chat:\n%1"
		},
		bn: {
			commandNotExist: "❌ কমান্ড \"%1\" অস্তিত্ব নেই",
			aliasExist: "❌ Alias \"%1\" ইতোমধ্যে exists জন্য কমান্ড \"%2\" in the system",
			addAliasSuccess: "✅ যোগ করা হয়েছে alias \"%1\" জন্য কমান্ড \"%2\" in the system",
			noPermissionAdd: "❌ আপনি করবেন না have permission এ যোগ alias \"%1\" জন্য কমান্ড \"%2\" in the system",
			aliasIsCommand: "❌ Alias \"%1\" is the same as another কমান্ড in the system",
			aliasExistInGroup: "❌ Alias \"%1\" ইতোমধ্যে exists জন্য কমান্ড \"%2\" in this গ্রুপ",
			addAliasToGroupSuccess: "✅ যোগ করা হয়েছে alias \"%1\" জন্য কমান্ড \"%2\" in আপনার গ্রুপ chat",
			aliasNotExist: "❌ Alias \"%1\" অস্তিত্ব নেই জন্য কমান্ড \"%2\"",
			removeAliasSuccess: "✅ সরিয়ে দেওয়া হয়েছে alias \"%1\" জন্য কমান্ড \"%2\" in the system",
			noPermissionDelete: "❌ আপনি করবেন না have permission এ অপসারণ alias \"%1\" জন্য কমান্ড \"%2\" in the system",
			noAliasInGroup: "❌ কমান্ড \"%1\" does not have any other alias in আপনার গ্রুপ",
			removeAliasInGroupSuccess: "✅ সরিয়ে দেওয়া হয়েছে alias \"%1\" জন্য কমান্ড \"%2\" in আপনার গ্রুপ chat",
			aliasList: "📜 তালিকা এর other aliases জন্য কমান্ডগুলো in the system:\n%1",
			noAliasInSystem: "⚠️ There are no aliases in the system",
			notExistAliasInGroup: "⚠️ আপনার গ্রুপ has not set any other aliases জন্য কমান্ডগুলো",
			aliasListInGroup: "📜 তালিকা এর other aliases জন্য কমান্ডগুলো in আপনার গ্রুপ chat:\n%1"
		}
	},
	onStart: async function ({ message, event, args, threadsData, globalData, role, getLang }) {
		const aliasesData = await threadsData.get(event.threadID, "data.aliases", {});
		switch (args[0]) {
			case "add": {
				if (!args[2])
					return message.SyntaxError();
				const commandName = args[2].toLowerCase();
				if (!global.GoatBot.commands.has(commandName))
					return message.reply(getLang("commandNotExist", commandName));
				const alias = args[1].toLowerCase();
				if (args[3] == '-g') {
					if (role > 1) {
						const globalAliasesData = await globalData.get('setalias', 'data', []);
						const globalAliasesExist = globalAliasesData.find(item => item.aliases.includes(alias));
						if (globalAliasesExist)
							return message.reply(getLang("aliasExist", alias, globalAliasesExist.commandName));
						if (global.GoatBot.aliases.has(alias))
							return message.reply(getLang("aliasExist", alias, global.GoatBot.aliases.get(alias)));
						const globalAliasesThisCommand = globalAliasesData.find(aliasData => aliasData.commandName == commandName);
						if (globalAliasesThisCommand)
							globalAliasesThisCommand.aliases.push(alias);
						else
							globalAliasesData.push({
								commandName,
								aliases: [alias]
							});
						await globalData.set('setalias', globalAliasesData, 'data');
						global.GoatBot.aliases.set(alias, commandName);
						return message.reply(getLang("addAliasSuccess", alias, commandName));
					}
					else {
						return message.reply(getLang("noPermissionAdd", alias, commandName));
					}
				}
				if (global.GoatBot.commands.get(alias))
					return message.reply(getLang("aliasIsCommand", alias));
				if (global.GoatBot.aliases.has(alias))
					return message.reply(getLang("aliasExist", alias, global.GoatBot.aliases.get(alias)));
				for (const cmdName in aliasesData)
					if (aliasesData[cmdName].includes(alias))
						return message.reply(getLang("aliasExistInGroup", alias, cmdName));
				const oldAlias = aliasesData[commandName] || [];
				oldAlias.push(alias);
				aliasesData[commandName] = oldAlias;
				await threadsData.set(event.threadID, aliasesData, "data.aliases");
				return message.reply(getLang("addAliasToGroupSuccess", alias, commandName));
			}
			case "remove":
			case "rm": {
				if (!args[2])
					return message.SyntaxError();
				const commandName = args[2].toLowerCase();
				const alias = args[1].toLowerCase();
				if (!global.GoatBot.commands.has(commandName))
					return message.reply(getLang("commandNotExist", commandName));
				if (args[3] == '-g') {
					if (role > 1) {
						const globalAliasesData = await globalData.get('setalias', 'data', []);
						const globalAliasesThisCommand = globalAliasesData.find(aliasData => aliasData.commandName == commandName);
						if (!globalAliasesThisCommand || !globalAliasesThisCommand.aliases.includes(alias))
							return message.reply(getLang("aliasNotExist", alias, commandName));
						globalAliasesThisCommand.aliases.splice(globalAliasesThisCommand.aliases.indexOf(alias), 1);
						await globalData.set('setalias', globalAliasesData, 'data');
						global.GoatBot.aliases.delete(alias);
						return message.reply(getLang("removeAliasSuccess", alias, commandName));
					}
					else {
						return message.reply(getLang("noPermissionDelete", alias, commandName));
					}
				}
				const oldAlias = aliasesData[commandName];
				if (!oldAlias)
					return message.reply(getLang("noAliasInGroup", commandName));
				const index = oldAlias.indexOf(alias);
				if (index === -1)
					return message.reply(getLang("aliasNotExist", alias, commandName));
				oldAlias.splice(index, 1);
				await threadsData.set(event.threadID, aliasesData, "data.aliases");
				return message.reply(getLang("removeAliasInGroupSuccess", alias, commandName));
			}
			case "list": {
				if (args[1] == '-g') {
					const globalAliasesData = await globalData.get('setalias', 'data', []);
					const globalAliases = globalAliasesData.map(aliasData => ({
						commandName: aliasData.commandName,
						aliases: aliasData.aliases.join(', ')
					}));
					return message.reply(
						globalAliases.length ?
							getLang("aliasList", globalAliases.map(alias => `• ${alias.commandName}: ${alias.aliases}`).join('\n')) :
							getLang("noAliasInSystem")
					);
				}
				if (!Object.keys(aliasesData).length)
					return message.reply(getLang("notExistAliasInGroup"));
				const list = Object.keys(aliasesData).map(commandName => `\n• ${commandName}: ${aliasesData[commandName].join(", ")} `);
				return message.reply(getLang("aliasListInGroup", list.join("\n")));
			}
			default: {
				return message.SyntaxError();
			}
		}
	}
};
