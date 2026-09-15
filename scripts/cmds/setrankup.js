const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;
const checkUrlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

module.exports = {
	config: {
    name: "setrankup",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 0,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Cấu hình rankup",
            en: "Configure rankup",
            bn: "Configure rankup"
        },
        category: "owner",
        guide: {
            vi: "   {pn} text <message>: Cấu hình tin nhắn khi thành viên thăng hạng trong box chat của bạn"
        			+ "\n   Với các tham số sau:"
        			+ "\n    + {userName}: Tên thành viên"
        			+ "\n    + {userNameTag}: Tag tên thành viên"
        			+ "\n    + {oldRank}: Rank cũ của thành viên"
        			+ "\n    + {currentRank}: Rank hiện tại của thành viên"
        			+ "\n   {pn} file <link>: Cấu hình file đính kèm khi thành viên thăng hạng trong box chat của bạn"
        			+ "\n   {pn} reset: Đặt lại cấu hình mặc định",
            en: "   {pn} text <message>: Configure the message when a member rankup in your chatbox"
        			+ "\n   With the following parameters:"
        			+ "\n    + {userName}: Member's name"
        			+ "\n    + {userNameTag}: Tag member's name"
        			+ "\n    + {oldRank}: Member's old rank"
        			+ "\n    + {currentRank}: Member's current rank"
        			+ "\n   {pn} file <link>: Configure the attachment file when a member rankup in your chatbox"
        			+ "\n   {pn} reset: Reset to default configuration",
            bn: "   {pn} text <বার্তা>: Configure the বার্তা when a member rankup in আপনার chatbox"
        			+ "\n   With the following parameters:"
        			+ "\n    + {userName}: Member's নাম"
        			+ "\n    + {userNameTag}: Tag member's নাম"
        			+ "\n    + {oldRank}: Member's old rank"
        			+ "\n    + {currentRank}: Member's বর্তমান rank"
        			+ "\n   {pn} ফাইল <লিংক>: Configure the অ্যাটাচমেন্ট ফাইল when a member rankup in আপনার chatbox"
        			+ "\n   {pn} reset: রিসেট করুন এ ডিফল্ট configuration"
        }
},
	langs: {
		vi: {
			changedMessage: "Đã thay đổi tin nhắn rankup thành: %1",
			missingAttachment: "Bạn phải đính kèm ảnh để cấu hình ảnh rankup",
			changedAttachment: "Đã thêm %1 tệp đính kèm vào rankup thành công"
		},
		en: {
			changedMessage: "Changed rankup message to: %1",
			missingAttachment: "You must attach an image to configure the rankup image",
			changedAttachment: "Successfully added %1 attachment to rankup"
		},
		bn: {
			changedMessage: "পরিবর্তন করা হয়েছে rankup বার্তা এ: %1",
			missingAttachment: "আপনি must attach an ছবি এ configure the rankup ছবি",
			changedAttachment: "Successfully added %1 অ্যাটাচমেন্ট এ rankup"
		}
	},
	onStart: async function ({ args, message, event, threadsData, getLang }) {
		const { body, threadID, senderID } = event;
		switch (args[0]) {
			case "text": {
				const newContent = body.slice(body.indexOf("text") + 5);
				await threadsData.set(threadID, newContent, "data.rankup.message");
				return message.reply(getLang("changedMessage", newContent));
			}
			case "file":
			case "image":
			case "mp3":
			case "video": {
				const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => ["photo", 'png', "animated_image", "video", "audio"].includes(item.type));
				if (!attachments.length && !(args[1] || '').match(checkUrlRegex))
					return message.reply(getLang("missingAttachment", attachments.length));
				const { data } = await threadsData.get(threadID);
				if (!data.rankup)
					data.rankup = {};
				if (!data.rankup.attachments)
					data.rankup.attachments = [];
				for (const attachment of attachments) {
					const { url } = attachment;
					const ext = getExtFromUrl(url);
					const fileName = `${getTime()}.${ext}`;
					const infoFile = await drive.uploadFile(`setrankup_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(url));
					data.rankup.attachments.push(infoFile.id);
				}
				await threadsData.set(threadID, {
					data
				});
				return message.reply(getLang("changedAttachment"));
			}
		}
	}
};
