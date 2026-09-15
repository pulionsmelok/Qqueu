module.exports = {
	config: {
    name: "onlyadminbox",
        aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "bật/tắt chế độ chỉ quản trị của viên nhóm mới có thể sử dụng bot",
            en: "turn on/off only admin box can use bot",
            bn: "turn on/off only admin box can use bot"
        },
        category: "box chat",
        guide: {
            vi: "   {pn} [on | off]: bật/tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot"
        			+ "\n   {pn} noti [on | off]: bật/tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
            en: "   {pn} [on | off]: turn on/off the mode only admin of group can use bot"
        			+ "\n   {pn} noti [on | off]: turn on/off the notification when user is not admin of group use bot",
            bn: "   {pn} [on | off]: turn on/off the মোড only গ্রুপের অ্যাডমিন can use bot"
        			+ "\n   {pn} noti [on | off]: turn on/off the বিজ্ঞপ্তি when ব্যবহারকারী is not গ্রুপের অ্যাডমিন use bot"
        }
},
	langs: {
		vi: {
			turnedOn: "Đã bật chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot",
			turnedOff: "Đã tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot",
			turnedOnNoti: "Đã bật thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
			turnedOffNoti: "Đã tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
			syntaxError: "Sai cú pháp, chỉ có thể dùng {pn} on hoặc {pn} off"
		},
		en: {
			turnedOn: "Turned on the mode only admin of group can use bot",
			turnedOff: "Turned off the mode only admin of group can use bot",
			turnedOnNoti: "Turned on the notification when user is not admin of group use bot",
			turnedOffNoti: "Turned off the notification when user is not admin of group use bot",
			syntaxError: "Syntax error, only use {pn} on or {pn} off"
		},
		bn: {
			turnedOn: "চালু করা হয়েছে the মোড only গ্রুপের অ্যাডমিন can use bot",
			turnedOff: "বন্ধ করা হয়েছে the মোড only গ্রুপের অ্যাডমিন can use bot",
			turnedOnNoti: "চালু করা হয়েছে the বিজ্ঞপ্তি when ব্যবহারকারী is not গ্রুপের অ্যাডমিন use bot",
			turnedOffNoti: "বন্ধ করা হয়েছে the বিজ্ঞপ্তি when ব্যবহারকারী is not গ্রুপের অ্যাডমিন use bot",
			syntaxError: "ভুল সিনট্যাক্স, only use {pn} on অথবা {pn} off"
		}
	},
	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;
		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}
		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.reply(getLang("syntaxError"));
		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);
		if (isSetNoti)
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		else
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	}
};
