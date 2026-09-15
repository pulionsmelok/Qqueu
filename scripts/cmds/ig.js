module.exports = {
  config: {
    name: "ig",
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 0,
    role: 0,
    
    
    
    
    usePrefix: false,
    description: {
            en: "Random photo and quote"
        },
        category: "fun",
        guide: {
            en: "Send the current prefix"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onChat: async function ({ api, event }) {
    if (!event.body) return;
    const prefix = GoatBot.config.prefix;
    if (event.body.trim() !== prefix) return;
    var quotes = [
      "জীবনে এমন বন্ধু থাকা দরকার.!\n\nযেনো বিপদে আপদে পাশে পাওয়া যায়..!❤️🥀",
      "শখের বয়সে টাকার অভাব থাকে 🙂💔\n\nতখন পাশে নারী ওহ্ থাকে না 😅",
      "প্রিয় মানুষটার কথা ভাবতে ভাবতে হঠাৎ হেসে ফেলার অনুভূতি টা সুন্দর!🖤🌸",
      "মন থেকে ভালোবাসা পূর্ণতা পাক, 💖 নাটকীয় ভালোবাসা থেকে মানুষ মুক্তি পাক!🙂🌸✨🔐"
    ];
    var images = [
      "https://i.postimg.cc/L4Cx5RKH/9e67645f927eaae0ba18f19b05622eac.jpg",
      "https://i.postimg.cc/7YXT11nD/780eb0e434ce5ca92e863a92e6cb27cf.jpg",
      "https://i.postimg.cc/1Xsfw4gf/2d1bcd832d2efb496e53cb45190e5325.jpg",
      "https://i.postimg.cc/ryjp7V0N/58137f27ceebf0482a58875d6ded3c1c.jpg",
      "https://i.postimg.cc/KvVmyRZB/1552cbe4d268c5f3a92f8ce0188f9fe7.jpg",
      "https://i.postimg.cc/L5WFRbM2/b68323d41ab7df1274342dd194292ede.jpg",
      "https://i.postimg.cc/nLxbHmNj/456ed64f3c38f3008f5f30f678563409.jpg",
      "https://i.postimg.cc/KYxwX2gt/95bf51e4d462707bf1557bbc47694849.jpg",
      "https://i.postimg.cc/g2mbpRCw/2bb146f811030e9a91b6654ac23101d1.jpg",
      "https://i.postimg.cc/tRxKV2yZ/98b0af95a9349c7705b7febf884e2fad.jpg",
      "https://i.postimg.cc/rwQ3LHGb/d13da3cb14a9630bf859795c26a2c972.jpg"
    ];
    var quote = quotes[Math.floor(Math.random() * quotes.length)];
    var imageUrl = images[Math.floor(Math.random() * images.length)];
    try {
      await api.sendPhoto(event.threadID, imageUrl, {
        caption: quote,
        ...(event.messageID ? { reply_to_message_id: Number(event.messageID) } : {})
      });
    } catch (error) {
      console.error("IG Error:", error);
      try {
        await api.sendMessage(event.threadID, quote, {
          ...(event.messageID ? { reply_to_message_id: Number(event.messageID) } : {})
        });
      } catch (sendError) {
        console.error("IG fallback Error:", sendError);
      }
    }
  }
};
