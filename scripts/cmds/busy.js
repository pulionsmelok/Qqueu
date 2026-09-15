if (!global.client.busyList)
	global.client.busyList = {};

module.exports = {
	config: {
    name: "busy",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "bật chế độ không làm phiền, khi bạn được tag bot sẽ thông báo",
            en: "turn on do not disturb mode, when you are tagged bot will notify",
            bn: "turn on করবেন না disturb মোড, when আপনি are tagged bot will notify"
        },
        category: "box chat",
        guide: {
            vi: "   {pn} [để trống | <lý do>]: bật chế độ không làm phiền"
        			+ "\n   {pn} off: tắt chế độ không làm phiền",
            en: "   {pn} [empty | <reason>]: turn on do not disturb mode"
        			+ "\n   {pn} off: turn off do not disturb mode",
            bn: "   {pn} [empty | <কারণ>]: turn on করবেন না disturb মোড"
        			+ "\n   {pn} off: turn off করবেন না disturb মোড"
        }
},
	langs: {
		vi: {
			turnedOff: "✅ | Đã tắt chế độ không làm phiền",
			turnedOn: "✅ | Đã bật chế độ không làm phiền",
			turnedOnWithReason: "✅ | Đã bật chế độ không làm phiền với lý do: %1",
			turnedOnWithoutReason: "✅ | Đã bật chế độ không làm phiền",
			alreadyOn: "Hiện tại người dùng %1 đang bận",
			alreadyOnWithReason: "Hiện tại người dùng %1 đang bận với lý do: %2"
		},
		en: {
			turnedOff: "✅ | Do not disturb mode has been turned off",
			turnedOn: "✅ | Do not disturb mode has been turned on",
			turnedOnWithReason: "✅ | Do not disturb mode has been turned on with reason: %1",
			turnedOnWithoutReason: "✅ | Do not disturb mode has been turned on",
			alreadyOn: "User %1 is currently busy",
			alreadyOnWithReason: "User %1 is currently busy with reason: %2"
		},
		bn: {
			turnedOff: "✅ | করবেন না disturb মোড has been turned off",
			turnedOn: "✅ | করবেন না disturb মোড has been turned on",
			turnedOnWithReason: "✅ | করবেন না disturb মোড has been turned on সহ কারণ: %1",
			turnedOnWithoutReason: "✅ | করবেন না disturb মোড has been turned on",
			alreadyOn: "ব্যবহারকারী %1 is currently busy",
			alreadyOnWithReason: "ব্যবহারকারী %1 is currently busy সহ কারণ: %2"
		}
	},
	onStart: async function ({ args, message, event, getLang, usersData }) {
		const { senderID } = event;
		if (args[0] == "off") {
			const { data } = await usersData.get(senderID);
			delete data.busy;
			await usersData.set(senderID, data, "data");
			return message.reply(getLang("turnedOff"));
		}
		const reason = args.join(" ") || "";
		await usersData.set(senderID, reason, "data.busy");
		return message.reply(
			reason ?
				getLang("turnedOnWithReason", reason) :
				getLang("turnedOnWithoutReason")
		);
	},
	onChat: async ({ event, message, getLang }) => {
		const { mentions } = event;
		if (!mentions || Object.keys(mentions).length == 0)
			return;
		const arrayMentions = Object.keys(mentions);
		for (const userID of arrayMentions) {
			const reasonBusy = global.db.allUserData.find(item => item.userID == userID)?.data.busy || false;
			if (reasonBusy !== false) {
				return message.reply(
					reasonBusy ?
						getLang("alreadyOnWithReason", mentions[userID].replace("@", ""), reasonBusy) :
						getLang("alreadyOn", mentions[userID].replace("@", "")));
			}
		}
	}
};
