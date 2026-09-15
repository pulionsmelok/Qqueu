const axios = require("axios");
const fs = require("fs-extra");
const pathData = __dirname + "/assets/hubble/nasa.json";
const pathDir = __dirname + "/assets/hubble";
fs.ensureDirSync(pathDir);
let hubbleData = [];

module.exports = {
	config: {
    name: "hubble",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            vi: "Xem ảnh từ Hubble",
            en: "View Hubble images",
            bn: "View Hubble images"
        },
        category: "owner",
        guide: {
            en: "{pn} <MM-DD>",
            bn: "{pn} <MM-DD>"
        }
},
	langs: {
		en: {
			invalidDate: "The date you entered is invalid. Use MM-DD, for example 05-15.",
			noImage: "No Hubble image was found for this date.",
			error: "❌ Failed to load the Hubble image."
		},
		bn: {
			invalidDate: "The তারিখ আপনি entered is অবৈধ. Use MM-DD, জন্য example 05-15.",
			noImage: "No Hubble ছবি was found জন্য this তারিখ.",
			error: "❌ Failed এ load the Hubble ছবি."
		},
		vi: {
			invalidDate: "Ngày không hợp lệ. Hãy dùng MM-DD, ví dụ 05-15.",
			noImage: "Không tìm thấy ảnh Hubble cho ngày này.",
			error: "❌ Không thể tải ảnh Hubble."
		}
	},
	onLoad: async function () {
		try {
			if (!fs.existsSync(pathData)) {
				const res = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/scripts/cmds/assets/hubble/nasa.json", { timeout: 20000 });
				await fs.writeJson(pathData, res.data, { spaces: 2 });
			}
			hubbleData = await fs.readJson(pathData);
			if (!Array.isArray(hubbleData)) hubbleData = [];
		} catch (err) {
			console.error("Hubble load error:", err.message);
			hubbleData = [];
		}
	},
	onStart: async function ({ message, args, getLang, api, event }) {
		const dateText = checkValidDate(args[0] || "");
		if (!dateText) return message.reply(getLang("invalidDate"));
		const data = hubbleData.find(item => String(item.date || "").toLowerCase().startsWith(dateText.toLowerCase()));
		if (!data) return message.reply(getLang("noImage"));
		const imageUrl = "https://imagine.gsfc.nasa.gov/hst_bday/images/" + encodeURIComponent(String(data.image || ""));
		const caption = `📅 Date: ${dateText}\n🌀 Name: ${data.name || "Unknown"}\n📖 Caption: ${data.caption || ""}\n🔗 Source: ${data.url || "NASA"}`;
		try {
			return await api.sendPhoto(event.threadID, imageUrl, {
				caption: caption.slice(0, 1024),
				...(event.messageID ? { reply_to_message_id: Number(event.messageID) } : {})
			});
		} catch (err) {
			console.error("Hubble image error:", err.message);
			return message.reply(getLang("error"));
		}
	}
};
const monthText = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function checkValidDate(value) {
	const match = String(value).trim().match(/^(\d{1,2})[-\/]?(\d{1,2})$/);
	if (!match) return false;
	const month = Number(match[1]);
	const day = Number(match[2]);
	if (month < 1 || month > 12 || day < 1 || day > new Date(2000, month, 0).getDate()) return false;
	return `${monthText[month - 1]} ${day}`;
}
