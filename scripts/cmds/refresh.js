module.exports = {
	config: {
    name: "refresh",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 20,
        role: 2,
        usePrefix: true,
    description: {
            vi: "làm mới thông tin nhóm chat hoặc người dùng",
            en: "refresh information of group chat or user",
            bn: "refresh information এর গ্রুপ chat অথবা ব্যবহারকারী"
        },
        category: "box chat",
        guide: {
            vi: "   {pn} [thread | group]: làm mới thông tin nhóm chat của bạn"
        			+ "\n   {pn} group <threadID>: làm mới thông tin nhóm chat theo ID"
        			+ "\n\n   {pn} user: làm mới thông tin người dùng của bạn"
        			+ "\n   {pn} user [<userID> | @tag]: làm mới thông tin người dùng theo ID",
            en: "   {pn} [thread | group]: refresh information of your group chat"
        			+ "\n   {pn} group <threadID>: refresh information of group chat by ID"
        			+ "\n\n   {pn} user: refresh information of your user"
        			+ "\n   {pn} user [<userID> | @tag]: refresh information of user by ID",
            bn: "   {pn} [thread | গ্রুপ]: refresh information এর আপনার গ্রুপ chat"
        			+ "\n   {pn} গ্রুপ <threadID>: refresh information এর গ্রুপ chat by ID"
        			+ "\n\n   {pn} ব্যবহারকারী: refresh information এর আপনার ব্যবহারকারী"
        			+ "\n   {pn} ব্যবহারকারী [<userID> | @tag]: refresh information এর ব্যবহারকারী by ID"
        }
},
	langs: {
		vi: {
			refreshMyThreadSuccess: "✅ | Đã làm mới thông tin nhóm chat của bạn thành công!",
			refreshThreadTargetSuccess: "✅ | Đã làm mới thông tin nhóm chat %1 thành công!",
			errorRefreshMyThread: "❌ | Đã xảy ra lỗi không thể làm mới thông tin nhóm chat của bạn",
			errorRefreshThreadTarget: "❌ | Đã xảy ra lỗi không thể làm mới thông tin nhóm chat %1",
			refreshMyUserSuccess: "✅ | Đã làm mới thông tin người dùng của bạn thành công!",
			refreshUserTargetSuccess: "✅ | Đã làm mới thông tin người dùng %1 thành công!",
			errorRefreshMyUser: "❌ | Đã xảy ra lỗi không thể làm mới thông tin người dùng của bạn",
			errorRefreshUserTarget: "❌ | Đã xảy ra lỗi không thể làm mới thông tin người dùng %1"
		},
		en: {
			refreshMyThreadSuccess: "✅ | Refresh information of your group chat successfully!",
			refreshThreadTargetSuccess: "✅ | Refresh information of group chat %1 successfully!",
			errorRefreshMyThread: "❌ | Error when refresh information of your group chat",
			errorRefreshThreadTarget: "❌ | Error when refresh information of group chat %1",
			refreshMyUserSuccess: "✅ | Refresh information of your user successfully!",
			refreshUserTargetSuccess: "✅ | Refresh information of user %1 successfully!",
			errorRefreshMyUser: "❌ | Error when refresh information of your user",
			errorRefreshUserTarget: "❌ | Error when refresh information of user %1"
		},
		bn: {
			refreshMyThreadSuccess: "✅ | Refresh information এর আপনার গ্রুপ chat সফলভাবে!",
			refreshThreadTargetSuccess: "✅ | Refresh information এর গ্রুপ chat %1 সফলভাবে!",
			errorRefreshMyThread: "❌ | ত্রুটি when refresh information এর আপনার গ্রুপ chat",
			errorRefreshThreadTarget: "❌ | ত্রুটি when refresh information এর গ্রুপ chat %1",
			refreshMyUserSuccess: "✅ | Refresh information এর আপনার ব্যবহারকারী সফলভাবে!",
			refreshUserTargetSuccess: "✅ | Refresh information এর ব্যবহারকারী %1 সফলভাবে!",
			errorRefreshMyUser: "❌ | ত্রুটি when refresh information এর আপনার ব্যবহারকারী",
			errorRefreshUserTarget: "❌ | ত্রুটি when refresh information এর ব্যবহারকারী %1"
		}
	},
	onStart: async function ({ args, threadsData, message, event, usersData, getLang }) {
		const type = String(args[0] || "").toLowerCase();
		if (type === "group" || type === "thread") {
			const target = String(args[1] || "").trim().toLowerCase();
			if (target === "all") {
				try {
					const allThreads = await threadsData.getAll();
					let success = 0;
					for (const thread of allThreads || []) {
						const id = thread?.threadID ?? thread?.id;
						if (id === undefined || id === null || String(id).trim() === "") continue;
						try {
							await threadsData.refreshInfo(String(id));
							success++;
						} catch (_) {}
					}
					return message.reply(`✅ | Refreshed ${success}/${(allThreads || []).length} stored group(s).`);
				} catch (error) {
					return message.reply(`❌ | Failed to refresh all groups: ${error.message || error}`);
				}
			}
			const targetID = args[1] || event.threadID;
			try {
				await threadsData.refreshInfo(String(targetID));
				return message.reply(String(targetID) === String(event.threadID)
					? getLang("refreshMyThreadSuccess")
					: getLang("refreshThreadTargetSuccess", targetID));
			} catch (error) {
				return message.reply(String(targetID) === String(event.threadID)
					? getLang("errorRefreshMyThread")
					: getLang("errorRefreshThreadTarget", targetID));
			}
		}
		if (type === "user") {
			let targetID = event.messageReply?.senderID || event.senderID;
			const target = String(args[1] || "").trim();
			if (target.toLowerCase() === "all") {
				try {
					const allUsers = await usersData.getAll();
					let success = 0;
					for (const user of allUsers || []) {
						const id = user?.userID ?? user?.id;
						if (id === undefined || id === null || String(id).trim() === "") continue;
						try {
							await usersData.refreshInfo(String(id));
							success++;
						} catch (_) {}
					}
					return message.reply(`✅ | Refreshed ${success}/${(allUsers || []).length} stored user(s).`);
				} catch (error) {
					return message.reply(`❌ | Failed to refresh all users: ${error.message || error}`);
				}
			}
			if (target) {
				if (event.mentions && Object.keys(event.mentions).length)
					targetID = Object.keys(event.mentions)[0];
				else
					targetID = target;
			}
			try {
				await usersData.refreshInfo(String(targetID));
				return message.reply(String(targetID) === String(event.senderID) && !event.messageReply
					? getLang("refreshMyUserSuccess")
					: getLang("refreshUserTargetSuccess", targetID));
			} catch (error) {
				return message.reply(String(targetID) === String(event.senderID) && !event.messageReply
					? getLang("errorRefreshMyUser")
					: getLang("errorRefreshUserTarget", targetID));
			}
		}
		return message.SyntaxError();
	}
};
