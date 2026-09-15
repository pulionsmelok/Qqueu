const itunes = require("searchitunes");
const { getStreamFromURL } = global.utils;

module.exports = {
	config: {
    name: "appstore",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
        
        
        
        envConfig: {
        		limitResult: 3
        	},
    description: {
            vi: "Tìm app trên appstore",
            en: "Search app on appstore",
            bn: "সার্চ app on appstore"
        },
        category: "software",
        guide: {
            en: "   {pn}: <keyword>\"\n        		+ \"\\n   - Example:\"\n        		+ \"\\n   {pn} PUBG"
        }
},
	langs: {
		vi: {
			missingKeyword: "Bạn chưa nhập từ khóa",
			noResult: "Không tìm thấy kết quả nào cho từ khóa %1"
		},
		en: {
			missingKeyword: "You haven't entered any keyword",
			noResult: "No result found for keyword %1"
		},
		bn: {
			missingKeyword: "আপনার আছেn't entered any কীওয়ার্ড",
			noResult: "কোনো ফলাফল পাওয়া যায়নি জন্য কীওয়ার্ড %1"
		}
	},
	onStart: async function ({ message, args, commandName, envCommands, getLang }) {
		if (!args[0])
			return message.reply(getLang("missingKeyword"));
		let results = [];
		try {
			results = (await itunes({
				entity: "software",
				country: "VN",
				term: args.join(" "),
				limit: envCommands[commandName].limitResult
			})).results;
		}
		catch (err) {
			return message.reply(getLang("noResult", args.join(" ")));
		}
		if (results.length > 0) {
			let msg = "";
			const pedningImages = [];
			for (const result of results) {
				msg += `\n\n- ${result.trackCensoredName} by ${result.artistName}, ${result.formattedPrice} and rated ${"🌟".repeat(result.averageUserRating)} (${result.averageUserRating.toFixed(1)}/5)`
					+ `\n- ${result.trackViewUrl}`;
				pedningImages.push(await getStreamFromURL(result.artworkUrl512 || result.artworkUrl100 || result.artworkUrl60));
			}
			message.reply({
				body: msg,
				attachment: await Promise.all(pedningImages)
			});
		}
		else {
			message.reply(getLang("noResult", args.join(" ")));
		}
	}
};
