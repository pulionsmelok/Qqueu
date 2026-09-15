module.exports = {
	config: {
    name: "sorthelp",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Sắp xếp danh sách help",
            en: "Sort help list",
            bn: "Sort সহায়তা তালিকা"
        },
        category: "image",
        guide: {
            en: "{pn} [name | category]",
            bn: "{pn} [নাম | category]"
        }
},
	langs: {
		vi: {
			savedName: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự chữ cái",
			savedCategory: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự thể loại"
		},
		en: {
			savedName: "Saved sort help list by name",
			savedCategory: "Saved sort help list by category"
		},
		bn: {
			savedName: "সংরক্ষণ করা হয়েছে sort সহায়তা তালিকা by নাম",
			savedCategory: "সংরক্ষণ করা হয়েছে sort সহায়তা তালিকা by category"
		}
	},
	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (args[0] == "name") {
			await threadsData.set(event.threadID, "name", "settings.sortHelp");
			message.reply(getLang("savedName"));
		}
		else if (args[0] == "category") {
			threadsData.set(event.threadID, "category", "settings.sortHelp");
			message.reply(getLang("savedCategory"));
		}
		else
			message.SyntaxError();
	}
};
